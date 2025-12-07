const express = require('express');
const router = express.Router();
const {
    updatePerformance,
    getStudentPerformance
} = require('../controllers/performanceController');
const { authMiddleware, facultyOnly } = require('../middleware/authMiddleware');

router.use(authMiddleware, facultyOnly);

router.get('/student/:student_id', getStudentPerformance);
router.post('/update', updatePerformance);

module.exports = router;