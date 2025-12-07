const Attendance = require('../models/Attendance');
const Reminder = require('../models/Reminder');
const db = require('../config/database');
const QRCode = require('qrcode');

const generateQRCode = async (req, res) => {
    try {
        const { subject, expiresIn = 15 } = req.body;
        const user = req.user;
        
        // Generate unique session ID
        const sessionId = 'QR' + Date.now() + Math.random().toString(36).substr(2, 9);
        
        // Calculate expiration time
        const expiresAt = new Date(Date.now() + expiresIn * 1000);
        
        // Create QR session in database
        db.run(
            `INSERT INTO qr_sessions (id, faculty_id, subject, expires_at) VALUES (?, ?, ?, ?)`,
            [sessionId, user.id, subject, expiresAt.toISOString()],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                // Generate QR data
                const qrData = JSON.stringify({
                    sessionId,
                    facultyId: user.id,
                    subject,
                    expiresAt: expiresAt.toISOString()
                });
                
                // Generate QR code as data URL
                QRCode.toDataURL(qrData, (err, url) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to generate QR code' });
                    }
                    
                    res.json({
                        success: true,
                        qrCode: url,
                        sessionId,
                        expiresAt: expiresAt.toISOString(),
                        expiresIn
                    });
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const scanQRCode = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const user = req.user;
        
        // Get QR session
        db.get(
            `SELECT * FROM qr_sessions WHERE id = ? AND is_active = 1 AND expires_at > datetime('now')`,
            [sessionId],
            async (err, session) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                if (!session) {
                    return res.status(400).json({ error: 'QR code expired or invalid' });
                }
                
                // Get student ID
                db.get(
                    `SELECT id FROM students WHERE user_id = ?`,
                    [user.id],
                    async (err, student) => {
                        if (err || !student) {
                            return res.status(400).json({ error: 'Student not found' });
                        }
                        
                        // Check if already scanned
                        const scannedStudents = JSON.parse(session.scanned_students || '[]');
                        if (scannedStudents.includes(student.id)) {
                            return res.status(400).json({ error: 'Already scanned' });
                        }
                        
                        // Mark attendance
                        const today = new Date().toISOString().split('T')[0];
                        await Attendance.create({
                            student_id: student.id,
                            faculty_id: session.faculty_id,
                            date: today,
                            subject: session.subject,
                            status: 'present',
                            qr_session_id: sessionId
                        });
                        
                        // Update scanned students
                        scannedStudents.push(student.id);
                        db.run(
                            `UPDATE qr_sessions SET scanned_students = ? WHERE id = ?`,
                            [JSON.stringify(scannedStudents), sessionId],
                            (err) => {
                                if (err) {
                                    console.error('Error updating scanned students:', err);
                                }
                            }
                        );
                        
                        res.json({ success: true, message: 'Attendance marked successfully' });
                    }
                );
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const endQRSession = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const user = req.user;
        
        // End QR session
        db.run(
            `UPDATE qr_sessions SET is_active = 0 WHERE id = ? AND faculty_id = ?`,
            [sessionId, user.id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Session not found or not authorized' });
                }
                
                res.json({ success: true, message: 'QR session ended successfully' });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getQRSessionStatus = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // Get QR session with scanned students
        db.get(
            `SELECT q.*, u.name as faculty_name 
             FROM qr_sessions q
             JOIN users u ON q.faculty_id = u.id
             WHERE q.id = ?`,
            [sessionId],
            (err, session) => {
                if (err || !session) {
                    return res.status(404).json({ error: 'Session not found' });
                }
                
                const scannedStudents = JSON.parse(session.scanned_students || '[]');
                
                // Get student names for scanned students
                if (scannedStudents.length > 0) {
                    const placeholders = scannedStudents.map(() => '?').join(',');
                    const query = `
                        SELECT s.student_id, u.name 
                        FROM students s
                        JOIN users u ON s.user_id = u.id
                        WHERE s.id IN (${placeholders})
                    `;
                    
                    db.all(query, scannedStudents, (err, students) => {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }
                        
                        res.json({
                            success: true,
                            session: {
                                ...session,
                                scanned_students: students,
                                is_expired: new Date(session.expires_at) < new Date()
                            }
                        });
                    });
                } else {
                    res.json({
                        success: true,
                        session: {
                            ...session,
                            scanned_students: [],
                            is_expired: new Date(session.expires_at) < new Date()
                        }
                    });
                }
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    generateQRCode,
    scanQRCode,
    endQRSession,
    getQRSessionStatus
};