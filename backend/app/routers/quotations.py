from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Quotation, QuotationLineItem, User, ActivityLog, QuotationStatus, Approval, ApprovalStatus
from app.schemas.schemas import QuotationCreate, QuotationUpdate, QuotationOut

router = APIRouter(prefix="/api/quotations", tags=["quotations"])

def log_activity(db, action, description, entity_type=None, entity_id=None, user_id=None):
    log = ActivityLog(action=action, description=description, entity_type=entity_type,
                      entity_id=entity_id, user_id=user_id)
    db.add(log)

def compute_totals(line_items, tax_percent):
    subtotal = sum(li.total for li in line_items)
    tax = round(subtotal * tax_percent / 100, 2)
    return subtotal, tax, round(subtotal + tax, 2)

@router.get("/", response_model=List[QuotationOut])
def list_quotations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Quotation).order_by(Quotation.created_at.desc()).all()

@router.get("/rfq/{rfq_id}", response_model=List[QuotationOut])
def get_quotations_by_rfq(rfq_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Quotation).filter(Quotation.rfq_id == rfq_id).all()

@router.post("/", response_model=QuotationOut)
def create_quotation(data: QuotationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quot = Quotation(
        rfq_id=data.rfq_id,
        vendor_id=data.vendor_id,
        tax_percent=data.tax_percent,
        notes=data.notes,
        delivery_days=data.delivery_days
    )
    db.add(quot)
    db.flush()
    line_objs = []
    for li in data.line_items:
        obj = QuotationLineItem(quotation_id=quot.id, **li.dict())
        db.add(obj)
        line_objs.append(obj)
    db.flush()
    subtotal, tax, grand = compute_totals(line_objs, data.tax_percent)
    quot.subtotal = subtotal
    quot.tax_amount = tax
    quot.grand_total = grand
    log_activity(db, "quotation_submitted", f"Quotation submitted for RFQ #{data.rfq_id}", "quotation", quot.id, current_user.id)
    db.commit()
    db.refresh(quot)
    return quot

@router.get("/{quot_id}", response_model=QuotationOut)
def get_quotation(quot_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Quotation).filter(Quotation.id == quot_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return q

@router.put("/{quot_id}", response_model=QuotationOut)
def update_quotation(quot_id: int, data: QuotationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Quotation).filter(Quotation.id == quot_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
    if data.tax_percent is not None:
        q.tax_percent = data.tax_percent
    if data.notes is not None:
        q.notes = data.notes
    if data.delivery_days is not None:
        q.delivery_days = data.delivery_days
    if data.line_items is not None:
        for old_li in q.line_items:
            db.delete(old_li)
        db.flush()
        new_items = []
        for li in data.line_items:
            obj = QuotationLineItem(quotation_id=q.id, **li.dict())
            db.add(obj)
            new_items.append(obj)
        db.flush()
        subtotal, tax, grand = compute_totals(new_items, q.tax_percent)
        q.subtotal = subtotal
        q.tax_amount = tax
        q.grand_total = grand
    db.commit()
    db.refresh(q)
    return q

@router.post("/{quot_id}/select")
def select_quotation(quot_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Quotation).filter(Quotation.id == quot_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
    q.status = QuotationStatus.selected
    # create approval
    approval = Approval(quotation_id=q.id, status=ApprovalStatus.pending, stage=1)
    db.add(approval)
    log_activity(db, "quotation_selected", f"Quotation #{quot_id} selected, approval workflow initiated",
                 "quotation", quot_id, current_user.id)
    db.commit()
    return {"message": "Quotation selected, approval initiated"}
