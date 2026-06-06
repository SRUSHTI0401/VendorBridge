import { useState, useEffect } from 'react';
import { getRFQs, createRFQ, publishRFQ, deleteRFQ, getVendors } from '../api';
import { useNavigate } from 'react-router-dom';

function stBadge(s) {
  const m = { published:'b-green', draft:'b-gray', closed:'b-red' };
  return <span className={`badge ${m[s]||'b-gray'}`}>{s}</span>;
}

/* ---- Create RFQ Modal: 3-step wizard matching wireframe ---- */
function CreateModal({ onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ title:'', category:'', description:'', deadline:'', line_items:[], vendor_ids:[] });
  const [newItem, setNewItem] = useState({ item:'', quantity:'', unit:'NOS' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { getVendors().then(r => setVendors(r.data)); }, []);

  const addItem = () => {
    if (!newItem.item || !newItem.quantity) return;
    setForm(f => ({ ...f, line_items: [...f.line_items, { ...newItem, quantity: parseFloat(newItem.quantity) }] }));
    setNewItem({ item:'', quantity:'', unit:'NOS' });
  };

  const toggleVendor = (id) => {
    setForm(f => ({
      ...f,
      vendor_ids: f.vendor_ids.includes(id) ? f.vendor_ids.filter(v=>v!==id) : [...f.vendor_ids, id]
    }));
  };

  const handleSave = async () => {
    if (!form.title) return alert('Title is required');
    setLoading(true);
    try {
      await createRFQ({ ...form, deadline: form.deadline ? new Date(form.deadline).toISOString() : null });
      onSave();
    } catch(e) { alert(e.response?.data?.detail || 'Error'); }
    finally { setLoading(false); }
  };

  const STEPS = ['Details','Line Items','Vendors'];

  return (
    <div className="overlay">
      <div className="modal" style={{ maxWidth:700 }}>
        <div className="modal-hdr">
          <div>
            <h2>Create RFQ's</h2>
            <p>new request for quotation</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Stepper — matches wireframe circles 1→2→3 */}
        <div className="stepper">
          {STEPS.map((name, i) => (
            <>
              <div className="step-item" key={name}>
                <div className={`step-dot ${step===i+1?'s-active':step>i+1?'s-done':''}`}>{i+1}</div>
                <div className="step-name">{name}</div>
              </div>
              {i < STEPS.length-1 && <div className={`step-line ${step>i+1?'done':''}`} key={`l${i}`}/>}
            </>
          ))}
        </div>

        {/* Step 1 — Details */}
        {step === 1 && (
          <>
            <div className="field">
              <label className="field-label">RFQ's title *</label>
              <input className="field-input" placeholder="Office Furniture procurement Q2" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
            </div>
            <div className="field">
              <label className="field-label">Category</label>
              <input className="field-input" placeholder="Furniture" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} />
            </div>
            <div className="field">
              <label className="field-label">Deadline *</label>
              <input className="field-input" type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} />
            </div>
            <div className="field">
              <label className="field-label">Description</label>
              <textarea className="field-textarea" placeholder="Ergonomic chairs and standing desks for 3rd floor" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setStep(2)}>Next →</button>
            </div>
          </>
        )}

        {/* Step 2 — Line Items */}
        {step === 2 && (
          <>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text-dim)', marginBottom:10 }}>Line Items</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 90px auto', gap:8, marginBottom:10 }}>
              <input className="field-input" placeholder="Item" value={newItem.item} onChange={e=>setNewItem({...newItem,item:e.target.value})} />
              <input className="field-input" placeholder="qty" type="number" value={newItem.quantity} onChange={e=>setNewItem({...newItem,quantity:e.target.value})} />
              <select className="field-select" value={newItem.unit} onChange={e=>setNewItem({...newItem,unit:e.target.value})}>
                <option>NOS</option><option>KG</option><option>L</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={addItem}>+ add</button>
            </div>

            {form.line_items.length > 0 && (
              <div className="tbl-wrap" style={{ marginBottom:14 }}>
                <table>
                  <thead><tr><th>Item</th><th>qty</th><th>Unit</th><th></th></tr></thead>
                  <tbody>
                    {form.line_items.map((li,i) => (
                      <tr key={i}>
                        <td>{li.item}</td><td>{li.quantity}</td><td>{li.unit}</td>
                        <td><button className="btn btn-danger btn-xs" onClick={()=>setForm(f=>({...f,line_items:f.line_items.filter((_,j)=>j!==i)}))}>×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <button className="btn btn-outline" onClick={()=>setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={()=>setStep(3)}>Next →</button>
            </div>
          </>
        )}

        {/* Step 3 — Assign Vendors */}
        {step === 3 && (
          <>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text-dim)', marginBottom:10 }}>ASSIGN VENDORS</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:200, overflowY:'auto', marginBottom:14 }}>
              {vendors.length === 0 && <p style={{ color:'var(--text-muted)', fontSize:12 }}>No vendors yet — add vendors first.</p>}
              {vendors.map(v => (
                <label key={v.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--bg-input)', borderRadius:4, cursor:'pointer', border: form.vendor_ids.includes(v.id) ? '1px solid var(--green-dim)' : '1px solid var(--border)' }}>
                  <input type="checkbox" checked={form.vendor_ids.includes(v.id)} onChange={()=>toggleVendor(v.id)} />
                  <span style={{ fontSize:12 }}>{v.company_name}</span>
                  {form.vendor_ids.includes(v.id) && (
                    <button className="btn btn-danger btn-xs" style={{ marginLeft:'auto' }} onClick={e=>{e.preventDefault();toggleVendor(v.id);}}>×</button>
                  )}
                </label>
              ))}
            </div>
            <div className="divider"/>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text-dim)', marginBottom:8 }}>Attachments</div>
            <div style={{ border:'1px dashed var(--border)', borderRadius:4, padding:'16px', textAlign:'center', fontSize:12, color:'var(--text-muted)', marginBottom:14 }}>
              Drag & drop files or click to upload
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <button className="btn btn-outline" onClick={()=>setStep(2)}>← Back</button>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-outline btn-sm" onClick={handleSave} disabled={loading}>Save as Draft</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>Save & Send to Vendors</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function RFQs() {
  const [rfqs, setRFQs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const navigate = useNavigate();

  const load = () => { setLoading(true); getRFQs().then(r=>setRFQs(r.data)).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); }, []);

  return (
    <div>
      <div className="ph">
        <div>
          <h1>RFQ's</h1>
          <div className="ph-sub">Request for Quotations</div>
        </div>
        <button className="btn btn-primary" onClick={()=>setModal(true)}>+ New RFQ</button>
      </div>

      {loading ? <div className="loading"><div className="spin"/></div> : (
        rfqs.length === 0 ? (
          <div className="empty"><div className="empty-ico">📋</div><p>No RFQs yet</p></div>
        ) : (
          <div className="card">
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Title</th><th>Category</th><th>Deadline</th><th>Items</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
                <tbody>
                  {rfqs.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight:500 }}>{r.title}</td>
                      <td>{r.category||'—'}</td>
                      <td>{r.deadline ? new Date(r.deadline).toLocaleDateString() : '—'}</td>
                      <td>{r.line_items?.length||0}</td>
                      <td>{stBadge(r.status)}</td>
                      <td style={{ color:'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display:'flex', gap:5 }}>
                          <button className="btn btn-outline btn-xs" onClick={()=>navigate(`/quotations?rfq=${r.id}`)}>Quotes</button>
                          {r.status==='draft' && <button className="btn btn-primary btn-xs" onClick={async()=>{await publishRFQ(r.id);load();}}>Publish</button>}
                          <button className="btn btn-danger btn-xs" onClick={async()=>{if(confirm('Delete?')){await deleteRFQ(r.id);load();}}}>Del</button>
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
      {modal && <CreateModal onClose={()=>setModal(false)} onSave={()=>{setModal(false);load();}} />}
    </div>
  );
}
