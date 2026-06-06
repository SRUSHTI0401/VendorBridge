from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import RFQ, RFQLineItem, RFQVendor, User, ActivityLog, RFQStatus
from app.schemas.schemas import RFQCreate, RFQUpdate, RFQOut

router = APIRouter(prefix="/api/rfqs", tags=["rfqs"])

def log_activity(db, action, description, entity_type=None, entity_id=None, user_id=None):
    log = ActivityLog(action=action, description=description, entity_type=entity_type,
                      entity_id=entity_id, user_id=user_id)
    db.add(log)

@router.get("/", response_model=List[RFQOut])
def list_rfqs(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(RFQ)
    if status:
        q = q.filter(RFQ.status == status)
    if search:
        q = q.filter(RFQ.title.ilike(f"%{search}%"))
    return q.order_by(RFQ.created_at.desc()).all()

@router.post("/", response_model=RFQOut)
def create_rfq(data: RFQCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rfq = RFQ(
        title=data.title,
        category=data.category,
        description=data.description,
        deadline=data.deadline,
        created_by_id=current_user.id
    )
    db.add(rfq)
    db.flush()
    for li in data.line_items:
        db.add(RFQLineItem(rfq_id=rfq.id, **li.dict()))
    for vid in data.vendor_ids:
        db.add(RFQVendor(rfq_id=rfq.id, vendor_id=vid))
    log_activity(db, "rfq_created", f"RFQ '{rfq.title}' created", "rfq", rfq.id, current_user.id)
    db.commit()
    db.refresh(rfq)
    return rfq

@router.get("/{rfq_id}", response_model=RFQOut)
def get_rfq(rfq_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return rfq

@router.put("/{rfq_id}", response_model=RFQOut)
def update_rfq(rfq_id: int, data: RFQUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    for k, v in data.dict(exclude_none=True).items():
        setattr(rfq, k, v)
    db.commit()
    db.refresh(rfq)
    return rfq

@router.post("/{rfq_id}/publish")
def publish_rfq(rfq_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    rfq.status = RFQStatus.published
    vendor_count = db.query(RFQVendor).filter(RFQVendor.rfq_id == rfq_id).count()
    log_activity(db, "rfq_published", f"RFQ '{rfq.title}' published and sent to {vendor_count} vendors",
                 "rfq", rfq.id, current_user.id)
    db.commit()
    return {"message": "RFQ published successfully"}

@router.get("/{rfq_id}/vendors")
def get_rfq_vendors(rfq_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    assignments = db.query(RFQVendor).filter(RFQVendor.rfq_id == rfq_id).all()
    return [{"vendor_id": a.vendor_id, "vendor": a.vendor} for a in assignments]

@router.delete("/{rfq_id}")
def delete_rfq(rfq_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    db.delete(rfq)
    db.commit()
    return {"message": "RFQ deleted"}
