import React, { useState, useEffect } from 'react';
import { getBillsApi, getIndividualScreenshotUrl } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { Eye, Download, Receipt, Search, Filter } from 'lucide-react';

const MyBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBill, setSelectedBill] = useState(null);

  const fetchBills = () => {
    setLoading(true);
    getBillsApi({ status: statusFilter, limit: 100 })
      .then((res) => {
        setBills(res.data.bills);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBills();
  }, [statusFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">My Food Bills</h1>
          <p className="text-xs sm:text-sm text-slate-500">History of all your submitted food expense bills</p>
        </div>

        {/* Status Filter Pill Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {['All', 'Pending', 'Approved', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === st
                  ? 'bg-white text-primary-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading your food bills...</div>
        ) : bills.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Receipt className="mx-auto h-12 w-12 text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No food bills found for status "{statusFilter}".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Bill ID</th>
                  <th className="py-3.5 px-4">Food Type</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      {new Date(bill.date).toISOString().split('T')[0]}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-primary-900 whitespace-nowrap">{bill.billId}</td>
                    <td className="py-3.5 px-4 text-slate-700">{bill.foodType}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">₹{bill.amount}</td>
                    <td className="py-3.5 px-4 text-slate-600">{bill.paymentMethod}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={bill.status} />
                      {bill.status === 'Rejected' && bill.rejectionReason && (
                        <span className="block text-[11px] text-rose-600 font-normal mt-0.5 max-w-xs truncate">
                          Reason: {bill.rejectionReason}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <a
                          href={getIndividualScreenshotUrl(bill._id)}
                          download
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                          title="Download Screenshot"
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

      {/* Bill View Modal */}
      <Modal
        isOpen={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        title={`Bill Submission - ${selectedBill?.billId}`}
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
                <span className="font-bold block mb-0.5">Admin Rejection Reason:</span>
                {selectedBill.rejectionReason}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 block">Agent Name</span>
                <span className="font-bold text-slate-900">{selectedBill.agentName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Employee ID</span>
                <span className="font-semibold text-slate-900">{selectedBill.agentId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Date</span>
                <span className="font-semibold text-slate-900">{new Date(selectedBill.date).toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Food Type</span>
                <span className="font-semibold text-slate-900">{selectedBill.foodType}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Amount Paid</span>
                <span className="font-extrabold text-emerald-600 text-base">₹{selectedBill.amount}</span>
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
                Uploaded Proof Screenshot
              </span>
              <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 overflow-hidden flex justify-center">
                <img
                  src={selectedBill.screenshotUrl}
                  alt="Payment Proof"
                  className="max-h-72 rounded object-contain"
                />
              </div>
            </div>

            <a
              href={getIndividualScreenshotUrl(selectedBill._id)}
              download
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-900 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary-800"
            >
              <Download className="h-4 w-4" /> Download Submitted Screenshot
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyBills;
