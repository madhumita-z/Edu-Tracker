const db = require('../config/database');

class Faculty {
    static create({ user_id, employee_id, designation, department, phone }) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO faculty (user_id, employee_id, designation, department, phone) 
                 VALUES (?, ?, ?, ?, ?)`,
                [user_id, employee_id, designation || 'Professor', department, phone],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, user_id, employee_id });
                }
            );
        });
    }

    static findByUserId(user_id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT f.*, u.name, u.email, u.branch 
                FROM faculty f
                JOIN users u ON f.user_id = u.id
                WHERE f.user_id = ?
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
                `UPDATE faculty SET ${fields.join(', ')} WHERE user_id = ?`,
                values,
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes > 0);
                }
            );
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT f.*, u.name, u.email, u.branch 
                FROM faculty f
                JOIN users u ON f.user_id = u.id
            `;
            db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static getFacultyByBranch(branch) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT f.*, u.name, u.email 
                FROM faculty f
                JOIN users u ON f.user_id = u.id
                WHERE u.branch = ?
            `;
            db.all(query, [branch], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = Faculty;