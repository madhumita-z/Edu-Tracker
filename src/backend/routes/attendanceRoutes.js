const express = require('express');
const router = express.Router();
const {
    generateQRCode,
    scanQRCode,
    endQRSession,
    getQRSessionStatus
} = require('../controllers/attendanceController');
const { authMiddleware } = require('../middleware/authMiddleware');

// QR code routes
router.post('/qr/generate', authMiddleware, generateQRCode);
router.post('/qr/scan', authMiddleware, scanQRCode);
router.post('/qr/end', authMiddleware, endQRSession);
router.get('/qr/status/:sessionId', authMiddleware, getQRSessionStatus);

module.exports = router;