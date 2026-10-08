import React, { useState, useEffect } from 'react';
import { getBillsApi, updateBillStatusApi, getAgentsApi, getIndividualScreenshotUrl } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  RotateCcw,
  Calendar,
  AlertCircle,
  Receipt
} from 'lucide-react';

const BillManagement = () => {
  const [bills, setBills] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedFoodType, setSelectedFoodType] = useState('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All');
  const [activeQuickFilter, setActiveQuickFilter] = useState('');

  // Modals state
  const [selectedBill, setSelectedBill] = useState(null);
  const [rejectingBill, setRejectingBill] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBills = (overrideParams = {}) => {
    setLoading(true);
    const params = {
      search,
      startDate,
      endDate,
      agentId: selectedAgent === 'All' ? '' : selectedAgent,
      status: selectedStatus,
      foodType: selectedFoodType,
      paymentMethod: selectedPaymentMethod,
      quickFilter: activeQuickFilter,
      limit: 100,
      ...overrideParams
    };

    getBillsApi(params)
      .then((res) => setBills(res.data.bills))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getAgentsApi().then((res) => setAgents(res.data)).catch(err => console.error(err));
    fetchBills();
  }, []);

  const handleApplyFilter = () => {
    setActiveQuickFilter('');
    fetchBills({ quickFilter: '' });
  };

  const handleResetFilter = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setSelectedAgent('All');
    setSelectedStatus('All');
    setSelectedFoodType('All');
    setSelectedPaymentMethod('All');
    setActiveQuickFilter('');
    fetchBills({
      search: '',
      startDate: '',
      endDate: '',
      agentId: '',
      status: 'All',
      foodType: 'All',
      paymentMethod: 'All',
      quickFilter: ''
    });
  };

  const handleQuickFilterClick = (qf) => {
    setActiveQuickFilter(qf);
    setStartDate('');
    setEndDate('');
    fetchBills({ quickFilter: qf, startDate: '', endDate: '' });
  };

  const handleApprove = async (billId) => {
    setActionLoading(true);
    setActionError('');
    try {
      await updateBillStatusApi(billId, 'Approved');
      fetchBills();
      if (selectedBill?._id === billId) {
        setSelectedBill(prev => ({ ...prev, status: 'Approved', rejectionReason: '' }));
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Error approving bill.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReasonInput.trim()) {
      setActionError('Please enter a rejection reason.');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      await updateBillStatusApi(rejectingBill._id, 'Rejected', rejectionReasonInput);
      setRejectingBill(null);
      setRejectionReasonInput('');
      fetchBills();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Error rejecting bill.');
    } finally {
      setActionLoading(false);
    }
  };

  const quickFilterOptions = [
    'Today',
    'Yesterday',
    'Last 7 Days',
    'Current 15 Days',
    'Previous 15 Days',
    'This Month'
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Food Bill Management</h1>
          <p className="text-xs sm:text-sm text-slate-500">Verify, approve, reject, and inspect agent food bill submissions</p>
        </div>
      </div>

      {/* Quick Filters Row */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-xs font-semibold">
        <span className="text-slate-400 uppercase tracking-wider text-[10px] pr-2 border-r border-slate-200">
          Quick Filters:
        </span>
        {quickFilterOptions.map((qf) => (
          <button
            key={qf}
            onClick={() => handleQuickFilterClick(qf)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeQuickFilter === qf
                ? 'bg-primary-900 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {qf}
          </button>
        ))}
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Instant Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Search (Name / Bill ID / Emp ID)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search agent or FB-2026..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-primary-900"
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-primary-900"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-primary-900"
            />
          </div>

          {/* Agent Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Agent Name</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 bg-white outline-none focus:border-primary-900"
            >
              <option value="All">All Agents</option>
              {agents.map((ag) => (
                <option key={ag._id} value={ag._id}>
                  {ag.name} ({ag.employeeId})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 bg-white outline-none focus:border-primary-900"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Food Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Food Type</label>
            <select
              value={selectedFoodType}
              onChange={(e) => setSelectedFoodType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 bg-white outline-none focus:border-primary-900"
            >
              <option value="All">All Food Types</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snacks">Snacks</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Payment Method</label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 bg-white outline-none focus:border-primary-900"
            >
              <option value="All">All Payment Methods</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyFilter}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary-900 py-2 px-3 text-xs font-bold text-white shadow-xs hover:bg-primary-800"
            >
              <Filter className="h-3.5 w-3.5" /> Apply Filter
            </button>
            <button
              onClick={handleResetFilter}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 py-2 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              title="Reset Filters"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading submissions...</div>
        ) : bills.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Receipt className="mx-auto h-12 w-12 text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No food bills found matching your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 text-[11px]">
                <tr>
                  <th className="py-3 px-3">Bill ID</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Agent</th>
                  <th className="py-3 px-3">Food Type</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3 text-center">Proof</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {bills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-primary-900 whitespace-nowrap">{bill.billId}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{new Date(bill.date).toISOString().split('T')[0]}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block leading-tight">{bill.agentName}</span>
                      <span className="text-[10px] text-slate-400">{bill.agentId}</span>
                    </td>
                    <td className="py-3 px-3">{bill.foodType}</td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">₹{bill.amount}</td>
                    <td className="py-3 px-3">{bill.paymentMethod}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="inline-block rounded border border-slate-200 p-0.5 hover:border-primary-900"
                        title="Click to inspect full screenshot"
                      >
                        <img
                          src={bill.screenshotUrl}
                          alt="Screenshot"
                          className="h-9 w-9 object-cover rounded"
                        />
                      </button>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={bill.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {bill.status !== 'Approved' && (
                          <button
                            onClick={() => handleApprove(bill._id)}
                            className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                            title="Approve Submission"
                          >
                            Approve
                          </button>
                        )}

                        {bill.status !== 'Rejected' && (
                          <button
                            onClick={() => {
                              setRejectingBill(bill);
                              setRejectionReasonInput('');
                              setActionError('');
                            }}
                            className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                            title="Reject Submission"
                          >
                            Reject
                          </button>
                        )}

                        <a
                          href={getIndividualScreenshotUrl(bill._id)}
                          download
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                          title="Download Screenshot Image"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={!!rejectingBill}
        onClose={() => setRejectingBill(null)}
        title={`Reject Submission - ${rejectingBill?.billId}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Please enter the official reason for rejecting <b>{rejectingBill?.agentName}</b>'s food bill of ₹{rejectingBill?.amount}.
          </p>

          {actionError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rejection Reason *</label>
            <textarea
              rows="3"
              required
              placeholder="e.g. Unclear amount on screenshot, wrong date selected, etc."
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 outline-none focus:border-rose-600"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setRejectingBill(null)}
              className="flex-1 rounded-xl border border-slate-300 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectSubmit}
              disabled={actionLoading}
              className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
            >
              {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bill View Detail Modal */}
      <Modal
        isOpen={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        title={`Food Bill Details - ${selectedBill?.billId}`}
        maxWidth="max-w-xl"
      >
        {selectedBill && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-400 block">Status:</span>
                <StatusBadge status={selectedBill.status} />
              </div>
              <div className="flex gap-2">
                {selectedBill.status !== 'Approved' && (
                  <button
                    onClick={() => handleApprove(selectedBill._id)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                )}
                {selectedBill.status !== 'Rejected' && (
                  <button
                    onClick={() => {
                      setRejectingBill(selectedBill);
                      setSelectedBill(null);
                    }}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>

            {selectedBill.status === 'Rejected' && selectedBill.rejectionReason && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                <span className="font-bold block mb-0.5">Rejection Reason:</span>
                {selectedBill.rejectionReason}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Agent Name</span>
                <span className="font-bold text-slate-900">{selectedBill.agentName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Employee ID</span>
                <span className="font-semibold text-slate-900">{selectedBill.agentId}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Date Paid</span>
                <span className="font-semibold text-slate-900">{new Date(selectedBill.date).toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Food Type</span>
                <span className="font-semibold text-slate-900">{selectedBill.foodType}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Amount Paid</span>
                <span className="font-extrabold text-emerald-600 text-base">₹{selectedBill.amount}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Payment Method</span>
                <span className="font-semibold text-slate-900">{selectedBill.paymentMethod}</span>
              </div>
            </div>

            {selectedBill.remarks && (
              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="font-semibold block text-slate-500">Agent Remarks:</span>
                {selectedBill.remarks}
              </div>
            )}

            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Payment Screenshot
              </span>
              <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 overflow-hidden flex justify-center">
                <img
                  src={selectedBill.screenshotUrl}
                  alt="Payment Screenshot"
                  className="max-h-80 rounded object-contain"
                />
              </div>
            </div>

            <a
              href={getIndividualScreenshotUrl(selectedBill._id)}
              download
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> Download Individual Screenshot Image
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BillManagement;
