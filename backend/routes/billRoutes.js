const express = require('express');
const router = express.Router();
const {
  createBill,
  getBills,
  updateBillStatus,
  downloadIndividualScreenshot
} = require('../controllers/billController');
const { optionalProtect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', optionalProtect, upload.single('screenshot'), createBill);
router.get('/', optionalProtect, getBills);
router.patch('/:id/status', optionalProtect, updateBillStatus);
router.get('/:id/screenshot/download', downloadIndividualScreenshot);

module.exports = router;
