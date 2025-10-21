const mockData = require('./mockData');

const studentService = {
    // 獲取所有可用項目
    getAvailableProjects: () => {
        return mockData.projects.filter(project => project.status === "active");
    },
    
    // 獲取學生信息
    getStudent: (studentId) => {
        return mockData.students.find(student => student.id === studentId);
    },
    
    // 獲取學生的偏好列表
    getStudentPreferences: (studentId) => {
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) return [];
        
        return student.preferences.map(projectId => {
            const project = mockData.projects.find(p => p.id === projectId);
            return project ? { ...project, rank: student.preferences.indexOf(projectId) + 1 } : null;
        }).filter(Boolean);
    },
    
    // 添加項目到偏好
    addPreference: (studentId, projectId) => {
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) {
            return { success: false, message: "Student not found" };
        }
        
        // 檢查是否已存在
        if (student.preferences.includes(projectId)) {
            return { success: false, message: "Project already in preferences" };
        }
        
        // 檢查最大數量
        if (student.preferences.length >= 5) {
            return { success: false, message: "Maximum 5 preferences allowed" };
        }
        
        // 檢查項目是否存在
        const project = mockData.projects.find(p => p.id === projectId);
        if (!project) {
            return { success: false, message: "Project not found" };
        }
        
        // 添加到偏好
        student.preferences.push(projectId);
        
        // 更新項目熱度
        project.popularity += 1;
        
        return { 
            success: true, 
            message: "Project added to preferences",
            currentPreferences: student.preferences.length
        };
    },
    
    // 從偏好中移除項目
    removePreference: (studentId, projectId) => {
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) {
            return { success: false, message: "Student not found" };
        }
        
        const index = student.preferences.indexOf(projectId);
        if (index === -1) {
            return { success: false, message: "Project not in preferences" };
        }
        
        // 移除項目
        student.preferences.splice(index, 1);
        
        // 更新項目熱度
        const project = mockData.projects.find(p => p.id === projectId);
        if (project && project.popularity > 0) {
            project.popularity -= 1;
        }
        
        return { 
            success: true, 
            message: "Project removed from preferences",
            currentPreferences: student.preferences.length
        };
    },
    
    // 提交最終偏好
    submitPreferences: (studentId) => {
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) {
            return { success: false, message: "Student not found" };
        }
        
        if (student.preferences.length === 0) {
            return { success: false, message: "No preferences to submit" };
        }
        
        // 在真實系統中，這裡會鎖定偏好不允許修改
        // 現在只是模擬提交成功
        
        return { 
            success: true, 
            message: "Preferences submitted successfully",
            preferencesCount: student.preferences.length,
            submittedAt: new Date().toISOString()
        };
    },
    
    // 獲取系統狀態和截止日期
    getSystemStatus: () => {
        return mockData.system;
    },
    
    // 更新學生個人資料
    updateStudentProfile: (studentId, updates) => {
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) {
            return { success: false, message: "Student not found" };
        }
        
        Object.assign(student, updates);
        return { success: true, message: "Profile updated successfully" };
    }
};

module.exports = studentService;