const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const db = new sqlite3.Database(path.join(__dirname, '..', 'database.db'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database with tables
function initializeDatabase() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        user_type TEXT NOT NULL CHECK(user_type IN ('student', 'faculty')),
        branch TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Students table
    db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        student_id TEXT UNIQUE,
        enrollment_year INTEGER,
        assigned_faculty_id INTEGER,
        phone TEXT,
        address TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (assigned_faculty_id) REFERENCES users(id)
    )`);

    // Faculty table
    db.run(`CREATE TABLE IF NOT EXISTS faculty (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        employee_id TEXT UNIQUE,
        designation TEXT DEFAULT 'Professor',
        department TEXT,
        phone TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Attendance table
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        faculty_id INTEGER NOT NULL,
        date DATE NOT NULL,
        subject TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('present', 'absent')),
        remarks TEXT,
        qr_session_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (faculty_id) REFERENCES faculty(id)
    )`);

    // Performance table
    db.run(`CREATE TABLE IF NOT EXISTS performance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        faculty_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        midterm_marks REAL DEFAULT 0,
        final_exam_marks REAL DEFAULT 0,
        assignment_marks REAL DEFAULT 0,
        total_marks REAL DEFAULT 0,
        grade TEXT,
        semester TEXT,
        academic_year TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (faculty_id) REFERENCES faculty(id)
    )`);

    // Placements table
    db.run(`CREATE TABLE IF NOT EXISTS placements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company TEXT NOT NULL,
        position TEXT NOT NULL,
        description TEXT,
        deadline DATE,
        status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed', 'filled')),
        posted_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (posted_by) REFERENCES faculty(id)
    )`);

    // Applications table
    db.run(`CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        placement_id INTEGER NOT NULL,
        status TEXT DEFAULT 'Applied' CHECK(status IN ('Applied', 'Shortlisted', 'Selected', 'Rejected', 'Waiting List')),
        applied_date DATE DEFAULT CURRENT_DATE,
        interview_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (placement_id) REFERENCES placements(id),
        UNIQUE(student_id, placement_id)
    )`);

    // Reminders table
    db.run(`CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('absent', 'placement', 'offer', 'deadline', 'general')),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
    )`);

    // QR Sessions table
    db.run(`CREATE TABLE IF NOT EXISTS qr_sessions (
        id TEXT PRIMARY KEY,
        faculty_id INTEGER NOT NULL,
        subject TEXT,
        expires_at DATETIME NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        scanned_students TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (faculty_id) REFERENCES faculty(id)
    )`);

    console.log('Database tables initialized');
}

module.exports = db;