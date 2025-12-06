const db = require('../config/database');

class Reminder {
    static create({ student_id, type, title, description }) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO reminders (student_id, type, title, description) 
                 VALUES (?, ?, ?, ?)`,
                [student_id, type, title, description],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });
    }

    static findByStudent(student_id, limit = 10) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM reminders 
                 WHERE student_id = ? AND is_read = 0
                 ORDER BY created_at DESC 
                 LIMIT ?`,
                [student_id, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    static markAsRead(id) {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE reminders SET is_read = 1 WHERE id = ?',
                [id],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes > 0);
                }
            );
        });
    }

    static createAbsentReminder(student_id, subject, date) {
        return this.create({
            student_id,
            type: 'absent',
            title: 'Attendance Alert',
            description: `You were absent for ${subject} class on ${new Date(date).toLocaleDateString()}`
        });
    }

    static createPlacementReminder(student_id, company, position, status) {
        return this.create({
            student_id,
            type: 'placement',
            title: 'Placement Update',
            description: `Your application for ${position} at ${company} has been ${status}`
        });
    }
}

module.exports = Reminder;