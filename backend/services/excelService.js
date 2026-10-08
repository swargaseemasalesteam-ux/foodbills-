const ExcelJS = require('exceljs');

const generateExcelReport = async (bills, periodInfo) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Food Bill Submission Portal';
  workbook.lastModifiedBy = 'Admin';
  workbook.created = new Date();

  // Primary Theme Colors (Dark Blue Header, Light Borders)
  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E3A8A' } // Dark Blue
  };
  const headerFont = {
    name: 'Segoe UI',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFF' }
  };
  const titleFont = {
    name: 'Segoe UI',
    size: 16,
    bold: true,
    color: { argb: '1E3A8A' }
  };
  const subTitleFont = {
    name: 'Segoe UI',
    size: 11,
    italic: true,
    color: { argb: '475569' }
  };

  // -------------------------------------------------------------
  // SHEET 1: Summary
  // -------------------------------------------------------------
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.views = [{ showGridLines: true }];

  summarySheet.mergeCells('A1:E1');
  summarySheet.getCell('A1').value = 'FOOD BILL SUBMISSION REPORT - SUMMARY';
  summarySheet.getCell('A1').font = titleFont;

  summarySheet.mergeCells('A2:E2');
  summarySheet.getCell('A2').value = `Report Period: ${periodInfo.startDateStr} to ${periodInfo.endDateStr}`;
  summarySheet.getCell('A2').font = subTitleFont;

  summarySheet.addRow([]); // Blank row

  // Summary Metrics Table
  const totalBills = bills.length;
  const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0);
  const pendingBills = bills.filter(b => b.status === 'Pending');
  const approvedBills = bills.filter(b => b.status === 'Approved');
  const rejectedBills = bills.filter(b => b.status === 'Rejected');
  
  const pendingAmount = pendingBills.reduce((sum, b) => sum + b.amount, 0);
  const approvedAmount = approvedBills.reduce((sum, b) => sum + b.amount, 0);
  const rejectedAmount = rejectedBills.reduce((sum, b) => sum + b.amount, 0);

  const uniqueAgents = new Set(bills.map(b => b.agentName)).size;

  const summaryHeaders = ['Metric', 'Count / Value', 'Total Amount (₹)'];
  const summaryHeaderRow = summarySheet.addRow(summaryHeaders);
  summaryHeaderRow.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const summaryData = [
    ['Total Agents Submitted', uniqueAgents, '-'],
    ['Total Submissions', totalBills, `₹${totalAmount.toLocaleString('en-IN')}`],
    ['Approved Submissions', approvedBills.length, `₹${approvedAmount.toLocaleString('en-IN')}`],
    ['Pending Verification', pendingBills.length, `₹${pendingAmount.toLocaleString('en-IN')}`],
    ['Rejected Submissions', rejectedBills.length, `₹${rejectedAmount.toLocaleString('en-IN')}`]
  ];

  summaryData.forEach(row => {
    const addedRow = summarySheet.addRow(row);
    addedRow.getCell(1).font = { bold: true };
    addedRow.getCell(2).alignment = { horizontal: 'center' };
    addedRow.getCell(3).alignment = { horizontal: 'right' };
  });

  summarySheet.columns = [
    { width: 30 },
    { width: 20 },
    { width: 25 }
  ];

  // -------------------------------------------------------------
  // SHEET 2: Bill Details
  // -------------------------------------------------------------
  const detailsSheet = workbook.addWorksheet('Bill Details');
  detailsSheet.views = [{ showGridLines: true }];

  const detailsHeaders = [
    'S.No', 'Bill ID', 'Date', 'Agent Name', 'Agent ID', 
    'Food Type', 'Amount (₹)', 'Payment Method', 'Status', 'Remarks', 'Rejection Reason'
  ];

  const detailsHeaderRow = detailsSheet.addRow(detailsHeaders);
  detailsHeaderRow.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  bills.forEach((bill, index) => {
    const formattedDate = new Date(bill.date).toISOString().split('T')[0];
    const row = detailsSheet.addRow([
      index + 1,
      bill.billId,
      formattedDate,
      bill.agentName,
      bill.agentId,
      bill.foodType,
      bill.amount,
      bill.paymentMethod,
      bill.status,
      bill.remarks || '-',
      bill.rejectionReason || '-'
    ]);

    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(3).alignment = { horizontal: 'center' };
    row.getCell(7).numFmt = '₹#,##0.00';
    row.getCell(7).alignment = { horizontal: 'right' };
    row.getCell(9).alignment = { horizontal: 'center' };
  });

  // Total Row at bottom
  const totalRowIndex = bills.length + 2;
  const totalRow = detailsSheet.addRow([
    '', 'TOTAL', '', '', '', '', totalAmount, '', '', '', ''
  ]);
  totalRow.font = { bold: true };
  totalRow.getCell(2).alignment = { horizontal: 'center' };
  totalRow.getCell(7).numFmt = '₹#,##0.00';
  totalRow.getCell(7).alignment = { horizontal: 'right' };

  detailsSheet.columns = [
    { width: 8 },
    { width: 18 },
    { width: 14 },
    { width: 22 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 14 },
    { width: 25 },
    { width: 25 }
  ];

  // -------------------------------------------------------------
  // SHEET 3: Agent Summary
  // -------------------------------------------------------------
  const agentSheet = workbook.addWorksheet('Agent Summary');
  agentSheet.views = [{ showGridLines: true }];

  const agentHeaders = ['Agent Name', 'Employee ID', 'Number of Bills', 'Total Amount (₹)'];
  const agentHeaderRow = agentSheet.addRow(agentHeaders);
  agentHeaderRow.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Group by Agent
  const agentMap = {};
  bills.forEach(bill => {
    const key = `${bill.agentName}_${bill.agentId}`;
    if (!agentMap[key]) {
      agentMap[key] = {
        name: bill.agentName,
        id: bill.agentId,
        count: 0,
        total: 0
      };
    }
    agentMap[key].count += 1;
    agentMap[key].total += bill.amount;
  });

  Object.values(agentMap).forEach(ag => {
    const row = agentSheet.addRow([
      ag.name,
      ag.id,
      ag.count,
      ag.total
    ]);
    row.getCell(3).alignment = { horizontal: 'center' };
    row.getCell(4).numFmt = '₹#,##0.00';
    row.getCell(4).alignment = { horizontal: 'right' };
  });

  agentSheet.columns = [
    { width: 25 },
    { width: 18 },
    { width: 18 },
    { width: 20 }
  ];

  return workbook;
};

module.exports = { generateExcelReport };
