const db = require('../config/database');

class Placement {
    static create({ company, position, description, deadline, posted_by }) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO placements (company, position, description, deadline, posted_by) 
                 VALUES (?, ?, ?, ?, ?)`,
                [company, position, description, deadline, posted_by],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT p.*, u.name as faculty_name 
                FROM placements p
                JOIN faculty f ON p.posted_by = f.id
                JOIN users u ON f.user_id = u.id
                WHERE p.status = 'open'
                ORDER BY p.deadline ASC
            `;
            db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static getByFaculty(faculty_id) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM placements WHERE posted_by = ? ORDER BY created_at DESC`,
                [faculty_id],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    static getWithApplications(faculty_id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT p.*, COUNT(a.id) as application_count
                FROM placements p
                LEFT JOIN applications a ON p.id = a.placement_id
                WHERE p.posted_by = ?
                GROUP BY p.id
                ORDER BY p.deadline ASC
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
                `UPDATE placements SET ${fields.join(', ')} WHERE id = ?`,
                values,
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes > 0);
                }
            );
        });
    }
}

module.exports = Placement;