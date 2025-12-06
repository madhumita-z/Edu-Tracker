const Performance = require('../models/Performance');

const updatePerformance = async (req, res) => {
    try {
        const { student_id, subject, midterm_marks, final_exam_marks, assignment_marks, semester, academic_year } = req.body;
        const user = req.user;
        
        // Update performance
        await Performance.updateOrCreate({
            student_id,
            faculty_id: user.id,
            subject,
            midterm_marks,
            final_exam_marks,
            assignment_marks,
            semester,
            academic_year
        });
        
        res.json({ success: true, message: 'Performance updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getStudentPerformance = async (req, res) => {
    try {
        const { student_id } = req.params;
        
        const performance = await Performance.findByStudent(student_id);
        res.json({ success: true, performance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    updatePerformance,
    getStudentPerformance
};