import React, { useState, useEffect } from 'react';
import {
  getAgentsApi,
  createAgentApi,
  deleteAgentApi,
  getBillsApi,
  submitBillApi,
  get15DayReportApi,
  getIndividualScreenshotUrl,
  downloadExcelReportUrl,
  downloadPDFReportUrl,
  downloadScreenshotPDFUrl
} from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import {
  Utensils,
  PlusCircle,
  Receipt,
  FileSpreadsheet,
  Users,
  Download,
  CheckCircle2,
  Eye,
  Camera,
  Trash2,
  Plus,
  Calendar,
  RotateCcw
} from 'lucide-react';

const SinglePortal = () => {
  const [activeTab, setActiveTab] = useState('submit'); // 'submit', 'bills', 'reports', 'agents'

  // Data States
  const [agents, setAgents] = useState([]);
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({
    totalBills: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------
  // SUBMIT FORM STATE (Food Type defaults to 'Dinner')
  // -------------------------------------------------------------
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [foodType, setFoodType] = useState('Dinner');
  const [packetCount, setPacketCount] = useState(1);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [remarks, setRemarks] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  // -------------------------------------------------------------
  // BILL MANAGEMENT & FILTER STATE (Includes Calendar Date Range)
  // -------------------------------------------------------------
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);

  // -------------------------------------------------------------
  // 15-DAY REPORT STATE
  // -------------------------------------------------------------
  const [reportPeriodPreset, setReportPeriodPreset] = useState('Period1');
  const [reportData, setReportData] = useState(null);

  // -------------------------------------------------------------
  // AGENT MANAGEMENT STATE
  // -------------------------------------------------------------
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agentFormName, setAgentFormName] = useState('');
  const [agentFormTeam, setAgentFormTeam] = useState('Operations');
  const [deletingAgent, setDeletingAgent] = useState(null);

  // Load Initial Data
  const loadData = () => {
    setLoading(true);
    Promise.all([
      getAgentsApi(),
      getBillsApi({
        startDate,
        endDate,
        quickFilter: activeQuickFilter,
        limit: 200
      }),
      get15DayReportApi({ periodPreset: reportPeriodPreset })
    ])
      .then(([agentsRes, billsRes, reportRes]) => {
        setAgents(agentsRes.data);
        if (agentsRes.data.length > 0 && !selectedAgentId) {
          setSelectedAgentId(agentsRes.data[0]._id);
        }
        setBills(billsRes.data.bills);
        setSummary(billsRes.data.summary);
        setReportData(reportRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [activeQuickFilter, reportPeriodPreset]);

  // Handle Agent Dropdown Selection in Submit Form
  const handleAgentChange = (e) => {
    setSelectedAgentId(e.target.value);
  };

  // Handle Image Upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setFormError('Only JPG, JPEG, and PNG images are allowed.');
      return;
    }

    setFormError('');
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Form Submission Handlers
  const handleFormValidate = (e) => {
    e.preventDefault();
    if (!selectedAgentId) {
      setFormError('Please select an Agent Name.');
      return;
    }
    if (!date) {
      setFormError('Please select a Date.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setFormError('Amount paid must be greater than ₹0.');
      return;
    }
    if (!imageFile) {
      setFormError('Payment screenshot is required.');
      return;
    }
    setFormError('');
    setShowConfirmModal(true);
  };

  const handleFinalBillSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('agentId', selectedAgentId);
      formData.append('date', date);
      formData.append('foodType', foodType);
      formData.append('packetCount', packetCount);
      formData.append('amount', amount);
      formData.append('paymentMethod', paymentMethod);
      formData.append('remarks', remarks);
      formData.append('screenshot', imageFile);

      const res = await submitBillApi(formData);
      setSubmissionSuccess(res.data);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error submitting food bill.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Agent Action
  const handleDeleteAgentConfirm = async () => {
    if (!deletingAgent) return;
    try {
      await deleteAgentApi(deletingAgent._id);
      setDeletingAgent(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const quickFilters = ['Today', 'Yesterday', 'Last 7 Days', 'Current 15 Days', 'Previous 15 Days', 'This Month'];
  const selectedAgentObj = agents.find((a) => String(a._id) === String(selectedAgentId));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Portal Top Header */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-900 text-white shadow-md">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-primary-900 leading-none">Food Bill Portal</h1>
            <span className="text-[11px] font-medium text-slate-500">Internal Company Portal (2 Months History Active)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" /> Live Portal
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Metrics Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Submissions</span>
            <span className="text-2xl font-black text-slate-900">{summary.totalBills}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Amount Paid</span>
            <span className="text-2xl font-black text-emerald-600">₹{summary.totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Agents</span>
            <span className="text-2xl font-black text-primary-900">{agents.length}</span>
          </div>
        </div>

        {/* Unified Portal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white p-1.5 rounded-2xl shadow-xs overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'submit'
                ? 'bg-primary-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Submit Food Bill</span>
          </button>

          <button
            onClick={() => setActiveTab('bills')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'bills'
                ? 'bg-primary-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Food Bills ({bills.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-primary-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>15-Day Reports & Downloads</span>
          </button>

          <button
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'agents'
                ? 'bg-primary-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Agent Directory ({agents.length})</span>
          </button>
        </div>

        {/* =================================----------------------------- */}
        {/* TAB 1: FOOD BILL SUBMISSION FORM */}
        {/* =================================----------------------------- */}
        {activeTab === 'submit' && (
          <div className="max-w-xl mx-auto">
            {submissionSuccess ? (
              <div className="rounded-3xl bg-white p-8 text-center shadow-xl border border-emerald-200 space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Food bill submitted successfully.</h2>
                <div className="inline-block rounded-full bg-primary-50 px-4 py-1.5 text-xs font-bold text-primary-900 border border-primary-200">
                  Bill ID: {submissionSuccess.bill?.billId}
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Agent Name:</span>
                    <span className="font-bold text-slate-900">{submissionSuccess.bill?.agentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-extrabold text-emerald-600 text-sm">₹{submissionSuccess.bill?.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span>{new Date(submissionSuccess.bill?.date).toISOString().split('T')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Food Type:</span>
                    <span>{submissionSuccess.bill?.foodType}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSubmissionSuccess(null);
                      setAmount('');
                      setRemarks('');
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="flex-1 rounded-xl bg-primary-900 py-3 text-xs font-bold text-white shadow-md hover:bg-primary-800"
                  >
                    + Submit Another Bill
                  </button>
                  <button
                    onClick={() => setActiveTab('bills')}
                    className="flex-1 rounded-xl border border-slate-300 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View All Submissions
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormValidate} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3 mb-2">
                  <h2 className="text-lg font-bold text-slate-900">Food Bill Submission</h2>
                  <p className="text-xs text-slate-500">Fill in payment details and attach receipt screenshot</p>
                </div>

                {formError && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
                    {formError}
                  </div>
                )}

                {/* 1. Agent Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    1. Select Agent Name *
                  </label>
                  <select
                    value={selectedAgentId}
                    onChange={handleAgentChange}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 font-medium bg-white outline-none focus:border-primary-900"
                  >
                    {agents.map((ag) => (
                      <option key={ag._id} value={ag._id}>
                        {ag.name} ({ag.team})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2 & 3. Date & Food Type (Food Type defaults to Dinner) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">2. Date *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-primary-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">3. Food Type *</label>
                    <select
                      value={foodType}
                      onChange={(e) => setFoodType(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 bg-white font-medium outline-none focus:border-primary-900"
                    >
                      <option value="Dinner">Dinner (Default)</option>
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* 4 & 5. Count & Amount Paid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      4. No. of Packets / Count *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="1"
                      value={packetCount}
                      onChange={(e) => setPacketCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-primary-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">5. Amount Paid (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 pl-8 pr-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-primary-900"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">6. Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 bg-white font-medium outline-none focus:border-primary-900"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* 7. Screenshot Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    7. Payment Screenshot *
                  </label>
                  <div className="relative rounded-2xl border-2 border-dashed border-slate-300 p-4 text-center hover:border-primary-900 bg-slate-50/50">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageChange}
                      className="absolute inset-0 z-10 opacity-0 cursor-pointer w-full h-full"
                    />
                    {imagePreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={imagePreview} alt="Preview" className="max-h-40 rounded object-contain border border-slate-200" />
                        <span className="text-[11px] font-semibold text-emerald-600">Tap to Change Image</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-3">
                        <Camera className="h-8 w-8 text-slate-400 mb-1" />
                        <span className="text-xs font-bold text-slate-700">Upload Screenshot / Proof</span>
                        <span className="text-[10px] text-slate-400">JPG, JPEG, PNG</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 8. Remarks */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">8. Optional Remarks</label>
                  <textarea
                    rows="2"
                    placeholder="Add any note..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary-900 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-primary-800 active:scale-95 transition-all"
                >
                  Submit Food Bill
                </button>
              </form>
            )}
          </div>
        )}

        {/* =================================----------------------------- */}
        {/* TAB 2: FOOD BILLS (CALENDAR DATE RANGE FILTER ADDED) */}
        {/* =================================----------------------------- */}
        {activeTab === 'bills' && (
          <div className="space-y-4">
            {/* Quick Filters + Calendar Date Range Picker */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 text-xs font-semibold">
              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400 uppercase text-[10px] pr-2 border-r border-slate-200">
                  Quick Filter:
                </span>
                {quickFilters.map((qf) => (
                  <button
                    key={qf}
                    onClick={() => {
                      setActiveQuickFilter(qf);
                      setStartDate('');
                      setEndDate('');
                      loadData();
                    }}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      activeQuickFilter === qf && !startDate
                        ? 'bg-primary-900 text-white font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {qf}
                  </button>
                ))}
              </div>

              {/* Calendar Date Range Selector */}
              <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-200 lg:pl-4">
                <Calendar className="h-4 w-4 text-primary-900 shrink-0" />
                <span className="text-slate-600 font-bold text-[11px] uppercase">Select Dates:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl border border-slate-300 px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-primary-900 bg-white"
                />
                <span className="text-slate-400 font-normal">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl border border-slate-300 px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-primary-900 bg-white"
                />
                <button
                  onClick={() => {
                    setActiveQuickFilter('');
                    loadData();
                  }}
                  className="rounded-xl bg-primary-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-800 transition-all"
                >
                  Apply Dates
                </button>
                {(startDate || endDate || activeQuickFilter) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setActiveQuickFilter('');
                      loadData();
                    }}
                    className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-slate-200 font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Bill ID</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Agent Name</th>
                      <th className="py-3.5 px-4">Food Type</th>
                      <th className="py-3.5 px-4 text-center">Count</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Method</th>
                      <th className="py-3.5 px-4 text-center">Screenshot</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {bills.map((bill) => (
                      <tr key={bill._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-primary-900 whitespace-nowrap">{bill.billId}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">{new Date(bill.date).toISOString().split('T')[0]}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">{bill.agentName}</td>
                        <td className="py-3.5 px-4">{bill.foodType}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">{bill.packetCount || 1}</td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">₹{bill.amount}</td>
                        <td className="py-3.5 px-4">{bill.paymentMethod}</td>
                        <td className="py-3.5 px-4 text-center">
                          <button onClick={() => setSelectedBill(bill)} className="p-0.5 border rounded border-slate-200 hover:border-primary-900">
                            <img src={bill.screenshotUrl} alt="Thumb" className="h-8 w-8 object-cover rounded" />
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedBill(bill)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" /> View
                            </button>
                            <a
                              href={getIndividualScreenshotUrl(bill._id)}
                              download
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                              title="Download Screenshot"
                            >
                              <Download className="h-3.5 w-3.5" /> Download
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================----------------------------- */}
        {/* TAB 3: 15-DAY REPORTS & DOWNLOADS */}
        {/* =================================----------------------------- */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Period Selector & Download Action Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">15-Day Period:</span>
                <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                  <button
                    onClick={() => setReportPeriodPreset('Period1')}
                    className={`px-3 py-1.5 rounded-lg ${reportPeriodPreset === 'Period1' ? 'bg-primary-900 text-white font-bold' : 'text-slate-600'}`}
                  >
                    1st - 15th
                  </button>
                  <button
                    onClick={() => setReportPeriodPreset('Period2')}
                    className={`px-3 py-1.5 rounded-lg ${reportPeriodPreset === 'Period2' ? 'bg-primary-900 text-white font-bold' : 'text-slate-600'}`}
                  >
                    16th - End
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={downloadExcelReportUrl({ periodPreset: reportPeriodPreset })}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Download Excel Report
                </a>
                <a
                  href={downloadScreenshotPDFUrl({ periodPreset: reportPeriodPreset })}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-800"
                >
                  <Download className="h-4 w-4" /> Download 6-Screenshot PDF Report
                </a>
              </div>
            </div>

            {/* Summary Data */}
            {reportData && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase">
                    15-DAY SUMMARY REPORT ({reportData.periodInfo?.startDateStr} to {reportData.periodInfo?.endDateStr})
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Agents Submitted</span>
                    <span className="text-2xl font-black text-slate-900">{reportData.summary?.totalAgents}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Bills</span>
                    <span className="text-2xl font-black text-slate-900">{reportData.summary?.totalBills}</span>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4 border border-blue-200">
                    <span className="text-xs font-bold text-blue-700 uppercase block mb-1">Total Amount</span>
                    <span className="text-2xl font-black text-primary-900">₹{reportData.summary?.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================----------------------------- */}
        {/* TAB 4: AGENT DIRECTORY */}
        {/* =================================----------------------------- */}
        {activeTab === 'agents' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">Agent Directory</h2>
                <p className="text-xs text-slate-500">Manage office agents and teams</p>
              </div>
              <button
                onClick={() => {
                  setAgentFormName('');
                  setAgentFormTeam('Operations');
                  setShowAgentModal(true);
                }}
                className="rounded-xl bg-primary-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary-800 flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> + Add Agent
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50">
                  <tr>
                    <th className="py-3.5 px-6">Agent Name</th>
                    <th className="py-3.5 px-6">Team</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {agents.map((ag) => (
                    <tr key={ag._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-slate-900">{ag.name}</td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${ag.team === 'Reporting Team' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700'}`}>
                          {ag.team}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => setDeletingAgent(ag)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirm & Submit Food Bill">
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Agent Name:</span>
              <span className="font-bold text-slate-900">{selectedAgentObj?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-extrabold text-emerald-600 text-base">₹{amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span>{date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Food Type:</span>
              <span>{foodType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">No. of Packets / Count:</span>
              <span className="font-bold text-slate-900">{packetCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Method:</span>
              <span>{paymentMethod}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold">
              Edit
            </button>
            <button onClick={handleFinalBillSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-primary-900 text-white font-bold">
              {submitting ? 'Submitting...' : 'Confirm & Submit'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Agent Modal */}
      <Modal isOpen={!!deletingAgent} onClose={() => setDeletingAgent(null)} title="Delete Agent">
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600">
            Are you sure you want to delete agent <b>{deletingAgent?.name}</b> ({deletingAgent?.team})?
          </p>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setDeletingAgent(null)} className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold">
              Cancel
            </button>
            <button onClick={handleDeleteAgentConfirm} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold">
              Delete Agent
            </button>
          </div>
        </div>
      </Modal>

      {/* View Detail Modal */}
      <Modal isOpen={!!selectedBill} onClose={() => setSelectedBill(null)} title={`Bill Details - ${selectedBill?.billId}`}>
        {selectedBill && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div><span className="text-slate-400 block">Agent Name</span><span className="font-bold text-slate-900">{selectedBill.agentName}</span></div>
              <div><span className="text-slate-400 block">Date</span><span className="font-semibold text-slate-900">{new Date(selectedBill.date).toISOString().split('T')[0]}</span></div>
              <div><span className="text-slate-400 block">Food Type</span><span className="font-semibold text-slate-900">{selectedBill.foodType}</span></div>
              <div><span className="text-slate-400 block">Packets / Count</span><span className="font-bold text-slate-900">{selectedBill.packetCount || 1}</span></div>
              <div><span className="text-slate-400 block">Amount Paid</span><span className="font-bold text-emerald-600">₹{selectedBill.amount}</span></div>
              <div><span className="text-slate-400 block">Payment Method</span><span className="font-semibold text-slate-900">{selectedBill.paymentMethod}</span></div>
            </div>

            <div className="border border-slate-200 rounded-xl p-2 bg-slate-100 flex justify-center">
              <img src={selectedBill.screenshotUrl} alt="Screenshot" className="max-h-64 rounded object-contain" />
            </div>

            <a
              href={getIndividualScreenshotUrl(selectedBill._id)}
              download
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-900 text-white font-bold rounded-xl text-xs shadow-xs"
            >
              <Download className="h-4 w-4" /> Download Individual Screenshot
            </a>
          </div>
        )}
      </Modal>

      {/* Add Agent Modal */}
      <Modal isOpen={showAgentModal} onClose={() => setShowAgentModal(false)} title="Add New Agent">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await createAgentApi({
              name: agentFormName,
              team: agentFormTeam
            });
            setShowAgentModal(false);
            loadData();
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="block font-bold mb-1">Agent Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Swathi"
              value={agentFormName}
              onChange={(e) => setAgentFormName(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 outline-none focus:border-primary-900"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Team *</label>
            <select
              value={agentFormTeam}
              onChange={(e) => setAgentFormTeam(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 bg-white outline-none focus:border-primary-900"
            >
              <option value="Operations">Operations</option>
              <option value="Reporting Team">Reporting Team</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowAgentModal(false)} className="flex-1 py-2.5 border rounded-xl font-semibold">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-primary-900 text-white rounded-xl font-bold">
              Save Agent
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SinglePortal;
