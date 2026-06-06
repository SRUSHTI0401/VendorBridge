from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import RFQ, RFQStatus, Approval, ApprovalStatus, PurchaseOrder, User, POStatus

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    active_rfqs = db.query(RFQ).filter(RFQ.status == RFQStatus.published).count()
    pending_approvals = db.query(Approval).filter(Approval.status == ApprovalStatus.pending).count()
    
    now = datetime.utcnow()
    pos_this_month = db.query(PurchaseOrder).filter(
        extract('month', PurchaseOrder.created_at) == now.month,
        extract('year', PurchaseOrder.created_at) == now.year
    ).all()
    po_value = sum((p.quotation.grand_total if p.quotation else 0) for p in pos_this_month)
    
    overdue = db.query(PurchaseOrder).filter(
        PurchaseOrder.status != POStatus.paid,
        PurchaseOrder.due_date < now
    ).count()
    
    recent_pos = db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).limit(5).all()
    recent_pos_data = []
    for po in recent_pos:
        v_name = po.quotation.vendor.company_name if po.quotation and po.quotation.vendor else "N/A"
        amt = po.quotation.grand_total if po.quotation else 0
        recent_pos_data.append({
            "po_number": po.po_number,
            "vendor": v_name,
            "amount": amt,
            "status": po.status.value
        })
    
    return {
        "active_rfqs": active_rfqs,
        "pending_approvals": pending_approvals,
        "po_this_month": po_value,
        "overdue_invoices": overdue,
        "recent_pos": recent_pos_data
    }
