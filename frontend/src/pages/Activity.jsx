import { useState, useEffect } from 'react';
import { getActivity } from '../api';

const FILTERS = [
  { label:'All',       val:'all' },
  { label:'RFQ',       val:'rfq' },
  { label:'Approvals', val:'approval' },
  { label:'Invoices',  val:'po' },
  { label:'Vendors',   val:'vendor' },
];

const ICONS = {
  rfq:      '📄',
  quotation:'💬',
  approval: '✅',
  vendor:   '🏢',
  po:       '🧾',
};

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = filter !== 'all' ? { entity_type: filter } : {};
    getActivity(params).then(r => setLogs(r.data)).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Activity & Logs</h1>
          <div className="ph-sub">Procurement audit trail</div>
        </div>
      </div>

      <div className="card">
        {/* Filter tabs — exactly like wireframe */}
        <div className="filter-row">
          {FILTERS.map(f => (
            <button key={f.val} className={`ftab ${filter===f.val?'active':''}`} onClick={()=>setFilter(f.val)}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? <div className="loading"><div className="spin"/></div> : (
          logs.length === 0
            ? <div className="empty"><div className="empty-ico">📋</div><p>No activity logged yet</p></div>
            : (
              <ul className="timeline">
                {logs.map(log => (
                  <li key={log.id} className="tl-item">
                    <div className="tl-icon">{ICONS[log.entity_type]||'📌'}</div>
                    <div className="tl-body">
                      <p>{log.description}</p>
                      <span>
                        {new Date(log.created_at).toLocaleString('en-IN',{
                          day:'2-digit', month:'short', year:'numeric',
                          hour:'2-digit', minute:'2-digit'
                        })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )
        )}
      </div>

      {/* Audit note — matches wireframe image 10 */}
      <div style={{ marginTop:16, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:6, padding:'16px 20px' }}>
        <div style={{ fontSize:12, color:'var(--text-dim)', lineHeight:1.7 }}>
          <strong style={{ color:'var(--text)' }}>Audit logs must be immutable</strong><br/>
          These entries must be write-once, no edit or delete. Make sure your DB schema reflects this (no soft-delete on log records).
        </div>
      </div>
    </div>
  );
}
