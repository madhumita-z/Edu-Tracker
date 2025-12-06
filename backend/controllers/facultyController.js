const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');
const Placement = require('../models/Placement');
const Application = require('../models/Application');
const Reminder = require('../models/Reminder');
const db = require('../config/database');

const getDashboard = async (req, res) => {
    try {
        const user = req.user;
        const faculty = await Faculty.findByUserId(user.id);
        
        // Get student count
        const students = await Student.getStudentsByFaculty(faculty.id);
        
        // Get attendance stats for faculty's students
        let totalStudents = students.length;
        let attendanceQuery = `
            SELECT 
                COUNT(*) as total_classes,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE s.assigned_faculty_id = ?
        `;
        
        db.get(attendanceQuery, [faculty.id], async (err, stats) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            const avgAttendance = stats.total_classes > 0 ? 
                Math.round((stats.present_count / stats.total_classes) * 100) : 0;
            
            // Get placement ready students (you can define your own criteria)
            const placementReady = Math.round(totalStudents * 0.7); // Example: 70% are placement ready
            
            // Get pending attendance updates (classes from last 3 days without attendance)
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            
            const pendingQuery = `
                SELECT COUNT(DISTINCT date) as pending_count
                FROM (
                    SELECT date('now', '-' || value || ' days') as date
                    FROM (
                        SELECT 0 as value UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
                    )
                ) dates
                LEFT JOIN attendance a ON dates.date = a.date AND a.faculty_id = ?
                WHERE a.id IS NULL AND dates.date <= date('now')
            `;
            
            db.get(pendingQuery, [faculty.id], (err, pending) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                res.json({
                    success: true,
                    dashboard: {
                        total_students: totalStudents,
                        avg_attendance: avgAttendance,
                        placement_ready: placementReady,
                        pending_attendance: pending.pending_count || 0
                    }
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getStudents = async (req, res) => {
    try {
        const user = req.user;
        const faculty = await Faculty.findByUserId(user.id);
        
        const students = await Student.getStudentsByFaculty(faculty.id);
        res.json({ success: true, students });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getStudentAttendance = async (req, res) => {
    try {
        const user = req.user;
        const faculty = await Faculty.findByUserId(user.id);
        
        const attendance = await Attendance.findByFaculty(faculty.id);
        res.json({ success: true, attendance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateAttendance = async (req, res) => {
    try {
        const { student_id, date, subject, status, remarks } = req.body;
        const user = req.user;
        const faculty = await Faculty.findByUserId(user.id);
        
        // Check if attendance already exists
        const existing = await Attendance.checkAttendanceExists(student_id, date, subject);
        
        if (existing) {
            // Update existing attendance
            await Attendance.update(existing.id, { status, remarks });
        } else {
            // Create new attendance
            await Attendance.create({
                student_id,
                faculty_id: faculty.id,
                date,
                subject,
                status,
                remarks
            });
        }
        
        // Create reminder for student if absent
        if (status === 'absent') {
            await Reminder.createAbsentReminder(student_id, subject, date);
        }
        
        res.json({ success: true, message: 'Attendance updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getStudentPerformance = async (req, res) => {
    try {
        const user = req.user;
        const faculty = await Faculty.findByUserId(user.id);
        const students = await Student.getStudentsByFaculty(faculty.id);
        
        // Get performance for all students
        let performanceData = [];
        for (const student of students) {
            const query = `
                SELECT p.* FROM performance p
                WHERE p.student_id = ?
                ORDER BY p.subject
            `;
            
            await new Promise((resolve, reject) => {
                db.all(query, [student.id], (err, rows) => {
                    if (err) reject(err);
                    else {
                        performanceData.push({
                            student_id: student.id,
                            student_name: student.name,
                            student_code: student.student_id,
                            performance: rows
                        });
                        resolve();
                    }
                });
            });
        }
        
        res.json({ success: true, performance: performanceData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updatePerformance = async (req, res) => {
    try {
        const { student_id, subject, midterm_marks, final_exam_marks, assignment_marks, semester, academic_year } = req.body;
        const user = req.user;
        const faculty = await Faculty.findByUserId(user.id);
        
        // Check if performance exists for this student and subject
        const existingQuery = `
            SELECT id FROM performance 
            WHERE student_id = ? AND subject = ? AND faculty_id = ?
        `;
        
        db.get(existingQuery, [student_id, subject, faculty.id], async (err, existing) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            try {
                if (existing) {
                    // Update existing performance
                    await Performance.update(existing.id, {
                        midterm_marks,
                        final_exam_marks,
                        assignment_marks,
                        semester,
                        academic_year
                    });
                } else {
                    // Create new performance record
                    await Performance.create({
                        student_id,
                        faculty_id: faculty.id,
                        subject,
                        midterm_marks,
                        final_exam_marks,
                        assignment_marks,
                        semester,
                        academic_year
                    });
                }
                
                res.json({ success: true, message: 'Performance updated successfully' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getDashboard,
    getStudents,
    getStudentAttendance,
    updateAttendance,
    getStudentPerformance,
    updatePerformance
};