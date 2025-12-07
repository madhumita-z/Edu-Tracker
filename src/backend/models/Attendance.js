const db = require('../config/database');

class Attendance {
    static create({ student_id, faculty_id, date, subject, status, remarks, qr_session_id }) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO attendance (student_id, faculty_id, date, subject, status, remarks, qr_session_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [student_id, faculty_id, date, subject, status, remarks, qr_session_id],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });
    }

    static findByStudent(student_id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT a.*, u.name as faculty_name 
                FROM attendance a
                JOIN faculty f ON a.faculty_id = f.id
                JOIN users u ON f.user_id = u.id
                WHERE a.student_id = ?
                ORDER BY a.date DESC
            `;
            db.all(query, [student_id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static findByFaculty(faculty_id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT a.*, s.student_id as student_code, u.name as student_name 
                FROM attendance a
                JOIN students s ON a.student_id = s.id
                JOIN users u ON s.user_id = u.id
                WHERE a.faculty_id = ?
                ORDER BY a.date DESC
            `;
            db.all(query, [faculty_id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static update(id, updates) {
        const fields = [];
        const values = [];
        
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });
        
        values.push(id);
        
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE attendance SET ${fields.join(', ')} WHERE id = ?`,
                values,
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes > 0);
                }
            );
        });
    }

    static getAttendanceStats(student_id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    COUNT(*) as total_classes,
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
                    ROUND((SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as attendance_percentage
                FROM attendance 
                WHERE student_id = ?
            `;
            db.get(query, [student_id], (err, row) => {
                if (err) reject(err);
                else resolve(row || { total_classes: 0, present_count: 0, attendance_percentage: 0 });
            });
        });
    }

    static checkAttendanceExists(student_id, date, subject) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM attendance WHERE student_id = ? AND date = ? AND subject = ?',
                [student_id, date, subject],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }
}

module.exports = Attendance;