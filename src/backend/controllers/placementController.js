const Placement = require('../models/Placement');
const Application = require('../models/Application');
const Reminder = require('../models/Reminder');
const Student = require('../models/Student');

const createPlacement = async (req, res) => {
    try {
        const { company, position, description, deadline } = req.body;
        const user = req.user;
        
        // Get faculty id
        const facultyQuery = `SELECT id FROM faculty WHERE user_id = ?`;
        
        req.app.locals.db.get(facultyQuery, [user.id], async (err, faculty) => {
            if (err || !faculty) {
                return res.status(400).json({ error: 'Faculty not found' });
            }
            
            // Create placement
            await Placement.create({
                company,
                position,
                description,
                deadline,
                posted_by: faculty.id
            });
            
            // Create reminders for all students in the same branch
            const students = await Student.getAll();
            const branchStudents = students.filter(s => s.branch === user.branch);
            
            for (const student of branchStudents) {
                await Reminder.create({
                    student_id: student.id,
                    type: 'offer',
                    title: 'New Placement Opportunity',
                    description: `${company} is hiring ${position}`
                });
            }
            
            res.json({ success: true, message: 'Placement opportunity created successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPlacements = async (req, res) => {
    try {
        const user = req.user;
        
        if (user.user_type === 'faculty') {
            // Get faculty's placements
            const facultyQuery = `SELECT id FROM faculty WHERE user_id = ?`;
            
            req.app.locals.db.get(facultyQuery, [user.id], async (err, faculty) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                const placements = await Placement.getWithApplications(faculty.id);
                res.json({ success: true, placements });
            });
        } else {
            // Get all open placements
            const placements = await Placement.getAll();
            res.json({ success: true, placements });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getApplications = async (req, res) => {
    try {
        const { placement_id } = req.params;
        
        const applications = await Application.getByPlacement(placement_id);
        res.json({ success: true, applications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateApplicationStatus = async (req, res) => {
    try {
        const { application_id, status, interview_date } = req.body;
        
        // Update application status
        await Application.updateStatus(application_id, status, interview_date);
        
        // Create reminder for student
        const application = await Application.findById(application_id);
        if (application) {
            await Reminder.createPlacementReminder(
                application.student_id,
                application.company,
                application.position,
                status
            );
        }
        
        res.json({ success: true, message: 'Application status updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createPlacement,
    getPlacements,
    getApplications,
    updateApplicationStatus
};