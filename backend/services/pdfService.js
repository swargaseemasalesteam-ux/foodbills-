const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Generate 15-day Tabular Summary PDF Report
 */
const generateTabularPDF = (bills, periodInfo, res) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  // Stream directly to response
  doc.pipe(res);

  // Colors
  const primaryColor = '#1E3A8A';
  const textColor = '#1F2937';
  const lightGray = '#F3F4F6';

  // Title & Header
  doc.fillColor(primaryColor)
     .fontSize(20)
     .font('Helvetica-Bold')
     .text('FOOD BILL SUBMISSION REPORT', { align: 'center' });

  doc.fontSize(11)
     .font('Helvetica')
     .fillColor('#4B5563')
     .text(`Report Period: ${periodInfo.startDateStr} to ${periodInfo.endDateStr}`, { align: 'center' });

  doc.moveDown(1);

  // Summary Metrics Box
  const totalBills = bills.length;
  const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0);
  const pendingCount = bills.filter(b => b.status === 'Pending').length;
  const approvedCount = bills.filter(b => b.status === 'Approved').length;
  const rejectedCount = bills.filter(b => b.status === 'Rejected').length;

  const startY = doc.y;
  doc.rect(30, startY, 535, 60).fillAndStroke(lightGray, '#E5E7EB');

  doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold');
  doc.text(`Total Bills: ${totalBills}`, 45, startY + 12);
  doc.text(`Total Amount: ₹${totalAmount.toLocaleString('en-IN')}`, 200, startY + 12);
  doc.text(`Approved: ${approvedCount}`, 400, startY + 12);

  doc.text(`Pending: ${pendingCount}`, 45, startY + 35);
  doc.text(`Rejected: ${rejectedCount}`, 200, startY + 35);

  doc.y = startY + 75;

  // Table Headers
  const tableTop = doc.y;
  doc.rect(30, tableTop, 535, 20).fill(primaryColor);

  doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
  doc.text('S.No', 35, tableTop + 5, { width: 30 });
  doc.text('Date', 70, tableTop + 5, { width: 65 });
  doc.text('Bill ID', 140, tableTop + 5, { width: 80 });
  doc.text('Agent Name', 225, tableTop + 5, { width: 110 });
  doc.text('Food Type', 340, tableTop + 5, { width: 70 });
  doc.text('Amount', 415, tableTop + 5, { width: 60, align: 'right' });
  doc.text('Status', 490, tableTop + 5, { width: 70, align: 'center' });

  let y = tableTop + 22;
  doc.font('Helvetica').fontSize(8.5).fillColor(textColor);

  bills.forEach((bill, idx) => {
    // Add page if near bottom
    if (y > 770) {
      doc.addPage({ margin: 30, size: 'A4' });
      y = 40;
    }

    const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
    doc.rect(30, y, 535, 18).fill(rowBg);

    const formattedDate = new Date(bill.date).toISOString().split('T')[0];

    doc.fillColor(textColor);
    doc.text(String(idx + 1), 35, y + 4, { width: 30 });
    doc.text(formattedDate, 70, y + 4, { width: 65 });
    doc.text(bill.billId, 140, y + 4, { width: 80 });
    doc.text(bill.agentName, 225, y + 4, { width: 110 });
    doc.text(bill.foodType, 340, y + 4, { width: 70 });
    doc.text(`₹${bill.amount.toLocaleString('en-IN')}`, 415, y + 4, { width: 60, align: 'right' });
    
    // Status color
    if (bill.status === 'Approved') doc.fillColor('#059669');
    else if (bill.status === 'Rejected') doc.fillColor('#DC2626');
    else doc.fillColor('#D97706');

    doc.text(bill.status, 490, y + 4, { width: 70, align: 'center' });

    y += 18;
  });

  // Bottom Total Line
  doc.rect(30, y, 535, 20).fill('#E5E7EB');
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9);
  doc.text('TOTAL AMOUNT', 225, y + 5);
  doc.text(`₹${totalAmount.toLocaleString('en-IN')}`, 415, y + 5, { width: 60, align: 'right' });

  doc.end();
};

/**
 * Generate PDF Screenshot Report with EXACTLY 6 screenshots per page (2x3 grid)
 */
const generateScreenshotPDF = (bills, periodInfo, res) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4', autoFirstPage: true });

  doc.pipe(res);

  const primaryColor = '#1E3A8A';
  const cardBorderColor = '#CBD5E1';
  const cardBg = '#F8FAFC';
  const textColor = '#0F172A';

  const cardsPerPage = 6;
  const totalPages = Math.ceil(bills.length / cardsPerPage) || 1;

  // Geometry calculations for A4 page (595.28 x 841.89 pt)
  const leftMargin = 30;
  const topMargin = 30;
  const usableWidth = 535.28;
  const usableHeight = 781.89;

  const headerHeight = 35;
  const gridTop = topMargin + headerHeight;
  const gridHeight = usableHeight - headerHeight;

  const gapX = 15;
  const gapY = 12;

  const cardWidth = (usableWidth - gapX) / 2; // ~260 pt
  const cardHeight = (gridHeight - gapY * 2) / 3; // ~236 pt

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      doc.addPage({ margin: 30, size: 'A4' });
    }

    // Header on top of each page
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('FOOD PAYMENT SCREENSHOTS REPORT', leftMargin, topMargin, { lineBreak: false });

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#64748B')
       .text(`Period: ${periodInfo.startDateStr} to ${periodInfo.endDateStr}   |   Page ${pageIdx + 1} of ${totalPages}`, 
             leftMargin, topMargin + 18, { align: 'left' });

    doc.moveTo(leftMargin, topMargin + 30)
       .lineTo(leftMargin + usableWidth, topMargin + 30)
       .strokeColor('#E2E8F0')
       .lineWidth(1)
       .stroke();

    const pageBills = bills.slice(pageIdx * cardsPerPage, (pageIdx + 1) * cardsPerPage);

    pageBills.forEach((bill, itemIdx) => {
      const col = itemIdx % 2;
      const row = Math.floor(itemIdx / 2);

      const x = leftMargin + col * (cardWidth + gapX);
      const y = gridTop + row * (cardHeight + gapY);

      // Draw Card Outer Frame
      doc.roundedRect(x, y, cardWidth, cardHeight, 6)
         .fillAndStroke(cardBg, cardBorderColor);

      // Card Header Banner (Agent Name & Bill ID)
      doc.roundedRect(x, y, cardWidth, 42, 6)
         .fill(primaryColor);
      // Fix bottom corners of header banner to be sharp
      doc.rect(x, y + 20, cardWidth, 22).fill(primaryColor);

      // Agent Name & Bill ID text
      doc.fillColor('#FFFFFF')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(bill.agentName, x + 8, y + 6, { width: cardWidth - 16, height: 14, ellipsis: true });

      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#93C5FD')
         .text(`ID: ${bill.billId}  |  ${new Date(bill.date).toISOString().split('T')[0]}`, x + 8, y + 22);

      // Amount & Payment Method sub-header
      doc.fillColor(textColor)
         .fontSize(9)
         .font('Helvetica-Bold')
         .text(`Amount: ₹${bill.amount.toLocaleString('en-IN')}`, x + 8, y + 46);

      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#475569')
         .text(`Via: ${bill.paymentMethod} (${bill.foodType} x${bill.packetCount || 1})`, x + cardWidth - 120, y + 46, { width: 112, align: 'right' });

      // Divider line before screenshot image
      doc.moveTo(x + 4, y + 60)
         .lineTo(x + cardWidth - 4, y + 60)
         .strokeColor('#CBD5E1')
         .lineWidth(0.5)
         .stroke();

      // Image Area Geometry
      const imgX = x + 8;
      const imgY = y + 64;
      const maxImgW = cardWidth - 16;
      const maxImgH = cardHeight - 70; // ~166 pt available

      // Resolve absolute file path of screenshot
      let imageFilePath = null;
      if (bill.screenshotUrl) {
        const basename = path.basename(bill.screenshotUrl);
        const resolvedPath = path.join(__dirname, '../uploads/screenshots', basename);
        if (fs.existsSync(resolvedPath)) {
          imageFilePath = resolvedPath;
        }
      }

      if (imageFilePath) {
        try {
          doc.image(imageFilePath, imgX, imgY, {
            fit: [maxImgW, maxImgH],
            align: 'center',
            valign: 'center'
          });
        } catch (imgErr) {
          console.error(`Error embedding image ${imageFilePath}:`, imgErr.message);
          renderPlaceholder(doc, imgX, imgY, maxImgW, maxImgH, 'Image Format Error');
        }
      } else {
        renderPlaceholder(doc, imgX, imgY, maxImgW, maxImgH, 'Screenshot Not Found');
      }
    });
  }

  doc.end();
};

function renderPlaceholder(doc, x, y, width, height, text) {
  doc.rect(x, y, width, height).fillAndStroke('#F1F5F9', '#CBD5E1');
  doc.fillColor('#94A3B8')
     .fontSize(9)
     .font('Helvetica-Oblique')
     .text(text, x, y + height / 2 - 5, { width: width, align: 'center' });
}

module.exports = {
  generateTabularPDF,
  generateScreenshotPDF
};
