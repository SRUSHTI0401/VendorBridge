import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../api';
import { useAuth } from '../context/AuthContext';

function stBadge(s) {
  const m = { approved:'b-green', pending:'b-yellow', draft:'b-gray', paid:'b-blue', sent:'b-orange' };
  return <span className={`badge ${m[s]||'b-gray'}`}>{s}</span>;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getDashboardStats().then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spin"/></div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Dashboard</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>
          Welcome back, {user?.role?.replace('_',' ')} — Today's Overview
        </p>
      </div>

      {/* Stat cards — exactly 4 like wireframe */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-num">{stats?.active_rfqs ?? 0}</div>
          <div className="stat-lbl">Active RFQ's</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats?.pending_approvals ?? 0}</div>
          <div className="stat-lbl">Pending Approvals</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ fontSize:24 }}>
            $ {stats?.po_this_month > 0 ? (stats.po_this_month/100000).toFixed(1)+'L' : '0'}
          </div>
          <div className="stat-lbl">PO's this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color:'var(--red)' }}>{stats?.overdue_invoices ?? 0}</div>
          <div className="stat-lbl">overdue invoices</div>
        </div>
      </div>

      {/* Bottom section — table + chart */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {/* Recent POs table */}
        <div className="card">
          <div className="card-title">Recent Purchase Orders</div>
          {stats?.recent_pos?.length > 0 ? (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr><th>PO#</th><th>Vendor</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {stats.recent_pos.map((po,i) => (
                    <tr key={i}>
                      <td style={{ fontFamily:'monospace', fontSize:11 }}>{po.po_number?.slice(-4)||`Po${i+1}`}</td>
                      <td>{po.vendor}</td>
                      <td>{po.amount?.toLocaleString()}</td>
                      <td>{stBadge(po.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding:'20px 0', textAlign:'center', color:'var(--text-muted)', fontSize:12 }}>
              No purchase orders yet
            </div>
          )}
        </div>

        {/* Analytics placeholder + quick actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="card" style={{ flex:1 }}>
            <div className="card-title">Procurement Analytics</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:120, color:'var(--text-muted)', fontSize:11, border:'1px dashed var(--border)', borderRadius:4 }}>
              📊 Charts appear here with more data
            </div>
          </div>
          <div className="card">
            <div className="card-title">Quick Actions</div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/rfqs')}>+ new RFQ</button>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/vendors')}>Add Vendor</button>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/invoices')}>View Invoices</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
