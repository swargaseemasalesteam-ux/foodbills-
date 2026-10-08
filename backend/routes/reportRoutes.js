const express = require('express');
const router = express.Router();
const {
  get15DayReportData,
  download15DayExcel,
  download15DayPDF,
  downloadScreenshotPDF
} = require('../controllers/reportController');
const { optionalProtect } = require('../middleware/authMiddleware');

router.get('/15-day', optionalProtect, get15DayReportData);
router.get('/excel', download15DayExcel);
router.get('/pdf', download15DayPDF);
router.get('/screenshot-pdf', downloadScreenshotPDF);

module.exports = router;
