const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const app = express();
const port = 3000;

// 中介軟體
app.use(express.json());
app.use(express.static('public'));

// 用戶資料（會自動初始化）
let users = [];

// Auto-initialize user data
async function initializeUsers() {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    
    console.log('Password hashing completed');
    
    users = [
        {
            email: 'admin@hkmu.edu.hk',
            password: adminPassword,
            role: 'admin',
            name: 'Admin Wang'
        },
        {
            email: 'student@hkmu.edu.hk',
            password: studentPassword,
            role: 'student',
            name: 'Chan Tai Man',
            studentId: 'S001', // 確保有 studentId
            gpa: '3.45',
            major: 'Computer Science'
        },
        {
            email: 'teacher@hkmu.edu.hk',
            password: teacherPassword,
            role: 'teacher',
            name: 'Dr. Bell Liu',
            department: 'Computer Science'
        }
    ];
    
    console.log('User data initialized');
    console.log('Test accounts:');
    console.log('   Admin: admin@hkmu.edu.hk / admin123');
    console.log('   Student: student@hkmu.edu.hk / student123');
    console.log('   Teacher: teacher@hkmu.edu.hk / teacher123');
}

// Login API route
app.post('/login', async (req, res) => {
    console.log('Received login request:', req.body);
    
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    
    if (!user) {
        console.log('User not found');
        return res.json({ success: false, message: 'Email or password is incorrect' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        console.log('Password incorrect');
        return res.json({ success: false, message: 'Email or password is incorrect' });
    }

    // Login successful - ensure all necessary info is returned
    console.log('Login successful, user role:', user.role);
    res.json({ 
        success: true, 
        message: `Login successful! Welcome, ${user.role}.`,
        user: { 
            email: user.email, 
            role: user.role,
            name: user.name,
            studentId: user.studentId || user.studentId || 'S001', // 確保返回 studentId
            gpa: user.gpa,
            major: user.major,
            department: user.department,
            redirectTo: getRedirectPage(user.role)
        }
    });
});

// 根據角色返回對應頁面
function getRedirectPage(role) {
    const pages = {
        'admin': '/admin.html',
        'student': '/student.html',
        'teacher': '/teacher.html'
    };
    return pages[role] || '/';
}

// Page routes
app.get('/admin.html', (req, res) => {
    console.log('Requesting admin page');
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/student.html', (req, res) => {
    console.log('Requesting student page');
    res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

app.get('/teacher.html', (req, res) => {
    console.log('Requesting teacher page');
    res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
});

app.get('/dashboard.html', (req, res) => {
    console.log('Requesting user dashboard - redirecting to login');
    res.redirect('/');
});

// 根路由 - 登入頁面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Import service layer - before routes
try {
    const studentService = require('./services/studentService');
    
    // Student API routes
    app.get('/api/student/projects', (req, res) => {
        console.log('Request project list');
        try {
            const projects = studentService.getAvailableProjects();
            res.json({ success: true, projects });
        } catch (error) {
            console.error('Get projects error:', error);
            res.json({ success: false, message: 'Failed to load projects' });
        }
    });

    app.get('/api/student/:id', (req, res) => {
        console.log('Request student info:', req.params.id);
        try {
            const student = studentService.getStudent(req.params.id);
            if (!student) {
                return res.json({ success: false, message: 'Student not found' });
            }
            res.json({ success: true, student });
        } catch (error) {
            console.error('Get student info error:', error);
            res.json({ success: false, message: 'Failed to load student info' });
        }
    });

    app.get('/api/student/:id/preferences', (req, res) => {
        console.log('Request student preferences:', req.params.id);
        try {
            const preferences = studentService.getStudentPreferences(req.params.id);
            res.json({ success: true, preferences });
        } catch (error) {
            console.error('Get preferences error:', error);
            res.json({ success: false, message: 'Failed to load preferences' });
        }
    });

    app.post('/api/student/:id/preferences', (req, res) => {
        console.log('Add preference:', { studentId: req.params.id, projectId: req.body.projectId });
        try {
            // Ensure projectId is a number
            const projectId = parseInt(req.body.projectId);
            const result = studentService.addPreference(req.params.id, projectId);
            res.json(result);
        } catch (error) {
            console.error('Add preference error:', error);
            res.json({ success: false, message: 'Failed to add preference' });
        }
    });

    app.delete('/api/student/:id/preferences/:projectId', (req, res) => {
        console.log('Remove preference:', { studentId: req.params.id, projectId: req.params.projectId });
        try {
            // Ensure projectId is a number
            const projectId = parseInt(req.params.projectId);
            const result = studentService.removePreference(req.params.id, projectId);
            res.json(result);
        } catch (error) {
            console.error('Remove preference error:', error);
            res.json({ success: false, message: 'Failed to remove preference' });
        }
    });

    app.put('/api/student/:id/preferences/:projectId/move', (req, res) => {
        console.log('Move preference:', { studentId: req.params.id, projectId: req.params.projectId, direction: req.body.direction });
        try {
            // Ensure projectId is a number
            const projectId = parseInt(req.params.projectId);
            const { direction } = req.body;
            const result = studentService.movePreference(req.params.id, projectId, direction);
            res.json(result);
        } catch (error) {
            console.error('Move preference error:', error);
            res.json({ success: false, message: 'Failed to move preference' });
        }
    });

    app.post('/api/student/:id/preferences/submit', (req, res) => {
        console.log('Submit preferences:', req.params.id);
        try {
            const result = studentService.submitPreferences(req.params.id);
            res.json(result);
        } catch (error) {
            console.error('Submit preferences error:', error);
            res.json({ success: false, message: 'Failed to submit preferences' });
        }
    });

    app.get('/api/system/status', (req, res) => {
        console.log('Request system status');
        try {
            const status = studentService.getSystemStatus();
            res.json({ success: true, ...status });
        } catch (error) {
            console.error('Get system status error:', error);
            res.json({ success: false, message: 'Failed to load system status' });
        }
    });

} catch (error) {
    console.log('Service layer not found, using mock API');
    
    // Simplified mock API as fallback
    app.get('/api/student/projects', (req, res) => {
        console.log('Request project list (mock)');
        const projects = [
            {
                id: 1,
                title: 'AI-based Learning System',
                supervisor: 'Dr. Bell Liu',
                description: 'Develop an intelligent learning platform.',
                skills: ['Python', 'Machine Learning', 'Web Development'],
                popularity: 15,
                capacity: 3,
                status: 'active'
            }
        ];
        res.json({ success: true, projects });
    });
}

// Initialize users before starting server
initializeUsers().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        console.log(`System interfaces:`);
        console.log(`   Login page: http://localhost:${port}/`);
        console.log(`   Admin interface: http://localhost:${port}/admin.html`);
        console.log(`   Student interface: http://localhost:${port}/student.html`);
        console.log(`   Teacher interface: http://localhost:${port}/teacher.html`);
        console.log('\nTest accounts:');
        console.log('   Admin: admin@hkmu.edu.hk / admin123');
        console.log('   Student: student@hkmu.edu.hk / student123');
        console.log('   Teacher: teacher@hkmu.edu.hk / teacher123');
    });
});

// Error handling
process.on('unhandledRejection', (err) => {
    console.error('Unhandled error:', err);
    process.exit(1);
});