from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, VendorStatus, RFQStatus, QuotationStatus, ApprovalStatus, POStatus

# ---- Auth ----
class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: UserRole = UserRole.procurement_officer
    country: Optional[str] = None
    additional_info: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    full_name: str

class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    role: UserRole
    country: Optional[str]
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# ---- Vendor ----
class VendorCreate(BaseModel):
    company_name: str
    category: Optional[str] = None
    gst_number: Optional[str] = None
    contact_person: Optional[str] = None
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None

class VendorUpdate(BaseModel):
    company_name: Optional[str] = None
    category: Optional[str] = None
    gst_number: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    status: Optional[VendorStatus] = None
    rating: Optional[float] = None

class VendorOut(BaseModel):
    id: int
    company_name: str
    category: Optional[str]
    gst_number: Optional[str]
    contact_person: Optional[str]
    email: str
    phone: Optional[str]
    address: Optional[str]
    country: Optional[str]
    status: VendorStatus
    rating: float
    created_at: datetime
    class Config:
        from_attributes = True

# ---- RFQ ----
class RFQLineItemCreate(BaseModel):
    item: str
    quantity: float
    unit: str = "NOS"

class RFQLineItemOut(BaseModel):
    id: int
    item: str
    quantity: float
    unit: str
    class Config:
        from_attributes = True

class RFQCreate(BaseModel):
    title: str
    category: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    line_items: List[RFQLineItemCreate] = []
    vendor_ids: List[int] = []

class RFQUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[RFQStatus] = None

class RFQOut(BaseModel):
    id: int
    title: str
    category: Optional[str]
    description: Optional[str]
    deadline: Optional[datetime]
    status: RFQStatus
    created_by_id: int
    created_at: datetime
    line_items: List[RFQLineItemOut] = []
    class Config:
        from_attributes = True

# ---- Quotation ----
class QuotationLineItemCreate(BaseModel):
    item: str
    quantity: float
    unit_price: float
    total: float
    delivery_days: Optional[int] = None

class QuotationLineItemOut(BaseModel):
    id: int
    item: str
    quantity: float
    unit_price: float
    total: float
    delivery_days: Optional[int]
    class Config:
        from_attributes = True

class QuotationCreate(BaseModel):
    rfq_id: int
    vendor_id: int
    tax_percent: float = 18.0
    notes: Optional[str] = None
    delivery_days: Optional[int] = None
    line_items: List[QuotationLineItemCreate] = []

class QuotationUpdate(BaseModel):
    tax_percent: Optional[float] = None
    notes: Optional[str] = None
    delivery_days: Optional[int] = None
    line_items: Optional[List[QuotationLineItemCreate]] = None

class QuotationOut(BaseModel):
    id: int
    rfq_id: int
    vendor_id: int
    tax_percent: float
    notes: Optional[str]
    status: QuotationStatus
    subtotal: float
    tax_amount: float
    grand_total: float
    delivery_days: Optional[int]
    created_at: datetime
    line_items: List[QuotationLineItemOut] = []
    vendor: Optional[VendorOut] = None
    class Config:
        from_attributes = True

# ---- Approval ----
class ApprovalAction(BaseModel):
    status: ApprovalStatus
    remarks: Optional[str] = None

class ApprovalOut(BaseModel):
    id: int
    quotation_id: int
    approver_id: Optional[int]
    status: ApprovalStatus
    remarks: Optional[str]
    stage: int
    created_at: datetime
    updated_at: Optional[datetime]
    class Config:
        from_attributes = True

# ---- Purchase Order ----
class POOut(BaseModel):
    id: int
    po_number: str
    quotation_id: int
    org_name: str
    org_address: str
    org_gstin: str
    status: POStatus
    invoice_date: Optional[datetime]
    due_date: Optional[datetime]
    cgst_percent: float
    sgst_percent: float
    created_at: datetime
    class Config:
        from_attributes = True

# ---- Activity Log ----
class ActivityLogOut(BaseModel):
    id: int
    action: str
    description: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    user_id: Optional[int]
    created_at: datetime
    class Config:
        from_attributes = True

# ---- Dashboard ----
class DashboardStats(BaseModel):
    active_rfqs: int
    pending_approvals: int
    po_this_month: float
    overdue_invoices: int
    recent_pos: list
