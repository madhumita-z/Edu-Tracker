const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');
const Application = require('../models/Application');
const Reminder = require('../models/Reminder');
const db = require('../config/database');

const getDashboard = async (req, res) => {
    try {
        const user = req.user;
        const student = await Student.findByUserId(user.id);
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Get attendance stats
        const attendanceStats = await Attendance.getAttendanceStats(student.id);
        
        // Get GPA
        const gpa = await Performance.calculateGPA(student.id);
        
        // Get applications count
        const applications = await Application.findByStudent(student.id);
        
        // Get reminders
        const reminders = await Reminder.findByStudent(student.id, 5);

        res.json({
            success: true,
            dashboard: {
                attendance_percentage: attendanceStats.attendance_percentage,
                gpa: parseFloat(gpa),
                applications_count: applications.length,
                upcoming_deadlines: 2, // You can implement this based on placements
                reminders
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAttendance = async (req, res) => {
    try {
        const user = req.user;
        const student = await Student.findByUserId(user.id);
        
        const attendance = await Attendance.findByStudent(student.id);
        res.json({ success: true, attendance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPerformance = async (req, res) => {
    try {
        const user = req.user;
        const student = await Student.findByUserId(user.id);
        
        const performance = await Performance.findByStudent(student.id);
        res.json({ success: true, performance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPlacements = async (req, res) => {
    try {
        const placementsQuery = `
            SELECT p.*, u.name as faculty_name,
                   CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END as has_applied,
                   a.status as application_status
            FROM placements p
            JOIN faculty f ON p.posted_by = f.id
            JOIN users u ON f.user_id = u.id
            LEFT JOIN (
                SELECT a1.* FROM applications a1
                JOIN students s ON a1.student_id = s.id
                WHERE s.user_id = ?
            ) a ON p.id = a.placement_id
            WHERE p.status = 'open'
            ORDER BY p.deadline ASC
        `;
        
        db.all(placementsQuery, [req.user.id], (err, placements) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, placements });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const applyForPlacement = async (req, res) => {
    try {
        const { placement_id, notes } = req.body;
        const user = req.user;
        
        // Get student id
        const student = await Student.findByUserId(user.id);
        
        // Create application
        await Application.create({
            student_id: student.id,
            placement_id,
            notes
        });

        // Create reminder
        await Reminder.create({
            student_id: student.id,
            type: 'placement',
            title: 'Application Submitted',
            description: `Your application has been submitted successfully`
        });

        res.json({ success: true, message: 'Application submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getDashboard,
    getAttendance,
    getPerformance,
    getPlacements,
    applyForPlacement
};