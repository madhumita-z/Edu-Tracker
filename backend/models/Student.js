const db = require('../config/database');

class Student {
    static create({ user_id, student_id, enrollment_year, assigned_faculty_id, phone, address }) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO students (user_id, student_id, enrollment_year, assigned_faculty_id, phone, address) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [user_id, student_id, enrollment_year || new Date().getFullYear(), assigned_faculty_id, phone, address],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, user_id, student_id });
                }
            );
        });
    }

    static findByUserId(user_id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT s.*, u.name, u.email, u.branch, f.name as faculty_name 
                FROM students s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN faculty f ON s.assigned_faculty_id = f.id
                WHERE s.user_id = ?
            `;
            db.get(query, [user_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static update(user_id, updates) {
        const fields = [];
        const values = [];
        
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });
        
        values.push(user_id);
        
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE students SET ${fields.join(', ')} WHERE user_id = ?`,
                values,
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes > 0);
                }
            );
        });
    }

    static getStudentsByFaculty(faculty_id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT s.*, u.name, u.email, u.branch 
                FROM students s
                JOIN users u ON s.user_id = u.id
                WHERE s.assigned_faculty_id = ?
            `;
            db.all(query, [faculty_id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT s.*, u.name, u.email, u.branch, f.name as faculty_name 
                FROM students s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN faculty f ON s.assigned_faculty_id = f.id
            `;
            db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = Student;