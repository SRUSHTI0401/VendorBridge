import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;

// Auth
export const loginUser = (data) => API.post('/api/auth/login', new URLSearchParams(data));
export const registerUser = (data) => API.post('/api/auth/register', data);
export const getMe = () => API.get('/api/users/me');

// Dashboard
export const getDashboardStats = () => API.get('/api/dashboard/stats');

// Vendors
export const getVendors = (params) => API.get('/api/vendors/', { params });
export const createVendor = (data) => API.post('/api/vendors/', data);
export const updateVendor = (id, data) => API.put(`/api/vendors/${id}`, data);
export const deleteVendor = (id) => API.delete(`/api/vendors/${id}`);
export const getVendor = (id) => API.get(`/api/vendors/${id}`);

// RFQs
export const getRFQs = (params) => API.get('/api/rfqs/', { params });
export const createRFQ = (data) => API.post('/api/rfqs/', data);
export const getRFQ = (id) => API.get(`/api/rfqs/${id}`);
export const updateRFQ = (id, data) => API.put(`/api/rfqs/${id}`, data);
export const publishRFQ = (id) => API.post(`/api/rfqs/${id}/publish`);
export const deleteRFQ = (id) => API.delete(`/api/rfqs/${id}`);

// Quotations
export const getQuotations = () => API.get('/api/quotations/');
export const getQuotationsByRFQ = (rfqId) => API.get(`/api/quotations/rfq/${rfqId}`);
export const createQuotation = (data) => API.post('/api/quotations/', data);
export const getQuotation = (id) => API.get(`/api/quotations/${id}`);
export const updateQuotation = (id, data) => API.put(`/api/quotations/${id}`, data);
export const selectQuotation = (id) => API.post(`/api/quotations/${id}/select`);

// Approvals
export const getApprovals = () => API.get('/api/approvals/');
export const getApproval = (id) => API.get(`/api/approvals/${id}`);
export const getApprovalByQuotation = (quotId) => API.get(`/api/approvals/quotation/${quotId}`);
export const processApproval = (id, data) => API.post(`/api/approvals/${id}/action`, data);

// Purchase Orders
export const getPurchaseOrders = () => API.get('/api/purchase-orders/');
export const getPurchaseOrder = (id) => API.get(`/api/purchase-orders/${id}`);
export const markPaid = (id) => API.post(`/api/purchase-orders/${id}/mark-paid`);
export const downloadInvoicePDF = (id) => API.get(`/api/purchase-orders/${id}/pdf`, { responseType: 'blob' });

// Activity
export const getActivity = (params) => API.get('/api/activity/', { params });
