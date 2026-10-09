const FoodBill = require('../models/FoodBill');
const Agent = require('../models/Agent');
const { generateBillId } = require('../utils/billIdGenerator');
const storageService = require('../services/storageService');
const path = require('path');
const fs = require('fs');

// Submit Food Bill (Agent or Public User)
const createBill = async (req, res) => {
  try {
    const { agentId, date, foodType, amount, paymentMethod, remarks, packetCount } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Payment screenshot image is required.' });
    }

    if (!agentId || !date || !foodType || !amount || !paymentMethod) {
      storageService.deleteFile(req.file.filename);
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      storageService.deleteFile(req.file.filename);
      return res.status(400).json({ message: 'Amount paid must be greater than ₹0.' });
    }

    const numericCount = parseInt(packetCount, 10) || 1;

    const agent = await Agent.findById(agentId);
    if (!agent || agent.status !== 'Active') {
      storageService.deleteFile(req.file.filename);
      return res.status(400).json({ message: 'Selected agent is invalid or inactive.' });
    }

    const submissionDate = new Date(date);

    // Duplicate Submission Prevention
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingDuplicate = await FoodBill.findOne({
      agent: agent._id,
      amount: numericAmount,
      foodType,
      date: submissionDate,
      submittedAt: { $gte: fiveMinutesAgo }
    });

    if (existingDuplicate) {
      storageService.deleteFile(req.file.filename);
      return res.status(409).json({ 
        message: `Duplicate submission detected! A bill of ₹${numericAmount} for ${foodType} was submitted just moments ago (${existingDuplicate.billId}).` 
      });
    }

    const billId = await generateBillId();
    const screenshotUrl = storageService.getPublicUrl(req.file.filename);

    const newBill = new FoodBill({
      billId,
      agent: agent._id,
      agentName: agent.name,
      agentId: agent.employeeId,
      date: submissionDate,
      foodType,
      packetCount: numericCount,
      amount: numericAmount,
      paymentMethod,
      screenshotUrl,
      remarks: remarks || '',
      status: 'Pending',
      submittedBy: req.user ? req.user._id : agent._id
    });

    await newBill.save();

    res.status(201).json({
      message: 'Food bill submitted successfully.',
      bill: newBill
    });
  } catch (error) {
    console.error('Error submitting bill:', error);
    if (req.file) storageService.deleteFile(req.file.filename);
    res.status(500).json({ message: 'Server error while submitting food bill', error: error.message });
  }
};

// Get Bills with search, filters, pagination
const getBills = async (req, res) => {
  try {
    const {
      search,
      startDate,
      endDate,
      quickFilter,
      agentId,
      status,
      foodType,
      paymentMethod,
      page = 1,
      limit = 100
    } = req.query;

    const query = {};

    if (req.user && req.user.role === 'AGENT') {
      if (req.user.agent) {
        query.agent = req.user.agent._id;
      } else {
        query.submittedBy = req.user._id;
      }
    } else if (agentId) {
      query.agent = agentId;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (foodType && foodType !== 'All') {
      query.foodType = foodType;
    }

    if (paymentMethod && paymentMethod !== 'All') {
      query.paymentMethod = paymentMethod;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { billId: searchRegex },
        { agentName: searchRegex },
        { agentId: searchRegex }
      ];
    }

    let dateStart, dateEnd;
    const now = new Date();

    if (quickFilter) {
      if (quickFilter === 'Today') {
        dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        dateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      } else if (quickFilter === 'Yesterday') {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        dateStart = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 0, 0, 0);
        dateEnd = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 23, 59, 59);
      } else if (quickFilter === 'Last 7 Days') {
        dateStart = new Date(now);
        dateStart.setDate(dateStart.getDate() - 7);
        dateStart.setHours(0, 0, 0, 0);
        dateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      } else if (quickFilter === 'Current 15 Days') {
        const day = now.getDate();
        if (day <= 15) {
          dateStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          dateEnd = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59);
        } else {
          dateStart = new Date(now.getFullYear(), now.getMonth(), 16, 0, 0, 0);
          dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }
      } else if (quickFilter === 'Previous 15 Days') {
        const day = now.getDate();
        if (day <= 15) {
          dateStart = new Date(now.getFullYear(), now.getMonth() - 1, 16, 0, 0, 0);
          dateEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        } else {
          dateStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          dateEnd = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59);
        }
      } else if (quickFilter === 'This Month') {
        dateStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      }
    } else {
      if (startDate) {
        dateStart = new Date(startDate);
        dateStart.setHours(0, 0, 0, 0);
      }
      if (endDate) {
        dateEnd = new Date(endDate);
        dateEnd.setHours(23, 59, 59, 999);
      }
    }

    if (dateStart || dateEnd) {
      query.date = {};
      if (dateStart) query.date.$gte = dateStart;
      if (dateEnd) query.date.$lte = dateEnd;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 100;
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await FoodBill.countDocuments(query);
    const bills = await FoodBill.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const allMatching = await FoodBill.find(query);
    const summary = {
      totalBills: allMatching.length,
      totalAmount: allMatching.reduce((sum, b) => sum + b.amount, 0),
      pendingCount: allMatching.filter(b => b.status === 'Pending').length,
      pendingAmount: allMatching.filter(b => b.status === 'Pending').reduce((sum, b) => sum + b.amount, 0),
      approvedCount: allMatching.filter(b => b.status === 'Approved').length,
      approvedAmount: allMatching.filter(b => b.status === 'Approved').reduce((sum, b) => sum + b.amount, 0),
      rejectedCount: allMatching.filter(b => b.status === 'Rejected').length,
      rejectedAmount: allMatching.filter(b => b.status === 'Rejected').reduce((sum, b) => sum + b.amount, 0)
    };

    res.json({
      bills,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      summary
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ message: 'Error fetching food bills', error: error.message });
  }
};

// Update Bill Status (Approve / Reject)
const updateBillStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be either Approved or Rejected.' });
    }

    if (status === 'Rejected' && (!rejectionReason || rejectionReason.trim() === '')) {
      return res.status(400).json({ message: 'Please provide a reason for rejecting the food bill.' });
    }

    const bill = await FoodBill.findById(id);
    if (!bill) {
      return res.status(404).json({ message: 'Food bill submission not found.' });
    }

    bill.status = status;
    bill.rejectionReason = status === 'Rejected' ? rejectionReason.trim() : '';
    if (req.user) bill.verifiedBy = req.user._id;
    bill.verifiedAt = new Date();

    await bill.save();

    res.json({ message: `Bill ${bill.billId} ${status.toLowerCase()} successfully.`, bill });
  } catch (error) {
    res.status(500).json({ message: 'Error updating bill status', error: error.message });
  }
};

// Download Individual Screenshot
const downloadIndividualScreenshot = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await FoodBill.findById(id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const filePath = storageService.getFilePath(bill.screenshotUrl);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Screenshot file not found on server' });
    }

    const ext = path.extname(filePath).toLowerCase();
    const safeAgentName = bill.agentName.replace(/[^a-zA-Z0-9]/g, '_');
    const customFilename = `${bill.billId}_${safeAgentName}_${bill.amount}${ext}`;

    res.download(filePath, customFilename);
  } catch (error) {
    res.status(500).json({ message: 'Error downloading screenshot', error: error.message });
  }
};

module.exports = {
  createBill,
  getBills,
  updateBillStatus,
  downloadIndividualScreenshot
};
