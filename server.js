const express = require('express');
const bcrypt = require('bcryptjs');
const { Parser } = require('json2csv');
const cors = require('cors');
const app = express();
const port = 3000;

// GPA Generation Function: randomly generates 2.5x - 3.8x
function generateRandomGPA() {
    const minGPA = 2.5;
    const maxGPA = 3.8;
    const gpa = Math.random() * (maxGPA - minGPA) + minGPA;
    return Math.round(gpa * 100) / 100; // keep two decimal places
}

// Middleware
app.use(cors());
app.use(express.json());

// Allow dynamic PORT assignment
const PORT = process.env.PORT || 3000;

// Static file serving
const path = require('path');
const staticPath = process.env.STATIC_DIR || path.join(__dirname, 'client', 'dist');
app.use(express.static(staticPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// load env and attempt DB connection
require('dotenv').config();
const mongoose = require('mongoose');

if (process.env.MONGO_URI) {
    const mongooseOptions = {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        maxPoolSize: 5,
        minPoolSize: 1,
        retryWrites: true,
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
    };

    console.log('Connecting to MongoDB Atlas...');

    mongoose.connection.on('connected', async () => {
        console.log('MongoDB connected successfully');
        try {
            await ensureDatabaseSeeded();
        } catch (e) {
            console.error('ensureDatabaseSeeded (on connected):', e.message);
        }
    });

    mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err.message.split('\n')[0]);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
    });

    mongoose.connect(process.env.MONGO_URI, mongooseOptions)
        .then(() => console.log('✅ Connected to MongoDB'))
        .catch(err => {
            console.error('❌ MongoDB connection error:', err.message.split('\n')[0]);
            console.log('Will run with mock data...');
        });
} else {
    console.log('⚠️ MONGO_URI not set — API needs MongoDB; seed and data features will be unavailable');
}
const fs = require('fs');
const Project = require('./models/Project');
const Teacher = require('./models/Teacher');
const { ensureDatabaseSeeded } = require('./services/seedDatabase');
const { majorsMatchForFilter, majorToFilterCode } = require('./services/majorMapping');
const mockData = require('./services/mockData');
const { applySupervisorsToMockProjects } = require('./services/projectCatalogSync');

function escapeRegex(str) {
    return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** MongoDB filter: exact email, case-insensitive */
function emailQueryInsensitive(email) {
    const e = String(email || '').trim();
    if (!e) return { email: '' };
    return { email: { $regex: new RegExp(`^${escapeRegex(e)}$`, 'i') } };
}

function stripProfPrefix(s) {
    return String(s || '').replace(/^prof\.?\s*/i, '').trim().toLowerCase();
}

/** Catalogue may show "Prof. Bell" while account is "Prof. Bell Liu" — match on substantive name tokens */
function supervisorNameLikelyMatches(supervisor, teacherDisplayName) {
    if (!supervisor || supervisor === 'TBD' || !teacherDisplayName) return false;
    const sup = stripProfPrefix(supervisor);
    const tn = stripProfPrefix(teacherDisplayName);
    if (!sup || !tn) return false;
    const supWords = sup.split(/\s+/).filter((w) => w.length > 1);
    if (supWords.length === 0) return false;
    const tnWords = new Set(tn.split(/\s+/));
    return supWords.every((w) => tnWords.has(w));
}

/** Normalised email string for teacher lookups (use t001@hkmu.edu.hk style accounts only) */
function resolveTeacherDbEmail(email) {
    return String(email || '').trim();
}

async function loadTeacherFilterContext(rawEmail) {
    const Teacher = require('./models/Teacher');
    const canonical = String(rawEmail || '').trim().toLowerCase();
    const row = await Teacher.findOne(emailQueryInsensitive(canonical)).lean().exec();
    const emailLower = (row?.email || canonical).toLowerCase();
    return {
        emailLower,
        teacherId: row?.teacherId ? String(row.teacherId).trim() : '',
        displayName: row?.name ? String(row.name).trim() : '',
        major: row?.major || '',
    };
}

/** Whether a project row belongs to the logged-in teacher (email, id, or supervisor name) */
function projectBelongsToTeacher(doc, ctx) {
    if (!doc || !ctx) return false;
    const sem = (doc.supervisorEmail || '').toLowerCase();
    if (sem && sem === ctx.emailLower) return true;
    if (ctx.teacherId && doc.supervisorId &&
        String(doc.supervisorId).trim().toLowerCase() === ctx.teacherId.toLowerCase()) {
        return true;
    }
    if (doc.supervisor && doc.supervisor !== 'TBD' && ctx.displayName &&
        supervisorNameLikelyMatches(doc.supervisor, ctx.displayName)) {
        return true;
    }
    return false;
}

// User data (auto-initialized)
let users = [];

// Auto-initialize user data
async function initializeUsers() {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const studentPassword = await bcrypt.hash('00000000', 10);

    console.log('Auto-generated password hashes completed');
    
    users = [
        {
            email: 'admin@hkmu.edu.hk',
            password: adminPassword,
            role: 'admin',
            name: 'Admin Wang'
        },
        {
            email: 's001@hkmu.edu.hk',
            password: studentPassword,
            role: 'student',
            name: 'Chan Tai Man',
            studentId: 's001',
            gpa: '3.45',
            major: 'Computer and Cyber Security'
        }
    ];
    
    console.log('User data initialization completed');
    console.log('Test accounts:');
    console.log('   Admin: admin@hkmu.edu.hk / admin123');
    console.log('   Student: s001@hkmu.edu.hk / 00000000');
    console.log('   Teacher: t001–t008@hkmu.edu.hk / 00000001–00000008 (MongoDB seed)');
}

// Login API route
app.post('/login', async (req, res) => {
    console.log('Received login request:', req.body);
    
    const { email: emailRaw, password } = req.body;
    const emailNorm = String(emailRaw || '').trim().toLowerCase();
    const email = emailNorm; // use normalized email for DB and comparisons
    
    // First check local users array (case-insensitive)
    let user = users.find(u => u.email.toLowerCase() === emailNorm);
    
    // For test student account s001@hkmu.edu.hk, check and update SID in MongoDB
    if (emailNorm === 's001@hkmu.edu.hk') {
        try {
            const mongoose = require('mongoose');
            const isDbConnected = mongoose.connection.readyState === 1;
            
            if (isDbConnected) {
                const Student = require('./models/Student');
                const student = await Student.findOne(emailQueryInsensitive(emailNorm)).exec();
                
                if (student) {
                    // Ensure test student's SID is s001
                    if (student.id !== 's001') {
                        console.log(`Updating test student SID: ${student.id} -> s001`);
                        student.id = 's001';
                        await student.save();
                    }
                    // Ensure major is Computer and Cyber Security
                    if (student.major !== 'Computer and Cyber Security') {
                        console.log(`Updating test student Major: ${student.major} -> Computer and Cyber Security`);
                        student.major = 'Computer and Cyber Security';
                        await student.save();
                    }
                }
            }
        } catch (err) {
            console.error('Update test student SID/Major error:', err);
        }
    }
    
    // If not found locally, and is student email format, check MongoDB
    if (!user && emailNorm.includes('@hkmu.edu.hk')) {
        try {
            const mongoose = require('mongoose');
            const isDbConnected = mongoose.connection.readyState === 1;

            if (isDbConnected) {
                // Try as student first
                const Student = require('./models/Student');
                const student = await Student.findOne(emailQueryInsensitive(emailNorm)).exec();

                console.log('Login - student from DB:', JSON.stringify(student));

                    if (student) {
                        console.log('Login - mustChangePassword from DB:', student.mustChangePassword);
                    if (student.password && student.password.startsWith('$2')) {
                        const isMatch = await bcrypt.compare(password, student.password);
                        if (isMatch) {
                            user = {
                                email: student.email,
                                role: 'student',
                                name: student.name,
                                studentId: student.id,
                                gpa: student.gpa,
                                major: student.major,
                                mustChangePassword: student.mustChangePassword,
                                initialPassword: student.initialPassword
                            };
                        }
                    } else if (student.password === password) {
                        user = {
                            email: student.email,
                            role: 'student',
                            name: student.name,
                            studentId: student.id,
                            gpa: student.gpa,
                            major: student.major,
                            mustChangePassword: student.mustChangePassword,
                            initialPassword: student.initialPassword
                        };
                    }
                } else {
                    // Try as teacher (alias account maps to canonical teacher email for password verification)
                    const Teacher = require('./models/Teacher');
                    const teacher = await Teacher.findOne(emailQueryInsensitive(emailNorm)).exec();

                    if (teacher) {
                        if (teacher.password && teacher.password.startsWith('$2')) {
                            const isMatch = await bcrypt.compare(password, teacher.password);
                            if (isMatch) {
                                user = {
                                    email: teacher.email.toLowerCase(),
                                    role: 'teacher',
                                    name: teacher.name,
                                    major: teacher.major,
                                    mustChangePassword: teacher.mustChangePassword,
                                    initialPassword: teacher.initialPassword
                                };
                            }
                        } else if (teacher.password === password) {
                            user = {
                                email: teacher.email.toLowerCase(),
                                role: 'teacher',
                                name: teacher.name,
                                major: teacher.major,
                                mustChangePassword: teacher.mustChangePassword,
                                initialPassword: teacher.initialPassword
                            };
                        }
                    }
                }
            }
        } catch (err) {
            console.error('MongoDB user check error:', err);
        }
    }
    
    // If user found locally
    if (user) {
        // For local users (admin/teacher/student), need bcrypt password verification
        const localUser = users.find(u => u.email.toLowerCase() === emailNorm);
        if (localUser) {
            const isMatch = await bcrypt.compare(password, localUser.password);
            if (!isMatch) {
                console.log('Incorrect password');
                return res.json({ success: false, message: 'Email or password is incorrect' });
            }
        }
        
        // Test student: ensure SID is correct in MongoDB first, then retrieve as return value
        if (emailNorm === 's001@hkmu.edu.hk') {
            try {
                const mongoose = require('mongoose');
                if (mongoose.connection.readyState === 1) {
                    const Student = require('./models/Student');
                    const updated = await Student.findOneAndUpdate(
                        emailQueryInsensitive(emailNorm),
                        { $set: { id: 's001', major: 'Computer and Cyber Security' } },
                        { upsert: false, new: true, lean: true }
                    ).exec();
                    if (updated && updated.id) {
                        user.studentId = updated.id;
                        user.major = updated.major;
                    }
                }
            } catch (e) {
                console.error('Sync test student SID/Major error:', e.message);
            }
        }

        // Teacher: use MongoDB major as authoritative (to avoid mismatch between local users and DB, or missing fields in old documents)
        if (user.role === 'teacher') {
            try {
                const mongoose = require('mongoose');
                if (mongoose.connection.readyState === 1) {
                    const Teacher = require('./models/Teacher');
                    const teacherDbEmail = resolveTeacherDbEmail(emailNorm).toLowerCase();
                    const tdoc = await Teacher.findOne(emailQueryInsensitive(teacherDbEmail)).lean().exec();
                    const defaultMajor = Teacher.schema.path('major').defaultValue;
                    if (tdoc) {
                        user.major = tdoc.major || defaultMajor || user.major;
                        user.email = (tdoc.email || user.email || emailNorm).toLowerCase();
                    }
                }
            } catch (e) {
                console.error('Sync teacher major error:', e.message);
            }
            if (!user.major && localUser && localUser.major) {
                user.major = localUser.major;
            }
        }
        
        // Login successful
        console.log('Login successful, user role:', user.role, '| studentId:', user.studentId, '| major:', user.major);
        return res.json({ 
            success: true,
            message: `Login successful! Welcome, ${user.name || user.role}.`,
            user: {
                email: user.email,
                role: user.role,
                name: user.name,
                studentId: user.studentId,
                id: user.studentId,
                gpa: user.gpa,
                major: user.major,
                mustChangePassword: user.mustChangePassword,
                initialPassword: user.initialPassword
            }
        });
    }
    
    console.log('User not found');
    return res.json({ success: false, message: 'Email or password is incorrect' });
});

// Change password (forces user to set a new password on first login)
app.post('/api/change-password', async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.json({ success: false, message: 'Email and new password are required' });
    }

    if (newPassword.length < 8) {
        return res.json({ success: false, message: 'Password must be at least 8 characters' });
    }

    try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            return res.json({ success: false, message: 'Database not connected' });
        }

        const Student = require('./models/Student');
        const Teacher = require('./models/Teacher');

        // Try student first
        let user = await Student.findOne({ email }).exec();

        if (!user) {
            user = await Teacher.findOne({ email }).exec();
        }

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Prevent using the same password as initial password
        if (user.initialPassword && newPassword === user.initialPassword) {
            return res.json({ success: false, message: 'New password cannot be the same as your initial password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        if (user.studentId !== undefined || user.id !== undefined) {
            await Student.findOneAndUpdate(
                { email },
                { $set: { password: hashedPassword, mustChangePassword: false } }
            ).exec();
        } else {
            await Teacher.findOneAndUpdate(
                { email },
                { $set: { password: hashedPassword, mustChangePassword: false } }
            ).exec();
        }

        console.log(`✅ Password changed for ${email}`);
        return res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        console.error('❌ Change password error:', err);
        return res.json({ success: false, message: 'Failed to change password' });
    }
});

// Note: HTML page routes have been removed. React version serves frontend via Vite dev server.
// This server only provides API endpoints.

// Import service layer - placed before routes
try {
    const studentService = require('./services/studentService');
    
    // Get dbEnabled status from studentService
    let dbEnabled = false;
    let ProjectModel = null;
    let StudentModel = null;
    
    // Try to get models
    try {
        ProjectModel = require('./models/Project');
        StudentModel = require('./models/Student');
        // Check database connection status
        const mongoose = require('mongoose');
        console.log(`[DB Check] mongoose.connection.readyState: ${mongoose.connection.readyState}`);
        if (mongoose.connection.readyState === 1) {
            dbEnabled = true;
            console.log('Teacher API: MongoDB connected, database mode enabled');
        } else {
            console.log(`[DB Check] MongoDB not connected, readyState: ${mongoose.connection.readyState}`);
        }
    } catch (e) {
        console.log('Teacher API: Model loading failed:', e.message);
    }
    
    // Student API routes
    app.get('/api/student/projects', async (req, res) => {
        console.log('Requesting project list | major query:', req.query.major);
        try {
            const studentMajor = req.query.major || '';
            const projects = await studentService.getAvailableProjects(studentMajor);
            console.log(`Returning ${projects.length} projects`);
            res.json({ success: true, projects });
        } catch (error) {
            console.error('Get projects error:', error);
            res.json({ success: false, message: 'Failed to load projects' });
        }
    });

    app.get('/api/student/:id', async (req, res) => {
        console.log('Requesting student info:', req.params.id);
        try {
            const student = await studentService.getStudent(req.params.id);
            if (!student) {
                return res.json({ success: false, message: 'Student not found' });
            }
            res.json({ success: true, student });
        } catch (error) {
            console.error('Get student info error:', error);
            res.json({ success: false, message: 'Failed to load student info' });
        }
    });

    app.get('/api/student/:id/preferences', async (req, res) => {
        console.log('Requesting student preferences:', req.params.id);
        try {
            const preferences = await studentService.getStudentPreferences(req.params.id);
            res.json({ success: true, preferences });
        } catch (error) {
            console.error('Get preferences error:', error);
            res.json({ success: false, message: 'Failed to load preferences' });
        }
    });

    app.post('/api/student/:id/preferences', async (req, res) => {
        console.log('Adding preference:', { studentId: req.params.id, projectId: req.body.projectId });
        try {
            const projectId = req.body.projectId;
            const result = await studentService.addPreference(req.params.id, projectId);
            res.json(result);
        } catch (error) {
            console.error('Add preference error:', error);
            res.json({ success: false, message: 'Failed to add preference' });
        }
    });

    // Set entire preferences (initiated by student Submit)
    app.post('/api/student/:id/preferences/set', async (req, res) => {
        console.log('Setting preferences (set):', { studentId: req.params.id, body: req.body });
        try {
            // Accept either { preferences: [..] } or single { projectId: x } for convenience
            let prefs = req.body && req.body.preferences;
            if ((!Array.isArray(prefs) || prefs.length === 0) && req.body && req.body.projectId) {
                prefs = [req.body.projectId];
            }
            const result = await studentService.setPreferences(req.params.id, prefs || [], { draft: !!req.body._draft });
            res.json(result);
        } catch (error) {
            console.error('Set preferences error:', error);
            res.status(500).json({ success: false, message: 'Failed to set preferences' });
        }
    });
    
    // Clear student's preferences on server (used when submitted)
    app.delete('/api/student/:id/preferences/clear', async (req, res) => {
        console.log('Clear student preferences (server clear):', req.params.id);
        try {
            const student = await studentService.getStudent(req.params.id);
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            // clear preferences using service
            const result = await studentService.setPreferences(req.params.id, []);
            res.json(result || { success: true, message: 'Preferences cleared' });
        } catch (error) {
            console.error('Clear preferences error:', error);
            res.status(500).json({ success: false, message: 'Failed to clear preferences' });
        }
    });

    app.delete('/api/student/:id/preferences/:projectId', async (req, res) => {
        console.log('Remove preference:', { studentId: req.params.id, projectId: req.params.projectId });
        try {
            const projectId = req.params.projectId;
            const result = await studentService.removePreference(req.params.id, projectId);
            res.json(result);
        } catch (error) {
            console.error('Remove preference error:', error);
            res.json({ success: false, message: 'Failed to remove preference' });
        }
    });

    app.put('/api/student/:id/preferences/:projectId/move', async (req, res) => {
        console.log('Move preference:', { studentId: req.params.id, projectId: req.params.projectId, direction: req.body.direction });
        try {
            const projectId = req.params.projectId;
            const { direction } = req.body;
            const result = await studentService.movePreference(req.params.id, projectId, direction);
            res.json(result);
        } catch (error) {
            console.error('Move preference error:', error);
            res.json({ success: false, message: 'Failed to move preference' });
        }
    });

    app.put('/api/student/:id/preferences/reorder', async (req, res) => {
        console.log('Reorder preferences:', { studentId: req.params.id, order: req.body.order });
        try {
            const { order } = req.body;
            // pass order through (studentService will normalize types)
            const result = await studentService.reorderPreferences(req.params.id, order);
            res.json(result);
        } catch (error) {
            console.error('Reorder preferences error:', error);
            res.json({ success: false, message: 'Failed to reorder preferences' });
        }
    });

    app.post('/api/student/:id/preferences/submit', async (req, res) => {
        console.log('Submit preferences:', req.params.id);
        try {
            const result = await studentService.submitPreferences(req.params.id);
            res.json(result);
        } catch (error) {
            console.error('Submit preferences error:', error);
            res.json({ success: false, message: 'Failed to submit preferences' });
        }
    });

    app.get('/api/system/status', async (req, res) => {
        console.log('Requesting system status');
        try {
            const status = await studentService.getSystemStatus();
            res.json({ success: true, ...status });
        } catch (error) {
            console.error('Get system status error:', error);
            res.json({ success: false, message: 'Failed to load system status' });
        }
    });

    app.get('/api/admin/deadlines', async (req, res) => {
        try {
            const deadlines = await studentService.getDeadlines();
            res.json({ success: true, deadlines });
        } catch (error) {
            console.error('Get deadlines error:', error);
            res.status(500).json({ success: false, message: 'Failed to load deadlines' });
        }
    });

    app.put('/api/admin/deadlines', async (req, res) => {
        try {
            const result = await studentService.updateDeadlines(req.body || {});
            res.json(result);
        } catch (error) {
            console.error('Update deadlines error:', error);
            res.status(500).json({ success: false, message: 'Failed to update deadlines' });
        }
    });

    // Auto-reject all unapproved student proposals (after deadline has passed)
    app.post('/api/admin/auto-reject-proposals', async (req, res) => {
        console.log('Auto-reject expired proposals request');
        try {
            const deadlines = await studentService.getDeadlines();
            const reviewDeadline = deadlines.teacherProposalReview
                ? new Date(deadlines.teacherProposalReview)
                : null;
            const now = new Date();

            if (!reviewDeadline || now < reviewDeadline) {
                return res.json({ success: false, message: 'Deadline not yet passed' });
            }

            // Find all pending proposals that haven't been processed
            const pendingProposals = await Project.find({
                type: 'student',
                proposalStatus: 'pending',
            }).lean().exec();

            let rejected = 0;
            for (const p of pendingProposals) {
                await Project.findByIdAndUpdate(p._id, {
                    proposalStatus: 'rejected',
                    reviewedAt: now,
                }).exec();
                rejected++;
            }

            console.log(`Auto-rejected ${rejected} expired proposals`);
            res.json({ success: true, message: `Auto-rejected ${rejected} expired proposals`, count: rejected });
        } catch (error) {
            console.error('Auto-reject error:', error);
            res.status(500).json({ success: false, message: 'Auto-reject failed' });
        }
    });

    // Export API
    app.get('/api/export/matching-results', async (req, res) => {
        console.log('Export matching results');
        try {
            const matchingResults = await studentService.getMatchingResults();
            const csvData = matchingResults.results.map(result => ({
                'Project ID': result.projectId,
                'Project Code': result.projectCode || '',
                'Project Title': result.title,
                'Supervisor': result.supervisor,
                'Source': result.projectType === 'student' ? 'Student Proposed' : 'Teacher',
                'Student ID': result.studentId || 'Unassigned',
                'Student Name': result.studentName || 'Unassigned',
                'Student GPA': result.studentGpa || 'N/A'
            }));

            const parser = new Parser();
            const csv = parser.parse(csvData);

            res.header('Content-Type', 'text/csv');
            res.attachment('matching_results.csv');
            res.send(csv);
        } catch (error) {
            console.error('Export matching results error:', error);
            res.status(500).json({ success: false, message: 'Failed to export matching results' });
        }
    });

    app.get('/api/export/student-list', async (req, res) => {
        console.log('Export student list');
        try {
            const students = await studentService.getAllStudents();
            const csvData = students.map(student => ({
                'Student ID': student.id,
                'Name': student.name,
                'Email': student.email,
                'GPA': student.gpa,
                'Major': student.major,
                'Year': student.year,
                'Preferences Submitted': (student.preferences && student.preferences.length > 0) ? 'Yes' : 'No',
                'Assigned Project': student.assignedProject || 'Unassigned'
            }));

            const parser = new Parser();
            const csv = parser.parse(csvData);

            res.header('Content-Type', 'text/csv');
            res.attachment('student_list.csv');
            res.send(csv);
        } catch (error) {
            console.error('Export student list error:', error);
            res.status(500).json({ success: false, message: 'Failed to export student list' });
        }
    });

    app.get('/api/export/project-list', async (req, res) => {
        console.log('Export project list');
        try {
            const projects = await studentService.getAvailableProjects();
            const csvData = projects.map(project => ({
                'Project ID': project.id || project.code || '',
                'Project Code': project.code || '',
                'Title': project.title,
                'Supervisor': project.supervisor,
                'Description': project.description,
                'Skills Required': Array.isArray(project.skills) ? project.skills.join(', ') : (project.skills || ''),
                'Capacity': project.capacity,
                'Popularity': project.popularity,
                'Source': project.type === 'student' ? 'Student Proposed' : 'Teacher',
                'Status': project.status || 'Active'
            }));

            const parser = new Parser();
            const csv = parser.parse(csvData);

            res.header('Content-Type', 'text/csv');
            res.attachment('project_list.csv');
            res.send(csv);
        } catch (error) {
            console.error('Export project list error:', error);
            res.status(500).json({ success: false, message: 'Failed to export project list' });
        }
    });

    // Export teacher list
    app.get('/api/export/teacher-list', async (req, res) => {
        console.log('Export teacher list');
        try {
            const teachers = await Teacher.find().lean().exec();
            const csvData = teachers.map(teacher => ({
                'Teacher ID': teacher.teacherId || '',
                'Name': teacher.name || '',
                'Email': teacher.email || '',
                'Department': teacher.department || '',
                'Major': teacher.major || ''
            }));

            const parser = new Parser();
            const csv = parser.parse(csvData);

            res.header('Content-Type', 'text/csv');
            res.attachment('teacher_list.csv');
            res.send(csv);
        } catch (error) {
            console.error('Export teacher list error:', error);
            res.status(500).json({ success: false, message: 'Failed to export teacher list' });
        }
    });

    // Admin: backup and remove legacy projects where code is null
    app.post('/api/admin/cleanup-null-projects', async (req, res) => {
        try {
            const docs = await Project.find({ code: null }).lean().exec();
            if (!docs || docs.length === 0) {
                return res.json({ success: true, message: 'No null-code projects found', count: 0 });
            }
            const backupPath = 'data/backup_null_code_projects.json';
            fs.writeFileSync(backupPath, JSON.stringify(docs, null, 2), 'utf8');
            const ids = docs.map(d => d._id);
            const delRes = await Project.deleteMany({ _id: { $in: ids } }).exec();
            return res.json({ success: true, message: 'Backed up and deleted null-code projects', backupPath, deletedCount: delRes.deletedCount });
        } catch (err) {
            console.error('Cleanup error:', err);
            return res.status(500).json({ success: false, message: 'Cleanup failed', error: String(err) });
        }
    });

    // Matching endpoints
    app.post('/api/match/run', async (req, res) => {
        console.log('Running matching algorithm (runMatching)');
        try {
            const result = await studentService.runMatching();
            res.json(result);
        } catch (error) {
            console.error('Run matching error:', error);
            res.status(500).json({ success: false, message: 'Failed to run matching' });
        }
    });

    app.get('/api/match/results', async (req, res) => {
        console.log('Getting matching results (getMatchingResults)');
        try {
            const result = await studentService.getMatchingResults();
            // result may be { results, matchingCompleted } or just results array
            if (result && typeof result === 'object' && 'results' in result) {
                res.json({ 
                    success: true, 
                    matchingCompleted: result.matchingCompleted || false, 
                    results: result.results || [] 
                });
            } else {
                // Legacy format compatibility — do not infer global lock from assigned rows
                const results = Array.isArray(result) ? result : [];
                res.json({ success: true, matchingCompleted: false, results });
            }
        } catch (error) {
            console.error('Get matching results error:', error);
            res.status(500).json({ success: false, message: 'Failed to get matching results' });
        }
    });

    // Admin: reset server state (clear preferences, assignments, matching flag)
    app.post('/api/admin/reset', async (req, res) => {
        console.log('🔁 Admin reset requested');
        try {
            const result = studentService.resetState ? await studentService.resetState() : null;
            res.json(result || { success: true, message: 'Reset completed' });
        } catch (error) {
            console.error('❌ Reset failed:', error);
            res.status(500).json({ success: false, message: 'Reset failed: ' + error.message });
        }
    });

    // ============================================
    // Student Proposal API Endpoints
    // ============================================

    // Helper function to check database connection
    const checkDbConnection = () => {
        try {
            const mongoose = require('mongoose');
            return mongoose.connection.readyState === 1;
        } catch (e) {
            return false;
        }
    };

    // Student submits a proposal
    app.post('/api/student/proposal', async (req, res) => {
        console.log('Student submits proposal', req.body);
        try {
            const { studentId, title, description, skills } = req.body;
            
            console.log('Received - title:', title, 'description:', description, 'skills:', skills);
            
            if (!studentId || !title || !description) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }
            
            // Check DB connection on each request
            const isDbConnected = checkDbConnection();
            const Project = require('./models/Project');
            const Student = require('./models/Student');
            
            if (isDbConnected && Project && Student) {
                // Get student info
                const student = await Student.findOne({ id: studentId }).exec();
                if (!student) {
                    return res.status(404).json({ success: false, message: 'Student not found' });
                }
                
                // Create new project from proposal with new schema
                const projectCode = `S${Date.now().toString().slice(-6)}`;
                
                const newProject = new Project({
                    code: projectCode,
                    title,
                    description,
                    skills: skills || [],
                    capacity: 1,
                    type: 'student',                    // Mark as student-proposed
                    category: 'Student Proposed',
                    department: student.major || 'ECE', // Set to student's major
                    major: majorToFilterCode(student.major) || 'CCS',       // Convert full major name to short code
                    status: 'Under Review',              // Waiting for teacher review
                    proposalStatus: 'pending',
                    popularity: 0,
                    proposedBy: studentId,             // Student ID
                    proposedByName: student.name,       // Student name
                    proposedByEmail: student.email,     // Student email
                    teacherReviews: [],                 // Teacher review records
                    createdAt: new Date()
                });
                
                await newProject.save();
                console.log('Student proposal saved:', newProject);
                
                // Track self-proposal via proposedProject / proposalStatus only — do not set proposalSubmitted
                // (that flag was conflated with "preferences submitted" and locked My Preferences incorrectly).
                student.proposedProject = newProject._id;
                student.proposalStatus = 'pending';
                await student.save();
                
                return res.json({ 
                    success: true, 
                    message: 'Proposal submitted successfully!',
                    proposal: {
                        id: newProject._id,
                        code: projectCode,
                        title,
                        description,
                        skills: skills || [],
                        type: 'student',
                        status: 'Under Review',
                        proposalStatus: 'pending'
                    }
                });
            }
            
            // Mock mode fallback - when database is not connected
            console.log('Database not connected - Mock mode for student proposal');
            const projectCode = `S${Date.now().toString().slice(-6)}`;
            
            return res.json({ 
                success: true, 
                message: 'Proposal submitted successfully! (Mock mode)',
                proposal: {
                    id: projectCode,
                    code: projectCode,
                    title,
                    description,
                    skills: skills || [],
                    type: 'student',
                    status: 'Under Review',
                    proposalStatus: 'pending'
                }
            });
        } catch (error) {
            console.error('Submit proposal error:', error);
            res.status(500).json({ success: false, message: 'Failed to submit proposal: ' + error.message });
        }
    });

    // Get student's proposal status
    app.get('/api/student/:studentId/proposal', async (req, res) => {
        console.log('Get student proposal status');
        try {
            const { studentId } = req.params;
            
            const isDbConnected = checkDbConnection();
            const Project = require('./models/Project');
            const Student = require('./models/Student');
            
            if (isDbConnected && Student) {
                const student = await Student.findOne({ id: studentId }).exec();
                if (!student) {
                    return res.json({ success: true, proposal: null });
                }
                
                if (student.proposedProject) {
                    const project = await Project.findById(student.proposedProject).exec();
                    return res.json({ 
                        success: true, 
                        proposal: project ? {
                            id: project._id,
                            code: project.code,
                            title: project.title,
                            description: project.description,
                            skills: project.skills,
                            status: project.status,
                            proposalStatus: student.proposalStatus
                        } : null
                    });
                }
                
                return res.json({ success: true, proposal: null });
            }
            
            res.json({ success: true, proposal: null });
        } catch (error) {
            console.error('Get proposal error:', error);
            res.status(500).json({ success: false, message: 'Failed to get proposal' });
        }
    });

    // Get all proposals (for Teacher/Admin)
    app.get('/api/proposals/all', async (req, res) => {
        console.log('Get all student proposals');
        try {
            const isDbConnected = checkDbConnection();
            const Project = require('./models/Project');
            const Student = require('./models/Student');
            
            if (isDbConnected && Project && Student) {
                // Use new type: 'student' field
                const proposals = await Project.find({ type: 'student' }).lean().exec();
                
                // Enrich with student info
                const enrichedProposals = await Promise.all(proposals.map(async (proposal) => {
                    const student = await Student.findOne({ proposedProject: proposal._id }).exec();
                    
                    // Calculate display status
                    // Only show rejected when all teachers have rejected, or deadline has passed
                    // Otherwise show pending
                    let displayStatus = proposal.proposalStatus;
                    if (displayStatus === 'rejected') {
                        // Check if all teachers have rejected
                        const hasAnyApproval = proposal.teacherReviews?.some(r => r.decision === 'approve');
                        if (!hasAnyApproval) {
                            // All teachers have not approved, check if deadline has passed
                            // Assume deadline logic will be implemented later
                            // Currently just show rejected if there's any reject record
                        }
                    }
                    
                    return {
                        ...proposal,
                        studentId: student?.id || proposal.proposedBy,
                        studentName: student?.name || proposal.proposedByName || 'Unknown',
                        studentEmail: student?.email || proposal.proposedByEmail || '',
                        studentGpa: student?.gpa || 0,
                        studentMajor: student?.major || '',
                        displayStatus: displayStatus // Display status for frontend
                    };
                }));
                
                return res.json({ success: true, proposals: enrichedProposals });
            }
            
            res.json({ success: true, proposals: [], message: 'MongoDB required for proposals' });
        } catch (error) {
            console.error('Get all proposals error:', error);
            res.status(500).json({ success: false, message: 'Failed to get proposals' });
        }
    });
    
    // Get proposals for specific teacher
    // Return all student-proposed projects including un-reviewed
    // Teachers can approve/reject projects that haven't been reviewed by any teacher
    // Only return proposals related to teacher's major
    app.get('/api/teacher/student-proposals', async (req, res) => {
        console.log('Get teacher student proposals (including un-reviewed, filtered by major)');
        try {
            const teacherEmail = req.query.email || req.headers['x-teacher-email'];
            const teacherEmailLower = teacherEmail?.toLowerCase();
            const isDbConnected = checkDbConnection();
            const Project = require('./models/Project');
            const Student = require('./models/Student');
            const Teacher = require('./models/Teacher');
            
            // Get teacher's major
            let teacherMajor = '';
            if (isDbConnected && Teacher && teacherEmail) {
                const teacher = await Teacher.findOne(emailQueryInsensitive(resolveTeacherDbEmail(teacherEmail))).lean().exec();
                teacherMajor = teacher?.major || '';
            }
            console.log('Teacher major:', teacherMajor);
            
            if (isDbConnected && Project && Student) {
                const proposals = await Project.find({ type: 'student' }).lean().exec();

                const withMajor = await Promise.all(proposals.map(async (p) => {
                    const st = await Student.findOne({ proposedProject: p._id }).lean().exec();
                    return {
                        proposal: p,
                        studentMajor: st?.major || '',
                    };
                }));

                const filteredProposals = withMajor.filter(({ proposal: p, studentMajor }) => {
                    const hasOtherApproval = p.teacherReviews?.some(r =>
                        r.decision === 'approve' && r.teacherEmail?.toLowerCase() !== teacherEmailLower
                    );
                    if (hasOtherApproval) return false;
                    return majorsMatchForFilter(teacherMajor, studentMajor);
                }).map((x) => x.proposal);

                const enrichedProposals = await Promise.all(filteredProposals.map(async (proposal) => {
                    const reviews = proposal.teacherReviews || [];
                    const myReview = reviews.find(r => r.teacherEmail?.toLowerCase() === teacherEmailLower);
                    
                    // Get the student who submitted this proposal
                    const student = await Student.findOne({ proposedProject: proposal._id }).exec();
                    
                    // Check if there's approval from another teacher
                    const otherApproval = reviews.find(r => 
                        r.decision === 'approve' && r.teacherEmail?.toLowerCase() !== teacherEmailLower
                    );
                    
                    return {
                        ...proposal,
                        studentId: student?.id || proposal.proposedBy,
                        studentName: student?.name || proposal.proposedByName || 'Unknown',
                        studentEmail: student?.email || proposal.proposedByEmail || '',
                        studentGpa: student?.gpa || 0,
                        studentMajor: student?.major || '',
                        myDecision: myReview?.decision || null,
                        myReviewedAt: myReview?.reviewedAt || null,
                        isApprovedByOther: !!otherApproval,
                        otherApprover: otherApproval?.teacherName || null
                    };
                }));
                
                console.log('Teacher student proposals (including un-reviewed):', enrichedProposals.length);
                return res.json({ success: true, proposals: enrichedProposals });
            }
            
            res.json({ success: true, proposals: [] });
        } catch (error) {
            console.error('Get teacher student proposals error:', error);
            res.status(500).json({ success: false, message: 'Failed to get teacher proposals' });
        }
    });

    // Approve/Reject proposal
    app.put('/api/proposals/:proposalId/status', async (req, res) => {
        console.log('[Proposal Status] Update proposal:', req.params.proposalId);
        console.log('[Proposal Status] Body:', JSON.stringify(req.body));
        try {
            const { proposalId } = req.params;
            const { status, supervisorEmail, supervisorName, teacherId } = req.body; 
            
            console.log('[Proposal Status] status:', status, '| teacherId:', teacherId, '| supervisorEmail:', supervisorEmail);
            
            if (!status) {
                return res.status(400).json({ success: false, message: 'Status required' });
            }
            
            const isDbConnected = checkDbConnection();
            const Project = require('./models/Project');
            const Student = require('./models/Student');
            
            if (isDbConnected && Project && Student) {
                const project = await Project.findById(proposalId).exec();
                if (!project) {
                    console.log('[Proposal Status] Project not found:', proposalId);
                    return res.status(404).json({ success: false, message: 'Proposal not found' });
                }
                
                console.log('[Proposal Status] Project found:', project.title);
                console.log('[Proposal Status] Current teacherReviews:', JSON.stringify(project.teacherReviews));
                
                // Initialize teacherReviews array
                if (!project.teacherReviews) {
                    project.teacherReviews = [];
                }
                
                // Find or create current teacher's review record
                const reviewEmail = teacherId || supervisorEmail;
                console.log('[Proposal Status] Review email:', reviewEmail);
                let reviewIndex = project.teacherReviews.findIndex(r => 
                    r.teacherEmail === reviewEmail || 
                    r.teacherEmail?.toLowerCase() === reviewEmail?.toLowerCase()
                );
                const reviewRecord = {
                    teacherEmail: reviewEmail,
                    teacherName: supervisorName || supervisorEmail?.split('@')[0] || 'Teacher',
                    decision: status,
                    reviewedAt: new Date()
                };
                
                if (reviewIndex >= 0) {
                    project.teacherReviews[reviewIndex] = reviewRecord;
                } else {
                    project.teacherReviews.push(reviewRecord);
                }
                
                console.log('[Proposal Status] Updated teacherReviews:', JSON.stringify(project.teacherReviews));
                
                if (status === 'approve') {
                    project.status = 'Approved';
                    const Teacher = require('./models/Teacher');
                    const reviewerNorm = String(reviewEmail || '').trim().toLowerCase();
                    const tReviewer = await Teacher.findOne(emailQueryInsensitive(reviewerNorm)).lean().exec();
                    project.supervisorEmail = (tReviewer?.email || reviewerNorm).toLowerCase();
                    project.supervisor = supervisorName || tReviewer?.name || supervisorEmail?.split('@')[0] || 'Assigned';
                    project.proposalStatus = 'approved';
                    console.log('[Proposal Status] Approved - supervisorEmail set to:', project.supervisorEmail);
                } else {
                    // reject: check if all teachers have rejected
                    // if at least one approve exists, overall is approved
                    const hasApproval = project.teacherReviews.some(r => r.decision === 'approve');
                    if (!hasApproval) {
                        project.proposalStatus = 'rejected';
                    }
                    console.log('[Proposal Status] Rejected - hasApproval:', hasApproval);
                }
                
                await project.save();
                console.log('[Proposal Status] Project saved successfully');
                
                // Update student's proposal status
                const student = await Student.findOne({ proposedProject: proposalId }).exec();
                if (student) {
                    student.proposalStatus = project.proposalStatus;
                    if (project.proposalStatus === 'approved') {
                        student.proposalApproved = true;
                        student.assignedProject = project._id; // Auto-assign!
                        console.log(`[Proposal] Student ${student.id} auto-assigned to project ${project._id}`);
                    } else {
                        student.proposalApproved = false;
                    }
                    await student.save();
                    console.log(`[Proposal] Student ${student.id} proposalStatus updated to: ${student.proposalStatus}`);
                }
                
                return res.json({ 
                    success: true, 
                    message: status === 'approve' ? 'Proposal approved!' : 'Proposal rejected',
                    project: {
                        _id: project._id,
                        title: project.title,
                        proposalStatus: project.proposalStatus,
                        teacherReviews: project.teacherReviews
                    }
                });
            }
            
            res.status(500).json({ success: false, message: 'Database not available' });
        } catch (error) {
            console.error('Update proposal status error:', error);
            res.status(500).json({ success: false, message: 'Failed to update proposal status' });
        }
    });

    // Check if student is already assigned (either through proposal approval or matching)
    app.get('/api/student/:studentId/assignment-status', async (req, res) => {
        console.log('Check student assignment status');
        try {
            const { studentId } = req.params;
            
            const isDbConnected = checkDbConnection();
            const Student = require('./models/Student');
            
            if (isDbConnected && Student) {
                // Check from database
                const student = await Student.findOne({ id: studentId }).exec();
                
                if (student) {
                    const isAssigned = !!student.assignedProject || student.proposalApproved === true;
                    const assignmentType = student.proposalApproved ? 'proposal' : (student.assignedProject ? 'matching' : null);
                    
                    return res.json({
                        success: true,
                        isAssigned,
                        assignmentType,
                        assignedProject: student.assignedProject,
                        proposalApproved: student.proposalApproved,
                        proposalStatus: student.proposalStatus
                    });
                }
            }
            
            // Fallback: check from matching results
            try {
                const result = await studentService.getMatchingResults();
                const results = result?.results || result || [];
                const matchingResult = results.find(r => r.studentId === studentId);
                
                if (matchingResult && matchingResult.title) {
                    return res.json({
                        success: true,
                        isAssigned: true,
                        assignmentType: 'matching',
                        assignedProject: matchingResult
                    });
                }
            } catch (e) {
                console.log('Could not check matching results:', e);
            }
            
            res.json({ success: true, isAssigned: false, assignmentType: null });
        } catch (error) {
            console.error('Check assignment status error:', error);
            res.json({ success: true, isAssigned: false, assignmentType: null });
        }
    });

    // ============================================
    // Teacher API Endpoints
    // ============================================

    // Get single teacher by email
    app.get('/api/teachers/:email', async (req, res) => {
        console.log('Request teacher info:', req.params.email);
        try {
            const teacherEmail = decodeURIComponent(req.params.email || '').trim();
            const emailNorm = teacherEmail.toLowerCase();
            const isDbConnected = teacherCheckDbConnection();
            const Teacher = require('./models/Teacher');
            const defaultMajor = Teacher.schema.path('major').defaultValue || 'Computer and Cyber Security';

            if (isDbConnected) {
                const teacher = await Teacher.findOne(emailQueryInsensitive(resolveTeacherDbEmail(teacherEmail))).lean().exec();

                if (teacher) {
                    const major = teacher.major || defaultMajor;
                    return res.json({
                        success: true,
                        teacher: {
                            name: teacher.name,
                            email: (teacher.email || emailNorm).toLowerCase(),
                            major,
                        },
                    });
                }
            }

            const local = users.find(
                (u) => u.role === 'teacher' && u.email.toLowerCase() === emailNorm
            );
            if (local) {
                return res.json({
                    success: true,
                    teacher: {
                        name: local.name,
                        email: local.email.toLowerCase(),
                        major: local.major || defaultMajor,
                    },
                });
            }

            return res.json({
                success: true,
                teacher: {
                    name: 'Teacher',
                    email: emailNorm,
                    major: '',
                },
            });
        } catch (error) {
            console.error('Error fetching teacher:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Get all projects (for teacher to browse other teachers' projects)
    // Excludes projects from the specified teacher email
    app.get('/api/projects/all', async (req, res) => {
        console.log('Request all projects (excluding specified teacher)');
        try {
            const excludeTeacher = req.query.excludeTeacher || '';
            
            const isDbConnected = teacherCheckDbConnection();
            const Project = require('./models/Project');
            
            if (isDbConnected && Project) {
                // Only get teacher-proposed projects (exclude student-proposed)
                const allDocs = await Project.find({ type: { $ne: 'student' } }).lean().exec();
                const ctx = excludeTeacher ? await loadTeacherFilterContext(excludeTeacher) : null;
                const filteredProjects = ctx
                    ? allDocs.filter((doc) => !projectBelongsToTeacher(doc, ctx))
                    : allDocs;
                
                return res.json({ 
                    success: true, 
                    projects: filteredProjects.map(p => ({
                        ...p,
                        id: p.code || String(p._id)
                    }))
                });
            }
            
            // Mock mode
            res.json({ success: true, projects: [] });
        } catch (error) {
            console.error('Get all projects error:', error);
            res.status(500).json({ success: false, message: 'Failed to load projects' });
        }
    });

    // Teacher helper function to check database connection
    const teacherCheckDbConnection = () => {
        try {
            const mongoose = require('mongoose');
            return mongoose.connection.readyState === 1;
        } catch (e) {
            return false;
        }
    };

    // Get teacher's projects 
    // Includes: teacher-created teacher-proposed projects + teacher-approved student-proposed projects
    // Filter by teacher's major: ECE teachers see only ECE projects, CCS teachers see only CCS projects
    app.get('/api/teacher/projects', async (req, res) => {
        console.log('Requesting teacher project list');
        try {
            const teacherEmail = req.query.email || req.headers['x-teacher-email'];
            if (!teacherEmail) {
                return res.status(400).json({ success: false, message: 'Teacher email required' });
            }

            const teacherEmailResolved = resolveTeacherDbEmail(teacherEmail);
            
            console.log('Teacher email:', teacherEmail);
            
            const isDbConnected = teacherCheckDbConnection();
            const Project = require('./models/Project');
            const Teacher = require('./models/Teacher');
            
            let teacherMajor = '';
            let teacherDbName = '';
            let teacherDbId = '';
            let tdoc = null;
            if (isDbConnected && Teacher) {
                tdoc = await Teacher.findOne(emailQueryInsensitive(teacherEmailResolved)).lean().exec();
                teacherMajor = tdoc?.major || '';
                teacherDbName = (tdoc?.name && String(tdoc.name).trim()) || '';
                teacherDbId = (tdoc?.teacherId && String(tdoc.teacherId).trim()) || '';
            }
            console.log('Teacher major:', teacherMajor, '| name:', teacherDbName, '| id:', teacherDbId);
            
            if (isDbConnected && Project) {
                const ctx = {
                    emailLower: ((tdoc && tdoc.email) || teacherEmailResolved).toLowerCase(),
                    teacherId: teacherDbId,
                    displayName: teacherDbName,
                };
                
                const allDocs = await Project.find({}).lean().exec();
                console.log('Total documents:', allDocs.length);
                
                const projects = allDocs.filter((doc) => {
                    if (doc.type === 'student') {
                        return false;
                    }
                    const tm = majorToFilterCode(teacherMajor);
                    const pm = majorToFilterCode(doc.major);
                    if (tm && tm !== 'ECE+CCS' && pm) {
                        if (tm === 'ECE' && pm !== 'ECE' && pm !== 'ECE+CCS') {
                            return false;
                        }
                        if (tm === 'CCS' && pm !== 'CCS' && pm !== 'ECE+CCS') {
                            return false;
                        }
                    }
                    return projectBelongsToTeacher(doc, ctx);
                });
                
                console.log('Filtered project count:', projects.length);
                projects.forEach(p => {
                    console.log('  - ', p.title, '| type:', p.type, '| supervisor:', p.supervisor);
                });
                
                return res.json({ 
                    success: true, 
                    projects: projects.map(p => ({
                        ...p,
                        id: p.code || String(p._id)
                    })) 
                });
            } else {
                // ── Mock fallback: use in-memory catalogue when DB is unavailable ──
                const teacherEmailResolved = resolveTeacherDbEmail(teacherEmail);
                const teacherEmailLower = teacherEmailResolved.toLowerCase();
                const teacherEmailPrefix = teacherEmailLower.replace('@hkmu.edu.hk', ''); // e.g. "t001"
                const mockProjects = applySupervisorsToMockProjects(mockData.projects || []);
                const teacherMockProjects = mockProjects.filter(p => {
                    if (p.type === 'student') return false;
                    const pe = (p.supervisorEmail || '').toLowerCase().replace('@hkmu.edu.hk', '');
                    return pe === teacherEmailPrefix;
                });
                if (teacherMockProjects.length > 0) {
                    console.log(`[mock] Returning ${teacherMockProjects.length} projects for ${teacherEmail}`);
                    return res.json({
                        success: true,
                        projects: teacherMockProjects.map(p => ({
                            ...p,
                            id: p.code || String(p.id)
                        }))
                    });
                }
                res.json({ success: true, projects: [] });
            }
        } catch (error) {
            console.error('Get teacher projects error:', error);
            res.status(500).json({ success: false, message: 'Failed to load teacher projects' });
        }
    });

    // Get students who applied to teacher's projects
    app.get('/api/teacher/students', async (req, res) => {
        console.log('Requesting teacher project student list');
        try {
            const teacherEmail = req.query.email || req.headers['x-teacher-email'];
            if (!teacherEmail) {
                return res.status(400).json({ success: false, message: 'Teacher email required' });
            }
            
            if (dbEnabled && ProjectModel && StudentModel) {
                // Get teacher's projects
                const teacherProjects = await ProjectModel.find({ supervisorEmail: teacherEmail }).lean().exec();
                const projectIds = teacherProjects.map(p => String(p._id));
                
                // Find students who have these projects in their preferences
                const students = await StudentModel.find({ 
                    preferences: { $in: projectIds }
                }).lean().exec();
                
                // Build response with student-preference mapping
                const result = teacherProjects.map(project => {
                    const projectIdStr = String(project._id);
                    const projectStudents = students
                        .filter(s => s.preferences && s.preferences.includes(projectIdStr))
                        .map(s => {
                            const prefIndex = s.preferences.indexOf(projectIdStr);
                            return {
                                id: s.id,
                                name: s.name,
                                email: s.email,
                                gpa: s.gpa,
                                major: s.major,
                                preferenceRank: prefIndex + 1,
                                proposalSubmitted: s.proposalSubmitted,
                                assignedProject: s.assignedProject ? String(s.assignedProject) : null
                            };
                        })
                        .sort((a, b) => a.preferenceRank - b.preferenceRank);
                    
                    return {
                        projectId: projectIdStr,
                        projectCode: project.code,
                        projectTitle: project.title,
                        capacity: project.capacity || 1,
                        applicants: projectStudents
                    };
                });
                
                return res.json({ success: true, projectsWithApplicants: result });
            }
            
            // Fallback to mock data
            res.json({ success: true, projectsWithApplicants: [] });
        } catch (error) {
            console.error('Get student list error:', error);
            res.status(500).json({ success: false, message: 'Failed to load student applications' });
        }
    });

    // Get teacher's supervision list (assigned students after matching)
    app.get('/api/teacher/supervision', async (req, res) => {
        console.log('Requesting teacher supervision list');
        try {
            const teacherEmail = req.query.email || req.headers['x-teacher-email'];
            if (!teacherEmail) {
                return res.status(400).json({ success: false, message: 'Teacher email required' });
            }

            if (dbEnabled && ProjectModel && StudentModel) {
                const ctx = await loadTeacherFilterContext(teacherEmail);
                const teacherProjects = await ProjectModel.find({
                    supervisorEmail: { $regex: new RegExp(`^${escapeRegex(ctx.emailLower)}$`, 'i') },
                }).lean().exec();
                const projectIds = teacherProjects.map(p => String(p._id));
                
                // Get assigned students
                const assignedStudents = await StudentModel.find({ 
                    assignedProject: { $in: projectIds }
                }).lean().exec();
                
                const supervisionList = assignedStudents.map(s => {
                    const project = teacherProjects.find(p => String(p._id) === String(s.assignedProject));
                    return {
                        studentId: s.id,
                        studentName: s.name,
                        studentEmail: s.email,
                        studentGpa: s.gpa,
                        studentMajor: s.major,
                        projectId: project ? String(project._id) : null,
                        projectCode: project ? project.code : null,
                        projectTitle: project ? project.title : null,
                        projectType: project ? (project.type === 'student' ? 'student' : 'teacher') : 'teacher',
                        assignedAt: s.updatedAt
                    };
                });
                
                return res.json({ success: true, supervisionList });
            }
            
            res.json({ success: true, supervisionList: [] });
        } catch (error) {
            console.error('Get supervision list error:', error);
            res.status(500).json({ success: false, message: 'Failed to load supervision list' });
        }
    });

    // Create new project (teacher-proposed)
    // Auto-set project major based on teacher's major
    app.post('/api/teacher/projects', async (req, res) => {
        console.log('Teacher creates project');
        try {
            const teacherEmail = req.body.teacherEmail || req.headers['x-teacher-email'];
            if (!teacherEmail) {
                return res.status(400).json({ success: false, message: 'Teacher email required' });
            }
            
            const { title, description, skills, capacity, department, category, major: majorFromBody } = req.body;
            if (!title || !String(title).trim()) {
                return res.status(400).json({ success: false, message: 'Project title is required' });
            }
            
            const isDbConnected = teacherCheckDbConnection();
            const Project = require('./models/Project');
            const Teacher = require('./models/Teacher');
            
            let teacherMajor = '';
            const teacherEmailCanonical = resolveTeacherDbEmail(teacherEmail).toLowerCase();
            let teacherRow = null;
            if (isDbConnected && Teacher) {
                teacherRow = await Teacher.findOne(emailQueryInsensitive(teacherEmailCanonical)).lean().exec();
                if (teacherRow && teacherRow.major) {
                    teacherMajor = teacherRow.major;
                }
            }

            const tm = majorToFilterCode(teacherMajor);
            let chosenMajor = majorToFilterCode(majorFromBody);
            if (chosenMajor !== 'ECE' && chosenMajor !== 'CCS') {
                if (tm === 'ECE') chosenMajor = 'ECE';
                else if (tm === 'CCS') chosenMajor = 'CCS';
                else if (tm === 'ECE+CCS') {
                    return res.status(400).json({
                        success: false,
                        message: 'Project major (ECE or CCS) is required for your account.',
                    });
                } else {
                    chosenMajor = 'CCS';
                }
            } else {
                if (tm === 'ECE' && chosenMajor !== 'ECE') {
                    return res.status(400).json({ success: false, message: 'ECE teachers may only create ECE projects.' });
                }
                if (tm === 'CCS' && chosenMajor !== 'CCS') {
                    return res.status(400).json({ success: false, message: 'CCS teachers may only create CCS projects.' });
                }
                if (tm === 'ECE+CCS' && chosenMajor !== 'ECE' && chosenMajor !== 'CCS') {
                    return res.status(400).json({ success: false, message: 'Select ECE or CCS for this project.' });
                }
            }
            
            if (isDbConnected && Project) {
                let supName =
                    (teacherRow && teacherRow.name && String(teacherRow.name).trim()) ||
                    teacherEmailCanonical.split('@')[0];
                if (supName && !/^prof\.?\s/i.test(supName)) {
                    supName = `Prof. ${supName}`;
                }

                const cap = Math.min(10, Math.max(1, parseInt(capacity, 10) || 1));

                // Generate project code
                const projectCode = `T${Date.now().toString().slice(-6)}`;
                
                const newProject = new Project({
                    code: projectCode,
                    title,
                    description,
                    skills: skills || [],
                    capacity: cap,
                    type: 'teacher',                           // Mark as teacher-proposed
                    supervisor: supName,
                    supervisorId: (teacherRow && teacherRow.teacherId) || '',
                    supervisorEmail: (teacherRow && teacherRow.email) ? String(teacherRow.email).toLowerCase() : teacherEmailCanonical,
                    department: department || teacherMajor || 'FYP',
                    major: chosenMajor,
                    category: category || 'General',
                    status: 'Under Review',
                    popularity: 0,
                    createdAt: new Date()
                });
                
                await newProject.save();
                return res.json({ 
                    success: true, 
                    message: 'Project created successfully',
                    project: newProject
                });
            }
            
            res.status(500).json({ success: false, message: 'Database not available' });
        } catch (error) {
            console.error('Create project error:', error);
            res.status(500).json({ success: false, message: 'Failed to create project' });
        }
    });

    // Update project
    app.put('/api/teacher/projects/:projectId', async (req, res) => {
        console.log('Teacher updates project', req.params.projectId);
        try {
            const { projectId } = req.params;
            const teacherEmail = req.body.teacherEmail || req.headers['x-teacher-email'];
            const { title, description, skills, capacity, status, major: majorFromBody } = req.body;
            
            const mongoose = require('mongoose');
            const isDbConnected = mongoose.connection.readyState === 1;
            
            if (isDbConnected && ProjectModel) {
                // Try different ways to find the project
                let project = null;
                
                // First try: Find by MongoDB _id
                if (mongoose.Types.ObjectId.isValid(projectId)) {
                    try {
                        project = await ProjectModel.findById(projectId).exec();
                    } catch (e) {
                        console.log('Try findById failed:', e.message);
                    }
                }
                
                // Second try: Find by code/id field
                if (!project) {
                    try {
                        project = await ProjectModel.findOne({ 
                            $or: [{ id: projectId }, { code: projectId }]
                        }).exec();
                    } catch (e) {
                        console.log('Try findOne failed:', e.message);
                    }
                }
                
                if (!project) {
                    return res.status(404).json({ success: false, message: 'Project not found: ' + projectId });
                }

                if (!teacherEmail) {
                    return res.status(400).json({ success: false, message: 'Teacher email required' });
                }
                const ctx = await loadTeacherFilterContext(teacherEmail);
                if (!projectBelongsToTeacher(project, ctx)) {
                    return res.status(403).json({ success: false, message: 'You can only edit your own projects.' });
                }

                const Teacher = require('./models/Teacher');
                const teacherRow = await Teacher.findOne(emailQueryInsensitive(ctx.emailLower)).lean().exec();
                const tm = majorToFilterCode(teacherRow?.major || '');
                
                // Update the project
                if (title) project.title = title;
                if (description) project.description = description;
                if (skills) project.skills = skills;
                if (capacity) project.capacity = Math.min(10, Math.max(1, parseInt(capacity, 10) || project.capacity || 1));
                if (status) project.status = status;
                if (majorFromBody != null && majorFromBody !== '') {
                    const ch = majorToFilterCode(majorFromBody);
                    if (ch === 'ECE' || ch === 'CCS') {
                        if (tm === 'ECE' && ch !== 'ECE') {
                            return res.status(400).json({ success: false, message: 'ECE teachers may only use ECE projects.' });
                        }
                        if (tm === 'CCS' && ch !== 'CCS') {
                            return res.status(400).json({ success: false, message: 'CCS teachers may only use CCS projects.' });
                        }
                        if (tm === 'ECE+CCS' && ch !== 'ECE' && ch !== 'CCS') {
                            return res.status(400).json({ success: false, message: 'Select ECE or CCS.' });
                        }
                        project.major = ch;
                    }
                }
                
                await project.save();
                console.log('✅ Project updated successfully');
                return res.json({ 
                    success: true, 
                    message: 'Project updated successfully',
                    project
                });
            } else {
                console.log('⚠️ Database not connected, isDbConnected:', isDbConnected);
            }
            
            res.status(500).json({ success: false, message: 'Database not available' });
        } catch (error) {
            console.error('Update project error:', error);
            res.status(500).json({ success: false, message: 'Failed to update project: ' + error.message });
        }
    });

    // Delete project
    app.delete('/api/teacher/projects/:projectId', async (req, res) => {
        console.log('Teacher deletes project', req.params.projectId);
        try {
            const { projectId } = req.params;
            const teacherEmail = req.headers['x-teacher-email'];
            
            console.log('🗑️ Delete request - projectId:', projectId, 'teacherEmail:', teacherEmail);
            
            if (!teacherEmail) {
                return res.status(400).json({ success: false, message: 'Teacher email required' });
            }
            
            const mongoose = require('mongoose');
            const isDbConnected = mongoose.connection.readyState === 1;
            const teacherName = teacherEmail.split('@')[0];
            
            if (isDbConnected && ProjectModel) {
                // Try different ways to find the project
                let project = null;
                
                // First try: Find by MongoDB _id (without email restriction)
                if (mongoose.Types.ObjectId.isValid(projectId)) {
                    try {
                        project = await ProjectModel.findOne({ _id: projectId }).exec();
                    } catch (e) {
                        console.log('Delete - Try findById failed:', e.message);
                    }
                }
                
                // Second try: Find by code/id field
                if (!project) {
                    try {
                        project = await ProjectModel.findOne({ 
                            $or: [{ id: projectId }, { code: projectId }]
                        }).exec();
                    } catch (e) {
                        console.log('Delete - Try findOne failed:', e.message);
                    }
                }
                
                if (!project) {
                    console.log('❌ Delete - Project not found:', projectId);
                    return res.status(404).json({ success: false, message: 'Project not found: ' + projectId });
                }
                
                console.log('✅ Delete - Found project:', project.title, '| supervisor:', project.supervisor);
                
                await ProjectModel.deleteOne({ _id: project._id });
                return res.json({ 
                    success: true, 
                    message: 'Project deleted successfully'
                });
            }
            
            res.status(500).json({ success: false, message: 'Database not available' });
        } catch (error) {
            console.error('Delete project error:', error);
            res.status(500).json({ success: false, message: 'Failed to delete project: ' + error.message });
        }
    });

    // Add note to student
    app.post('/api/teacher/students/:studentId/note', async (req, res) => {
        console.log('Teacher adds student note');
        try {
            const { studentId } = req.params;
            const teacherEmail = req.headers['x-teacher-email'];
            const { note } = req.body;
            
            if (!teacherEmail) {
                return res.status(400).json({ success: false, message: 'Teacher email required' });
            }
            
            if (dbEnabled && StudentModel) {
                const student = await StudentModel.findOne({ id: studentId }).exec();
                
                if (!student) {
                    return res.status(404).json({ success: false, message: 'Student not found' });
                }
                
                // Initialize notes array if not exists
                if (!student.teacherNotes) {
                    student.teacherNotes = [];
                }
                
                // Add new note
                student.teacherNotes.push({
                    note,
                    teacherEmail,
                    createdAt: new Date()
                });
                
                await student.save();
                return res.json({ 
                    success: true, 
                    message: 'Note added successfully'
                });
            }
            
            res.status(500).json({ success: false, message: 'Database not available' });
        } catch (error) {
            console.error('Add note error:', error);
            res.status(500).json({ success: false, message: 'Failed to add note' });
        }
    });

    // Get matching results for teacher
    app.get('/api/teacher/matching-results', async (req, res) => {
        try {
            const teacherEmail = req.query.email || req.headers['x-teacher-email'];
            if (!teacherEmail) {
                return res.status(400).json({ success: false, message: 'Teacher email required' });
            }

            // Always check fresh connection status
            const mongoose = require('mongoose');
            const currentDbEnabled = mongoose.connection.readyState === 1;
            console.log(`[Matching Results] Request from teacher: ${teacherEmail}, dbEnabled: ${currentDbEnabled}`);

            if (currentDbEnabled && ProjectModel && StudentModel) {
                const teacherEmailLower = teacherEmail.toLowerCase();
                const ctx = await loadTeacherFilterContext(teacherEmail);
                const allDocs = await ProjectModel.find({}).lean().exec();
                console.log(`[Matching Results] Total projects in DB: ${allDocs.length}`);
                
                const teacherProjects = allDocs.filter((p) => {
                    const sem = (p.supervisorEmail || '').toLowerCase();
                    if (sem && (sem === ctx.emailLower || sem === teacherEmailLower)) return true;
                    const hasReview = (p.teacherReviews || []).some((r) => {
                        const e = (r.teacherEmail || '').toLowerCase();
                        return e === ctx.emailLower || e === teacherEmailLower;
                    });
                    if (hasReview) return true;
                    return projectBelongsToTeacher(p, ctx);
                });
                
                console.log(`[Matching Results] Projects for teacher: ${teacherProjects.length}`);

                const projectIds = teacherProjects.map((p) => String(p._id));
                const oidList = projectIds
                    .filter((id) => mongoose.Types.ObjectId.isValid(id))
                    .map((id) => new mongoose.Types.ObjectId(id));

                const assignedStudents = oidList.length
                    ? await StudentModel.find({ assignedProject: { $in: oidList } }).lean().exec()
                    : [];
                
                const results = teacherProjects.map(project => {
                    const assigned = assignedStudents.find(s => String(s.assignedProject) === String(project._id));
                    return {
                        projectId: String(project._id),
                        projectCode: project.code,
                        projectTitle: project.title,
                        projectType: project.type === 'student' ? 'student' : 'teacher',
                        capacity: project.capacity || 1,
                        assignedStudent: assigned ? {
                            id: assigned.id,
                            name: assigned.name,
                            email: assigned.email,
                            gpa: assigned.gpa,
                            major: assigned.major,
                            assignedAt: assigned.updatedAt ? assigned.updatedAt.toISOString() : null
                        } : null,
                        status: assigned ? 'Matched' : 'Available'
                    };
                });
                
                return res.json({ success: true, results });
            }
            
            res.json({ success: true, results: [] });
        } catch (error) {
            console.error('Get matching results error:', error);
            res.status(500).json({ success: false, message: 'Failed to load matching results' });
        }
    });

} catch (error) {
    console.error('❌ studentService failed to load — real student APIs are disabled. Error:', error.message);
    console.error(error.stack);
    console.log('Registering minimal mock /api/student/projects only (Prof. Bell demo). Fix the error above and restart.');
    
    // Simplified mock API as fallback
    app.get('/api/student/projects', (req, res) => {
        console.log('Request project list (mock)');
        const projects = [
            {
                id: 1,
                title: 'AI-based Learning System',
                supervisor: 'Prof. Bell',
                description: 'Develop an intelligent learning platform.',
                skills: 'Python, Machine Learning, Web Development',
                popularity: 15,
                capacity: 3
            }
        ];
        res.json({ success: true, projects });
    });
}

// Initialize user data before starting server
initializeUsers().then(async () => {
    await ensureDatabaseSeeded();
    
    app.listen(PORT, () => {
        const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
        console.log(`API server running on ${baseUrl}`);
        console.log(`Available API endpoints:`);
        console.log(`   POST /login - Login verification`);
        console.log(`   GET  /api/student/projects - Get project list`);
        console.log(`   GET  /api/student/:id - Get student info`);
        console.log(`   GET  /api/student/:id/preferences - Get student preferences`);
        console.log(`   See server.js for more API endpoints`);
        console.log(`\nReact frontend running on http://localhost:5173 (via Vite)`);
        console.log(`\nTest accounts:`);
        console.log('   Admin: admin@hkmu.edu.hk / admin123');
        console.log('   Student: s001@hkmu.edu.hk / 00000000 (Major: CCS)');
        console.log('   Teacher: t001@hkmu.edu.hk / 00000001 (MongoDB seed, Major: CCS)');
    });
});

// ============================================
// Admin: Student Account Management API
// ============================================

// Helper function to check database connection
const checkDbConnectionForAdmin = () => {
    try {
        const mongoose = require('mongoose');
        const state = mongoose.connection.readyState;
        console.log(`[checkDBConnection] mongoose.readyState: ${state} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
        return state === 1;
    } catch (e) {
        console.error('[checkDBConnection] Error:', e.message);
        return false;
    }
};

// Create student account (admin only)
app.post('/api/admin/students/create', async (req, res) => {
    console.log('Admin creates student account:', req.body);
    try {
        const { studentId, name, major } = req.body;

        // Validation (password not required - using default)
        if (!studentId || !name || !major) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: studentId, name, major'
            });
        }

        // Validate studentId: 8 digits
        if (!/^\d{8}$/.test(studentId)) {
            return res.status(400).json({
                success: false,
                message: 'Student ID must be exactly 8 digits'
            });
        }

        const isDbConnected = checkDbConnectionForAdmin();
        const Student = require('./models/Student');

        if (isDbConnected && Student) {
            // Check if student ID already exists
            const existingStudent = await Student.findOne({ id: studentId }).exec();
            if (existingStudent) {
                return res.status(400).json({
                    success: false,
                    message: `Student ID ${studentId} already exists`
                });
            }

            // Generate email: first 7 digits + @hkmu.edu.hk
            const email = studentId.substring(0, 7) + '@hkmu.edu.hk';

            // Check if email already exists
            const existingEmail = await Student.findOne({ email: email }).exec();
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: `Email ${email} already exists`
                });
            }

            // Use default password (admin doesn't need to set it)
            const DEFAULT_PASSWORD = 'Changeme123!';
            const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

            // Create new student
            const newStudent = new Student({
                id: studentId,
                name: name,
                email: email,
                password: hashedPassword,
                gpa: 0,
                major: major,
                year: 'Year 4',
                preferences: [],
                proposalSubmitted: false,
                assignedProject: null,
                proposedProject: null,
                proposalApproved: false,
                proposalStatus: 'none',
                mustChangePassword: true,
                initialPassword: DEFAULT_PASSWORD
            });

            await newStudent.save();

            console.log('✅ Student account created:', {
                id: studentId,
                name: name,
                email: email,
                major: major
            });

            return res.json({
                success: true,
                message: 'Student account created successfully!',
                student: {
                    id: studentId,
                    name: name,
                    email: email,
                    major: major,
                    year: 'Year 4'
                },
                loginCredentials: {
                    email: email,
                    password: DEFAULT_PASSWORD
                }
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Database not available'
            });
        }
    } catch (error) {
        console.error('Create single student account error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create student account: ' + error.message
        });
    }
});

// Batch create student accounts (admin only)
// New format: Student ID is 's001', 's002', etc.
app.post('/api/admin/students/batch-create', async (req, res) => {
    console.log('=== Batch create student accounts START ===');
    console.log('Admin batch creates student accounts:', req.body);
    try {
        const students = req.body.students ?? req.body.accounts;

        if (!students || !Array.isArray(students) || students.length === 0) {
            console.log('❌ Invalid request: no students array');
            return res.status(400).json({
                success: false,
                message: 'Students array is required'
            });
        }

        console.log(`📝 Processing ${students.length} student(s)`);
        const isDbConnected = checkDbConnectionForAdmin();
        console.log(`📊 Database connected: ${isDbConnected}`);
        const Student = require('./models/Student');
        const results = [];

        // ⚠️ IMPORTANT: All accounts use the same default password
        // Admin does NOT need to provide passwords - they are auto-generated
        // Users MUST change password on first login
        const DEFAULT_PASSWORD = 'Changeme123!';

        for (const studentData of students) {
            const { studentId, name, major } = studentData;

            try {
                // Validation (password not required - using default)
                if (!studentId || !name || !major) {
                    results.push({
                        studentId,
                        name,
                        success: false,
                        message: 'All fields are required: studentId, name, major'
                    });
                    continue;
                }

                // Validate studentId: must start with 's' followed by digits (1-10 digits)
                if (!/^s\d{1,10}$/.test(studentId)) {
                    results.push({
                        studentId,
                        name,
                        success: false,
                        message: 'Invalid student ID format. Must be s001, s002, etc. (1-10 digits)'
                    });
                    continue;
                }

                // Validate major: Computer and Cyber Security or Electronics and Computer Engineering
                const validMajors = ['Computer and Cyber Security', 'Electronics and Computer Engineering'];
                if (!validMajors.includes(major)) {
                    results.push({
                        studentId,
                        name,
                        success: false,
                        message: 'Invalid major. Must be Computer and Cyber Security or Electronics and Computer Engineering'
                    });
                    continue;
                }

                if (isDbConnected && Student) {
                    // Check if student ID already exists
                    const existingStudent = await Student.findOne({ id: studentId }).exec();
                    if (existingStudent) {
                        results.push({
                            studentId,
                            name,
                            success: false,
                            message: `Student ID ${studentId} already exists`
                        });
                        continue;
                    }

                    // Email is the studentId + @hkmu.edu.hk
                    const email = `${studentId}@hkmu.edu.hk`;

                    // Check if email already exists
                    const existingEmail = await Student.findOne({ email: email }).exec();
                    if (existingEmail) {
                        results.push({
                            studentId,
                            name,
                            success: false,
                            message: `Email ${email} already exists`
                        });
                        continue;
                    }

                    // Use default password (admin doesn't need to set it)
                    const DEFAULT_PASSWORD = 'Changeme123!';
                    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

                    // Generate random GPA between 2.5 and 3.8
                    const randomGPA = generateRandomGPA();

                    // Create new student
                    const newStudent = new Student({
                        id: studentId,
                        name: name,
                        email: email,
                        password: hashedPassword,
                        gpa: randomGPA,
                        major: major,
                        year: 'Year 4',
                        preferences: [],
                        proposalSubmitted: false,
                        assignedProject: null,
                        proposedProject: null,
                        proposalApproved: false,
                        proposalStatus: 'none',
                        mustChangePassword: true,
                        initialPassword: DEFAULT_PASSWORD
                    });

                    await newStudent.save();

                    console.log('✅ Student account created:', {
                        id: studentId,
                        name: name,
                        email: email,
                        major: major,
                        gpa: randomGPA
                    });

                    results.push({
                        studentId,
                        name,
                        email,
                        major,
                        gpa: randomGPA,
                        success: true,
                        message: 'Account created successfully'
                    });
                } else {
                    // Mock mode
                    const email = `${studentId}@hkmu.edu.hk`;
                    console.log('⚠️ Mock mode - Student account:', { studentId, name, email, major });
                    results.push({
                        studentId,
                        name,
                        email,
                        major,
                        success: true,
                        message: 'Account created successfully (Mock mode)'
                    });
                }
            } catch (individualError) {
                console.error('❌ Error creating student:', studentData.studentId, individualError);
                results.push({
                    studentId: studentData.studentId,
                    name: studentData.name,
                    success: false,
                    message: 'Error: ' + individualError.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        return res.json({
            success: true,
            message: `Created ${successCount} out of ${students.length} accounts`,
            results: results
        });

    } catch (error) {
        console.error('Batch create student accounts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to batch create student accounts: ' + error.message
        });
    }
});

// Batch create teacher accounts
// New format: Teacher ID is 't001', 't002', etc.
app.post('/api/admin/teachers/batch-create', async (req, res) => {
    console.log('=== Batch create teacher accounts START ===');
    console.log('Admin batch creates teacher accounts:', req.body);
    try {
        const { accounts } = req.body;

        if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
            console.log('❌ Invalid request: no accounts array');
            return res.status(400).json({
                success: false,
                message: 'Accounts array is required'
            });
        }

        console.log(`📝 Processing ${accounts.length} teacher(s)`);
        const isDbConnected = checkDbConnectionForAdmin();
        console.log(`📊 Database connected: ${isDbConnected}`);
        const Teacher = require('./models/Teacher');
        const results = [];

        for (const teacherData of accounts) {
            const { teacherId, name, major } = teacherData;

            try {
                // Validation (password not required - using default)
                if (!teacherId || !name || !major) {
                    results.push({
                        teacherId,
                        name,
                        success: false,
                        message: 'All fields are required: teacherId, name, major'
                    });
                    continue;
                }

                // Validate teacherId: must start with 't' followed by digits (1-10 digits)
                if (!/^t\d{1,10}$/.test(teacherId)) {
                    results.push({
                        teacherId,
                        name,
                        success: false,
                        message: 'Invalid teacher ID format. Must be t001, t002, etc. (1-10 digits)'
                    });
                    continue;
                }

                // Validate major
                const validMajors = ['Computer and Cyber Security', 'Electronics and Computer Engineering', 'Computer and Cyber Security + Electronics and Computer Engineering'];
                if (!validMajors.includes(major)) {
                    results.push({
                        teacherId,
                        name,
                        success: false,
                        message: 'Invalid major. Must be Computer and Cyber Security, Electronics and Computer Engineering, or Computer and Cyber Security + Electronics and Computer Engineering'
                    });
                    continue;
                }

                // Email is the teacherId + @hkmu.edu.hk
                const email = `${teacherId}@hkmu.edu.hk`;

                if (isDbConnected && Teacher) {
                    // Check if teacher already exists by email
                    const existingTeacher = await Teacher.findOne({ email: email }).exec();
                    if (existingTeacher) {
                        results.push({
                            teacherId,
                            name,
                            email,
                            success: false,
                            message: `Teacher with email ${email} already exists`
                        });
                        continue;
                    }

                    // Use default password (admin doesn't need to set it)
                    const DEFAULT_PASSWORD = 'Changeme123!';
                    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

                    // Create new teacher
                    const newTeacher = new Teacher({
                        teacherId: teacherId,
                        email: email,
                        name: name,
                        password: hashedPassword,
                        department: 'FYP',
                        major: major,
                        mustChangePassword: true,
                        initialPassword: DEFAULT_PASSWORD
                    });

                    await newTeacher.save();

                    console.log('✅ Teacher account created:', {
                        teacherId: teacherId,
                        name: name,
                        email: email,
                        major: major
                    });

                    results.push({
                        teacherId,
                        name,
                        email,
                        major,
                        success: true,
                        message: 'Account created successfully'
                    });
                } else {
                    // Mock mode
                    console.log('⚠️ Mock mode - Teacher account:', { teacherId, name, email, major });
                    results.push({
                        teacherId,
                        name,
                        email,
                        major,
                        success: true,
                        message: 'Account created successfully (Mock mode)'
                    });
                }
            } catch (individualError) {
                console.error('❌ Error creating teacher:', teacherData.name, individualError);
                results.push({
                    teacherId: teacherData.teacherId,
                    name: teacherData.name,
                    success: false,
                    message: 'Error: ' + individualError.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        return res.json({
            success: true,
            message: `Created ${successCount} out of ${accounts.length} accounts`,
            results: results
        });

    } catch (error) {
        console.error('Batch create teacher accounts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to batch create teacher accounts: ' + error.message
        });
    }
});

// Get project statistics for major requirements
app.get('/api/admin/project-stats', async (req, res) => {
    console.log('Requesting project statistics');
    try {
        const isDbConnected = checkDbConnectionForAdmin();
        
        let eceStudents = 0;
        let ccsStudents = 0;
        let eceProjects = 0;
        let ccsProjects = 0;
        let eceTeachers = 0;
        let ccsTeachers = 0;
        let bothTeachers = 0;
        
        if (isDbConnected) {
            const Student = require('./models/Student');
            const Project = require('./models/Project');
            const Teacher = require('./models/Teacher');

            const studentDocs = await Student.find({}).select('major').lean().exec();
            eceStudents = studentDocs.filter((s) => majorToFilterCode(s.major) === 'ECE').length;
            ccsStudents = studentDocs.filter((s) => majorToFilterCode(s.major) === 'CCS').length;

            const projectDocs = await Project.find({ type: { $ne: 'student' } }).select('major').lean().exec();
            eceProjects = projectDocs.filter((p) => {
                const c = majorToFilterCode(p.major);
                return c === 'ECE' || c === 'ECE+CCS';
            }).length;
            ccsProjects = projectDocs.filter((p) => {
                const c = majorToFilterCode(p.major);
                return c === 'CCS' || c === 'ECE+CCS';
            }).length;

            const teacherDocs = await Teacher.find({}).select('major').lean().exec();
            eceTeachers = teacherDocs.filter((t) => majorToFilterCode(t.major) === 'ECE').length;
            ccsTeachers = teacherDocs.filter((t) => majorToFilterCode(t.major) === 'CCS').length;
            bothTeachers = teacherDocs.filter((t) => majorToFilterCode(t.major) === 'ECE+CCS').length;
        } else {
            // Mock mode - estimate based on test data
            eceStudents = 20;
            ccsStudents = 30;
            eceProjects = 10;
            ccsProjects = 20;
            eceTeachers = 1;
            ccsTeachers = 1;
            bothTeachers = 1;
        }

        const eceDenom = Math.max(1, eceTeachers + bothTeachers);
        const ccsDenom = Math.max(1, ccsTeachers + bothTeachers);
        return res.json({
            success: true,
            stats: {
                eceStudents,
                ccsStudents,
                eceProjects,
                ccsProjects,
                eceTeachers,
                ccsTeachers,
                bothTeachers,
                eceNeeded: Math.max(0, eceStudents - eceProjects),
                ccsNeeded: Math.max(0, ccsStudents - ccsProjects),
                /** Fair share per supervisor (does not double-count when you add a project) */
                ecePerTeacherTarget: Math.ceil(eceStudents / eceDenom),
                ccsPerTeacherTarget: Math.ceil(ccsStudents / ccsDenom),
                totalStudents: eceStudents + ccsStudents,
                totalProjects: eceProjects + ccsProjects
            }
        });
    } catch (error) {
        console.error('❌ Error fetching project stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all students (admin only)
app.get('/api/admin/students', async (req, res) => {
    console.log('Admin requests student list');
    try {
        const isDbConnected = checkDbConnectionForAdmin();
        const Student = require('./models/Student');
        
        if (isDbConnected && Student) {
            const students = await Student.find({}).lean().exec();
            return res.json({ 
                success: true, 
                students: students.map(s => ({
                    id: s.id,
                    name: s.name,
                    email: s.email,
                    gpa: s.gpa,
                    major: s.major,
                    year: s.year,
                    proposalSubmitted: s.proposalSubmitted,
                    proposalStatus: s.proposalStatus,
                    assignedProject: s.assignedProject ? String(s.assignedProject) : null,
                    proposalApproved: s.proposalApproved
                }))
            });
        }
        
        return res.json({ success: true, students: [] });
    } catch (error) {
        console.error('Get student list error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to get student list' 
        });
    }
});

// ============================================
// Admin: Final Assignment API Endpoints
// ============================================

// Get unmatched students (no assigned project, proposal approved or not)
app.get('/api/admin/unmatched-students', async (req, res) => {
    console.log('Admin requests unassigned student list');
    try {
        const isDbConnected = checkDbConnectionForAdmin();
        const Student = require('./models/Student');
        const Project = require('./models/Project');
        
        if (isDbConnected && Student && Project) {
            // Get students without assignedProject
            const students = await Student.find({ 
                assignedProject: null 
            }).lean().exec();
            
            // Transform data
            const unmatchedStudents = students.map(s => ({
                id: s.id,
                name: s.name,
                email: s.email,
                gpa: s.gpa,
                major: s.major,
                year: s.year,
                proposalSubmitted: s.proposalSubmitted,
                proposalApproved: s.proposalApproved,
                proposalStatus: s.proposalStatus
            }));
            
            return res.json({ success: true, students: unmatchedStudents });
        }
        
        return res.json({ success: true, students: [] });
    } catch (error) {
        console.error('Get unassigned student list error:', error);
        return res.status(500).json({ success: false, message: 'Failed to get unmatched students' });
    }
});

// Get matched students (with assigned project)
app.get('/api/admin/matched-students', async (req, res) => {
    console.log('Admin requests assigned student list');
    try {
        const isDbConnected = checkDbConnectionForAdmin();
        const Student = require('./models/Student');
        const Project = require('./models/Project');
        
        if (isDbConnected && Student && Project) {
            // Get students with assignedProject
            const students = await Student.find({ 
                assignedProject: { $ne: null } 
            }).lean().exec();
            
            // Resolve project details
            const matchedStudents = await Promise.all(students.map(async (s) => {
                let project = null;
                if (s.assignedProject) {
                    project = await Project.findById(s.assignedProject).lean().exec();
                }
                
                return {
                    id: s.id,
                    name: s.name,
                    email: s.email,
                    gpa: s.gpa,
                    major: s.major,
                    year: s.year,
                    assignedProject: s.assignedProject ? String(s.assignedProject) : null,
                    projectTitle: project?.title || null,
                    projectCode: project?.code || null,
                    projectType: project?.type || 'teacher',
                    supervisor: project?.supervisor || 'TBD',
                    supervisorEmail: project?.supervisorEmail || '',
                    assignedAt: s.updatedAt
                };
            }));
            
            return res.json({ success: true, students: matchedStudents });
        }
        
        return res.json({ success: true, students: [] });
    } catch (error) {
        console.error('Get assigned student list error:', error);
        return res.status(500).json({ success: false, message: 'Failed to get matched students' });
    }
});

// Get available projects for assignment
app.get('/api/admin/available-projects', async (req, res) => {
    console.log('Admin requests available project list (for assignment)');
    try {
        const isDbConnected = checkDbConnectionForAdmin();
        const Project = require('./models/Project');
        const Student = require('./models/Student');
        
        if (isDbConnected && Project && Student) {
            // For unmatched students: only show teacher-proposed projects
            // (Student-proposed projects have supervisor: 'TBD' and should not be assigned)
            // Consistent with getAvailableProjects / runMatching: accept all non-rejected projects
            const projects = await Project.find({
                type: { $ne: 'student' }, // Only teacher-proposed
                isActive: { $ne: false }
            }).lean().exec();
            
            // Count assigned students per project
            const assignedCounts = {};
            const assignedStudents = await Student.find({ assignedProject: { $ne: null } }).lean().exec();
            assignedStudents.forEach(s => {
                const pid = String(s.assignedProject);
                assignedCounts[pid] = (assignedCounts[pid] || 0) + 1;
            });
            
            // Build available projects
            const availableProjects = [];
            
            projects.forEach(p => {
                const pid = String(p._id);
                const capacity = p.capacity || 1;
                const assigned = assignedCounts[pid] || 0;
                const remaining = capacity - assigned;
                
                const projectData = {
                    id: pid,
                    code: p.code,
                    title: p.title,
                    supervisor: p.supervisor || (p.proposedByName || 'Student Proposed'),
                    supervisorEmail: p.supervisorEmail || '',
                    capacity: capacity,
                    assignedCount: assigned,
                    remainingSlots: remaining,
                    type: 'teacher' // All are teacher-proposed
                };
                
                availableProjects.push(projectData);
            });
            
            return res.json({ 
                success: true, 
                projects: availableProjects
            });
        }
        
        return res.json({ success: true, projects: [] });
    } catch (error) {
        console.error('Get available project list error:', error);
        return res.status(500).json({ success: false, message: 'Failed to get available projects' });
    }
});

// Get ALL projects for edit modal (admin has maximum permissions)
// Includes both teacher-proposed and student-proposed projects
app.get('/api/admin/all-projects', async (req, res) => {
    console.log('Admin requests all project list (for edit modal)');
    try {
        const isDbConnected = checkDbConnectionForAdmin();
        const Project = require('./models/Project');
        const Student = require('./models/Student');
        
        if (isDbConnected && Project && Student) {
            // Get all projects (both teacher-proposed and student-proposed)
            // Teacher-proposed: status is 'Under Review'
            // Student-proposed: proposalStatus is 'approved'
            const projects = await Project.find({
                $or: [
                    { type: { $ne: 'student' }, status: 'Under Review' },
                    { type: 'student', proposalStatus: 'approved' }
                ],
                isActive: { $ne: false }
            }).lean().exec();
            
            // Count assigned students per project
            const assignedCounts = {};
            const assignedStudents = await Student.find({ assignedProject: { $ne: null } }).lean().exec();
            assignedStudents.forEach(s => {
                const pid = String(s.assignedProject);
                assignedCounts[pid] = (assignedCounts[pid] || 0) + 1;
            });
            
            // Build all projects
            const allProjects = [];
            
            projects.forEach(p => {
                const pid = String(p._id);
                const capacity = p.capacity || 1;
                const assigned = assignedCounts[pid] || 0;
                const remaining = capacity - assigned;
                
                const projectData = {
                    id: pid,
                    code: p.code,
                    title: p.title,
                    supervisor: p.supervisor || (p.proposedByName || 'Student Proposed'),
                    supervisorEmail: p.supervisorEmail || '',
                    capacity: capacity,
                    assignedCount: assigned,
                    remainingSlots: remaining,
                    type: p.type === 'student' ? 'student' : 'teacher'
                };
                
                allProjects.push(projectData);
            });
            
            return res.json({ 
                success: true, 
                projects: allProjects
            });
        }
        
        return res.json({ success: true, projects: [] });
    } catch (error) {
        console.error('Get all project list error:', error);
        return res.status(500).json({ success: false, message: 'Failed to get all projects' });
    }
});

// Manual assign project to a student
app.post('/api/admin/assign-project', async (req, res) => {
    console.log('Admin manually assigns project:', req.body);
    try {
        const { studentId, projectId } = req.body;
        
        if (!studentId || !projectId) {
            return res.status(400).json({ success: false, message: 'studentId and projectId are required' });
        }
        
        const isDbConnected = checkDbConnectionForAdmin();
        const Student = require('./models/Student');
        const Project = require('./models/Project');
        
        if (isDbConnected && Student && Project) {
            // Find student
            const student = await Student.findOne({ id: studentId }).exec();
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            
            // Check if student already has a project assigned
            if (student.assignedProject) {
                return res.status(400).json({ success: false, message: 'Student already has an assigned project. Please clear it first.' });
            }
            
            // Find project
            const project = await Project.findById(projectId).exec();
            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }
            
            // Verify project is approved (either teacher-proposed or student-proposed with approved status)
            // Teacher-proposed: status is 'Under Review' (approved but waiting for final assignment)
            // Student-proposed: proposalStatus is 'approved'
            if (project.type !== 'student' && project.status !== 'Under Review') {
                return res.status(400).json({ success: false, message: 'Project is not approved for assignment' });
            }
            if (project.type === 'student' && project.proposalStatus !== 'approved') {
                return res.status(400).json({ success: false, message: 'Student-proposed project is not approved' });
            }
            
            // Check capacity
            const currentAssigned = await Student.countDocuments({ assignedProject: projectId });
            if (currentAssigned >= (project.capacity || 1)) {
                return res.status(400).json({ success: false, message: 'Project has reached its capacity' });
            }
            
            // Assign project
            student.assignedProject = project._id;
            student.updatedAt = new Date();
            await student.save();
            
            // Update project assigned count
            project.assignedCount = currentAssigned + 1;
            await project.save();
            
            console.log(`✅ Assigned project ${project.title} to student ${student.name}`);
            
            return res.json({ 
                success: true, 
                message: `Project ${project.title} assigned to ${student.name}`,
                student: {
                    id: student.id,
                    name: student.name,
                    assignedProject: String(project._id),
                    projectTitle: project.title
                }
            });
        }
        
        return res.status(500).json({ success: false, message: 'Database not available' });
    } catch (error) {
        console.error('Assign project error:', error);
        return res.status(500).json({ success: false, message: 'Failed to assign project: ' + error.message });
    }
});

// Auto-assign selected students to random available projects
app.post('/api/admin/auto-assign', async (req, res) => {
    console.log('Admin auto-assigns selected students:', req.body);
    try {
        const { studentIds } = req.body;
        
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ success: false, message: 'studentIds array is required' });
        }
        
        const isDbConnected = checkDbConnectionForAdmin();
        const Student = require('./models/Student');
        const Project = require('./models/Project');
        
        if (isDbConnected && Student && Project) {
            // Get all approved projects (both teacher-proposed and student-proposed)
            const projects = await Project.find({ 
                $or: [
                    { type: { $ne: 'student' }, status: 'Approved' },
                    { type: 'student', proposalStatus: 'approved' }
                ],
                isActive: { $ne: false }
            }).lean().exec();
            
            // Calculate remaining slots for each project
            const projectSlots = {};
            for (const p of projects) {
                const pid = String(p._id);
                const capacity = p.capacity || 1;
                const assigned = await Student.countDocuments({ assignedProject: pid });
                projectSlots[pid] = {
                    project: p,
                    remaining: capacity - assigned
                };
            }
            
            // Filter projects with remaining slots
            const availableProjects = projects.filter(p => {
                const pid = String(p._id);
                return projectSlots[pid] && projectSlots[pid].remaining > 0;
            });
            
            if (availableProjects.length === 0) {
                return res.status(400).json({ success: false, message: 'No available projects with remaining capacity' });
            }
            
            // Get unmatched students
            const students = await Student.find({ 
                id: { $in: studentIds },
                assignedProject: null 
            }).exec();
            
            if (students.length === 0) {
                return res.status(400).json({ success: false, message: 'No unmatched students found among the selected IDs' });
            }
            
            const results = [];
            // Shuffle students for random assignment
            const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
            // Keep track of used projects per student to avoid duplicates
            const studentAssignedProjects = {};
            
            for (const student of shuffledStudents) {
                // Find available projects (with remaining slots, not yet assigned to this student)
                const availableForStudent = availableProjects.filter(p => {
                    const pid = String(p._id);
                    return projectSlots[pid] && projectSlots[pid].remaining > 0;
                });
                
                if (availableForStudent.length === 0) {
                    continue;
                }
                
                // Randomly select a project
                const randomIndex = Math.floor(Math.random() * availableForStudent.length);
                const selectedProject = availableForStudent[randomIndex];
                const pid = String(selectedProject._id);
                
                // Assign project to student
                student.assignedProject = selectedProject._id;
                student.updatedAt = new Date();
                await student.save();
                
                // Update slot count
                projectSlots[pid].remaining--;
                
                results.push({
                    studentId: student.id,
                    studentName: student.name,
                    projectId: pid,
                    projectTitle: selectedProject.title
                });
                
                console.log(`✅ Auto-assigned project ${selectedProject.title} to student ${student.name}`);
            }
            
            return res.json({ 
                success: true, 
                message: `Auto-assigned ${results.length} students to projects`,
                assignments: results
            });
        }
        
        return res.status(500).json({ success: false, message: 'Database not available' });
    } catch (error) {
        console.error('Auto-assign error:', error);
        return res.status(500).json({ success: false, message: 'Failed to auto-assign: ' + error.message });
    }
});

// Clear student's assignment
app.post('/api/admin/clear-assignment', async (req, res) => {
    console.log('Admin clears student assignment:', req.body);
    try {
        const { studentId } = req.body;
        
        if (!studentId) {
            return res.status(400).json({ success: false, message: 'studentId is required' });
        }
        
        const isDbConnected = checkDbConnectionForAdmin();
        const Student = require('./models/Student');
        const Project = require('./models/Project');
        
        if (isDbConnected && Student && Project) {
            // Find student
            const student = await Student.findOne({ id: studentId }).exec();
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            
            // Check if student has a project assigned
            if (!student.assignedProject) {
                return res.status(400).json({ success: false, message: 'Student does not have an assigned project' });
            }
            
            const projectId = student.assignedProject;
            
            // Clear assignment
            student.assignedProject = null;
            student.updatedAt = new Date();
            await student.save();
            
            // Update project assigned count
            const project = await Project.findById(projectId).exec();
            if (project && project.assignedCount > 0) {
                project.assignedCount--;
                await project.save();
            }
            
            console.log(`✅ Cleared assignment for student ${student.name}`);
            
            return res.json({ 
                success: true, 
                message: `Assignment cleared for ${student.name}`
            });
        }
        
        return res.status(500).json({ success: false, message: 'Database not available' });
    } catch (error) {
        console.error('Clear assignment error:', error);
        return res.status(500).json({ success: false, message: 'Failed to clear assignment: ' + error.message });
    }
});

// Update student's assignment (change project)
app.post('/api/admin/update-assignment', async (req, res) => {
    console.log('Admin updates student assignment:', req.body);
    try {
        const { studentId, newProjectId } = req.body;
        
        if (!studentId || !newProjectId) {
            return res.status(400).json({ success: false, message: 'studentId and newProjectId are required' });
        }
        
        const isDbConnected = checkDbConnectionForAdmin();
        const Student = require('./models/Student');
        const Project = require('./models/Project');
        
        if (isDbConnected && Student && Project) {
            // Find student
            const student = await Student.findOne({ id: studentId }).exec();
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            
            // Find new project
            const newProject = await Project.findById(newProjectId).exec();
            if (!newProject) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }
            
            // Verify project is approved (either teacher-proposed or student-proposed with approved status)
            // Teacher-proposed: status is 'Under Review' (approved but waiting for final assignment)
            // Student-proposed: proposalStatus is 'approved'
            if (newProject.type !== 'student' && newProject.status !== 'Under Review') {
                return res.status(400).json({ success: false, message: 'Project is not approved for assignment' });
            }
            if (newProject.type === 'student' && newProject.proposalStatus !== 'approved') {
                return res.status(400).json({ success: false, message: 'Student-proposed project is not approved' });
            }
            
            const oldProjectId = student.assignedProject;
            
            // If same project, do nothing
            if (oldProjectId && String(oldProjectId) === newProjectId) {
                return res.json({ success: true, message: 'Student is already assigned to this project' });
            }
            
            // Check capacity for new project (if it's a different project)
            if (!oldProjectId || String(oldProjectId) !== newProjectId) {
                const currentAssigned = await Student.countDocuments({ assignedProject: newProjectId });
                if (currentAssigned >= (newProject.capacity || 1)) {
                    return res.status(400).json({ success: false, message: 'New project has reached its capacity' });
                }
            }
            
            // Update old project count
            if (oldProjectId) {
                const oldProject = await Project.findById(oldProjectId).exec();
                if (oldProject && oldProject.assignedCount > 0) {
                    oldProject.assignedCount--;
                    await oldProject.save();
                }
            }
            
            // Assign new project
            student.assignedProject = newProject._id;
            student.updatedAt = new Date();
            await student.save();
            
            // Update new project count
            newProject.assignedCount = await Student.countDocuments({ assignedProject: newProjectId });
            await newProject.save();
            
            console.log(`✅ Updated assignment for student ${student.name} to project ${newProject.title}`);
            
            return res.json({ 
                success: true, 
                message: `Updated assignment to ${newProject.title}`,
                student: {
                    id: student.id,
                    name: student.name,
                    assignedProject: String(newProject._id),
                    projectTitle: newProject.title
                }
            });
        }
        
        return res.status(500).json({ success: false, message: 'Database not available' });
    } catch (error) {
        console.error('Update assignment error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update assignment: ' + error.message });
    }
});

// Update student test account SID
app.put('/api/admin/students/test-account-sid', async (req, res) => {
    console.log('Update test student account SID:', req.body);
    try {
        const { email, newId } = req.body;
        
        if (!email || !newId) {
            return res.status(400).json({ success: false, message: 'email and newId are required' });
        }
        
        // Validate newId format (8 digits)
        if (!/^\d{8}$/.test(newId)) {
            return res.status(400).json({ success: false, message: 'Student ID must be exactly 8 digits' });
        }
        
        const isDbConnected = checkDbConnectionForAdmin();
        const Student = require('./models/Student');
        
        if (isDbConnected && Student) {
            // Find student by email
            const student = await Student.findOne({ email: email }).exec();
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            
            // Check if newId already exists
            const existingStudent = await Student.findOne({ id: newId }).exec();
            if (existingStudent && String(existingStudent._id) !== String(student._id)) {
                return res.status(400).json({ success: false, message: `Student ID ${newId} already exists` });
            }
            
            const oldId = student.id;
            student.id = newId;
            await student.save();
            
            console.log(`✅ Updated student ${email} SID from ${oldId} to ${newId}`);
            
            return res.json({ 
                success: true, 
                message: `Updated student ID from ${oldId} to ${newId}`,
                student: {
                    id: student.id,
                    name: student.name,
                    email: student.email
                }
            });
        }
        
        return res.status(500).json({ success: false, message: 'Database not available' });
    } catch (error) {
        console.error('Update student SID error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update student SID: ' + error.message });
    }
});

// Error handling
process.on('unhandledRejection', (err) => {
    console.error('Unhandled error:', err);
    process.exit(1);
});

// SPA routing - all non-API routes return index.html (place after all API routes)
// Express 5 no longer supports '*', use regex instead
app.get(/^(?!\/api).*$/, (req, res) => {
    const indexPath = path.join(staticPath, 'index.html');
    if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head><title>FYP Matching System</title></head>
            <body>
                <h1>FYP Matching System</h1>
                <p>Backend is running. Frontend build pending.</p>
                <p>Please wait for deployment to complete...</p>
            </body>
            </html>
        `);
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Static files from: ${staticPath}`);
});