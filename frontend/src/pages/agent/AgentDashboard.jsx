import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBillsApi, getIndividualScreenshotUrl } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { PlusCircle, Receipt, Clock, CheckCircle2, XCircle, Download, Eye, Sparkles } from 'lucide-react';
import Modal from '../../components/Modal';

const AgentDashboard = () => {
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({
    totalBills: 0,
    totalAmount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    getBillsApi({ limit: 5 })
      .then((res) => {
        setBills(res.data.bills);
        setSummary(res.data.summary);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Agent Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500">Track and manage your submitted food bills</p>
        </div>
        <Link
          to="/agent/submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-900 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-800 transition-all active:scale-95"
        >
          <PlusCircle className="h-5 w-5" />
          <span>+ Submit Food Bill</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Receipt className="h-4 w-4 text-primary-900" />
            <span>Total Bills</span>
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900">{summary.totalBills}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>Total Amount</span>
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-600">₹{summary.totalAmount.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-amber-700">{summary.pendingCount}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>Approved</span>
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-700">{summary.approvedCount}</span>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/40 shadow-xs">
          <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <XCircle className="h-4 w-4" />
            <span>Rejected</span>
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-rose-700">{summary.rejectedCount}</span>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Recent Submissions</h2>
          <Link to="/agent/my-bills" className="text-xs font-bold text-primary-900 hover:underline">
            View All Bills &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Loading recent submissions...</div>
        ) : bills.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Receipt className="mx-auto h-12 w-12 text-slate-300 mb-2" />
            <p className="text-sm font-medium">No food bills submitted yet.</p>
            <Link to="/agent/submit" className="mt-2 inline-block text-xs font-bold text-primary-900 hover:underline">
              Submit your first food bill &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Bill ID</th>
                  <th className="py-3 px-4">Food Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {new Date(bill.date).toISOString().split('T')[0]}
                    </td>
                    <td className="py-3 px-4 font-bold text-primary-900 whitespace-nowrap">{bill.billId}</td>
                    <td className="py-3 px-4 text-slate-700">{bill.foodType}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{bill.amount}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={bill.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Eye className="h-3.5 w-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bill Details Modal */}
      <Modal
        isOpen={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        title={`Submission Details - ${selectedBill?.billId}`}
        maxWidth="max-w-lg"
      >
        {selectedBill && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <StatusBadge status={selectedBill.status} />
            </div>

            {selectedBill.status === 'Rejected' && selectedBill.rejectionReason && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                <span className="font-bold block mb-0.5">Rejection Reason:</span>
                {selectedBill.rejectionReason}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 block">Date Paid</span>
                <span className="font-semibold text-slate-900">{new Date(selectedBill.date).toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Food Type</span>
                <span className="font-semibold text-slate-900">{selectedBill.foodType}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Amount Paid</span>
                <span className="font-bold text-emerald-600 text-base">₹{selectedBill.amount}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Payment Method</span>
                <span className="font-semibold text-slate-900">{selectedBill.paymentMethod}</span>
              </div>
            </div>

            {selectedBill.remarks && (
              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="font-semibold block text-slate-500">Remarks:</span>
                {selectedBill.remarks}
              </div>
            )}

            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Uploaded Payment Proof
              </span>
              <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 overflow-hidden flex justify-center">
                <img
                  src={selectedBill.screenshotUrl}
                  alt="Payment Proof"
                  className="max-h-64 rounded object-contain"
                />
              </div>
            </div>

            <a
              href={getIndividualScreenshotUrl(selectedBill._id)}
              download
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> Download Screenshot
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AgentDashboard;
