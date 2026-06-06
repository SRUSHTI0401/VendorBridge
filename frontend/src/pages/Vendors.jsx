import { useState, useEffect } from 'react';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../api';

function stBadge(s) {
  const m = { verified:'b-green', pending:'b-yellow', rejected:'b-red' };
  return <span className={`badge ${m[s]||'b-gray'}`}>{s}</span>;
}

function VendorModal({ onClose, onSave, initial }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(initial || { company_name:'', category:'', gst_number:'', contact_person:'', email:'', phone:'', address:'', country:'' });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.company_name || !form.email) return alert('Company name and email required');
    setLoading(true);
    try {
      if (isEdit) await updateVendor(initial.id, form);
      else await createVendor(form);
      onSave();
    } catch(e) { alert(e.response?.data?.detail||'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="overlay">
      <div className="modal" style={{ maxWidth:560 }}>
        <div className="modal-hdr">
          <div><h2>{isEdit ? 'Edit Vendor' : 'Add Vendor'}</h2></div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
          <div style={{ width:64, height:64, background:'var(--bg-input)', border:'1px dashed var(--border)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:11 }}>Photo</div>
        </div>

        <div className="row-2">
          <div className="field"><label className="field-label">First Name / Company *</label><input className="field-input" placeholder="Company Name" value={form.company_name} onChange={e=>setForm({...form,company_name:e.target.value})} /></div>
          <div className="field"><label className="field-label">Last Name / Category</label><input className="field-input" placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} /></div>
        </div>
        <div className="row-2">
          <div className="field"><label className="field-label">Email Address *</label><input className="field-input" type="email" placeholder="Email Address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
          <div className="field"><label className="field-label">Phone Number</label><input className="field-input" placeholder="Phone Number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
        </div>
        <div className="row-2">
          <div className="field"><label className="field-label">Role (GST Number)</label><input className="field-input" placeholder="GST Number" value={form.gst_number} onChange={e=>setForm({...form,gst_number:e.target.value})} /></div>
          <div className="field"><label className="field-label">Country</label><input className="field-input" placeholder="Country" value={form.country} onChange={e=>setForm({...form,country:e.target.value})} /></div>
        </div>
        <div className="field">
          <label className="field-label">Additional Information (Address)</label>
          <textarea className="field-textarea" placeholder="Additional Information ...." value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
        </div>
        {isEdit && (
          <div className="field">
            <label className="field-label">Status</label>
            <select className="field-select" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{isEdit?'Update':'Register'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = () => { setLoading(true); getVendors({search}).then(r=>setVendors(r.data)).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); }, [search]);

  return (
    <div>
      <div className="ph">
        <div><h1>Vendors</h1><div className="ph-sub">Vendor registration & management</div></div>
        <button className="btn btn-primary" onClick={()=>setModal('new')}>+ Add Vendor</button>
      </div>

      <div className="search-row">
        <div className="search-box">
          <span className="search-icon" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:12 }}>🔍</span>
          <input className="search-input" placeholder="Search vendors..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <div className="loading"><div className="spin"/></div> : (
        vendors.length===0
          ? <div className="empty"><div className="empty-ico">🏢</div><p>No vendors found</p></div>
          : (
            <div className="card">
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr><th>Company</th><th>Category</th><th>Contact</th><th>Email</th><th>GST</th><th>Country</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {vendors.map(v => (
                      <tr key={v.id}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:28, height:28, background:'var(--green-muted)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
                              {v.company_name[0].toUpperCase()}
                            </div>
                            <span style={{ fontWeight:500 }}>{v.company_name}</span>
                          </div>
                        </td>
                        <td>{v.category||'—'}</td>
                        <td>{v.contact_person||'—'}</td>
                        <td style={{ fontSize:11 }}>{v.email}</td>
                        <td style={{ fontFamily:'monospace', fontSize:11 }}>{v.gst_number||'—'}</td>
                        <td>{v.country||'—'}</td>
                        <td>{stBadge(v.status)}</td>
                        <td>
                          <div style={{ display:'flex', gap:4 }}>
                            <button className="btn btn-outline btn-xs" onClick={()=>setModal(v)}>Edit</button>
                            <button className="btn btn-danger btn-xs" onClick={async()=>{ if(confirm('Delete?')){await deleteVendor(v.id);load();} }}>Del</button>
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

      {modal && <VendorModal onClose={()=>setModal(null)} onSave={()=>{setModal(null);load();}} initial={modal==='new'?null:modal} />}
    </div>
  );
}
