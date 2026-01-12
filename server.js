const express = require('express');
const bcrypt = require('bcryptjs');
const { Parser } = require('json2csv');
const app = express();
const port = 3000;

// 中介軟體
app.use(express.json());
// 注意：React 版本通過 Vite 提供前端，不需要靜態檔案服務

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
            studentId: user.studentId // 添加 studentId
        }
    });
});

// 注意：HTML 頁面路由已移除，React 版本通過 Vite 開發伺服器提供前端
// 此伺服器僅提供 API 端點

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
            // 確保 projectId 是數字類型
            const projectId = parseInt(req.body.projectId);
            const result = studentService.addPreference(req.params.id, projectId);
            res.json(result);
        } catch (error) {
            console.error('❌ 添加偏好錯誤:', error);
            res.json({ success: false, message: 'Failed to add preference' });
        }
    });

    app.delete('/api/student/:id/preferences/:projectId', (req, res) => {
        console.log('➖ 移除偏好:', { studentId: req.params.id, projectId: req.params.projectId });
        try {
            // 確保 projectId 是數字類型
            const projectId = parseInt(req.params.projectId);
            const result = studentService.removePreference(req.params.id, projectId);
            res.json(result);
        } catch (error) {
            console.error('❌ 移除偏好錯誤:', error);
            res.json({ success: false, message: 'Failed to remove preference' });
        }
    });

    app.put('/api/student/:id/preferences/:projectId/move', (req, res) => {
        console.log('🔄 移動偏好:', { studentId: req.params.id, projectId: req.params.projectId, direction: req.body.direction });
        try {
            // 確保 projectId 是數字類型
            const projectId = parseInt(req.params.projectId);
            const { direction } = req.body;
            const result = studentService.movePreference(req.params.id, projectId, direction);
            res.json(result);
        } catch (error) {
            console.error('❌ 移動偏好錯誤:', error);
            res.json({ success: false, message: 'Failed to move preference' });
        }
    });

    app.put('/api/student/:id/preferences/reorder', (req, res) => {
        console.log('🔄 重新排序偏好:', { studentId: req.params.id, order: req.body.order });
        try {
            const { order } = req.body;
            // 確保所有 ID 都是數字類型
            const numericOrder = order.map(id => typeof id === 'number' ? id : parseInt(id));
            const result = studentService.reorderPreferences(req.params.id, numericOrder);
            res.json(result);
        } catch (error) {
            console.error('❌ 重新排序偏好錯誤:', error);
            res.json({ success: false, message: 'Failed to reorder preferences' });
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

    // 匯出 API
    app.get('/api/export/matching-results', (req, res) => {
        console.log('📊 導出配對結果');
        try {
            const matchingResults = studentService.getMatchingResults();
            const csvData = matchingResults.map(result => ({
                'Project ID': result.projectId,
                'Project Title': result.title,
                'Supervisor': result.supervisor,
                'Student ID': result.studentId || 'Unassigned',
                'Student Name': result.studentName || 'Unassigned',
                'Student GPA': result.studentGpa || 'N/A',
                'Match Rank': result.matchRank || 'N/A'
            }));

            const parser = new Parser();
            const csv = parser.parse(csvData);

            res.header('Content-Type', 'text/csv');
            res.attachment('matching_results.csv');
            res.send(csv);
        } catch (error) {
            console.error('❌ 導出配對結果錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to export matching results' });
        }
    });

    app.get('/api/export/student-list', (req, res) => {
        console.log('👥 導出學生清單');
        try {
            const students = studentService.getAllStudents();
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
            console.error('❌ 導出學生清單錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to export student list' });
        }
    });

    app.get('/api/export/project-list', (req, res) => {
        console.log('📋 導出項目清單');
        try {
            const projects = studentService.getAvailableProjects();
            const csvData = projects.map(project => ({
                'Project ID': project.id,
                'Title': project.title,
                'Supervisor': project.supervisor,
                'Description': project.description,
                'Skills Required': Array.isArray(project.skills) ? project.skills.join(', ') : project.skills,
                'Capacity': project.capacity,
                'Popularity': project.popularity,
                'Status': project.status,
                'Created Date': project.createdAt
            }));

            const parser = new Parser();
            const csv = parser.parse(csvData);

            res.header('Content-Type', 'text/csv');
            res.attachment('project_list.csv');
            res.send(csv);
        } catch (error) {
            console.error('❌ 導出項目清單錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to export project list' });
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
        console.log(`🚀 API 伺服器運行在 http://localhost:${port}`);
        console.log(`📡 提供 API 端點:`);
        console.log(`   POST /login - 登入驗證`);
        console.log(`   GET  /api/student/projects - 獲取項目列表`);
        console.log(`   GET  /api/student/:id - 獲取學生信息`);
        console.log(`   GET  /api/student/:id/preferences - 獲取學生偏好`);
        console.log(`   更多 API 端點請查看 server.js`);
        console.log(`\n💡 React 前端運行在 http://localhost:5173 (通過 Vite)`);
        console.log(`\n🔑 測試帳號:`);
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