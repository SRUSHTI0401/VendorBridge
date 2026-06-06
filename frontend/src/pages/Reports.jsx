import { useState, useEffect } from 'react';
import { getDashboardStats, getVendors, getRFQs, getPurchaseOrders } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const C = ['#1db954','#155c2e','#40916c','#52b788','#74c69d'];

export default function Reports() {
  const [data, setData] = useState({ stats:null, vendors:[], rfqs:[], pos:[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getVendors(), getRFQs(), getPurchaseOrders()])
      .then(([s,v,r,p]) => setData({ stats:s.data, vendors:v.data, rfqs:r.data, pos:p.data }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spin"/></div>;

  const { stats, vendors, rfqs, pos } = data;

  const vStatus = [
    { name:'Verified', value: vendors.filter(v=>v.status==='verified').length },
    { name:'Pending',  value: vendors.filter(v=>v.status==='pending').length },
    { name:'Rejected', value: vendors.filter(v=>v.status==='rejected').length },
  ].filter(d=>d.value>0);

  const now = new Date();
  const monthly = Array.from({length:6},(_,i)=>{
    const d = new Date(now.getFullYear(), now.getMonth()-5+i, 1);
    return {
      month: d.toLocaleString('default',{month:'short'}),
      orders: pos.filter(p=>{ const pd=new Date(p.created_at); return pd.getMonth()===d.getMonth()&&pd.getFullYear()===d.getFullYear(); }).length
    };
  });

  return (
    <div>
      <div className="ph"><div><h1>Reports & Analytics</h1><div className="ph-sub">Procurement insights and trends</div></div></div>

      <div className="stat-grid" style={{ gridTemplateColumns:'repeat(4,1fr)' }}>
        <div className="stat-card"><div className="stat-num">{vendors.length}</div><div className="stat-lbl">Total Vendors</div></div>
        <div className="stat-card"><div className="stat-num">{rfqs.length}</div><div className="stat-lbl">Total RFQs</div></div>
        <div className="stat-card"><div className="stat-num">{pos.length}</div><div className="stat-lbl">Total POs</div></div>
        <div className="stat-card"><div className="stat-num">{stats?.pending_approvals||0}</div><div className="stat-lbl">Pending Approvals</div></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div className="card">
          <div className="card-title">Monthly PO Trend</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly}>
              <XAxis dataKey="month" stroke="var(--text-muted)" tick={{fontSize:10}} />
              <YAxis stroke="var(--text-muted)" tick={{fontSize:10}} allowDecimals={false} />
              <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',fontSize:11}} />
              <Bar dataKey="orders" fill="var(--green-muted)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">Vendor Status</div>
          {vStatus.length > 0 ? (
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <ResponsiveContainer width="55%" height={160}>
                <PieChart>
                  <Pie data={vStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {vStatus.map((_,i)=><Cell key={i} fill={C[i%C.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',fontSize:11}} />
                </PieChart>
              </ResponsiveContainer>
              <div>
                {vStatus.map((d,i)=>(
                  <div key={d.name} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:C[i%C.length] }}/>
                    <span style={{ fontSize:11, color:'var(--text-dim)' }}>{d.name}</span>
                    <span style={{ fontSize:11, fontWeight:600, marginLeft:'auto', paddingLeft:12 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="empty" style={{ padding:40 }}><p>No vendor data</p></div>}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Recent Purchase Orders</div>
        {pos.length===0 ? <div className="empty" style={{ padding:30 }}><p>No POs yet</p></div> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>PO Number</th><th>Date</th><th>Status</th><th>Due Date</th></tr></thead>
              <tbody>
                {pos.slice(0,8).map(po=>(
                  <tr key={po.id}>
                    <td style={{ fontFamily:'monospace' }}>{po.po_number}</td>
                    <td>{new Date(po.created_at).toLocaleDateString()}</td>
                    <td><span className={`badge ${po.status==='paid'?'b-blue':po.status==='approved'?'b-green':'b-gray'}`}>{po.status}</span></td>
                    <td>{po.due_date?new Date(po.due_date).toLocaleDateString():'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
