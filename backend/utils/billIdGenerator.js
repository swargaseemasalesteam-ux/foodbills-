const FoodBill = require('../models/FoodBill');

const generateBillId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `FB-${currentYear}-`;
  
  // Find all bills for current year to calculate true numeric max sequence
  const bills = await FoodBill.find(
    { billId: new RegExp(`^${prefix}`) },
    { billId: 1 }
  );

  let maxSeq = 0;
  for (const b of bills) {
    if (b.billId) {
      const parts = b.billId.split('-');
      if (parts.length === 3) {
        const seqNum = parseInt(parts[2], 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const paddedSeq = String(nextSeq).padStart(5, '0');
  return `${prefix}${paddedSeq}`;
};

module.exports = { generateBillId };
