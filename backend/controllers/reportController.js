const FoodBill = require('../models/FoodBill');
const { generateExcelReport } = require('../services/excelService');
const { generateTabularPDF, generateScreenshotPDF } = require('../services/pdfService');

// Helper to resolve date range from parameters
const parseDatePeriod = (startDateStr, endDateStr, periodPreset) => {
  let start, end;
  const now = new Date();

  if (periodPreset === 'Period1') {
    // 1st to 15th of current or specified month
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59);
  } else if (periodPreset === 'Period2') {
    // 16th to end of month
    start = new Date(now.getFullYear(), now.getMonth(), 16, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (startDateStr && endDateStr) {
    start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
  } else {
    // Default to current 15-day period
    const day = now.getDate();
    if (day <= 15) {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 16, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }
  }

  const formatFn = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return {
    start,
    end,
    startDateStr: formatFn(start),
    endDateStr: formatFn(end)
  };
};

// Get JSON Data for 15-Day Report View
const get15DayReportData = async (req, res) => {
  try {
    const { startDate, endDate, periodPreset } = req.query;
    const periodInfo = parseDatePeriod(startDate, endDate, periodPreset);

    const bills = await FoodBill.find({
      date: { $gte: periodInfo.start, $lte: periodInfo.end }
    }).sort({ date: 1, createdAt: 1 });

    const totalBills = bills.length;
    const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0);
    const pendingBills = bills.filter(b => b.status === 'Pending');
    const approvedBills = bills.filter(b => b.status === 'Approved');
    const rejectedBills = bills.filter(b => b.status === 'Rejected');

    const totalAgents = new Set(bills.map(b => b.agentName)).size;

    res.json({
      periodInfo,
      summary: {
        totalAgents,
        totalBills,
        totalAmount,
        pendingCount: pendingBills.length,
        pendingAmount: pendingBills.reduce((sum, b) => sum + b.amount, 0),
        approvedCount: approvedBills.length,
        approvedAmount: approvedBills.reduce((sum, b) => sum + b.amount, 0),
        rejectedCount: rejectedBills.length,
        rejectedAmount: rejectedBills.reduce((sum, b) => sum + b.amount, 0)
      },
      bills
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report data', error: error.message });
  }
};

// Download Excel Report
const download15DayExcel = async (req, res) => {
  try {
    const { startDate, endDate, periodPreset } = req.query;
    const periodInfo = parseDatePeriod(startDate, endDate, periodPreset);

    const bills = await FoodBill.find({
      date: { $gte: periodInfo.start, $lte: periodInfo.end }
    }).sort({ date: 1, createdAt: 1 });

    const workbook = await generateExcelReport(bills, periodInfo);

    const filename = `Food_Bill_Report_${periodInfo.startDateStr}_to_${periodInfo.endDateStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ message: 'Error generating Excel report', error: error.message });
  }
};

// Download Tabular PDF Report
const download15DayPDF = async (req, res) => {
  try {
    const { startDate, endDate, periodPreset } = req.query;
    const periodInfo = parseDatePeriod(startDate, endDate, periodPreset);

    const bills = await FoodBill.find({
      date: { $gte: periodInfo.start, $lte: periodInfo.end }
    }).sort({ date: 1, createdAt: 1 });

    const filename = `Food_Bill_Report_${periodInfo.startDateStr}_to_${periodInfo.endDateStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    generateTabularPDF(bills, periodInfo, res);
  } catch (error) {
    res.status(500).json({ message: 'Error generating PDF report', error: error.message });
  }
};

// Download Screenshot PDF Report (2x3 Grid, Exactly 6 per A4 page)
const downloadScreenshotPDF = async (req, res) => {
  try {
    const { startDate, endDate, periodPreset, status } = req.query;
    const periodInfo = parseDatePeriod(startDate, endDate, periodPreset);

    const filter = {
      date: { $gte: periodInfo.start, $lte: periodInfo.end }
    };
    if (status && status !== 'All') {
      filter.status = status;
    }

    const bills = await FoodBill.find(filter).sort({ date: 1, createdAt: 1 });

    const filename = `Food_Payment_Screenshots_${periodInfo.startDateStr}_to_${periodInfo.endDateStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    generateScreenshotPDF(bills, periodInfo, res);
  } catch (error) {
    console.error('Screenshot PDF generation error:', error);
    res.status(500).json({ message: 'Error generating screenshot PDF report', error: error.message });
  }
};

module.exports = {
  get15DayReportData,
  download15DayExcel,
  download15DayPDF,
  downloadScreenshotPDF
};
