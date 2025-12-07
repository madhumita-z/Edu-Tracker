const db = require('../config/database');

class Performance {
    static create({ student_id, faculty_id, subject, midterm_marks, final_exam_marks, assignment_marks, semester, academic_year }) {
        const total_marks = midterm_marks + final_exam_marks + assignment_marks;
        const grade = this.calculateGrade(total_marks);
        
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO performance (student_id, faculty_id, subject, midterm_marks, final_exam_marks, assignment_marks, total_marks, grade, semester, academic_year) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [student_id, faculty_id, subject, midterm_marks, final_exam_marks, assignment_marks, total_marks, grade, semester, academic_year],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, total_marks, grade });
                }
            );
        });
    }

    static findByStudent(student_id) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM performance WHERE student_id = ? ORDER BY subject`,
                [student_id],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    static update(id, updates) {
        if (updates.midterm_marks !== undefined || updates.final_exam_marks !== undefined || updates.assignment_marks !== undefined) {
            // Recalculate total and grade if marks are updated
            return new Promise((resolve, reject) => {
                db.get('SELECT * FROM performance WHERE id = ?', [id], (err, row) => {
                    if (err) return reject(err);
                    
                    const midterm = updates.midterm_marks !== undefined ? updates.midterm_marks : row.midterm_marks;
                    const final = updates.final_exam_marks !== undefined ? updates.final_exam_marks : row.final_exam_marks;
                    const assignment = updates.assignment_marks !== undefined ? updates.assignment_marks : row.assignment_marks;
                    
                    updates.total_marks = midterm + final + assignment;
                    updates.grade = this.calculateGrade(updates.total_marks);
                    updates.updated_at = new Date().toISOString();
                    
                    this.performUpdate(id, updates, resolve, reject);
                });
            });
        } else {
            return this.performUpdate(id, updates);
        }
    }

    static performUpdate(id, updates, resolve, reject) {
        const fields = [];
        const values = [];
        
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });
        
        values.push(id);
        
        db.run(
            `UPDATE performance SET ${fields.join(', ')} WHERE id = ?`,
            values,
            function(err) {
                if (err) reject(err);
                else resolve(this.changes > 0);
            }
        );
    }

    static calculateGPA(student_id) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT grade FROM performance WHERE student_id = ?`,
                [student_id],
                (err, rows) => {
                    if (err) return reject(err);
                    
                    if (rows.length === 0) {
                        return resolve(0.0);
                    }
                    
                    let totalPoints = 0;
                    const gradePoints = {
                        'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
                    };
                    
                    rows.forEach(row => {
                        totalPoints += gradePoints[row.grade] || 0;
                    });
                    
                    const gpa = totalPoints / rows.length;
                    resolve(gpa.toFixed(1));
                }
            );
        });
    }

    static calculateGrade(total) {
        if (total >= 90) return 'A';
        if (total >= 80) return 'B';
        if (total >= 70) return 'C';
        if (total >= 60) return 'D';
        return 'F';
    }
}

module.exports = Performance;