const express = require('express');
const router = express.Router();
const { 
    getDashboard, 
    getAttendance, 
    getPerformance, 
    getPlacements, 
    applyForPlacement 
} = require('../controllers/StudentController');
const { authMiddleware, studentOnly } = require('../middleware/authMiddleware');

// All routes require student authentication
router.use(authMiddleware, studentOnly);

router.get('/dashboard', getDashboard);
router.get('/attendance', getAttendance);
router.get('/performance', getPerformance);
router.get('/placements', getPlacements);
router.post('/placements/apply', applyForPlacement);

module.exports = router;