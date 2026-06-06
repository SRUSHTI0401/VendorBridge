from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Approval, User, ActivityLog, ApprovalStatus, PurchaseOrder, POStatus, Quotation
from app.schemas.schemas import ApprovalAction, ApprovalOut
from datetime import datetime, timedelta
import random, string

router = APIRouter(prefix="/api/approvals", tags=["approvals"])

def log_activity(db, action, description, entity_type=None, entity_id=None, user_id=None):
    log = ActivityLog(action=action, description=description, entity_type=entity_type,
                      entity_id=entity_id, user_id=user_id)
    db.add(log)

def generate_po_number():
    return f"PO-{datetime.now().year}-{''.join(random.choices(string.digits, k=4))}"

@router.get("/", response_model=List[ApprovalOut])
def list_approvals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Approval).order_by(Approval.created_at.desc()).all()

@router.get("/{approval_id}", response_model=ApprovalOut)
def get_approval(approval_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    a = db.query(Approval).filter(Approval.id == approval_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Approval not found")
    return a

@router.get("/quotation/{quot_id}", response_model=ApprovalOut)
def get_approval_by_quotation(quot_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    a = db.query(Approval).filter(Approval.quotation_id == quot_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Approval not found")
    return a

@router.post("/{approval_id}/action")
def process_approval(approval_id: int, data: ApprovalAction, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    approval.status = data.status
    approval.remarks = data.remarks
    approval.approver_id = current_user.id
    approval.updated_at = datetime.utcnow()

    if data.status == ApprovalStatus.approved:
        if approval.stage < 2:
            # advance to next stage
            approval.stage += 1
            approval.status = ApprovalStatus.pending
            approval.approver_id = None
            log_activity(db, "approval_l1", f"L1 approval granted for quotation #{approval.quotation_id}",
                         "approval", approval.id, current_user.id)
        else:
            # final approval - generate PO
            po_number = generate_po_number()
            now = datetime.utcnow()
            po = PurchaseOrder(
                po_number=po_number,
                quotation_id=approval.quotation_id,
                status=POStatus.approved,
                invoice_date=now,
                due_date=now + timedelta(days=30)
            )
            db.add(po)
            log_activity(db, "approval_final", f"Final approval granted - PO {po_number} generated",
                         "approval", approval.id, current_user.id)
    else:
        log_activity(db, "approval_rejected", f"Quotation #{approval.quotation_id} rejected",
                     "approval", approval.id, current_user.id)
    db.commit()
    db.refresh(approval)
    return {"message": f"Approval {data.status.value}", "approval": approval}
