import axios from 'axios';
import {
  getLocalAgents,
  createLocalAgent,
  deleteLocalAgent,
  submitLocalBill,
  getLocalBills,
  generateClientExcelReport,
  generateClientPDFReport
} from '../services/localDB';

const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

const api = axios.create({
  baseURL: '/api'
});

export const loginApi = async (email, password) => {
  return { data: { user: { role: 'ADMIN', name: 'System Admin' }, token: 'mock-token' } };
};

export const getMeApi = async () => {
  return { data: { user: { role: 'ADMIN', name: 'System Admin' } } };
};

export const getAgentsApi = async (activeOnly = false) => {
  if (isGitHubPages) {
    const data = await getLocalAgents();
    return { data };
  }
  try {
    return await api.get(`/agents?activeOnly=${activeOnly}`);
  } catch (err) {
    const data = await getLocalAgents();
    return { data };
  }
};

export const createAgentApi = async (data) => {
  if (isGitHubPages) {
    const newAgent = await createLocalAgent(data);
    return { data: newAgent };
  }
  try {
    return await api.post('/agents', data);
  } catch (err) {
    const newAgent = await createLocalAgent(data);
    return { data: newAgent };
  }
};

export const deleteAgentApi = async (id) => {
  if (isGitHubPages) {
    await deleteLocalAgent(id);
    return { data: { message: 'Agent deleted' } };
  }
  try {
    return await api.delete(`/agents/${id}`);
  } catch (err) {
    await deleteLocalAgent(id);
    return { data: { message: 'Agent deleted' } };
  }
};

export const submitBillApi = async (formData) => {
  if (isGitHubPages) {
    const bill = await submitLocalBill(formData);
    return { data: { message: 'Bill submitted successfully', bill } };
  }
  try {
    return await api.post('/bills', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  } catch (err) {
    const bill = await submitLocalBill(formData);
    return { data: { message: 'Bill submitted successfully', bill } };
  }
};

export const getBillsApi = async (params) => {
  if (isGitHubPages) {
    const data = await getLocalBills(params);
    return { data };
  }
  try {
    return await api.get('/bills', { params });
  } catch (err) {
    const data = await getLocalBills(params);
    return { data };
  }
};

export const get15DayReportApi = async (params) => {
  if (isGitHubPages) {
    const resData = await getLocalBills(params);
    return {
      data: {
        periodInfo: { startDateStr: '1st', endDateStr: '15th' },
        summary: {
          totalAgents: 42,
          totalBills: resData.summary.totalBills,
          totalAmount: resData.summary.totalAmount
        }
      }
    };
  }
  try {
    return await api.get('/reports/15-day', { params });
  } catch (err) {
    const resData = await getLocalBills(params);
    return {
      data: {
        periodInfo: { startDateStr: '1st', endDateStr: '15th' },
        summary: {
          totalAgents: 42,
          totalBills: resData.summary.totalBills,
          totalAmount: resData.summary.totalAmount
        }
      }
    };
  }
};

export const getIndividualScreenshotUrl = (id) => `/api/bills/${id}/screenshot/download`;

export const downloadExcelReportUrl = (params) => {
  if (isGitHubPages) {
    return 'javascript:window.triggerClientExcel()';
  }
  const query = new URLSearchParams(params).toString();
  return `/api/reports/excel?${query}`;
};

export const downloadPDFReportUrl = (params) => {
  if (isGitHubPages) {
    return 'javascript:window.triggerClientPDF()';
  }
  const query = new URLSearchParams(params).toString();
  return `/api/reports/pdf?${query}`;
};

export const downloadScreenshotPDFUrl = (params) => {
  if (isGitHubPages) {
    return 'javascript:window.triggerClientPDF()';
  }
  const query = new URLSearchParams(params).toString();
  return `/api/reports/screenshot-pdf?${query}`;
};

if (typeof window !== 'undefined') {
  window.triggerClientExcel = () => generateClientExcelReport('15Day');
  window.triggerClientPDF = () => generateClientPDFReport('15Day');
}

export default api;
