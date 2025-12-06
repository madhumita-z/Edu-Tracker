const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No authentication token, access denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user
        db.get('SELECT * FROM users WHERE id = ?', [decoded.userId], (err, user) => {
            if (err || !user) {
                return res.status(401).json({ error: 'User not found' });
            }

            req.user = user;
            req.userId = decoded.userId;
            next();
        });
    } catch (error) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

const facultyOnly = (req, res, next) => {
    if (req.user.user_type !== 'faculty') {
        return res.status(403).json({ error: 'Access denied. Faculty only.' });
    }
    next();
};

const studentOnly = (req, res, next) => {
    if (req.user.user_type !== 'student') {
        return res.status(403).json({ error: 'Access denied. Students only.' });
    }
    next();
};

module.exports = { authMiddleware, facultyOnly, studentOnly };