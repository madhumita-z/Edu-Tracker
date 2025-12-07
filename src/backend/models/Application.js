const db = require('../config/database');

class Application {
    static create({ student_id, placement_id, status, interview_date, notes }) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO applications (student_id, placement_id, status, interview_date, notes) 
                 VALUES (?, ?, ?, ?, ?)`,
                [student_id, placement_id, status || 'Applied', interview_date, notes],
                function(err) {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed')) {
                            reject(new Error('Already applied for this placement'));
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve({ id: this.lastID });
                    }
                }
            );
        });
    }

    static findByStudent(student_id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT a.*, p.company, p.position, p.deadline 
                FROM applications a
                JOIN placements p ON a.placement_id = p.id
                WHERE a.student_id = ?
                ORDER BY a.applied_date DESC
            `;
            db.all(query, [student_id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static getByPlacement(placement_id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT a.*, s.student_id as student_code, u.name as student_name, u.email 
                FROM applications a
                JOIN students s ON a.student_id = s.id
                JOIN users u ON s.user_id = u.id
                WHERE a.placement_id = ?
                ORDER BY a.applied_date DESC
            `;
            db.all(query, [placement_id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static updateStatus(id, status, interview_date = null) {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE applications SET status = ?, interview_date = ? WHERE id = ?`,
                [status, interview_date, id],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes > 0);
                }
            );
        });
    }
}

module.exports = Application;