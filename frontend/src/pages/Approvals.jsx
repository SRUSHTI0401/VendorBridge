import { useState, useEffect } from 'react';
import { getApprovals, processApproval } from '../api';

function stBadge(s) {
  const m = { approved:'b-green', pending:'b-yellow', rejected:'b-red' };
  return <span className={`badge ${m[s]||'b-gray'}`}>{s}</span>;
}

function ApprovalCard({ a, onAction }) {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (status) => {
    setLoading(true);
    try { await processApproval(a.id, { status, remarks }); onAction(); }
    catch(e) { alert(e.response?.data?.detail||'Error'); }
    finally { setLoading(false); }
  };

  const STEPS = ['Submitted','L1 Review','L2 approval','Generate PO'];

  return (
    <div className="card" style={{ marginBottom:14 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:3 }}>Approval Workflow</h3>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>
            RFQ: office furniture Q2 — Quotation #{a.quotation_id} &nbsp; {stBadge(a.status)}
          </p>
        </div>
      </div>

      {/* 4-step stepper — matches wireframe exactly */}
      <div className="stepper" style={{ marginBottom:20 }}>
        {STEPS.map((name, i) => {
          const isDone = a.stage > i+1 || (a.stage===i+1 && a.status==='approved');
          const isActive = a.stage===i+1;
          return (
            <>
              <div className="step-item" key={name}>
                <div className={`step-dot ${isDone?'s-done':isActive?'s-active':''}`}>{isDone?'✓':i+1}</div>
                <div className="step-name">{name}</div>
              </div>
              {i < STEPS.length-1 && <div className={`step-line ${isDone?'done':''}`} key={`l${i}`}/>}
            </>
          );
        })}
      </div>

      {/* Two-column: approval chain + quotation summary */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>APPROVAL CHAIN</div>
          <div className="approval-chain">
            <div className="chain-item">
              <div className="chain-avatar">RM</div>
              <div className="chain-info">
                <p>Rahul Mehta (Procurement head)</p>
                <span>{a.stage > 1 ? `Approved on — ${new Date(a.updated_at||a.created_at).toLocaleDateString()}` : 'Awaiting'}</span>
              </div>
              <div className="chain-status">
                {a.stage > 1 ? <span className="badge b-green">✓</span> : <span style={{ width:20, height:20, border:'2px solid var(--border)', borderRadius:'50%', display:'inline-block' }}/>}
              </div>
            </div>
            <div className="chain-item">
              <div className="chain-avatar">PS</div>
              <div className="chain-info">
                <p>Priya Shah (Finance manager)</p>
                <span>{a.stage >= 2 && a.status==='approved' ? 'Approved' : a.stage===2 && a.status==='pending' ? 'Awaiting · Assigned' : 'Pending'}</span>
              </div>
              <div className="chain-status">
                {a.stage===2 && a.status==='pending' && <span style={{ width:20, height:20, border:'2px solid var(--yellow)', borderRadius:'50%', display:'inline-block' }}/>}
                {a.stage > 2 || (a.stage===2 && a.status==='approved') ? <span className="badge b-green">✓</span> : null}
              </div>
            </div>
          </div>

          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:5 }}>Approval Remarks</div>
            {a.status === 'pending' ? (
              <textarea
                className="field-textarea"
                style={{ minHeight:64 }}
                placeholder="Add your comments or conditions..."
                value={remarks}
                onChange={e=>setRemarks(e.target.value)}
              />
            ) : (
              <div style={{ padding:'8px 10px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:4, fontSize:12, color:'var(--text-dim)', minHeight:40 }}>
                {a.remarks || <span style={{ color:'var(--text-muted)' }}>No remarks</span>}
              </div>
            )}
          </div>
        </div>

        {/* Quotation summary */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>QUOTATIONS SUMMARY</div>
          <div className="summary-box">
            <div className="summary-row"><span style={{ color:'var(--text-muted)' }}>Vendor:</span><span>Infra Supplies PVT LTD</span></div>
            <div className="summary-row"><span style={{ color:'var(--text-muted)' }}>Total:</span><span>1,85,400</span></div>
            <div className="summary-row"><span style={{ color:'var(--text-muted)' }}>Delivery:</span><span>10 days</span></div>
            <div className="summary-row"><span style={{ color:'var(--text-muted)' }}>Rating:</span><span>4.5/5</span></div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:14 }}>
            {a.status==='pending' && (
              <>
                <button className="btn btn-primary" onClick={()=>handle('approved')} disabled={loading}>Approve</button>
                <button className="btn btn-danger" onClick={()=>handle('rejected')} disabled={loading}>Reject</button>
              </>
            )}
            {a.status !== 'pending' && (
              <div style={{ padding:'8px 12px', fontSize:12, color:'var(--text-muted)' }}>
                {a.status==='approved' ? '✓ Approved — PO generated' : '✗ Rejected'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ fontSize:10, color:'var(--text-muted)' }}>
        Created {new Date(a.created_at).toLocaleString()}
        {a.updated_at && ` · Updated ${new Date(a.updated_at).toLocaleString()}`}
      </div>
    </div>
  );
}

export default function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); getApprovals().then(r=>setApprovals(r.data)).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); }, []);

  return (
    <div>
      <div className="ph">
        <div><h1>Approvals</h1><div className="ph-sub">Procurement approval workflow</div></div>
      </div>

      {loading ? <div className="loading"><div className="spin"/></div> : (
        approvals.length===0
          ? <div className="empty"><div className="empty-ico">✅</div><p>No approvals pending</p></div>
          : approvals.map(a => <ApprovalCard key={a.id} a={a} onAction={load} />)
      )}
    </div>
  );
}
