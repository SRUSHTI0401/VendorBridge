import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getQuotations, getQuotationsByRFQ, createQuotation, getRFQs, getVendors, selectQuotation } from '../api';

function stBadge(s) {
  const m = { submitted:'b-blue', under_review:'b-yellow', selected:'b-green', rejected:'b-red' };
  return <span className={`badge ${m[s]||'b-gray'}`}>{s?.replace('_',' ')}</span>;
}

/* Submit Quotation modal — matches wireframe exactly */
function SubmitModal({ onClose, onSave, rfqId }) {
  const [rfqs, setRFQs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selRFQ, setSelRFQ] = useState(rfqId ? String(rfqId) : '');
  const [form, setForm] = useState({ rfq_id: rfqId||'', vendor_id:'', tax_percent:18, notes:'', delivery_days:'', line_items:[] });
  const [newItem, setNewItem] = useState({ item:'', quantity:'', unit_price:'', delivery_days:'' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getRFQs().then(r => setRFQs(r.data));
    getVendors().then(r => setVendors(r.data));
  }, []);

  const selectedRFQ = rfqs.find(r => r.id === parseInt(selRFQ));

  const addItem = () => {
    if (!newItem.item || !newItem.quantity || !newItem.unit_price) return;
    const total = parseFloat(newItem.quantity) * parseFloat(newItem.unit_price);
    setForm(f => ({
      ...f,
      line_items: [...f.line_items, {
        item: newItem.item,
        quantity: parseFloat(newItem.quantity),
        unit_price: parseFloat(newItem.unit_price),
        total,
        delivery_days: newItem.delivery_days ? parseInt(newItem.delivery_days) : null
      }]
    }));
    setNewItem({ item:'', quantity:'', unit_price:'', delivery_days:'' });
  };

  const subtotal = form.line_items.reduce((s, li) => s + li.total, 0);
  const gst = subtotal * form.tax_percent / 100;
  const grand = subtotal + gst;

  const handleSave = async () => {
    setLoading(true);
    try {
      await createQuotation({
        ...form,
        rfq_id: parseInt(selRFQ),
        vendor_id: parseInt(form.vendor_id),
        delivery_days: form.delivery_days ? parseInt(form.delivery_days) : null
      });
      onSave();
    } catch(e) { alert(e.response?.data?.detail || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="overlay">
      <div className="modal" style={{ maxWidth:700 }}>
        <div className="modal-hdr">
          <div>
            <h2>Submit Quotations</h2>
            {selectedRFQ && (
              <p>RFQ: {selectedRFQ.title} — deadline {selectedRFQ.deadline ? new Date(selectedRFQ.deadline).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}) : ''}</p>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="row-2" style={{ marginBottom:12 }}>
          <div className="field">
            <label className="field-label">Select RFQ</label>
            <select className="field-select" value={selRFQ} onChange={e=>{setSelRFQ(e.target.value);setForm(f=>({...f,rfq_id:e.target.value}));}}>
              <option value="">Choose RFQ...</option>
              {rfqs.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Vendor</label>
            <select className="field-select" value={form.vendor_id} onChange={e=>setForm({...form,vendor_id:e.target.value})}>
              <option value="">Choose Vendor...</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name}</option>)}
            </select>
          </div>
        </div>

        {/* RFQ Summary banner (like wireframe) */}
        {selectedRFQ && (
          <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:4, padding:'10px 14px', marginBottom:14, fontSize:12, color:'var(--text-dim)' }}>
            <span style={{ fontWeight:600, color:'var(--text-muted)', fontSize:11 }}>RFQ Summary &nbsp;</span>
            {selectedRFQ.line_items?.map(li => `${li.item} × ${li.quantity}`).join(', ')}
            {selectedRFQ.category && ` — category ${selectedRFQ.category}`}
          </div>
        )}

        {/* Line items table */}
        <div style={{ fontSize:12, fontWeight:600, color:'var(--text-dim)', marginBottom:8 }}>Your Quotation</div>
        <div style={{ border:'1px solid var(--border)', borderRadius:4, overflow:'hidden', marginBottom:14 }}>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Total</th><th>Delivery (days)</th></tr>
            </thead>
            <tbody>
              {form.line_items.map((li,i) => (
                <tr key={i}>
                  <td>{li.item}</td>
                  <td>{li.quantity}</td>
                  <td>₹{li.unit_price.toLocaleString()}</td>
                  <td>₹{li.total.toLocaleString()}</td>
                  <td>{li.delivery_days||'—'}</td>
                </tr>
              ))}
              {/* Add row */}
              <tr style={{ background:'var(--bg)' }}>
                <td><input className="field-input" style={{ padding:'5px 8px', fontSize:11 }} placeholder="Item" value={newItem.item} onChange={e=>setNewItem({...newItem,item:e.target.value})} /></td>
                <td><input className="field-input" style={{ padding:'5px 8px', fontSize:11 }} placeholder="qty" type="number" value={newItem.quantity} onChange={e=>setNewItem({...newItem,quantity:e.target.value})} /></td>
                <td><input className="field-input" style={{ padding:'5px 8px', fontSize:11 }} placeholder="price" type="number" value={newItem.unit_price} onChange={e=>setNewItem({...newItem,unit_price:e.target.value})} /></td>
                <td style={{ color:'var(--text-muted)', fontSize:11 }}>{newItem.quantity && newItem.unit_price ? `₹${(parseFloat(newItem.quantity)*parseFloat(newItem.unit_price)).toLocaleString()}` : '—'}</td>
                <td><input className="field-input" style={{ padding:'5px 8px', fontSize:11, width:60 }} placeholder="days" type="number" value={newItem.delivery_days} onChange={e=>setNewItem({...newItem,delivery_days:e.target.value})} /></td>
              </tr>
            </tbody>
          </table>
          <div style={{ padding:'8px 12px', borderTop:'1px solid var(--border)' }}>
            <button className="btn btn-outline btn-xs" onClick={addItem}>+ add line item</button>
          </div>
        </div>

        <div className="row-2">
          <div>
            <div className="field">
              <label className="field-label">Tax / GST %</label>
              <input className="field-input" type="number" value={form.tax_percent} onChange={e=>setForm({...form,tax_percent:parseFloat(e.target.value)||0})} />
            </div>
            <div className="field">
              <label className="field-label">Note / Terms</label>
              <textarea className="field-textarea" style={{ minHeight:60 }} placeholder="Payment terms: 20 days net..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
            </div>
          </div>
          {/* Summary box — right side */}
          <div className="summary-box" style={{ alignSelf:'flex-start' }}>
            <div className="summary-row"><span style={{ color:'var(--text-muted)' }}>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className="summary-row"><span style={{ color:'var(--text-muted)' }}>GST ({form.tax_percent}%)</span><span>₹{gst.toFixed(0)}</span></div>
            <div className="summary-row total"><span>Grand total</span><span>₹{grand.toFixed(0)}</span></div>
          </div>
        </div>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Quotation'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [searchParams] = useSearchParams();
  const rfqId = searchParams.get('rfq');

  const load = () => {
    setLoading(true);
    (rfqId ? getQuotationsByRFQ(rfqId) : getQuotations()).then(r=>setQuotations(r.data)).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); }, [rfqId]);

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Quotations</h1>
          <div className="ph-sub">{rfqId ? `RFQ #${rfqId} — quotations received` : 'All vendor quotations'}</div>
        </div>
        <button className="btn btn-primary" onClick={()=>setModal(true)}>+ Submit Quotation</button>
      </div>

      {loading ? <div className="loading"><div className="spin"/></div> : (
        quotations.length === 0
          ? <div className="empty"><div className="empty-ico">💬</div><p>No quotations yet</p></div>
          : (
            <div className="card">
              <div className="tbl-wrap">
                <table>
                  <thead><tr><th>RFQ #</th><th>Vendor</th><th>Subtotal</th><th>GST%</th><th>Grand Total</th><th>Delivery</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {quotations.map(q => (
                      <tr key={q.id}>
                        <td>#{q.rfq_id}</td>
                        <td style={{ fontWeight:500 }}>{q.vendor?.company_name||`Vendor #${q.vendor_id}`}</td>
                        <td>₹{q.subtotal?.toLocaleString()}</td>
                        <td>{q.tax_percent}%</td>
                        <td style={{ fontWeight:700, color:'var(--green)' }}>₹{q.grand_total?.toLocaleString()}</td>
                        <td>{q.delivery_days ? `${q.delivery_days}d` : '—'}</td>
                        <td>{stBadge(q.status)}</td>
                        <td>
                          {q.status==='submitted' && (
                            <button className="btn btn-primary btn-xs" onClick={async()=>{ if(confirm('Select & initiate approval?')){await selectQuotation(q.id);load();} }}>
                              Select & Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
      )}
      {modal && <SubmitModal onClose={()=>setModal(false)} onSave={()=>{setModal(false);load();}} rfqId={rfqId} />}
    </div>
  );
}
