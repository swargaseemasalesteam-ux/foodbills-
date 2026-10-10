import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const DB_NAME = 'FoodBillsLocalDB';
const DB_VERSION = 1;

const RAW_AGENT_NAMES = [
  'Lahari', 'Deepthi', 'Likhitha', 'Bhargavi', 'Sri devi',
  'Iswarya', 'Raj kumari', 'Kaveri', 'Sravani', 'Varshini',
  'Rehana', 'Amulya', 'Rachana', 'Hema.V', 'Aparna',
  'Joyas', 'Charishma', 'Vinathi', 'Mitra', 'N.kavya',
  'Kumari', 'Teja', 'Sailaja', 'Sindhu', 'Madhavi',
  'Ranjitha', 'Suguna', 'Sravanthi', 'Lavanya', 'Swathi',
  'Hema Sri', 'Souparnika', 'UshaRani', 'Akanksha', 'Sukeetha',
  'Akhila', 'Khushi', 'Praveena', 'Paadha sri',
  'Sangeetha', 'Nandhini', 'Satwika'
];
const REPORTING_NAMES = ['Sangeetha', 'Nandhini', 'Satwika'];

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('agents')) {
        db.createObjectStore('agents', { keyPath: '_id' });
      }
      if (!db.objectStoreNames.contains('bills')) {
        db.createObjectStore('bills', { keyPath: '_id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const initLocalDB = async () => {
  const db = await openDB();
  const tx = db.transaction(['agents'], 'readwrite');
  const store = tx.objectStore('agents');
  
  const countReq = store.count();
  return new Promise((resolve) => {
    countReq.onsuccess = async () => {
      if (countReq.result === 0) {
        const txAdd = db.transaction(['agents'], 'readwrite');
        const addStore = txAdd.objectStore('agents');
        RAW_AGENT_NAMES.forEach((name, i) => {
          const isReporting = REPORTING_NAMES.includes(name);
          addStore.put({
            _id: 'local_agent_' + (i + 1),
            name,
            employeeId: `FB${String(i + 1).padStart(3, '0')}`,
            team: isReporting ? 'Reporting Team' : 'Operations',
            status: 'Active'
          });
        });
        txAdd.oncomplete = () => resolve(true);
      } else {
        resolve(true);
      }
    };
  });
};

export const getLocalAgents = async () => {
  await initLocalDB();
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(['agents'], 'readonly');
    const req = tx.objectStore('agents').getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
};

export const createLocalAgent = async (data) => {
  const db = await openDB();
  const _id = 'local_agent_' + Date.now();
  const newAgent = {
    _id,
    name: data.name,
    team: data.team || 'Operations',
    employeeId: `FB${Math.floor(100 + Math.random() * 900)}`,
    status: 'Active'
  };
  return new Promise((resolve) => {
    const tx = db.transaction(['agents'], 'readwrite');
    tx.objectStore('agents').put(newAgent);
    tx.oncomplete = () => resolve(newAgent);
  });
};

export const deleteLocalAgent = async (id) => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(['agents'], 'readwrite');
    tx.objectStore('agents').delete(id);
    tx.oncomplete = () => resolve(true);
  });
};

export const submitLocalBill = async (formData) => {
  const db = await openDB();
  const agentId = formData.get('agentId');
  const agents = await getLocalAgents();
  const agentObj = agents.find(a => String(a._id) === String(agentId)) || { name: 'Unknown Agent', employeeId: 'FB000' };

  const imageFile = formData.get('screenshot');
  let dataUrl = '';
  if (imageFile) {
    dataUrl = await new Promise((res) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result);
      reader.readAsDataURL(imageFile);
    });
  }

  const billId = `FB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
  const amountVal = parseFloat(formData.get('amount')) || 0;
  const countVal = parseInt(formData.get('packetCount'), 10) || 1;

  const newBill = {
    _id: 'bill_' + Date.now(),
    billId,
    agent: agentId,
    agentName: agentObj.name,
    agentId: agentObj.employeeId,
    date: new Date(formData.get('date')).toISOString(),
    foodType: formData.get('foodType') || 'Dinner',
    packetCount: countVal,
    amount: amountVal,
    paymentMethod: formData.get('paymentMethod') || 'UPI',
    screenshotUrl: dataUrl,
    remarks: formData.get('remarks') || '',
    status: 'Pending',
    submittedAt: new Date().toISOString()
  };

  return new Promise((resolve) => {
    const tx = db.transaction(['bills'], 'readwrite');
    tx.objectStore('bills').put(newBill);
    tx.oncomplete = () => resolve(newBill);
  });
};

export const getLocalBills = async (params = {}) => {
  const db = await openDB();
  const allBills = await new Promise((resolve) => {
    const tx = db.transaction(['bills'], 'readonly');
    const req = tx.objectStore('bills').getAll();
    req.onsuccess = () => resolve(req.result || []);
  });

  let filtered = [...allBills];
  if (params.startDate) {
    const sTime = new Date(params.startDate).setHours(0,0,0,0);
    filtered = filtered.filter(b => new Date(b.date).getTime() >= sTime);
  }
  if (params.endDate) {
    const eTime = new Date(params.endDate).setHours(23,59,59,999);
    filtered = filtered.filter(b => new Date(b.date).getTime() <= eTime);
  }

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalAmount = filtered.reduce((s, b) => s + b.amount, 0);

  return {
    bills: filtered,
    summary: {
      totalBills: filtered.length,
      totalAmount
    }
  };
};

export const generateClientExcelReport = async (periodPreset) => {
  const { bills } = await getLocalBills();
  const wb = XLSX.utils.book_new();

  const detailsData = bills.map((b, idx) => ({
    'S.No': idx + 1,
    'Bill ID': b.billId,
    'Date': b.date ? b.date.split('T')[0] : '',
    'Agent Name': b.agentName,
    'Agent ID': b.agentId,
    'Food Type': b.foodType,
    'Count': b.packetCount || 1,
    'Amount (₹)': b.amount,
    'Payment Method': b.paymentMethod,
    'Status': b.status,
    'Remarks': b.remarks || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(detailsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Bill Details');
  XLSX.writeFile(wb, `Food_Bills_Report_${periodPreset}.xlsx`);
};

export const generateClientPDFReport = async (periodPreset) => {
  const { bills } = await getLocalBills();
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('FOOD PAYMENT SCREENSHOTS REPORT', 14, 15);
  doc.setFontSize(10);
  doc.text(`Period: ${periodPreset} | Total Bills: ${bills.length}`, 14, 23);

  let y = 35;
  bills.forEach((b, idx) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.text(`${idx + 1}. ${b.agentName} - ${b.billId} (₹${b.amount})`, 14, y);
    doc.setFontSize(9);
    doc.text(`Date: ${b.date ? b.date.split('T')[0] : ''} | Food: ${b.foodType} | Count: ${b.packetCount || 1} | Method: ${b.paymentMethod}`, 14, y + 6);
    y += 18;
  });

  doc.save(`Food_Bills_Report_${periodPreset}.pdf`);
};
