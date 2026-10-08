import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Intercept requests to attach JWT Token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('food_bills_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const loginApi = (email, password) => api.post('/auth/login', { email, password });
export const getMeApi = () => api.get('/auth/me');

// Agents API
export const getAgentsApi = (activeOnly = false) => api.get(`/agents?activeOnly=${activeOnly}`);
export const createAgentApi = (data) => api.post('/agents', data);
export const updateAgentApi = (id, data) => api.put(`/agents/${id}`, data);
export const deleteAgentApi = (id) => api.delete(`/agents/${id}`);

// Bills API
export const submitBillApi = (formData) => 
  api.post('/bills', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const getBillsApi = (params) => api.get('/bills', { params });
export const updateBillStatusApi = (id, status, rejectionReason) => 
  api.patch(`/bills/${id}/status`, { status, rejectionReason });

export const getIndividualScreenshotUrl = (id) => `/api/bills/${id}/screenshot/download`;

// Reports API
export const get15DayReportApi = (params) => api.get('/reports/15-day', { params });

export const downloadExcelReportUrl = (params) => {
  const query = new URLSearchParams(params).toString();
  return `/api/reports/excel?${query}`;
};

export const downloadPDFReportUrl = (params) => {
  const query = new URLSearchParams(params).toString();
  return `/api/reports/pdf?${query}`;
};

export const downloadScreenshotPDFUrl = (params) => {
  const query = new URLSearchParams(params).toString();
  return `/api/reports/screenshot-pdf?${query}`;
};

export default api;
