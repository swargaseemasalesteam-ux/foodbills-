import React, { useState, useEffect } from 'react';
import { get15DayReportApi, downloadScreenshotPDFUrl } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { FileText, Download, Image as ImageIcon, Grid, CheckCircle, Calendar, Sparkles } from 'lucide-react';

const ScreenshotReports = () => {
  const [periodPreset, setPeriodPreset] = useState('Period1');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = (preset = periodPreset, start = customStartDate, end = customEndDate) => {
    setLoading(true);
    const params = { status: statusFilter };
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
  }, [statusFilter]);

  const handlePeriodChange = (preset) => {
    setPeriodPreset(preset);
    setCustomStartDate('');
    setCustomEndDate('');
    fetchReport(preset, '', '');
  };

  const getExportParams = () => {
    const params = { status: statusFilter };
    if (customStartDate && customEndDate) {
      params.startDate = customStartDate;
      params.endDate = customEndDate;
    } else {
      params.periodPreset = periodPreset || 'Period1';
    }
    return params;
  };

  const bills = reportData?.bills || [];
  const cardsPerPage = 6;
  const pageCount = Math.ceil(bills.length / cardsPerPage) || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Screenshot Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Generate print-friendly A4 PDF reports formatted with exactly 6 screenshots per page in a 2×3 grid
          </p>
        </div>

        {/* Download Button */}
        <a
          href={downloadScreenshotPDFUrl(getExportParams())}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-900 px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-primary-800 transition-all active:scale-95"
        >
          <Download className="h-5 w-5" />
          <span>Download Screenshot Report (PDF)</span>
        </a>
      </div>

      {/* Grid Specs Notification Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 p-4 text-white shadow-md flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white shrink-0">
          <Grid className="h-6 w-6" />
        </div>
        <div className="text-xs">
          <span className="font-bold text-sm block">A4 PDF Grid Layout Specification</span>
          <p className="text-slate-200 mt-0.5">
            PDFs strictly render <b>exactly 6 screenshots per page</b> in a clean <b>2 × 3 grid layout</b>. Original aspect ratios are strictly preserved without cropping.
          </p>
        </div>
      </div>

      {/* Period & Filter Control */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Period:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                onClick={() => handlePeriodChange('Period1')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodPreset === 'Period1' && !customStartDate
                    ? 'bg-primary-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1st - 15th
              </button>
              <button
                onClick={() => handlePeriodChange('Period2')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodPreset === 'Period2' && !customStartDate
                    ? 'bg-primary-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                16th - End
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800 bg-white outline-none focus:border-primary-900"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved Only</option>
              <option value="Pending">Pending Only</option>
              <option value="Rejected">Rejected Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live Preview of 2x3 Grid Cards */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary-900" />
            PDF Grid Preview ({bills.length} Screenshots Total &bull; {pageCount} PDF Page{pageCount > 1 ? 's' : ''})
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            Page Layout Preview
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading screenshot grid...</div>
        ) : bills.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ImageIcon className="mx-auto h-12 w-12 text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No screenshots found for selected period.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from({ length: pageCount }).map((_, pageIdx) => {
              const pageBills = bills.slice(pageIdx * cardsPerPage, (pageIdx + 1) * cardsPerPage);
              return (
                <div key={pageIdx} className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 sm:p-6 space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase border-b border-slate-200 pb-2">
                    <span>PDF Page {pageIdx + 1} of {pageCount}</span>
                    <span className="text-primary-900">{pageBills.length} Screenshots on this page</span>
                  </div>

                  {/* 2 x 3 Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pageBills.map((bill) => (
                      <div
                        key={bill._id}
                        className="rounded-xl bg-white border border-slate-300 shadow-xs overflow-hidden flex flex-col"
                      >
                        {/* Header Box inside card */}
                        <div className="bg-primary-900 text-white p-3 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-sm block leading-tight">{bill.agentName}</span>
                            <span className="text-[10px] text-blue-200">
                              ID: {bill.billId} &bull; {new Date(bill.date).toISOString().split('T')[0]}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-sm block text-emerald-300">₹{bill.amount}</span>
                            <span className="text-[10px] text-blue-100">{bill.paymentMethod}</span>
                          </div>
                        </div>

                        {/* Image Preview Container */}
                        <div className="p-3 bg-slate-100 flex-1 flex items-center justify-center min-h-[160px]">
                          <img
                            src={bill.screenshotUrl}
                            alt={`Screenshot ${bill.billId}`}
                            className="max-h-48 w-auto max-w-full object-contain rounded border border-slate-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenshotReports;
