from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import ActivityLog, User
from app.schemas.schemas import ActivityLogOut

router = APIRouter(prefix="/api/activity", tags=["activity"])

@router.get("/", response_model=List[ActivityLogOut])
def list_activity(
    entity_type: Optional[str] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(ActivityLog)
    if entity_type:
        q = q.filter(ActivityLog.entity_type == entity_type)
    return q.order_by(ActivityLog.created_at.desc()).limit(limit).all()
