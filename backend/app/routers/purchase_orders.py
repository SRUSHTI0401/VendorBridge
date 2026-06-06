from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import PurchaseOrder, User, ActivityLog, POStatus
from app.schemas.schemas import POOut
import io

router = APIRouter(prefix="/api/purchase-orders", tags=["purchase-orders"])

def log_activity(db, action, description, entity_type=None, entity_id=None, user_id=None):
    log = ActivityLog(action=action, description=description, entity_type=entity_type,
                      entity_id=entity_id, user_id=user_id)
    db.add(log)

@router.get("/", response_model=List[POOut])
def list_pos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).all()

@router.get("/{po_id}", response_model=POOut)
def get_po(po_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    return po

@router.post("/{po_id}/mark-paid")
def mark_paid(po_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    po.status = POStatus.paid
    log_activity(db, "invoice_paid", f"PO {po.po_number} marked as paid", "po", po.id, current_user.id)
    db.commit()
    return {"message": "Marked as paid"}

@router.get("/{po_id}/pdf")
def download_invoice_pdf(po_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm,
                                topMargin=20*mm, bottomMargin=20*mm)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle('title', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#1a472a'))
        story.append(Paragraph("PURCHASE ORDER & INVOICE", title_style))
        story.append(Spacer(1, 10*mm))
        
        quot = po.quotation
        vendor = quot.vendor if quot else None
        
        # Header info
        header_data = [
            ["FROM:", "TO:"],
            [po.org_name, vendor.company_name if vendor else "N/A"],
            [po.org_address, vendor.address if vendor else ""],
            [f"GSTIN: {po.org_gstin}", f"GSTIN: {vendor.gst_number if vendor else 'N/A'}"],
            ["", ""],
            [f"PO Number: {po.po_number}", f"Invoice Date: {po.invoice_date.strftime('%d %b %Y') if po.invoice_date else 'N/A'}"],
            [f"PO Date: {po.created_at.strftime('%d %b %Y')}", f"Due Date: {po.due_date.strftime('%d %b %Y') if po.due_date else 'N/A'}"],
        ]
        header_table = Table(header_data, colWidths=[85*mm, 85*mm])
        header_table.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 8*mm))
        
        # Line items
        if quot and quot.line_items:
            item_data = [["Item", "Qty", "Unit Price", "Total"]]
            for li in quot.line_items:
                item_data.append([li.item, str(li.quantity), f"₹{li.unit_price:,.2f}", f"₹{li.total:,.2f}"])
            
            subtotal = quot.subtotal
            cgst = round(subtotal * po.cgst_percent / 100, 2)
            sgst = round(subtotal * po.sgst_percent / 100, 2)
            grand = subtotal + cgst + sgst
            
            item_data.extend([
                ["", "", "Subtotal", f"₹{subtotal:,.2f}"],
                ["", "", f"CGST ({po.cgst_percent}%)", f"₹{cgst:,.2f}"],
                ["", "", f"SGST ({po.sgst_percent}%)", f"₹{sgst:,.2f}"],
                ["", "", "Grand Total", f"₹{grand:,.2f}"],
            ])
            
            t = Table(item_data, colWidths=[70*mm, 30*mm, 40*mm, 30*mm])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1a472a')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('GRID', (0,0), (-1,-5), 0.5, colors.grey),
                ('FONTNAME', (2,-4), (-1,-1), 'Helvetica-Bold'),
                ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
                ('FONTSIZE', (0,0), (-1,-1), 10),
            ]))
            story.append(t)
        
        story.append(Spacer(1, 10*mm))
        story.append(Paragraph(f"Status: {po.status.value.upper()}", styles['Normal']))
        
        doc.build(story)
        buffer.seek(0)
        return Response(
            content=buffer.read(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={po.po_number}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")
