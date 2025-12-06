const express = require('express');
const router = express.Router();
const {
    getDashboard,
    getStudents,
    getStudentAttendance,
    updateAttendance,
    getStudentPerformance,
    updatePerformance
} = require('../controllers/facultyController');
const { authMiddleware, facultyOnly } = require('../middleware/authMiddleware');

// All routes require faculty authentication
router.use(authMiddleware, facultyOnly);

router.get('/dashboard', getDashboard);
router.get('/students', getStudents);
router.get('/attendance', getStudentAttendance);
router.post('/attendance', updateAttendance);
router.get('/performance', getStudentPerformance);
router.post('/performance', updatePerformance);

module.exports = router;