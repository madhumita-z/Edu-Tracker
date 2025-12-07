const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const register = async (req, res) => {
    try {
        const { email, password, name, user_type, branch, student_id, employee_id, phone, address } = req.body;

        // Create user
        const user = await User.create({ email, password, name, user_type, branch });
        
        // Create student or faculty profile
        if (user_type === 'student') {
            // Find a faculty in the same branch to assign
            let assigned_faculty_id = null;
            
            db.get(
                'SELECT f.id FROM faculty f JOIN users u ON f.user_id = u.id WHERE u.branch = ? LIMIT 1',
                [branch],
                async (err, faculty) => {
                    if (err) {
                        console.error('Error finding faculty:', err);
                    }
                    
                    if (faculty) {
                        assigned_faculty_id = faculty.id;
                    }
                    
                    try {
                        await Student.create({
                            user_id: user.id,
                            student_id,
                            enrollment_year: new Date().getFullYear(),
                            assigned_faculty_id,
                            phone,
                            address
                        });
                        
                        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
                            expiresIn: process.env.JWT_EXPIRE
                        });
                        
                        res.status(201).json({
                            success: true,
                            token,
                            user: {
                                id: user.id,
                                email: user.email,
                                name: user.name,
                                user_type: user.user_type,
                                branch: user.branch
                            }
                        });
                    } catch (error) {
                        res.status(500).json({ error: error.message });
                    }
                }
            );
        } else if (user_type === 'faculty') {
            try {
                await Faculty.create({
                    user_id: user.id,
                    employee_id,
                    department: branch,
                    phone
                });
                
                const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRE
                });
                
                res.status(201).json({
                    success: true,
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        user_type: user.user_type,
                        branch: user.branch
                    }
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password, user_type } = req.body;

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check user type
        if (user_type && user.user_type !== user_type) {
            return res.status(401).json({ error: `Invalid credentials for ${user_type}` });
        }

        // Verify password
        const isValidPassword = await User.verifyPassword(user, password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE
        });

        // Get profile details
        let profile = null;
        if (user.user_type === 'student') {
            profile = await Student.findByUserId(user.id);
        } else if (user.user_type === 'faculty') {
            profile = await Faculty.findByUserId(user.id);
        }

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                user_type: user.user_type,
                branch: user.branch,
                profile
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = req.user;
        
        let profile = null;
        if (user.user_type === 'student') {
            profile = await Student.findByUserId(user.id);
        } else if (user.user_type === 'faculty') {
            profile = await Faculty.findByUserId(user.id);
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                user_type: user.user_type,
                branch: user.branch,
                profile
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, email, branch, phone, address, assigned_faculty_id } = req.body;
        const user = req.user;

        // Update user
        await User.updateProfile(user.id, { name, email, branch });

        // Update profile based on user type
        if (user.user_type === 'student') {
            await Student.update(user.id, { phone, address, assigned_faculty_id });
        } else if (user.user_type === 'faculty') {
            await Faculty.update(user.id, { phone });
        }

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { register, login, getProfile, updateProfile };