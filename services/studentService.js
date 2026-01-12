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
        // 確保 projectId 是數字類型
        const numericProjectId = typeof projectId === 'number' ? projectId : parseInt(projectId);
        
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) {
            return { success: false, message: "Student not found" };
        }
        
        // 檢查是否已存在
        if (student.preferences.includes(numericProjectId)) {
            return { success: false, message: "Project already in preferences" };
        }
        
        // 檢查最大數量
        if (student.preferences.length >= 5) {
            return { success: false, message: "Maximum 5 preferences allowed" };
        }
        
        // 檢查項目是否存在
        const project = mockData.projects.find(p => p.id === numericProjectId);
        if (!project) {
            return { success: false, message: "Project not found" };
        }
        
        // 添加到偏好
        student.preferences.push(numericProjectId);
        
        // 更新項目熱度
        project.popularity += 1;
        
        console.log(`✅ 已添加項目 ${numericProjectId} 到學生 ${studentId} 的偏好列表`);
        console.log(`📊 當前偏好:`, student.preferences);
        
        return { 
            success: true, 
            message: "Project added to preferences",
            currentPreferences: student.preferences.length
        };
    },
    
    // 從偏好中移除項目
    removePreference: (studentId, projectId) => {
        // 確保 projectId 是數字類型
        const numericProjectId = typeof projectId === 'number' ? projectId : parseInt(projectId);
        
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) {
            return { success: false, message: "Student not found" };
        }
        
        console.log(`🔍 查找項目 ${numericProjectId} 在偏好列表中:`, student.preferences);
        
        const index = student.preferences.indexOf(numericProjectId);
        if (index === -1) {
            console.log(`❌ 項目 ${numericProjectId} 不在偏好列表中`);
            return { success: false, message: "Project not in preferences" };
        }
        
        // 移除項目
        student.preferences.splice(index, 1);
        
        // 更新項目熱度
        const project = mockData.projects.find(p => p.id === numericProjectId);
        if (project && project.popularity > 0) {
            project.popularity -= 1;
        }
        
        console.log(`✅ 已移除項目 ${numericProjectId}，剩餘偏好:`, student.preferences);
        
        return { 
            success: true, 
            message: "Project removed from preferences",
            currentPreferences: student.preferences.length
        };
    },
    
    // Move preference position
    movePreference: (studentId, projectId, direction) => {
        // 確保 projectId 是數字類型
        const numericProjectId = typeof projectId === 'number' ? projectId : parseInt(projectId);
        
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) {
            return { success: false, message: "Student not found" };
        }
        
        console.log(`🔄 移動項目 ${numericProjectId}，方向: ${direction}，當前偏好:`, student.preferences);
        
        const currentIndex = student.preferences.indexOf(numericProjectId);
        if (currentIndex === -1) {
            console.log(`❌ 項目 ${numericProjectId} 不在偏好列表中`);
            return { success: false, message: "Project not in preferences" };
        }
        
        // Calculate target index
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        // Check boundaries
        if (targetIndex < 0 || targetIndex >= student.preferences.length) {
            return { success: false, message: "Cannot move in that direction" };
        }
        
        // Swap positions
        const temp = student.preferences[currentIndex];
        student.preferences[currentIndex] = student.preferences[targetIndex];
        student.preferences[targetIndex] = temp;
        
        console.log(`✅ 移動成功，新偏好順序:`, student.preferences);
        
        return { 
            success: true, 
            message: "Preference order updated",
            newPosition: targetIndex + 1
        };
    },
    
    // Reorder preferences (用於拖曳排序)
    reorderPreferences: (studentId, newOrder) => {
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) {
            return { success: false, message: "Student not found" };
        }
        
        console.log(`🔄 重新排序偏好，學生: ${studentId}`);
        console.log(`📋 舊順序:`, student.preferences);
        console.log(`📋 新順序:`, newOrder);
        
        // 驗證所有項目 ID 都存在且有效
        const validIds = newOrder.every(id => {
            const numericId = typeof id === 'number' ? id : parseInt(id);
            return student.preferences.includes(numericId);
        });
        
        if (!validIds) {
            console.log(`❌ 新順序包含無效的項目 ID`);
            return { success: false, message: "Invalid project IDs in new order" };
        }
        
        // 驗證數量是否相同
        if (newOrder.length !== student.preferences.length) {
            console.log(`❌ 新順序的項目數量不匹配`);
            return { success: false, message: "Order length mismatch" };
        }
        
        // 更新偏好順序
        student.preferences = newOrder.map(id => typeof id === 'number' ? id : parseInt(id));
        
        console.log(`✅ 重新排序成功:`, student.preferences);
        
        return { 
            success: true, 
            message: "Preferences reordered successfully",
            newOrder: student.preferences
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
    
    // 獲取配對結果（模擬）
    getMatchingResults: () => {
        const results = [];

        mockData.projects.forEach(project => {
            const assignedStudents = [];

            mockData.students.forEach(student => {
                const projectIndex = student.preferences.indexOf(project.id);
                if (projectIndex !== -1 && assignedStudents.length < project.capacity) {
                    assignedStudents.push({
                        studentId: student.id,
                        studentName: student.name,
                        studentGpa: student.gpa,
                        matchRank: projectIndex + 1
                    });
                }
            });

            if (assignedStudents.length < project.capacity) {
                const remainingCapacity = project.capacity - assignedStudents.length;
                const unassignedStudents = mockData.students.filter(student =>
                    !assignedStudents.some(a => a.studentId === student.id) && student.preferences.length > 0
                );
                for (let i = 0; i < Math.min(remainingCapacity, unassignedStudents.length); i++) {
                    assignedStudents.push({
                        studentId: unassignedStudents[i].id,
                        studentName: unassignedStudents[i].name,
                        studentGpa: unassignedStudents[i].gpa,
                        matchRank: 'Auto-assigned'
                    });
                }
            }

            assignedStudents.forEach(assigned => {
                results.push({
                    projectId: project.id,
                    title: project.title,
                    supervisor: project.supervisor,
                    studentId: assigned.studentId,
                    studentName: assigned.studentName,
                    studentGpa: assigned.studentGpa,
                    matchRank: assigned.matchRank
                });
            });

            for (let i = assignedStudents.length; i < project.capacity; i++) {
                results.push({
                    projectId: project.id,
                    title: project.title,
                    supervisor: project.supervisor,
                    studentId: null,
                    studentName: null,
                    studentGpa: null,
                    matchRank: null
                });
            }
        });

        return results;
    },

    // 獲取所有學生列表
    getAllStudents: () => {
        return mockData.students.map(student => ({
            ...student,
            assignedProject: student.assignedProject || null
        }));
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