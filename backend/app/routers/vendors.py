from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Vendor, User, ActivityLog
from app.schemas.schemas import VendorCreate, VendorUpdate, VendorOut

router = APIRouter(prefix="/api/vendors", tags=["vendors"])

def log_activity(db, action, description, entity_type=None, entity_id=None, user_id=None):
    log = ActivityLog(action=action, description=description, entity_type=entity_type,
                      entity_id=entity_id, user_id=user_id)
    db.add(log)

@router.get("/", response_model=List[VendorOut])
def list_vendors(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Vendor)
    if search:
        q = q.filter(Vendor.company_name.ilike(f"%{search}%"))
    if category:
        q = q.filter(Vendor.category == category)
    if status:
        q = q.filter(Vendor.status == status)
    return q.all()

@router.post("/", response_model=VendorOut)
def create_vendor(data: VendorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor = Vendor(**data.dict())
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    log_activity(db, "vendor_added", f"Vendor {vendor.company_name} registered and pending verification",
                 "vendor", vendor.id, current_user.id)
    db.commit()
    return vendor

@router.get("/{vendor_id}", response_model=VendorOut)
def get_vendor(vendor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor

@router.put("/{vendor_id}", response_model=VendorOut)
def update_vendor(vendor_id: int, data: VendorUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for k, v in data.dict(exclude_none=True).items():
        setattr(vendor, k, v)
    db.commit()
    db.refresh(vendor)
    return vendor

@router.delete("/{vendor_id}")
def delete_vendor(vendor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    db.delete(vendor)
    db.commit()
    return {"message": "Vendor deleted"}
