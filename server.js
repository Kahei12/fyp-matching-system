const express = require('express');
const bcrypt = require('bcryptjs');
const { Parser } = require('json2csv');
const app = express();
const port = 3000;

// 中介軟體
app.use(express.json());

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

    console.log('🔄 正在連接 MongoDB Atlas...');

    mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB 連接成功');
    });

    mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB 連接錯誤:', err.message.split('\n')[0]);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB 連接已斷開');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB 已重新連接');
    });

    mongoose.connect(process.env.MONGO_URI, mongooseOptions)
        .then(() => console.log('✅ Connected to MongoDB'))
        .catch(err => {
            console.error('❌ MongoDB connection error:', err.message.split('\n')[0]);
            console.log('⚠️ 將使用模擬數據運行...');
        });
} else {
    console.log('⚠️ MONGO_URI not set — running with mockData only');
}
const fs = require('fs');
const Project = require('./models/Project');
const mockData = require('./services/mockData');

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
    
    // 首先檢查本地 users 數組
    let user = users.find(u => u.email === email);
    
    // 如果本地沒有找到，且是學生 email 格式，檢查 MongoDB
    if (!user && email.includes('@hkmu.edu.hk')) {
        try {
            const mongoose = require('mongoose');
            const isDbConnected = mongoose.connection.readyState === 1;
            
            if (isDbConnected) {
                const Student = require('./models/Student');
                const student = await Student.findOne({ email: email }).lean().exec();
                
                if (student) {
                    // 從 MongoDB 找到學生，構造 user 對象
                    // 注意：密碼在創建時已經 hashed，所以我們需要用 bcrypt 驗證
                    // 但我們需要先確保密碼是 hashed 後存儲的
                    // 由於新創建的學生密碼是 plain text 或已 hashed，讓我們檢查
                    
                    // 檢查是否是 bcrypt hash 格式
                    if (student.password && student.password.startsWith('$2')) {
                        // 密碼已經是 hashed，用 bcrypt 驗證
                        const isMatch = await bcrypt.compare(password, student.password);
                        if (isMatch) {
                            user = {
                                email: student.email,
                                role: 'student',
                                name: student.name,
                                studentId: student.id,
                                gpa: student.gpa,
                                major: student.major
                            };
                        }
                    } else if (student.password === password) {
                        // 密碼是 plain text（新創建的學生密碼是 plain text）
                        user = {
                            email: student.email,
                            role: 'student',
                            name: student.name,
                            studentId: student.id,
                            gpa: student.gpa,
                            major: student.major
                        };
                    }
                }
            }
        } catch (err) {
            console.error('❌ 檢查 MongoDB 學生錯誤:', err);
        }
    }
    
    // 如果本地找到用戶
    if (user) {
        // 如果是本地用戶（admin/teacher），需要 bcrypt 驗證密碼
        if (users.find(u => u.email === email)) {
            const localUser = users.find(u => u.email === email);
            const isMatch = await bcrypt.compare(password, localUser.password);
            if (!isMatch) {
                console.log('❌ 密碼錯誤');
                return res.json({ success: false, message: 'Email or password is incorrect' });
            }
        }
        
        // 登入成功
        console.log('✅ 登入成功，用戶角色:', user.role);
        return res.json({ 
            success: true, 
            message: `Login successful! Welcome, ${user.role}.`,
            user: { 
                email: user.email, 
                role: user.role,
                name: user.name,
                studentId: user.studentId,
                gpa: user.gpa,
                major: user.major
            }
        });
    }
    
    console.log('❌ 用戶不存在');
    return res.json({ success: false, message: 'Email or password is incorrect' });
});

// 注意：HTML 頁面路由已移除，React 版本通過 Vite 開發伺服器提供前端
// 此伺服器僅提供 API 端點

// 🔥 引入服務層 - 放在路由之前
try {
    const studentService = require('./services/studentService');
    
    // 從 studentService 獲取 dbEnabled 狀態
    let dbEnabled = false;
    let ProjectModel = null;
    let StudentModel = null;
    
    // 嘗試獲取模型
    try {
        ProjectModel = require('./models/Project');
        StudentModel = require('./models/Student');
        // 檢查數據庫連接狀態
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
            dbEnabled = true;
            console.log('✅ Teacher API: MongoDB 已連接，啟用數據庫模式');
        }
    } catch (e) {
        console.log('⚠️ Teacher API: 模型加載失敗');
    }
    
    // 📊 Student API 路由
    app.get('/api/student/projects', async (req, res) => {
        console.log('📋 請求項目列表');
        try {
            const projects = await studentService.getAvailableProjects();
            res.json({ success: true, projects });
        } catch (error) {
            console.error('❌ 獲取項目錯誤:', error);
            res.json({ success: false, message: 'Failed to load projects' });
        }
    });

    app.get('/api/student/:id', async (req, res) => {
        console.log('👤 請求學生信息:', req.params.id);
        try {
            const student = await studentService.getStudent(req.params.id);
            if (!student) {
                return res.json({ success: false, message: 'Student not found' });
            }
            res.json({ success: true, student });
        } catch (error) {
            console.error('❌ 獲取學生信息錯誤:', error);
            res.json({ success: false, message: 'Failed to load student info' });
        }
    });

    app.get('/api/student/:id/preferences', async (req, res) => {
        console.log('⭐ 請求學生偏好:', req.params.id);
        try {
            const preferences = await studentService.getStudentPreferences(req.params.id);
            res.json({ success: true, preferences });
        } catch (error) {
            console.error('❌ 獲取偏好錯誤:', error);
            res.json({ success: false, message: 'Failed to load preferences' });
        }
    });

    app.post('/api/student/:id/preferences', async (req, res) => {
        console.log('➕ 添加偏好:', { studentId: req.params.id, projectId: req.body.projectId });
        try {
            const projectId = req.body.projectId;
            const result = await studentService.addPreference(req.params.id, projectId);
            res.json(result);
        } catch (error) {
            console.error('❌ 添加偏好錯誤:', error);
            res.json({ success: false, message: 'Failed to add preference' });
        }
    });

    // 設定整個 preferences（由學生 Submit 發起）
    app.post('/api/student/:id/preferences/set', async (req, res) => {
        console.log('🔧 設定偏好 (set):', { studentId: req.params.id, body: req.body });
        try {
            // Accept either { preferences: [..] } or single { projectId: x } for convenience
            let prefs = req.body && req.body.preferences;
            if ((!Array.isArray(prefs) || prefs.length === 0) && req.body && req.body.projectId) {
                prefs = [req.body.projectId];
            }
            const result = await studentService.setPreferences(req.params.id, prefs || []);
            res.json(result);
        } catch (error) {
            console.error('❌ 設定偏好錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to set preferences' });
        }
    });
    
    // Clear student's preferences on server (used when submitted)
    app.delete('/api/student/:id/preferences/clear', async (req, res) => {
        console.log('🧹 清除學生偏好 (server clear):', req.params.id);
        try {
            const student = await studentService.getStudent(req.params.id);
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            // clear preferences using service
            const result = await studentService.setPreferences(req.params.id, []);
            res.json(result || { success: true, message: 'Preferences cleared' });
        } catch (error) {
            console.error('❌ 清除偏好錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to clear preferences' });
        }
    });

    app.delete('/api/student/:id/preferences/:projectId', async (req, res) => {
        console.log('➖ 移除偏好:', { studentId: req.params.id, projectId: req.params.projectId });
        try {
            const projectId = req.params.projectId;
            const result = await studentService.removePreference(req.params.id, projectId);
            res.json(result);
        } catch (error) {
            console.error('❌ 移除偏好錯誤:', error);
            res.json({ success: false, message: 'Failed to remove preference' });
        }
    });

    app.put('/api/student/:id/preferences/:projectId/move', async (req, res) => {
        console.log('🔄 移動偏好:', { studentId: req.params.id, projectId: req.params.projectId, direction: req.body.direction });
        try {
            const projectId = req.params.projectId;
            const { direction } = req.body;
            const result = await studentService.movePreference(req.params.id, projectId, direction);
            res.json(result);
        } catch (error) {
            console.error('❌ 移動偏好錯誤:', error);
            res.json({ success: false, message: 'Failed to move preference' });
        }
    });

    app.put('/api/student/:id/preferences/reorder', async (req, res) => {
        console.log('🔄 重新排序偏好:', { studentId: req.params.id, order: req.body.order });
        try {
            const { order } = req.body;
            // pass order through (studentService will normalize types)
            const result = await studentService.reorderPreferences(req.params.id, order);
            res.json(result);
        } catch (error) {
            console.error('❌ 重新排序偏好錯誤:', error);
            res.json({ success: false, message: 'Failed to reorder preferences' });
        }
    });

    app.post('/api/student/:id/preferences/submit', async (req, res) => {
        console.log('📤 提交偏好:', req.params.id);
        try {
            const result = await studentService.submitPreferences(req.params.id);
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
    app.get('/api/export/matching-results', async (req, res) => {
        console.log('📊 導出配對結果');
        try {
            const matchingResults = await studentService.getMatchingResults();
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

    app.get('/api/export/student-list', async (req, res) => {
        console.log('👥 導出學生清單');
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
            console.error('❌ 導出學生清單錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to export student list' });
        }
    });

    app.get('/api/export/project-list', async (req, res) => {
        console.log('📋 導出項目清單');
        try {
            const projects = await studentService.getAvailableProjects();
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
        console.log('▶️ 執行配對 (runMatching)');
        try {
            const result = await studentService.runMatching();
            res.json(result);
        } catch (error) {
            console.error('❌ 執行配對錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to run matching' });
        }
    });

    app.get('/api/match/results', async (req, res) => {
        console.log('📄 取得配對結果 (getMatchingResults)');
        try {
            const result = await studentService.getMatchingResults();
            // result 可能是 { results, matchingCompleted } 或只是 results 數組
            if (result && typeof result === 'object' && 'results' in result) {
                res.json({ 
                    success: true, 
                    matchingCompleted: result.matchingCompleted || false, 
                    results: result.results || [] 
                });
            } else {
                // 兼容舊格式
                const results = Array.isArray(result) ? result : [];
                const matchingCompleted = results.some(r => r.studentId !== null);
                res.json({ success: true, matchingCompleted, results });
            }
        } catch (error) {
            console.error('❌ 獲取配對結果錯誤:', error);
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
        console.log('📝 學生提交提議', req.body);
        try {
            const { studentId, title, description, skills } = req.body;
            
            console.log('📝 Received - title:', title, 'description:', description, 'skills:', skills);
            
            if (!studentId || !title || !description) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }
            
            // Check DB connection on each request
            const isDbConnected = checkDbConnection();
            const Project = require('./models/Project');
            const Student = require('./models/Student');
            
            if (isDbConnected && Project && Student) {
                // 獲取學生信息
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
                    department: student.major || 'Computer Science',
                    status: 'Under Review',              // 等待老師審批
                    proposalStatus: 'pending',
                    popularity: 0,
                    proposedBy: studentId,             // 學生ID
                    proposedByName: student.name,       // 學生名字
                    proposedByEmail: student.email,     // 學生email
                    teacherReviews: [],                 // 老師審批記錄
                    createdAt: new Date()
                });
                
                await newProject.save();
                console.log('✅ Student proposal saved:', newProject);
                
                // Update student's proposal status
                student.proposalSubmitted = true;
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
            
            // Mock mode fallback - 當數據庫未連接時
            console.log('⚠️ Database not connected - Mock mode for student proposal');
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
            console.error('❌ 提交提議錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to submit proposal: ' + error.message });
        }
    });

    // Get student's proposal status
    app.get('/api/student/:studentId/proposal', async (req, res) => {
        console.log('📋 獲取學生提議狀態');
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
            console.error('❌ 獲取提議錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to get proposal' });
        }
    });

    // Get all proposals (for Teacher/Admin)
    app.get('/api/proposals/all', async (req, res) => {
        console.log('📋 獲取所有學生提議');
        try {
            const isDbConnected = checkDbConnection();
            const Project = require('./models/Project');
            const Student = require('./models/Student');
            
            if (isDbConnected && Project && Student) {
                // 使用新的 type: 'student' 字段
                const proposals = await Project.find({ type: 'student' }).lean().exec();
                
                // Enrich with student info
                const enrichedProposals = await Promise.all(proposals.map(async (proposal) => {
                    const student = await Student.findOne({ proposedProject: proposal._id }).exec();
                    
                    // 計算顯示狀態
                    // 只有當所有老師都reject了，或者deadline過了，才顯示rejected
                    // 否則顯示pending
                    let displayStatus = proposal.proposalStatus;
                    if (displayStatus === 'rejected') {
                        // 檢查是否所有老師都reject了
                        const hasAnyApproval = proposal.teacherReviews?.some(r => r.decision === 'approve');
                        if (!hasAnyApproval) {
                            // 所有老師都沒有approve，檢查是否deadline過了
                            // 這裡我們假設 deadline logic 會在之後實裝
                            // 目前只要有reject記錄就顯示rejected
                        }
                    }
                    
                    return {
                        ...proposal,
                        studentId: student?.id || proposal.proposedBy,
                        studentName: student?.name || proposal.proposedByName || 'Unknown',
                        studentEmail: student?.email || proposal.proposedByEmail || '',
                        studentGpa: student?.gpa || 0,
                        studentMajor: student?.major || '',
                        displayStatus: displayStatus // 前端使用的顯示狀態
                    };
                }));
                
                return res.json({ success: true, proposals: enrichedProposals });
            }
            
            // Mock mode
            res.json({ success: true, proposals: mockData.projects.filter(p => p.type === 'student') });
        } catch (error) {
            console.error('❌ 獲取所有提議錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to get proposals' });
        }
    });
    
    // Get proposals for specific teacher
    // 返回所有 student-proposed 項目，包括未審核的
    // 老師可以approve/reject 尚未被任何老師審核的項目
    app.get('/api/teacher/student-proposals', async (req, res) => {
        console.log('📋 獲取老師的學生提議（包含未審核）');
        try {
            const teacherEmail = req.query.email || req.headers['x-teacher-email'];
            const teacherEmailLower = teacherEmail?.toLowerCase();
            const isDbConnected = checkDbConnection();
            const Project = require('./models/Project');
            const Student = require('./models/Student');
            
            if (isDbConnected && Project && Student) {
                // 獲取所有 student-proposed 項目
                const proposals = await Project.find({ type: 'student' }).lean().exec();
                
                // 過濾邏輯：
                // - 返回所有未經過該老師審核的項目
                // - 已經被其他老師 approve 的項目不顯示
                const filteredProposals = proposals.filter(p => {
                    // 檢查是否已被其他老師 approve
                    const hasOtherApproval = p.teacherReviews?.some(r => 
                        r.decision === 'approve' && r.teacherEmail?.toLowerCase() !== teacherEmailLower
                    );
                    if (hasOtherApproval) {
                        return false;
                    }
                    return true;
                });
                
                const enrichedProposals = await Promise.all(filteredProposals.map(async (proposal) => {
                    const reviews = proposal.teacherReviews || [];
                    const myReview = reviews.find(r => r.teacherEmail?.toLowerCase() === teacherEmailLower);
                    
                    // 獲取提出這個 proposal 的學生
                    const student = await Student.findOne({ proposedProject: proposal._id }).exec();
                    
                    // 檢查是否有其他老師的 approve
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
                
                console.log('📋 老師的 student proposals (含未審核):', enrichedProposals.length);
                return res.json({ success: true, proposals: enrichedProposals });
            }
            
            // Mock mode
            const mockProposals = mockData.projects.filter(p => 
                p.type === 'student' && p.supervisorEmail === teacherEmail
            );
            res.json({ success: true, proposals: mockProposals });
        } catch (error) {
            console.error('❌ 獲取老師的學生提議錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to get teacher proposals' });
        }
    });

    // Approve/Reject proposal
    app.put('/api/proposals/:proposalId/status', async (req, res) => {
        console.log('✏️ 更新提議狀態');
        try {
            const { proposalId } = req.params;
            const { status, supervisorEmail, supervisorName, teacherId } = req.body; 
            
            if (!status) {
                return res.status(400).json({ success: false, message: 'Status required' });
            }
            
            const isDbConnected = checkDbConnection();
            const Project = require('./models/Project');
            const Student = require('./models/Student');
            
            if (isDbConnected && Project && Student) {
                const project = await Project.findById(proposalId).exec();
                if (!project) {
                    return res.status(404).json({ success: false, message: 'Proposal not found' });
                }
                
                // 初始化 teacherReviews 數組
                if (!project.teacherReviews) {
                    project.teacherReviews = [];
                }
                
                // 找到或創建當前老師的review記錄
                let reviewIndex = project.teacherReviews.findIndex(r => r.teacherEmail === teacherId || r.teacherEmail === supervisorEmail);
                const reviewRecord = {
                    teacherEmail: teacherId || supervisorEmail,
                    teacherName: supervisorName || supervisorEmail?.split('@')[0] || 'Teacher',
                    decision: status,
                    reviewedAt: new Date()
                };
                
                if (reviewIndex >= 0) {
                    project.teacherReviews[reviewIndex] = reviewRecord;
                } else {
                    project.teacherReviews.push(reviewRecord);
                }
                
                // 根據decision更新項目狀態
                if (status === 'approve') {
                    project.status = 'Approved';
                    project.supervisorEmail = teacherId || supervisorEmail;
                    project.supervisor = supervisorName || supervisorEmail?.split('@')[0] || 'Assigned';
                    project.proposalStatus = 'approved';
                } else {
                    // reject: 檢查是否所有老師都reject了
                    // 如果有至少一個approve，整體是approved
                    const hasApproval = project.teacherReviews.some(r => r.decision === 'approve');
                    if (!hasApproval) {
                        project.proposalStatus = 'rejected';
                    }
                }
                
                await project.save();
                
                // Update student's proposal status
                const student = await Student.findOne({ proposedProject: proposalId }).exec();
                if (student) {
                    student.proposalStatus = project.proposalStatus;
                    if (project.proposalStatus === 'approved') {
                        student.proposalApproved = true;
                        student.assignedProject = project._id; // Auto-assign!
                    } else {
                        student.proposalApproved = false;
                    }
                    await student.save();
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
            console.error('❌ 更新提議狀態錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to update proposal status' });
        }
    });

    // Check if student is already assigned (either through proposal approval or matching)
    app.get('/api/student/:studentId/assignment-status', async (req, res) => {
        console.log('📋 檢查學生分配狀態');
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
            console.error('❌ 檢查分配狀態錯誤:', error);
            res.json({ success: true, isAssigned: false, assignmentType: null });
        }
    });

    // ============================================
    // Teacher API Endpoints
    // ============================================

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
    // 包括：老師自己創建的 teacher-proposed 項目 + 老師approve的 student-proposed 項目
    app.get('/api/teacher/projects', async (req, res) => {
        console.log('📋 請求導師項目列表');
        try {
            const teacherEmail = req.query.email || req.headers['x-teacher-email'];
            if (!teacherEmail) {
                return res.status(400).json({ success: false, message: 'Teacher email required' });
            }
            
            console.log('📧 教師郵箱:', teacherEmail);
            
            const isDbConnected = teacherCheckDbConnection();
            const Project = require('./models/Project');
            
            if (isDbConnected && Project) {
                const teacherEmailLower = teacherEmail.toLowerCase();
                
                // 特殊映射：測試帳號 teacher@hkmu.edu.hk 等同於 Dr. Bell Liu
                const SPECIAL_TEACHER_MAP = {
                    'teacher@hkmu.edu.hk': { name: 'Dr. Bell Liu', extract: 'bell liu' }
                };
                
                // 從 email 提取老師名字
                // e.g., "teacherBellLiu@hkmu.edu.hk" -> "Bell Liu"
                const extractNameFromEmail = (email) => {
                    // 檢查特殊映射
                    if (SPECIAL_TEACHER_MAP[email.toLowerCase()]) {
                        return SPECIAL_TEACHER_MAP[email.toLowerCase()].extract;
                    }
                    const userPart = email.split('@')[0]; // "teacherBellLiu"
                    // 移除前綴 "teacher" 或 "Teacher"
                    let name = userPart.replace(/^teacher(s?)/i, '');
                    // 在每個大寫字母前加空格，分割成單詞
                    name = name.replace(/([A-Z])/g, ' $1').trim();
                    // 如果只有一個詞，保持原樣
                    return name || userPart;
                };
                const teacherName = extractNameFromEmail(teacherEmail);
                console.log('👤 提取的老師名:', teacherName);
                
                // 先獲取所有文檔
                const allDocs = await Project.find({}).lean().exec();
                console.log('📋 總文檔數:', allDocs.length);
                allDocs.forEach(doc => {
                    console.log('  📄 ', doc.title, '| type:', doc.type, '| supervisor:', doc.supervisor, '| email:', doc.supervisorEmail);
                });
                
                // 過濾條件（只用於 "My Projects"）：
                // 必須是 teacher-proposed 項目
                // type === 'student' 的項目屬於 "Student Proposals"，不應顯示在 "My Projects"
                // 
                // 規則：
                // - type === 'student' → 排除（這些屬於 "Student Proposals"）
                // - type === undefined/null/'' → 視為 teacher-proposed（舊數據兼容）
                // - type === 'teacher' → 包含
                const projects = allDocs.filter(doc => {
                    // 明確排除 student-proposed 項目
                    if (doc.type === 'student') {
                        console.log('  🚫 排除 student-proposed:', doc.title);
                        return false;
                    }
                    
                    // 匹配 supervisorEmail 精確匹配
                    if (doc.supervisorEmail && doc.supervisorEmail.toLowerCase() === teacherEmailLower) {
                        return true;
                    }
                    
                    // 匹配 supervisor 名字
                    if (doc.supervisor && doc.supervisor !== 'TBD') {
                        const supLower = doc.supervisor.toLowerCase();
                        const teacherLower = teacherName.toLowerCase();
                        
                        // 特殊映射處理：teacher@hkmu.edu.hk <-> Dr. Bell Liu
                        if (SPECIAL_TEACHER_MAP[teacherEmailLower]) {
                            const mappedName = SPECIAL_TEACHER_MAP[teacherEmailLower].name.toLowerCase();
                            // "dr. bell liu" 包含 "bell" 或 "liu"
                            if (supLower.includes('bell') || supLower.includes('liu') || 
                                mappedName.includes(supLower) || supLower.includes(mappedName.split(' ')[0])) {
                                return true;
                            }
                        }
                        
                        // supervisor 包含老師名字
                        if (teacherLower && (supLower.includes(teacherLower) || teacherLower.includes(supLower))) return true;
                        
                        // 老師名字包含 supervisor 第一個詞
                        const supFirstWord = supLower.split(' ')[0];
                        if (teacherLower && teacherLower.includes(supFirstWord)) return true;
                    }
                    
                    return false;
                });
                
                console.log('✅ 過濾後返回項目數:', projects.length);
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
            }
            
            // Fallback to mock data
            const mockProjects = mockData.projects.filter(p => 
                (p.type === 'teacher' && p.supervisorEmail === teacherEmail) ||
                (p.type === 'student' && p.supervisorEmail === teacherEmail && p.proposalStatus === 'approved')
            );
            res.json({ success: true, projects: mockProjects });
        } catch (error) {
            console.error('❌ 獲取導師項目錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to load teacher projects' });
        }
    });

    // Get students who applied to teacher's projects
    app.get('/api/teacher/students', async (req, res) => {
        console.log('👥 請求導師項目的學生列表');
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
            console.error('❌ 獲取學生列表錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to load student applications' });
        }
    });

    // Get teacher's supervision list (assigned students after matching)
    app.get('/api/teacher/supervision', async (req, res) => {
        console.log('📝 請求導師監督列表');
        try {
            const teacherEmail = req.query.email || req.headers['x-teacher-email'];
            if (!teacherEmail) {
                return res.status(400).json({ success: false, message: 'Teacher email required' });
            }
            
            if (dbEnabled && ProjectModel && StudentModel) {
                // Get teacher's projects
                const teacherProjects = await ProjectModel.find({ supervisorEmail: teacherEmail }).lean().exec();
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
                        assignedAt: s.updatedAt
                    };
                });
                
                return res.json({ success: true, supervisionList });
            }
            
            res.json({ success: true, supervisionList: [] });
        } catch (error) {
            console.error('❌ 獲取監督列表錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to load supervision list' });
        }
    });

    // Create new project (teacher-proposed)
    app.post('/api/teacher/projects', async (req, res) => {
        console.log('➕ 導師創建項目');
        try {
            const teacherEmail = req.body.teacherEmail || req.headers['x-teacher-email'];
            if (!teacherEmail) {
                return res.status(400).json({ success: false, message: 'Teacher email required' });
            }
            
            const { title, description, skills, capacity, department, category } = req.body;
            
            const isDbConnected = teacherCheckDbConnection();
            const Project = require('./models/Project');
            
            if (isDbConnected && Project) {
                // Generate project code
                const projectCode = `T${Date.now().toString().slice(-6)}`;
                
                const newProject = new Project({
                    code: projectCode,
                    title,
                    description,
                    skills: skills || [],
                    capacity: capacity || 2,
                    type: 'teacher',                           // Mark as teacher-proposed
                    supervisor: teacherEmail.split('@')[0],
                    supervisorEmail: teacherEmail,
                    department: department || 'Computer Science',
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
            console.error('❌ 創建項目錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to create project' });
        }
    });

    // Update project
    app.put('/api/teacher/projects/:projectId', async (req, res) => {
        console.log('✏️ 導師更新項目', req.params.projectId);
        try {
            const { projectId } = req.params;
            const teacherEmail = req.body.teacherEmail || req.headers['x-teacher-email'];
            const { title, description, skills, capacity, status } = req.body;
            
            console.log('📝 Update request - projectId:', projectId, 'teacherEmail:', teacherEmail);
            
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
                    console.log('❌ Project not found:', projectId);
                    return res.status(404).json({ success: false, message: 'Project not found: ' + projectId });
                }
                
                console.log('✅ Found project:', project.title, 'supervisorEmail:', project.supervisorEmail);
                
                // Update the project
                if (title) project.title = title;
                if (description) project.description = description;
                if (skills) project.skills = skills;
                if (capacity) project.capacity = capacity;
                if (status) project.status = status;
                
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
            console.error('❌ 更新項目錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to update project: ' + error.message });
        }
    });

    // Delete project
    app.delete('/api/teacher/projects/:projectId', async (req, res) => {
        console.log('🗑️ 導師刪除項目', req.params.projectId);
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
            console.error('❌ 刪除項目錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to delete project: ' + error.message });
        }
    });

    // Add note to student
    app.post('/api/teacher/students/:studentId/note', async (req, res) => {
        console.log('📝 導師添加學生備註');
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
            console.error('❌ 添加備註錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to add note' });
        }
    });

    // Get matching results for teacher
    app.get('/api/teacher/matching-results', async (req, res) => {
        console.log('📊 請求導師配對結果');
        try {
            const teacherEmail = req.query.email || req.headers['x-teacher-email'];
            if (!teacherEmail) {
                return res.status(400).json({ success: false, message: 'Teacher email required' });
            }
            
            if (dbEnabled && ProjectModel && StudentModel) {
                // Get teacher's projects
                const teacherProjects = await ProjectModel.find({ supervisorEmail: teacherEmail }).lean().exec();
                const projectIds = teacherProjects.map(p => String(p._id));
                
                // Get assigned students
                const assignedStudents = await StudentModel.find({ 
                    assignedProject: { $in: projectIds }
                }).lean().exec();
                
                const results = teacherProjects.map(project => {
                    const assigned = assignedStudents.find(s => String(s.assignedProject) === String(project._id));
                    return {
                        projectId: String(project._id),
                        projectCode: project.code,
                        projectTitle: project.title,
                        capacity: project.capacity || 1,
                        assignedStudent: assigned ? {
                            id: assigned.id,
                            name: assigned.name,
                            email: assigned.email,
                            gpa: assigned.gpa,
                            major: assigned.major
                        } : null,
                        status: assigned ? 'Matched' : 'Available'
                    };
                });
                
                return res.json({ success: true, results });
            }
            
            res.json({ success: true, results: [] });
        } catch (error) {
            console.error('❌ 獲取配對結果錯誤:', error);
            res.status(500).json({ success: false, message: 'Failed to load matching results' });
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

// ============================================
// Admin: Student Account Management API
// ============================================

// Helper function to check database connection
const checkDbConnectionForAdmin = () => {
    try {
        const mongoose = require('mongoose');
        return mongoose.connection.readyState === 1;
    } catch (e) {
        return false;
    }
};

// Create student account (admin only)
app.post('/api/admin/students/create', async (req, res) => {
    console.log('👤 Admin 創建學生帳戶:', req.body);
    try {
        const { studentId, password, name, major } = req.body;
        
        // Validation
        if (!studentId || !password || !name || !major) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required: studentId, password, name, major' 
            });
        }
        
        // Validate studentId: 8 digits
        if (!/^\d{8}$/.test(studentId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Student ID must be exactly 8 digits' 
            });
        }
        
        // Validate password: at least 8 characters
        if (password.length < 8) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 8 characters' 
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
            
            // Hash password for security
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Create new student
            const newStudent = new Student({
                id: studentId,
                name: name,
                email: email,
                password: hashedPassword, // 存儲 hashed 密碼
                gpa: 0, // Default GPA
                major: major,
                year: 'Year 4', // 預設為 Year 4
                preferences: [],
                proposalSubmitted: false,
                assignedProject: null,
                proposedProject: null,
                proposalApproved: false,
                proposalStatus: 'none'
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
                    password: password
                }
            });
        }
        
        // If no database, return mock success for testing
        const email = studentId.substring(0, 7) + '@hkmu.edu.hk';
        console.log('⚠️ Database not connected - mock success response');
        console.log('   Student ID:', studentId);
        console.log('   Email:', email);
        console.log('   Name:', name);
        console.log('   Major:', major);
        
        return res.json({ 
            success: true, 
            message: 'Student account created successfully! (Mock mode - no database)',
            student: {
                id: studentId,
                name: name,
                email: email,
                major: major,
                year: 'Year 4'
            },
            loginCredentials: {
                email: email,
                password: password
            }
        });
        
    } catch (error) {
        console.error('❌ 創建學生帳戶錯誤:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to create student account: ' + error.message 
        });
    }
});

// Batch create student accounts (admin only)
app.post('/api/admin/students/batch-create', async (req, res) => {
    console.log('👥 Admin 批量創建學生帳戶:', req.body);
    try {
        const { students } = req.body;

        if (!students || !Array.isArray(students) || students.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Students array is required'
            });
        }

        const isDbConnected = checkDbConnectionForAdmin();
        const Student = require('./models/Student');
        const results = [];

        for (const studentData of students) {
            const { studentId, password, name, major } = studentData;

            try {
                // Validation
                if (!studentId || !password || !name || !major) {
                    results.push({
                        studentId,
                        name,
                        success: false,
                        message: 'All fields are required'
                    });
                    continue;
                }

                // Validate studentId: 8 digits
                if (!/^\d{8}$/.test(studentId)) {
                    results.push({
                        studentId,
                        name,
                        success: false,
                        message: 'Student ID must be exactly 8 digits'
                    });
                    continue;
                }

                // Validate password: at least 8 characters
                if (password.length < 8) {
                    results.push({
                        studentId,
                        name,
                        success: false,
                        message: 'Password must be at least 8 characters'
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

                    // Generate email: first 7 digits + @hkmu.edu.hk
                    const email = studentId.substring(0, 7) + '@hkmu.edu.hk';

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

                    // Hash password for security
                    const hashedPassword = await bcrypt.hash(password, 10);

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
                        proposalStatus: 'none'
                    });

                    await newStudent.save();

                    console.log('✅ Student account created:', {
                        id: studentId,
                        name: name,
                        email: email,
                        major: major
                    });

                    results.push({
                        studentId,
                        name,
                        email,
                        major,
                        success: true,
                        message: 'Account created successfully'
                    });
                } else {
                    // Mock mode
                    const email = studentId.substring(0, 7) + '@hkmu.edu.hk';
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
        console.error('❌ 批量創建學生帳戶錯誤:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to batch create student accounts: ' + error.message
        });
    }
});

// Batch create teacher accounts
app.post('/api/admin/teachers/batch-create', async (req, res) => {
    console.log('👨‍🏫 Admin 批量創建教師帳戶:', req.body);
    try {
        const { accounts } = req.body;

        if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Accounts array is required'
            });
        }

        const isDbConnected = checkDbConnectionForAdmin();
        const Teacher = require('./models/Teacher');
        const results = [];

        for (const teacherData of accounts) {
            const { name, email, password } = teacherData;

            try {
                // Validation
                if (!name || !email || !password) {
                    results.push({
                        name,
                        email,
                        success: false,
                        message: 'All fields are required'
                    });
                    continue;
                }

                // Validate email format
                if (!/^[\w.-]+@hkmu\.edu\.hk$/.test(email)) {
                    results.push({
                        name,
                        email,
                        success: false,
                        message: 'Invalid email format. Must be @hkmu.edu.hk'
                    });
                    continue;
                }

                // Validate password: at least 8 characters
                if (password.length < 8) {
                    results.push({
                        name,
                        email,
                        success: false,
                        message: 'Password must be at least 8 characters'
                    });
                    continue;
                }

                if (isDbConnected && Teacher) {
                    // Check if teacher already exists by email
                    const existingTeacher = await Teacher.findOne({ email: email }).exec();
                    if (existingTeacher) {
                        results.push({
                            name,
                            email,
                            success: false,
                            message: `Teacher with email ${email} already exists`
                        });
                        continue;
                    }

                    // Hash password for security
                    const hashedPassword = await bcrypt.hash(password, 10);

                    // Create new teacher
                    const newTeacher = new Teacher({
                        email: email,
                        name: name,
                        password: hashedPassword,
                        title: 'Teacher',
                        department: 'FYP',
                        researchInterests: [],
                        maxStudents: 5,
                        currentStudents: 0,
                        projects: [],
                        proposals: []
                    });

                    await newTeacher.save();

                    console.log('✅ Teacher account created:', {
                        name: name,
                        email: email
                    });

                    results.push({
                        name,
                        email,
                        success: true,
                        message: 'Account created successfully'
                    });
                } else {
                    // Mock mode
                    console.log('⚠️ Mock mode - Teacher account:', { name, email });
                    results.push({
                        name,
                        email,
                        success: true,
                        message: 'Account created successfully (Mock mode)'
                    });
                }
            } catch (individualError) {
                console.error('❌ Error creating teacher:', teacherData.name, individualError);
                results.push({
                    name: teacherData.name,
                    email: teacherData.email,
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
        console.error('❌ 批量創建教師帳戶錯誤:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to batch create teacher accounts: ' + error.message
        });
    }
});

// Get all students (admin only)
app.get('/api/admin/students', async (req, res) => {
    console.log('👥 Admin 請求學生列表');
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
                    proposalStatus: s.proposalStatus
                }))
            });
        }
        
        return res.json({ success: true, students: [] });
    } catch (error) {
        console.error('❌ 獲取學生列表錯誤:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to get student list' 
        });
    }
});

// 錯誤處理
process.on('unhandledRejection', (err) => {
    console.error('❌ 未處理的錯誤:', err);
    process.exit(1);
});