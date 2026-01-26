const mockData = require('./mockData');
let ProjectModel = null;
let StudentModel = null;
let dbEnabled = false;
try {
    ProjectModel = require('../models/Project');
    StudentModel = require('../models/Student');
    dbEnabled = true;
    console.log('studentService: DB models loaded, DB-backed queries enabled');
} catch (err) {
    console.log('studentService: DB models not available, falling back to mockData');
}

const studentService = {
    // 獲取所有可用項目（DB-backed if available）
    getAvailableProjects: async () => {
        if (dbEnabled && ProjectModel) {
            // return plain objects and normalize shape for frontend compatibility
            const docs = await ProjectModel.find({ status: 'active' }).lean().exec();
            return docs.map(p => ({
                ...p,
                id: (p.id !== undefined && p.id !== null) ? p.id : (p.code || String(p._id)),
                skills: Array.isArray(p.skills) ? p.skills : (p.skills ? [p.skills] : []),
                popularity: typeof p.popularity === 'number' ? p.popularity : (parseInt(p.popularity) || 0)
            }));
        }
        return mockData.projects.filter(project => project.status === "active");
    },
    
    // 獲取學生信息
    getStudent: async (studentId) => {
        if (dbEnabled && StudentModel) {
            const doc = await StudentModel.findOne({ id: studentId }).lean().exec();
            if (!doc) return null;
            return {
                id: doc.id,
                name: doc.name,
                email: doc.email,
                gpa: (typeof doc.gpa === 'number') ? doc.gpa.toString() : (doc.gpa || null),
                major: doc.major,
                year: doc.year,
                preferences: Array.isArray(doc.preferences) ? doc.preferences.map(p => (typeof p === 'number' ? p : parseInt(p))) : [],
                proposalSubmitted: !!doc.proposalSubmitted,
                assignedProject: doc.assignedProject || null
            };
        }
        return mockData.students.find(student => student.id === studentId);
    },
    
    // 獲取學生的偏好列表
    getStudentPreferences: async (studentId) => {
        if (dbEnabled && StudentModel && ProjectModel) {
            const student = await StudentModel.findOne({ id: studentId }).lean().exec();
            if (!student) return [];
            const prefs = Array.isArray(student.preferences) ? student.preferences : [];
            const projects = await ProjectModel.find({}).lean().exec();
            const resolved = prefs.map((projectId) => {
                const pid = String(projectId);
                const proj = projects.find(p => {
                    return (p.id !== undefined && String(p.id) === pid) || (p.code && String(p.code) === pid) || (p._id && String(p._id) === pid);
                });
                if (!proj) return null;
                return {
                    ...proj,
                    id: (proj.id !== undefined && proj.id !== null) ? proj.id : (proj.code || String(proj._id)),
                };
            }).filter(Boolean);
            return resolved.map((proj, idx) => ({ ...proj, rank: idx + 1 }));
        }
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) return [];
        
        return student.preferences.map(projectId => {
            const project = mockData.projects.find(p => p.id === projectId);
            return project ? { ...project, rank: student.preferences.indexOf(projectId) + 1 } : null;
        }).filter(Boolean);
    },
    
    // 添加項目到偏好
    addPreference: async (studentId, projectId) => {
        // projectId may be a string (code or ObjectId) or numeric id
        if (dbEnabled && StudentModel && ProjectModel) {
            const student = await StudentModel.findOne({ id: studentId }).exec();
            if (!student) return { success: false, message: "Student not found" };
            const existing = (student.preferences || []).map(p => String(p));
            const pidStr = String(projectId);
            if (existing.includes(pidStr)) return { success: false, message: "Project already in preferences" };
            if (existing.length >= 5) return { success: false, message: "Maximum 5 preferences allowed" };
            // find project by _id, code, or id field
            let project = null;
            const mongoose = require('mongoose');
            if (mongoose.Types.ObjectId.isValid(pidStr)) {
                project = await ProjectModel.findById(pidStr).exec();
            }
            if (!project) {
                project = await ProjectModel.findOne({ $or: [{ code: pidStr }, { id: pidStr }] }).exec();
            }
            if (!project) return { success: false, message: "Project not found" };
            student.preferences = existing.concat([pidStr]);
            await student.save();
            try {
                project.popularity = (project.popularity || 0) + 1;
                await project.save();
            } catch (e) {}
            return { success: true, message: "Project added to preferences", currentPreferences: student.preferences.length };
        }
        // fallback mock
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) return { success: false, message: "Student not found" };
        if (student.preferences.includes(numericProjectId)) return { success: false, message: "Project already in preferences" };
        if (student.preferences.length >= 5) return { success: false, message: "Maximum 5 preferences allowed" };
        const project = mockData.projects.find(p => p.id === numericProjectId);
        if (!project) return { success: false, message: "Project not found" };
        student.preferences.push(numericProjectId);
        project.popularity += 1;
        return { success: true, message: "Project added to preferences", currentPreferences: student.preferences.length };
    },
    
    // 從偏好中移除項目
    removePreference: async (studentId, projectId) => {
        // 確保 projectId 是數字類型
        const pidStr = String(projectId);
        if (dbEnabled && StudentModel && ProjectModel) {
            const student = await StudentModel.findOne({ id: studentId }).exec();
            if (!student) return { success: false, message: "Student not found" };
            const prefs = Array.isArray(student.preferences) ? student.preferences.map(p => String(p)) : [];
            const index = prefs.indexOf(pidStr);
            if (index === -1) return { success: false, message: "Project not in preferences" };
            prefs.splice(index, 1);
            student.preferences = prefs;
            await student.save();
            // decrement popularity if possible
            let project = null;
            const mongoose = require('mongoose');
            if (mongoose.Types.ObjectId.isValid(pidStr)) {
                project = await ProjectModel.findById(pidStr).exec();
            }
            if (!project) {
                project = await ProjectModel.findOne({ $or: [{ code: pidStr }, { id: pidStr }] }).exec();
            }
            if (project && typeof project.popularity === 'number' && project.popularity > 0) {
                project.popularity -= 1;
                await project.save();
            }
            return { success: true, message: "Project removed from preferences", currentPreferences: student.preferences.length };
        }
        // fallback
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) return { success: false, message: "Student not found" };
        const index = student.preferences.indexOf(numericProjectId);
        if (index === -1) return { success: false, message: "Project not in preferences" };
        student.preferences.splice(index, 1);
        const project = mockData.projects.find(p => p.id === numericProjectId);
        if (project && project.popularity > 0) project.popularity -= 1;
        return { success: true, message: "Project removed from preferences", currentPreferences: student.preferences.length };
    },
    
    // Move preference position
    movePreference: async (studentId, projectId, direction) => {
        // 確保 projectId 是數字類型
        const pidStr = String(projectId);
        if (dbEnabled && StudentModel) {
            const student = await StudentModel.findOne({ id: studentId }).exec();
            if (!student) return { success: false, message: "Student not found" };
            const prefs = Array.isArray(student.preferences) ? student.preferences.map(p => String(p)) : [];
            const currentIndex = prefs.indexOf(pidStr);
            if (currentIndex === -1) return { success: false, message: "Project not in preferences" };
            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (targetIndex < 0 || targetIndex >= prefs.length) return { success: false, message: "Cannot move in that direction" };
            const temp = prefs[currentIndex];
            prefs[currentIndex] = prefs[targetIndex];
            prefs[targetIndex] = temp;
            student.preferences = prefs;
            await student.save();
            return { success: true, message: "Preference order updated", newPosition: targetIndex + 1 };
        }
        // fallback
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) return { success: false, message: "Student not found" };
        const currentIndex = student.preferences.indexOf(numericProjectId);
        if (currentIndex === -1) return { success: false, message: "Project not in preferences" };
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= student.preferences.length) return { success: false, message: "Cannot move in that direction" };
        const temp = student.preferences[currentIndex];
        student.preferences[currentIndex] = student.preferences[targetIndex];
        student.preferences[targetIndex] = temp;
        return { success: true, message: "Preference order updated", newPosition: targetIndex + 1 };
    },
    
    // Reorder preferences (用於拖曳排序)
    reorderPreferences: async (studentId, newOrder) => {
        if (dbEnabled && StudentModel) {
            const student = await StudentModel.findOne({ id: studentId }).exec();
            if (!student) return { success: false, message: "Student not found" };
            const prefs = Array.isArray(student.preferences) ? student.preferences.map(p => String(p)) : [];
            const stringOrder = newOrder.map(id => String(id));
            const validIds = stringOrder.every(id => prefs.includes(id));
            if (!validIds) return { success: false, message: "Invalid project IDs in new order" };
            if (stringOrder.length !== prefs.length) return { success: false, message: "Order length mismatch" };
            student.preferences = stringOrder;
            await student.save();
            return { success: true, message: "Preferences reordered successfully", newOrder: student.preferences };
        }
        // fallback
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) return { success: false, message: "Student not found" };
        const validIds = newOrder.every(id => {
            const numericId = typeof id === 'number' ? id : parseInt(id);
            return student.preferences.includes(numericId);
        });
        if (!validIds) return { success: false, message: "Invalid project IDs in new order" };
        if (newOrder.length !== student.preferences.length) return { success: false, message: "Order length mismatch" };
        student.preferences = newOrder.map(id => typeof id === 'number' ? id : parseInt(id));
        return { success: true, message: "Preferences reordered successfully", newOrder: student.preferences };
    },
    
    // 提交最終偏好
    submitPreferences: async (studentId) => {
        if (dbEnabled && StudentModel) {
            const student = await StudentModel.findOne({ id: studentId }).exec();
            if (!student) return { success: false, message: "Student not found" };
            if (!Array.isArray(student.preferences) || student.preferences.length === 0) return { success: false, message: "No preferences to submit" };
            student.proposalSubmitted = true;
            await student.save();
            return { success: true, message: "Preferences submitted successfully", preferencesCount: student.preferences.length, submittedAt: new Date().toISOString() };
        }
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) return { success: false, message: "Student not found" };
        if (student.preferences.length === 0) return { success: false, message: "No preferences to submit" };
        student.proposalSubmitted = true;
        return { success: true, message: "Preferences submitted successfully", preferencesCount: student.preferences.length, submittedAt: new Date().toISOString() };
    },
    
    // 直接設定學生的 preferences（由 Student UI 的 Submit 發起）
    setPreferences: async (studentId, preferencesArray) => {
        const stringPrefs = (preferencesArray || []).map(id => String(id));
        if (dbEnabled && StudentModel) {
            const student = await StudentModel.findOne({ id: studentId }).exec();
            if (!student) return { success: false, message: "Student not found" };
            student.preferences = stringPrefs;
            student.proposalSubmitted = true;
            await student.save();
            return { success: true, message: "Preferences saved", preferencesCount: student.preferences.length };
        }
        const student = mockData.students.find(s => s.id === studentId);
        if (!student) return { success: false, message: "Student not found" };
        student.preferences = (preferencesArray || []).map(id => typeof id === 'number' ? id : parseInt(id));
        student.proposalSubmitted = true;
        return { success: true, message: "Preferences saved", preferencesCount: student.preferences.length };
    },
    
    // 獲取系統狀態和截止日期
    getSystemStatus: () => {
        return mockData.system;
    },
    
    // Run matching using student-proposing Gale–Shapley with GPA tie-breaker and project capacities
    runMatching: async () => {
        if (dbEnabled && StudentModel && ProjectModel) {
            // clear previous assignments
            await StudentModel.updateMany({}, { $set: { assignedProject: null, proposalSubmitted: false } }).exec();

            // fetch students who submitted preferences
            const studentDocs = await StudentModel.find({ proposalSubmitted: true, preferences: { $exists: true, $ne: [] } }).lean().exec();
            const projectDocs = await ProjectModel.find({}).lean().exec();

            // build quick lookup by possible identifiers
            const projectLookup = {};
            projectDocs.forEach(p => {
                if (p.id !== undefined && p.id !== null) projectLookup[String(p.id)] = p;
                if (p.code) projectLookup[String(p.code)] = p;
                projectLookup[String(p._id)] = p;
            });

            // prepare projects map for algorithm keyed by project._id string
            const projectsMap = {};
            projectDocs.forEach(p => {
                const key = String(p._id);
                projectsMap[key] = { capacity: p.capacity || 1, accepted: [], doc: p };
            });

            // prepare students map
            const studentMap = {};
            studentDocs.forEach(s => {
                const prefs = Array.isArray(s.preferences) ? s.preferences.map(x => String(x)) : [];
                studentMap[s.id] = { id: s.id, preferences: prefs, nextIndex: 0, numericGpa: parseFloat(s.gpa) || 0 };
            });

            const freeQueue = Object.keys(studentMap);

            function resolvePrefToProjectKey(pref) {
                if (!pref && pref !== 0) return null;
                const asString = String(pref);
                if (projectLookup[asString]) return String(projectLookup[asString]._id);
                if (projectsMap[asString]) return asString;
                return null;
            }

            while (freeQueue.length > 0) {
                const studentId = freeQueue.shift();
                const student = studentMap[studentId];
                if (!student) continue;
                if (student.nextIndex >= student.preferences.length) continue;
                const rawPref = student.preferences[student.nextIndex];
                student.nextIndex += 1;
                const projKey = resolvePrefToProjectKey(rawPref);
                if (!projKey) {
                    if (student.nextIndex < student.preferences.length) freeQueue.push(studentId);
                    continue;
                }
                const proj = projectsMap[projKey];
                proj.accepted.push(studentId);
                proj.accepted.sort((aId, bId) => {
                    const a = studentMap[aId];
                    const b = studentMap[bId];
                    if (!a || !b) return 0;
                    if (b.numericGpa !== a.numericGpa) return b.numericGpa - a.numericGpa;
                    return (aId || '').localeCompare(bId || '');
                });
                if (proj.accepted.length > proj.capacity) {
                    const removedId = proj.accepted.pop();
                    if (removedId && removedId !== studentId) {
                        const removedStudent = studentMap[removedId];
                        if (removedStudent && removedStudent.nextIndex < removedStudent.preferences.length) {
                            freeQueue.push(removedId);
                        }
                    } else if (removedId === studentId) {
                        if (student.nextIndex < student.preferences.length) {
                            freeQueue.push(studentId);
                        }
                    }
                }
            }

            // finalize assignments
            const assignments = [];
            for (const key of Object.keys(projectsMap)) {
                const proj = projectsMap[key];
                for (const sid of proj.accepted) {
                    const studentDoc = await StudentModel.findOne({ id: sid }).exec();
                    if (studentDoc) {
                        studentDoc.assignedProject = proj.doc._id;
                        await studentDoc.save();
                        assignments.push({
                            studentId: studentDoc.id,
                            projectId: String(proj.doc._id),
                            assignedAt: new Date().toISOString()
                        });
                    }
                }
            }

            return { success: true, assignments };
        }

        // fallback to mockData behaviour
        mockData.assignments = [];
        mockData.students.forEach(s => { s.assignedProject = null; });

        const studentsWithPrefs = mockData.students
            .filter(s => Array.isArray(s.preferences) && s.preferences.length > 0 && s.proposalSubmitted)
            .map(s => ({
                id: s.id,
                preferences: [...s.preferences],
                nextIndex: 0,
                numericGpa: parseFloat(s.gpa) || 0
            }));

        const studentMap = {};
        studentsWithPrefs.forEach(s => { studentMap[s.id] = s; });

        const projectsMap = {};
        mockData.projects.forEach(p => {
            projectsMap[p.id] = {
                capacity: p.capacity || 1,
                accepted: []
            };
        });

        const freeQueue = studentsWithPrefs.map(s => s.id);
        while (freeQueue.length > 0) {
            const studentId = freeQueue.shift();
            const student = studentMap[studentId];
            if (!student) continue;
            if (student.nextIndex >= student.preferences.length) continue;
            const projectId = student.preferences[student.nextIndex];
            student.nextIndex += 1;
            const proj = projectsMap[projectId];
            if (!proj) {
                if (student.nextIndex < student.preferences.length) freeQueue.push(studentId);
                continue;
            }
            proj.accepted.push(studentId);
            proj.accepted.sort((aId, bId) => {
                const a = studentMap[aId] || mockData.students.find(s => s.id === aId);
                const b = studentMap[bId] || mockData.students.find(s => s.id === bId);
                const aG = a ? (a.numericGpa || parseFloat(a.gpa) || 0) : 0;
                const bG = b ? (b.numericGpa || parseFloat(b.gpa) || 0) : 0;
                if (bG !== aG) return bG - aG;
                return (aId || '').localeCompare(bId || '');
            });
            if (proj.accepted.length > proj.capacity) {
                const removedId = proj.accepted.pop();
                if (removedId && removedId !== studentId) {
                    const removedStudent = studentMap[removedId];
                    if (removedStudent && removedStudent.nextIndex < removedStudent.preferences.length) {
                        freeQueue.push(removedId);
                    }
                } else if (removedId === studentId) {
                    if (student.nextIndex < student.preferences.length) {
                        freeQueue.push(studentId);
                    }
                }
            }
        }

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

        mockData.system.matchingCompleted = true;
        return {
            success: true,
            assignments: mockData.assignments
        };
    },
    
    // Return current matching results (based on assignments if available)
    getMatchingResults: async () => {
        if (dbEnabled && StudentModel && ProjectModel) {
            const projects = await ProjectModel.find({}).lean().exec();
            const students = await StudentModel.find({ assignedProject: { $ne: null } }).lean().exec();
            const results = [];
            for (const project of projects) {
                const assigned = students.find(s => String(s.assignedProject) === String(project._id));
                if (assigned) {
                    results.push({
                        projectId: String(project._id),
                        title: project.title,
                        supervisor: project.supervisor,
                        studentId: assigned.id || null,
                        studentName: assigned.name || null,
                        studentGpa: assigned.gpa || null,
                        matchRank: 1,
                        assignedAt: assigned.updatedAt || null
                    });
                } else {
                    results.push({
                        projectId: String(project._id),
                        title: project.title,
                        supervisor: project.supervisor,
                        studentId: null,
                        studentName: null,
                        studentGpa: null,
                        matchRank: null,
                        assignedAt: null
                    });
                }
            }
            return results;
        }

        const results = [];
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

    // 獲取所有學生列表（DB-backed if available）
    getAllStudents: async () => {
        if (dbEnabled && StudentModel) {
            const docs = await StudentModel.find({}).lean().exec();
            return docs.map(d => ({
                id: d.id,
                name: d.name,
                email: d.email,
                gpa: (typeof d.gpa === 'number') ? d.gpa.toString() : (d.gpa || null),
                major: d.major,
                year: d.year,
                preferences: Array.isArray(d.preferences) ? d.preferences.map(p => String(p)) : [],
                proposalSubmitted: !!d.proposalSubmitted,
                assignedProject: d.assignedProject || null
            }));
        }
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