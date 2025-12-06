const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create({ email, password, name, user_type, branch }) {
        // Check email domain
        if (!email.endsWith('@clg.edu.in')) {
            throw new Error('Only @clg.edu.in emails allowed');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO users (email, password, name, user_type, branch) 
                 VALUES (?, ?, ?, ?, ?)`,
                [email, hashedPassword, name, user_type, branch],
                function(err) {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed')) {
                            reject(new Error('Email already registered'));
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve({ id: this.lastID, email, name, user_type, branch });
                    }
                }
            );
        });
    }

    static findByEmail(email) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static findById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static async verifyPassword(user, password) {
        return await bcrypt.compare(password, user.password);
    }

    static updateProfile(id, updates) {
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
                `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
                values,
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes > 0);
                }
            );
        });
    }
}

module.exports = User;