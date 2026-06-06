import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const TITLES = {
  '/dashboard': 'Main Landing Page',
  '/vendors': 'Vendor Management',
  '/rfqs': "RFQ's Page",
  '/quotations/compare': 'Quotations Comparison',
  '/quotations': 'Quotation Submission',
  '/approvals': 'Approval page',
  '/purchase-orders': 'PO & invoice',
  '/invoices': 'PO & invoice',
  '/reports': 'Reports & Analytics',
  '/activity': 'Activity and logs page',
};

export default function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  const title = Object.entries(TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([k]) => location.pathname.startsWith(k))?.[1] || 'VendorBridge';

  const screenNum = {
    '/dashboard': 'Screen 3',
    '/vendors': 'Screen 4',
    '/rfqs': 'Screen 5',
    '/quotations/compare': 'Screen 7',
    '/quotations': 'Screen 6',
    '/approvals': 'Screen 8',
    '/purchase-orders': 'Screen 9',
    '/invoices': 'Screen 9',
    '/reports': 'Screen 10',
    '/activity': 'Screen 10',
  };
  const screen = Object.entries(screenNum)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([k]) => location.pathname.startsWith(k))?.[1] || '';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrap">
        <header className="topbar">
          <span className="topbar-title">
            VendorBridge &nbsp;|&nbsp; {title} &nbsp;
            {screen && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({screen})</span>}
          </span>
          <div className="topbar-right">
            <div className="user-chip">
              <div className="avatar">{(user?.full_name || 'U')[0].toUpperCase()}</div>
              <span>{user?.full_name}</span>
              <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>· {user?.role?.replace('_',' ')}</span>
            </div>
          </div>
        </header>
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
}
