import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { path: '/dashboard',           label: '- Dashboard' },
  { path: '/vendors',             label: '- Vendors' },
  { path: '/rfqs',                label: "- RFQ's" },
  { path: '/quotations',          label: '- Quotations' },
  { path: '/quotations/compare',  label: '- Compare' },
  { path: '/approvals',           label: '- Approvals' },
  { path: '/purchase-orders',     label: '- Purchase orders' },
  { path: '/invoices',            label: '- Invoices' },
  { path: '/reports',             label: '- Reports' },
  { path: '/activity',            label: '- Activity' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">VendorBridge</div>
      <nav className="sidebar-nav">
        {NAV.map(({ path, label }) => (
          <div
            key={path}
            className={`nav-item ${location.pathname.startsWith(path) && (path !== '/quotations' || location.pathname === '/quotations') ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            {label}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ marginBottom: 6, color: 'var(--text-dim)', fontSize: 11 }}>
          {user?.full_name}
        </div>
        <div
          style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11 }}
          onClick={logout}
        >
          Logout →
        </div>
      </div>
    </aside>
  );
}
