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

// 🔥 自動初始化用戶資料
async function initializeUsers() {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    
    console.log('🔑 自動生成的密碼雜湊完成');
    
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
            studentId: 'S001',
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
    
    console.log('✅ 用戶資料初始化完成');
    console.log('📧 測試帳號:');
    console.log('   Admin: admin@hkmu.edu.hk / admin123');
    console.log('   Student: student@hkmu.edu.hk / student123');
    console.log('   Teacher: teacher@hkmu.edu.hk / teacher123');
}

// 登入 API 路由
app.post('/login', async (req, res) => {
    console.log('📨 收到登入請求:', req.body);
    
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    
    if (!user) {
        console.log('❌ 用戶不存在');
        return res.json({ success: false, message: 'Email or password is incorrect' });
    }

    // 檢查密碼
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        console.log('❌ 密碼錯誤');
        return res.json({ success: false, message: 'Email or password is incorrect' });
    }

    // 登入成功
    console.log('✅ 登入成功，用戶角色:', user.role);
    res.json({ 
        success: true, 
        message: `Login successful! Welcome, ${user.role}.`,
        user: { 
            email: user.email, 
            role: user.role,
            name: user.name,
            studentId: user.studentId, // 添加 studentId
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

// 📋 頁面路由
app.get('/admin.html', (req, res) => {
    console.log('📄 請求管理員頁面');
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/student.html', (req, res) => {
    console.log('📄 請求學生頁面');
    res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

app.get('/teacher.html', (req, res) => {
    console.log('📄 請求教師頁面');
    res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
});

app.get('/dashboard.html', (req, res) => {
    console.log('📄 請求用戶儀表板 - 重定向到登入頁');
    res.redirect('/');
});

// 根路由 - 登入頁面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 🔥 引入服務層 - 放在路由之前
try {
    const studentService = require('./services/studentService');
    
    // 📊 Student API 路由
    app.get('/api/student/projects', (req, res) => {
        console.log('📋 請求項目列表');
        try {
            const projects = studentService.getAvailableProjects();
            res.json({ success: true, projects });
        } catch (error) {
            console.error('❌ 獲取項目錯誤:', error);
            res.json({ success: false, message: 'Failed to load projects' });
        }
    });

    app.get('/api/student/:id', (req, res) => {
        console.log('👤 請求學生信息:', req.params.id);
        try {
            const student = studentService.getStudent(req.params.id);
            if (!student) {
                return res.json({ success: false, message: 'Student not found' });
            }
            res.json({ success: true, student });
        } catch (error) {
            console.error('❌ 獲取學生信息錯誤:', error);
            res.json({ success: false, message: 'Failed to load student info' });
        }
    });

    app.get('/api/student/:id/preferences', (req, res) => {
        console.log('⭐ 請求學生偏好:', req.params.id);
        try {
            const preferences = studentService.getStudentPreferences(req.params.id);
            res.json({ success: true, preferences });
        } catch (error) {
            console.error('❌ 獲取偏好錯誤:', error);
            res.json({ success: false, message: 'Failed to load preferences' });
        }
    });

    app.post('/api/student/:id/preferences', (req, res) => {
        console.log('➕ 添加偏好:', { studentId: req.params.id, projectId: req.body.projectId });
        try {
            const result = studentService.addPreference(req.params.id, req.body.projectId);
            res.json(result);
        } catch (error) {
            console.error('❌ 添加偏好錯誤:', error);
            res.json({ success: false, message: 'Failed to add preference' });
        }
    });

    app.delete('/api/student/:id/preferences/:projectId', (req, res) => {
        console.log('➖ 移除偏好:', { studentId: req.params.id, projectId: req.params.projectId });
        try {
            const result = studentService.removePreference(req.params.id, req.params.projectId);
            res.json(result);
        } catch (error) {
            console.error('❌ 移除偏好錯誤:', error);
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
        console.log('📤 提交偏好:', req.params.id);
        try {
            const result = studentService.submitPreferences(req.params.id);
            res.json(result);
        } catch (error) {
            console.error('❌ 提交偏好錯誤:', error);
            res.json({ success: false, message: 'Failed to submit preferences' });
        }
    });

    app.get('/api/system/status', (req, res) => {
        console.log('⚙️ 請求系統狀態');
        try {
            const status = studentService.getSystemStatus();
            res.json({ success: true, ...status });
        } catch (error) {
            console.error('❌ 獲取系統狀態錯誤:', error);
            res.json({ success: false, message: 'Failed to load system status' });
        }
    });

} catch (error) {
    console.log('⚠️ 服務層未找到，使用模擬API');
    
    // 簡化的模擬API作為後備
    app.get('/api/student/projects', (req, res) => {
        console.log('📋 請求項目列表 (模擬)');
        const projects = [
            {
                id: 1,
                title: 'AI-based Learning System',
                supervisor: 'Dr. Bell Liu',
                description: 'Develop an intelligent learning platform.',
                skills: 'Python, Machine Learning, Web Development',
                popularity: 15,
                capacity: 3
            }
        ];
        res.json({ success: true, projects });
    });
}

// 🔥 啟動伺服器前先初始化用戶資料
initializeUsers().then(() => {
    app.listen(port, () => {
        console.log(`🚀 伺服器運行在 http://localhost:${port}`);
        console.log(`🎯 系統界面:`);
        console.log(`   📧 登入頁面: http://localhost:${port}/`);
        console.log(`   👨‍💼 管理員界面: http://localhost:${port}/admin.html`);
        console.log(`   👨‍🎓 學生界面: http://localhost:${port}/student.html`);
        console.log(`   👨‍🏫 教師界面: http://localhost:${port}/teacher.html`);
        console.log('\n🔑 測試帳號:');
        console.log('   Admin: admin@hkmu.edu.hk / admin123');
        console.log('   Student: student@hkmu.edu.hk / student123');
        console.log('   Teacher: teacher@hkmu.edu.hk / teacher123');
    });
});

// 錯誤處理
process.on('unhandledRejection', (err) => {
    console.error('❌ 未處理的錯誤:', err);
    process.exit(1);
});