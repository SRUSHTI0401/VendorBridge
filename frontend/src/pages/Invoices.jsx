import { useState, useEffect } from 'react';
import { getPurchaseOrders, downloadInvoicePDF, markPaid } from '../api';

function InvoiceView({ po, onClose }) {
  const handleDL = async () => {
    try {
      const res = await downloadInvoicePDF(po.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href=url; a.download=`${po.po_number}.pdf`; a.click();
    } catch(e) { alert('PDF generation failed. Make sure backend is running.'); }
  };

  return (
    <div className="overlay">
      <div className="modal" style={{ maxWidth:720 }}>
        <div className="modal-hdr">
          <div>
            <h2>Purchase Order & Invoice</h2>
            <p>{po.po_number} — auto-generated after approval</p>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn btn-outline btn-sm" onClick={handleDL}>Download PDF</button>
            <button className="btn btn-outline btn-sm" onClick={()=>window.print()}>Print</button>
            <button className="btn btn-outline btn-sm">Email Invoice</button>
            <button className="close-btn" onClick={onClose} style={{ marginLeft:8 }}>×</button>
          </div>
        </div>

        {/* Two-column header — matches wireframe */}
        <div className="invoice-grid">
          <div>
            <div className="invoice-sec-label">YOUR ORGANIZATION</div>
            <div style={{ fontSize:13 }}>
              <div style={{ fontWeight:700, marginBottom:2 }}>{po.org_name}</div>
              <div style={{ color:'var(--text-dim)', fontSize:12 }}>{po.org_address}</div>
              <div style={{ color:'var(--text-muted)', fontSize:11, marginTop:2 }}>GSTIN:{po.org_gstin}</div>
            </div>
          </div>
          <div>
            <div className="invoice-sec-label">VENDOR</div>
            <div style={{ fontSize:13, color:'var(--text-dim)' }}>
              <div style={{ fontWeight:600 }}>Infra supplies pvt ltd</div>
              <div style={{ fontSize:12 }}>456, industrial estate, surat</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>GSTIN: 343434D#523</div>
            </div>
          </div>
        </div>

        <div className="divider"/>

        {/* PO details row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16, fontSize:12 }}>
          <div>
            <span style={{ color:'var(--text-muted)' }}>PO Number: </span>
            <span style={{ fontFamily:'monospace', fontWeight:600 }}>{po.po_number}</span>
          </div>
          <div>
            <span style={{ color:'var(--text-muted)' }}>invoice date: </span>
            <span>{po.invoice_date ? new Date(po.invoice_date).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}) : 'N/A'}</span>
          </div>
          <div>
            <span style={{ color:'var(--text-muted)' }}>PO date: </span>
            <span>{new Date(po.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}</span>
          </div>
          <div>
            <span style={{ color:'var(--text-muted)' }}>Due date: </span>
            <span>{po.due_date ? new Date(po.due_date).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}) : 'N/A'}</span>
          </div>
        </div>

        {/* Items table */}
        <div style={{ border:'1px solid var(--border)', borderRadius:4, overflow:'hidden', marginBottom:16 }}>
          <table>
            <thead>
              <tr>
                <th style={{ background:'var(--green-muted)', color:'var(--text)' }}>Item</th>
                <th style={{ background:'var(--green-muted)', color:'var(--text)' }}>Qty</th>
                <th style={{ background:'var(--green-muted)', color:'var(--text)' }}>Unit price</th>
                <th style={{ background:'var(--green-muted)', color:'var(--text)' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Ergonomic chair</td><td>25</td><td>3500</td><td>₹7,500</td></tr>
              <tr><td>Tech Core LTD</td><td>10</td><td>8,200</td><td>₹82000</td></tr>
              <tr>
                <td colSpan={2}></td>
                <td style={{ color:'var(--text-muted)', fontSize:11 }}>Subtotal</td>
                <td>₹1,69,500</td>
              </tr>
              <tr>
                <td colSpan={2}></td>
                <td style={{ color:'var(--text-muted)', fontSize:11 }}>CGST({po.cgst_percent}%)</td>
                <td>15,255</td>
              </tr>
              <tr>
                <td colSpan={2}></td>
                <td style={{ color:'var(--text-muted)', fontSize:11 }}>SGST({po.sgst_percent}%)</td>
                <td>15,255</td>
              </tr>
              <tr>
                <td colSpan={2}></td>
                <td style={{ fontWeight:700 }}>Grand total</td>
                <td style={{ fontWeight:700, color:'var(--green)' }}>₹2,00,010</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:12 }}>
          <span style={{ color:'var(--text-muted)' }}>Status:</span>
          <span className={`badge ${po.status==='paid'?'b-blue':po.status==='approved'?'b-green':'b-gray'}`}>{po.status}</span>
          {po.status !== 'paid' && (
            <button className="btn btn-outline btn-sm" style={{ marginLeft:'auto' }} onClick={async()=>{ await markPaid(po.id); onClose(); }}>
              Mark as Paid
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Invoices() {
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () => { setLoading(true); getPurchaseOrders().then(r=>setPOs(r.data)).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); }, []);

  return (
    <div>
      <div className="ph">
        <div><h1>PO & Invoice</h1><div className="ph-sub">Purchase orders and invoice management</div></div>
      </div>

      {loading ? <div className="loading"><div className="spin"/></div> : (
        pos.length===0
          ? <div className="empty"><div className="empty-ico">🧾</div><p>No invoices yet. Complete an approval to generate one.</p></div>
          : (
            <div className="card">
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr><th>PO Number</th><th>Invoice Date</th><th>Due Date</th><th>Org</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {pos.map(po => (
                      <tr key={po.id} onClick={()=>setSelected(po)} style={{ cursor:'pointer' }}>
                        <td style={{ fontFamily:'monospace', fontWeight:600 }}>{po.po_number}</td>
                        <td>{po.invoice_date ? new Date(po.invoice_date).toLocaleDateString() : '—'}</td>
                        <td>{po.due_date ? new Date(po.due_date).toLocaleDateString() : '—'}</td>
                        <td style={{ fontSize:11 }}>{po.org_name}</td>
                        <td><span className={`badge ${po.status==='paid'?'b-blue':po.status==='approved'?'b-green':'b-gray'}`}>{po.status}</span></td>
                        <td onClick={e=>e.stopPropagation()}>
                          <div style={{ display:'flex', gap:5 }}>
                            <button className="btn btn-outline btn-xs" onClick={async()=>{ try{ const r=await downloadInvoicePDF(po.id); const url=URL.createObjectURL(new Blob([r.data])); const a=document.createElement('a');a.href=url;a.download=`${po.po_number}.pdf`;a.click(); }catch(e){ alert('PDF failed'); } }}>PDF</button>
                            {po.status!=='paid' && <button className="btn btn-primary btn-xs" onClick={async()=>{ await markPaid(po.id); load(); }}>Mark Paid</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
      )}

      {selected && <InvoiceView po={selected} onClose={()=>{ setSelected(null); load(); }} />}
    </div>
  );
}
