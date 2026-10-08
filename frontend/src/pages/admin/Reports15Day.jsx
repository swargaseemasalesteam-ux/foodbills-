import React, { useState, useEffect } from 'react';
import { get15DayReportApi, downloadExcelReportUrl, downloadPDFReportUrl } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { FileSpreadsheet, FileText, Calendar, Filter, Download, ArrowRight, Printer } from 'lucide-react';

const Reports15Day = () => {
  const [periodPreset, setPeriodPreset] = useState('Period1'); // Period1 (1-15), Period2 (16-End)
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = (preset = periodPreset, start = customStartDate, end = customEndDate) => {
    setLoading(true);
    const params = {};
    if (preset) params.periodPreset = preset;
    if (start && end) {
      params.startDate = start;
      params.endDate = end;
      delete params.periodPreset;
    }

    get15DayReportApi(params)
      .then((res) => {
        setReportData(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handlePeriodChange = (preset) => {
    setPeriodPreset(preset);
    setCustomStartDate('');
    setCustomEndDate('');
    fetchReport(preset, '', '');
  };

  const handleCustomGenerate = (e) => {
    e.preventDefault();
    if (customStartDate && customEndDate) {
      setPeriodPreset('');
      fetchReport('', customStartDate, customEndDate);
    }
  };

  const getExportParams = () => {
    if (customStartDate && customEndDate) {
      return { startDate: customStartDate, endDate: customEndDate };
    }
    return { periodPreset: periodPreset || 'Period1' };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">15-Day Summary Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500">Automated 15-day bi-monthly food bill audit and Excel/PDF generation</p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <a
            href={downloadExcelReportUrl(getExportParams())}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-800 transition-all"
          >
            <FileSpreadsheet className="h-4 w-4" /> Download Excel
          </a>
          <a
            href={downloadPDFReportUrl(getExportParams())}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-all"
          >
            <FileText className="h-4 w-4 text-rose-600" /> Download PDF
          </a>
        </div>
      </div>

      {/* Period Selection Control */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Period:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                onClick={() => handlePeriodChange('Period1')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  periodPreset === 'Period1' && !customStartDate
                    ? 'bg-primary-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Period 1: 1st - 15th
              </button>
              <button
                onClick={() => handlePeriodChange('Period2')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  periodPreset === 'Period2' && !customStartDate
                    ? 'bg-primary-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Period 2: 16th - End of Month
              </button>
            </div>
          </div>

          {/* Custom Date Form */}
          <form onSubmit={handleCustomGenerate} className="flex items-center gap-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-primary-900"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-primary-900"
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              Generate
            </button>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
          Generating 15-day report data...
        </div>
      ) : reportData ? (
        <>
          {/* SUMMARY Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
                SUMMARY REPORT ({reportData.periodInfo?.startDateStr} — {reportData.periodInfo?.endDateStr})
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Generated Dynamically for Audit
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Agents</span>
                <span className="text-lg font-black text-slate-900">{reportData.summary?.totalAgents}</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Bills</span>
                <span className="text-lg font-black text-slate-900">{reportData.summary?.totalBills}</span>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 border border-blue-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-blue-700 uppercase block">Total Amount</span>
                <span className="text-lg font-black text-primary-900">
                  ₹{reportData.summary?.totalAmount?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 border border-amber-200">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">Pending</span>
                <span className="text-lg font-black text-amber-700">{reportData.summary?.pendingCount}</span>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Approved</span>
                <span className="text-lg font-black text-emerald-700">{reportData.summary?.approvedCount}</span>
              </div>
              <div className="rounded-xl bg-rose-50 p-3 border border-rose-200">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Rejected</span>
                <span className="text-lg font-black text-rose-700">{reportData.summary?.rejectedCount}</span>
              </div>
            </div>
          </div>

          {/* Detailed Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-bold text-slate-800 text-sm">
              Detailed Bill Submissions ({reportData.bills?.length || 0})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50">
                  <tr>
                    <th className="py-3.5 px-4 text-center">S.No</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Agent Name</th>
                    <th className="py-3.5 px-4">Agent ID</th>
                    <th className="py-3.5 px-4">Food Type</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {reportData.bills?.map((bill, index) => (
                    <tr key={bill._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-bold">{index + 1}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{new Date(bill.date).toISOString().split('T')[0]}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{bill.agentName}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">{bill.agentId}</td>
                      <td className="py-3 px-4">{bill.foodType}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">₹{bill.amount}</td>
                      <td className="py-3 px-4">{bill.paymentMethod}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={bill.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-extrabold text-slate-900 border-t border-slate-300">
                  <tr>
                    <td colSpan="5" className="py-3.5 px-4 text-right uppercase tracking-wider text-xs">
                      Total Amount:
                    </td>
                    <td colSpan="3" className="py-3.5 px-4 text-base text-emerald-700">
                      ₹{reportData.summary?.totalAmount?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Reports15Day;
