from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    procurement_officer = "procurement_officer"
    vendor = "vendor"
    manager = "manager"

class VendorStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"

class RFQStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    closed = "closed"

class QuotationStatus(str, enum.Enum):
    submitted = "submitted"
    under_review = "under_review"
    selected = "selected"
    rejected = "rejected"

class ApprovalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class POStatus(str, enum.Enum):
    draft = "draft"
    approved = "approved"
    sent = "sent"
    paid = "paid"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.procurement_officer)
    country = Column(String, nullable=True)
    additional_info = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    vendor_profile = relationship("Vendor", back_populates="user", uselist=False)
    rfqs_created = relationship("RFQ", back_populates="created_by")
    approvals = relationship("Approval", back_populates="approver")

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    company_name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    gst_number = Column(String, nullable=True)
    contact_person = Column(String, nullable=True)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    country = Column(String, nullable=True)
    status = Column(SAEnum(VendorStatus), default=VendorStatus.pending)
    rating = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="vendor_profile")
    quotations = relationship("Quotation", back_populates="vendor")
    rfq_assignments = relationship("RFQVendor", back_populates="vendor")

class RFQ(Base):
    __tablename__ = "rfqs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=True)
    status = Column(SAEnum(RFQStatus), default=RFQStatus.draft)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = relationship("User", back_populates="rfqs_created")
    line_items = relationship("RFQLineItem", back_populates="rfq", cascade="all, delete-orphan")
    vendor_assignments = relationship("RFQVendor", back_populates="rfq", cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="rfq")

class RFQLineItem(Base):
    __tablename__ = "rfq_line_items"
    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id"))
    item = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, default="NOS")
    rfq = relationship("RFQ", back_populates="line_items")

class RFQVendor(Base):
    __tablename__ = "rfq_vendors"
    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    invited_at = Column(DateTime(timezone=True), server_default=func.now())
    rfq = relationship("RFQ", back_populates="vendor_assignments")
    vendor = relationship("Vendor", back_populates="rfq_assignments")

class Quotation(Base):
    __tablename__ = "quotations"
    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    tax_percent = Column(Float, default=18.0)
    notes = Column(Text, nullable=True)
    status = Column(SAEnum(QuotationStatus), default=QuotationStatus.submitted)
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    delivery_days = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    rfq = relationship("RFQ", back_populates="quotations")
    vendor = relationship("Vendor", back_populates="quotations")
    line_items = relationship("QuotationLineItem", back_populates="quotation", cascade="all, delete-orphan")
    approval = relationship("Approval", back_populates="quotation", uselist=False)
    purchase_order = relationship("PurchaseOrder", back_populates="quotation", uselist=False)

class QuotationLineItem(Base):
    __tablename__ = "quotation_line_items"
    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"))
    item = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    delivery_days = Column(Integer, nullable=True)
    quotation = relationship("Quotation", back_populates="line_items")

class Approval(Base):
    __tablename__ = "approvals"
    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"))
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(SAEnum(ApprovalStatus), default=ApprovalStatus.pending)
    remarks = Column(Text, nullable=True)
    stage = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    quotation = relationship("Quotation", back_populates="approval")
    approver = relationship("User", back_populates="approvals")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String, unique=True, nullable=False)
    quotation_id = Column(Integer, ForeignKey("quotations.id"))
    org_name = Column(String, default="Your Organization Name")
    org_address = Column(String, default="123 Business Park, Ahmedabad")
    org_gstin = Column(String, default="25AF349B5AFB")
    status = Column(SAEnum(POStatus), default=POStatus.draft)
    invoice_date = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    cgst_percent = Column(Float, default=9.0)
    sgst_percent = Column(Float, default=9.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    quotation = relationship("Quotation", back_populates="purchase_order")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    entity_type = Column(String, nullable=True)
    entity_id = Column(Integer, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
