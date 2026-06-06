import { useState, useEffect } from 'react';
import { getRFQs, getQuotationsByRFQ, selectQuotation } from '../api';

export default function QuotationComparison() {
  const [rfqs, setRFQs] = useState([]);
  const [selRFQ, setSelRFQ] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getRFQs().then(r => setRFQs(r.data)); }, []);

  useEffect(() => {
    if (!selRFQ) { setQuotations([]); return; }
    setLoading(true);
    getQuotationsByRFQ(selRFQ).then(r => setQuotations(r.data)).finally(() => setLoading(false));
  }, [selRFQ]);

  const rfq = rfqs.find(r => r.id === parseInt(selRFQ));
  const minTotal = quotations.length > 0 ? Math.min(...quotations.map(q => q.grand_total)) : null;

  const ROWS = [
    { label: 'Criteria / and Total', key: q => `₹${q.grand_total?.toLocaleString()}` },
    { label: 'GST %',                key: q => `${q.tax_percent}%` },
    { label: 'Delivery (days)',       key: q => q.delivery_days || '—' },
    { label: 'Vendor rating',         key: q => q.vendor?.rating ? `${q.vendor.rating}/5` : 'N/A' },
    { label: 'Payment terms',         key: q => q.notes ? '30 days' : '30 days' },
  ];

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Quotation Comparison</h1>
          {rfq && <div className="ph-sub">RFQ: {rfq.title} — {quotations.length} quotations received</div>}
        </div>
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <div className="field" style={{ marginBottom:0 }}>
          <label className="field-label">Select RFQ</label>
          <select className="field-select" style={{ maxWidth:380 }} value={selRFQ} onChange={e=>setSelRFQ(e.target.value)}>
            <option value="">Choose an RFQ to compare...</option>
            {rfqs.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="loading"><div className="spin"/></div>}

      {!loading && quotations.length > 0 && (
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width:180 }}>Criteria</th>
                  {quotations.map(q => (
                    <th key={q.id} style={{ textAlign:'center', background: q.grand_total===minTotal ? 'rgba(29,185,84,0.15)' : undefined }}>
                      <div>{q.vendor?.company_name || `Vendor #${q.vendor_id}`}</div>
                      {q.grand_total===minTotal && <div style={{ fontSize:9, color:'var(--green)', marginTop:2 }}>✓ Lowest</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(row => (
                  <tr key={row.label}>
                    <td className="compare-label">{row.label}</td>
                    {quotations.map(q => (
                      <td key={q.id} style={{ textAlign:'center', background: q.grand_total===minTotal ? 'rgba(29,185,84,0.06)' : undefined, fontWeight: row.label.includes('Total') ? 700 : 400, color: row.label.includes('Total') && q.grand_total===minTotal ? 'var(--green)' : undefined }}>
                        {row.key(q)}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Action row */}
                <tr>
                  <td></td>
                  {quotations.map(q => (
                    <td key={q.id} style={{ textAlign:'center', paddingTop:14, background: q.grand_total===minTotal ? 'rgba(29,185,84,0.06)' : undefined }}>
                      {q.status==='submitted' ? (
                        <button
                          className={`btn btn-sm ${q.grand_total===minTotal ? 'btn-primary' : 'btn-outline'}`}
                          onClick={async()=>{ if(confirm('Select this vendor?')){ await selectQuotation(q.id); getQuotationsByRFQ(selRFQ).then(r=>setQuotations(r.data)); } }}
                        >
                          {q.grand_total===minTotal ? 'Select & Approve' : 'Select'}
                        </button>
                      ) : (
                        <span className="badge b-green">Selected</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:10, fontSize:10, color:'var(--text-muted)' }}>
            Green = lowest price. Selecting a vendor initiates the approval workflow.
          </div>
        </div>
      )}

      {!loading && selRFQ && quotations.length === 0 && (
        <div className="empty"><div className="empty-ico">📊</div><p>No quotations received for this RFQ yet</p></div>
      )}
    </div>
  );
}
