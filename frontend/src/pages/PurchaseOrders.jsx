import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// Redirect PO page to Invoices (they're combined in wireframe Screen 9)
export default function PurchaseOrders() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/invoices', { replace: true }); }, []);
  return null;
}
