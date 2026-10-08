const mongoose = require('mongoose');

const foodBillSchema = new mongoose.Schema({
  billId: {
    type: String,
    required: true,
    unique: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  agentName: {
    type: String,
    required: true
  },
  agentId: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  foodType: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Other'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Cash', 'Card', 'Other'],
    required: true
  },
  screenshotUrl: {
    type: String,
    required: true
  },
  remarks: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'submittedAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('FoodBill', foodBillSchema);
