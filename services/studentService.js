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
    
    // 直接設定學生的 preferences（由 Student UI 的 Submit 發起）
    setPreferences: (studentId, preferencesArray) => {
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) {
            return { success: false, message: "Student not found" };
        }

        // 確保所有 ID 都是數字
        const numericPrefs = (preferencesArray || []).map(id => typeof id === 'number' ? id : parseInt(id));
        student.preferences = numericPrefs;
        student.proposalSubmitted = true;

        console.log(`✅ 已為學生 ${studentId} 設定 preferences:`, student.preferences);
        return { success: true, message: "Preferences saved", preferencesCount: student.preferences.length };
    },
    
    // 獲取系統狀態和截止日期
    getSystemStatus: () => {
        return mockData.system;
    },
    
    // Run matching using student-proposing Gale–Shapley with GPA tie-breaker and project capacities
    runMatching: () => {
        // reset previous assignments and tentative matches
        mockData.assignments = [];
        mockData.students.forEach(s => { s.assignedProject = null; });

        // Prepare students who have submitted preferences
        const studentsWithPrefs = mockData.students
            .filter(s => Array.isArray(s.preferences) && s.preferences.length > 0 && s.proposalSubmitted)
            .map(s => ({
                id: s.id,
                preferences: [...s.preferences], // copy
                nextIndex: 0,
                numericGpa: parseFloat(s.gpa) || 0
            }));

        const studentMap = {};
        studentsWithPrefs.forEach(s => { studentMap[s.id] = s; });

        // Prepare project acceptance lists
        const projectsMap = {};
        mockData.projects.forEach(p => {
            projectsMap[p.id] = {
                capacity: p.capacity || 1,
                accepted: [] // array of student ids
            };
        });

        // Initialize free students queue
        const freeQueue = studentsWithPrefs.map(s => s.id);

        while (freeQueue.length > 0) {
            const studentId = freeQueue.shift();
            const student = studentMap[studentId];
            if (!student) continue;

            // find next project to propose to
            if (student.nextIndex >= student.preferences.length) {
                // no more proposals
                continue;
            }
            const projectId = student.preferences[student.nextIndex];
            student.nextIndex += 1;

            const proj = projectsMap[projectId];
            if (!proj) {
                // invalid project id — try next
                if (student.nextIndex < student.preferences.length) freeQueue.push(studentId);
                continue;
            }

            // Tentatively add student to project's accepted list
            proj.accepted.push(studentId);

            // Sort accepted by GPA desc, tie-break by student id
            proj.accepted.sort((aId, bId) => {
                const a = studentMap[aId] || mockData.students.find(s => s.id === aId);
                const b = studentMap[bId] || mockData.students.find(s => s.id === bId);
                const aG = a ? (a.numericGpa || parseFloat(a.gpa) || 0) : 0;
                const bG = b ? (b.numericGpa || parseFloat(b.gpa) || 0) : 0;
                if (bG !== aG) return bG - aG;
                return (aId || '').localeCompare(bId || '');
            });

            // If over capacity, remove lowest-ranked student
            if (proj.accepted.length > proj.capacity) {
                const removedId = proj.accepted.pop();
                if (removedId && removedId !== studentId) {
                    // removed someone else — they become free again if they have more preferences
                    const removedStudent = studentMap[removedId];
                    if (removedStudent && removedStudent.nextIndex < removedStudent.preferences.length) {
                        freeQueue.push(removedId);
                    }
                } else if (removedId === studentId) {
                    // current student was rejected, they remain free if they have more preferences
                    if (student.nextIndex < student.preferences.length) {
                        freeQueue.push(studentId);
                    }
                }
            }
        }

        // Finalize assignments from projects' accepted lists
        Object.keys(projectsMap).forEach(pid => {
            const proj = projectsMap[pid];
            proj.accepted.forEach(sid => {
                const student = mockData.students.find(s => s.id === sid);
                if (student) {
                    student.assignedProject = parseInt(pid);
                    mockData.assignments.push({
                        studentId: student.id,
                        projectId: parseInt(pid),
                        assignedAt: new Date().toISOString()
                    });
                }
            });
        });

        // mark matching completed
        mockData.system.matchingCompleted = true;

        return {
            success: true,
            assignments: mockData.assignments
        };
    },
    
    // Return current matching results (based on assignments if available)
    getMatchingResults: () => {
        const results = [];

        // if assignments present, use them
        const assignments = Array.isArray(mockData.assignments) ? mockData.assignments : [];

        mockData.projects.forEach(project => {
            const assignment = assignments.find(a => a.projectId === project.id);
            if (assignment) {
                const student = mockData.students.find(s => s.id === assignment.studentId);
                results.push({
                    projectId: project.id,
                    title: project.title,
                    supervisor: project.supervisor,
                    studentId: student ? student.id : assignment.studentId,
                    studentName: student ? student.name : null,
                    studentGpa: student ? student.gpa : null,
                    matchRank: 1,
                    assignedAt: assignment.assignedAt
                });
            } else {
                results.push({
                    projectId: project.id,
                    title: project.title,
                    supervisor: project.supervisor,
                    studentId: null,
                    studentName: null,
                    studentGpa: null,
                    matchRank: null,
                    assignedAt: null
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
    
    // Reset mockData state to initial test state (clear assignments and student submissions)
    resetState: () => {
        // clear assignments
        mockData.assignments = [];
        // reset students
        mockData.students.forEach(s => {
            s.preferences = [];
            s.proposalSubmitted = false;
            s.assignedProject = null;
        });
        // reset matching flag
        mockData.system.matchingCompleted = false;
        return { success: true, message: 'Server state reset' };
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