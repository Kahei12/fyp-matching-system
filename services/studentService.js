const { majorToFilterCode } = require('./majorMapping');
const path = require('path');
const fs = require('fs');

let ProjectModel = null;
let StudentModel = null;
let SystemSettingsModel = null;

const DEADLINES_FILE = path.join(__dirname, '..', 'data', 'deadlines.json');

function loadDeadlinesFromFile() {
    try {
        if (fs.existsSync(DEADLINES_FILE)) {
            const raw = fs.readFileSync(DEADLINES_FILE, 'utf8');
            const parsed = JSON.parse(raw);
            console.log('[deadlines] Loaded from file:', JSON.stringify(parsed));
            return parsed;
        }
    } catch (e) {
        console.error('[deadlines] Failed to load file:', e.message);
    }
    return null;
}

function saveDeadlinesToFile(deadlines) {
    try {
        const dir = path.dirname(DEADLINES_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DEADLINES_FILE, JSON.stringify(deadlines, null, 2), 'utf8');
        console.log('[deadlines] Saved to file:', JSON.stringify(deadlines));
        return true;
    } catch (e) {
        console.error('[deadlines] Failed to save file:', e.message);
        return false;
    }
}

// Sync check database connection status - check fresh every time
function checkDBConnection() {
    try {
        const mongoose = require('mongoose');
        const isConnected = mongoose.connection.readyState === 1;
        
        if (isConnected) {
            if (!ProjectModel) {
                ProjectModel = require('../models/Project');
                StudentModel = require('../models/Student');
                SystemSettingsModel = require('../models/SystemSettings');
            }
        }
        return isConnected;
    } catch (err) {
        return false;
    }
}

/** Resolve a raw preference value to a project doc (ObjectId / code / catalogue id). */
function resolveProjectByPref(projects, pref) {
    const asString = String(pref == null ? '' : pref);
    if (!asString) return null;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(asString)) {
        const found = projects.find(p => String(p._id) === asString);
        if (found) return found;
    }
    const byId = projects.find(p => String(p._id) === asString);
    if (byId) return byId;
    const byNumId = projects.find(p => p.id != null && String(p.id) === asString);
    if (byNumId) return byNumId;
    const byCode = projects.find(p => p.code && String(p.code) === asString);
    if (byCode) return byCode;
    return null;
}

const studentService = {
    // Get all available projects (DB-backed)
    // Major filter is preferred; if matching projects is 0, show all teacher projects (without major filter)
    getAvailableProjects: async (studentMajor) => {
        try {
            if (!checkDBConnection() || !ProjectModel) {
                console.warn('[getAvailableProjects] MongoDB not connected — returning no projects');
                return [];
            }

            const allDocs = await ProjectModel.find({}).lean().exec();
            console.log(`[getAvailableProjects] Total docs in DB: ${allDocs.length}`);

            // First layer filter: only teacher-proposed projects with supervisor and reasonable status
            const teacherProjects = allDocs.filter(doc => {
                if (doc.type === 'student') return false;
                if (!doc.supervisor || doc.supervisor === 'TBD') return false;
                // Accept any status except explicitly rejected (consistent with runMatching)
                const s = String(doc.status || '').toLowerCase();
                return s !== 'rejected';
            });

            console.log(`[getAvailableProjects] Teacher projects (no major filter): ${teacherProjects.length}`);

            // Second layer: apply major filter
            let filtered = teacherProjects;
            if (studentMajor) {
                const sm = majorToFilterCode(studentMajor);
                console.log(`[getAvailableProjects] Applying major filter: ${sm} (from: ${studentMajor})`);
                if (sm) {
                    filtered = teacherProjects.filter(doc => {
                        const pm = majorToFilterCode(doc.major);
                        // Legacy catalogue rows often omit major — show to all students (do not default to ECE)
                        if (!pm || pm === '') return true;
                        if (pm === 'ECE+CCS') return true;
                        return pm === sm;
                    });
                    console.log(`[getAvailableProjects] After major filter: ${filtered.length}`);
                }
            }

            // If major filter returns 0, fallback to showing all (without major filter)
            if (filtered.length === 0 && studentMajor) {
                console.log('[getAvailableProjects] Major filter returned 0, showing all teacher projects');
                filtered = teacherProjects;
            }

            return filtered.map(p => ({
                ...p,
                id: (p.id != null) ? p.id : (p.code || String(p._id)),
                skills: Array.isArray(p.skills) ? p.skills : (p.skills ? [p.skills] : []),
                popularity: typeof p.popularity === 'number' ? p.popularity : (parseInt(p.popularity) || 0)
            }));
        } catch (err) {
            console.error('❌ getAvailableProjects error:', err.message);
            return [];
        }
    },
    
    // Get student info
    getStudent: async (studentId) => {
        if (checkDBConnection() && StudentModel) {
            const doc = await StudentModel.findOne({ id: studentId }).lean().exec();
            if (!doc) return null;
            const hasSelfProposal = !!doc.proposedProject;
            const storedPrefsSubmitted = !!doc.preferencesSubmitted;
            const legacyPrefsOnly = !!doc.proposalSubmitted && !hasSelfProposal
                && Array.isArray(doc.preferences) && doc.preferences.length > 0;
            const preferencesSubmitted = storedPrefsSubmitted || legacyPrefsOnly;

            return {
                id: doc.id,
                studentId: doc.id,
                name: doc.name,
                email: doc.email,
                gpa: (typeof doc.gpa === 'number') ? doc.gpa.toString() : (doc.gpa || null),
                major: doc.major,
                year: doc.year,
                preferences: Array.isArray(doc.preferences) ? doc.preferences.map(p => (typeof p === 'number' ? p : parseInt(p))) : [],
                preferencesSubmitted,
                proposalSubmitted: !!doc.proposalSubmitted,
                proposedProject: doc.proposedProject ? String(doc.proposedProject) : null,
                proposalStatus: doc.proposalStatus || 'none',
                assignedProject: doc.assignedProject || null
            };
        }
        return null;
    },

    // Get student's preference list
    getStudentPreferences: async (studentId) => {
        if (checkDBConnection() && StudentModel && ProjectModel) {
            const student = await StudentModel.findOne({ id: studentId }).lean().exec();
            if (!student) return [];
            const prefs = Array.isArray(student.preferences) ? student.preferences : [];
            if (prefs.length === 0) return [];

            const projects = await ProjectModel.find({}).lean().exec();

            const resolved = prefs.map(prefId => {
                const proj = resolveProjectByPref(projects, prefId);
                if (!proj) {
                    console.warn(`[getStudentPreferences] Project not found for pref ID: ${prefId}`);
                    return null;
                }
                return {
                    ...proj,
                    id: proj.code || String(proj._id),
                    title: proj.title,
                    supervisor: proj.supervisor,
                    description: proj.description,
                    skills: Array.isArray(proj.skills) ? proj.skills : [],
                    popularity: typeof proj.popularity === 'number' ? proj.popularity : 0,
                    capacity: proj.capacity || 2,
                    status: proj.status || 'active'
                };
            }).filter(Boolean);

            return resolved.map((proj, idx) => ({ ...proj, rank: idx + 1 }));
        }
        return [];
    },
    
    // Add project to preferences
    addPreference: async (studentId, projectId) => {
        // projectId may be a string (code or ObjectId) or numeric id
        if (checkDBConnection() && StudentModel && ProjectModel) {
            const student = await StudentModel.findOne({ id: studentId }).exec();
            if (!student) return { success: false, message: "Student not found" };
            const existing = (student.preferences || []).map(p => String(p));
            const pidStr = String(projectId);
            if (existing.includes(pidStr)) return { success: false, message: "Project already in preferences" };
            if (existing.length >= 10) return { success: false, message: "Maximum 10 preferences allowed" };
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
        return { success: false, message: "Database unavailable" };
    },
    
    // Remove project from preferences
    removePreference: async (studentId, projectId) => {
        // Ensure projectId is string type
        const pidStr = String(projectId);
        if (checkDBConnection() && StudentModel && ProjectModel) {
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
        return { success: false, message: "Database unavailable" };
    },
    
    // Move preference position
    movePreference: async (studentId, projectId, direction) => {
        // Ensure projectId is string type
        const pidStr = String(projectId);
        if (checkDBConnection() && StudentModel) {
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
        return { success: false, message: "Database unavailable" };
    },
    
    // Reorder preferences (used for drag-drop sorting)
    reorderPreferences: async (studentId, newOrder) => {
        if (checkDBConnection() && StudentModel) {
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
        return { success: false, message: "Database unavailable" };
    },
    
    // Submit final preferences
    submitPreferences: async (studentId) => {
        if (checkDBConnection() && StudentModel) {
            const student = await StudentModel.findOne({ id: studentId }).exec();
            if (!student) return { success: false, message: "Student not found" };
            if (!Array.isArray(student.preferences) || student.preferences.length === 0) return { success: false, message: "No preferences to submit" };
            student.preferencesSubmitted = true;
            await student.save();
            return { success: true, message: "Preferences submitted successfully", preferencesCount: student.preferences.length, submittedAt: new Date().toISOString() };
        }
        return { success: false, message: "Database unavailable" };
    },
    
    // Set student's preferences directly (initiated by Student UI Submit)
    setPreferences: async (studentId, preferencesArray, options = {}) => {
        const stringPrefs = (preferencesArray || []).map(id => String(id));
        const isDraft = !!options?.draft;
        if (checkDBConnection() && StudentModel && ProjectModel) {
            const student = await StudentModel.findOne({ id: studentId }).exec();
            if (!student) {
                console.error(`[setPreferences] Student not found: ${studentId}`);
                return { success: false, message: "Student not found" };
            }

            // Validate all project IDs (consistent resolve strategy)
            if (stringPrefs.length > 0) {
                const mongoose = require('mongoose');
                const allProjects = await ProjectModel.find({}).lean().exec();
                const validProjects = [];
                for (const prefId of stringPrefs) {
                    const proj = resolveProjectByPref(allProjects, prefId);
                    if (proj) {
                        validProjects.push(prefId);
                    } else {
                        console.warn(`[setPreferences] Project not found: ${prefId}`);
                    }
                }
                // Use validated project IDs
                student.preferences = validProjects;
                // Only lock (preferencesSubmitted) on final submit — not on draft moves/removes
                if (!isDraft) {
                    student.preferencesSubmitted = true;
                }
            } else {
                student.preferences = stringPrefs;
                student.preferencesSubmitted = false;
            }

            await student.save();
            console.log(`[setPreferences] Saved preferences for student ${studentId}: ${student.preferences.length} projects${isDraft ? ' (draft)' : ''}`);
            return {
                success: true,
                message: "Preferences saved to database",
                preferencesCount: student.preferences.length
            };
        }
        return { success: false, message: "Database unavailable" };
    },
    
    getSystemStatus: async function () {
        const deadlines = await this.getDeadlines();
        if (checkDBConnection() && SystemSettingsModel) {
            try {
                const settings = await SystemSettingsModel.findOne({ key: 'system' }).lean().exec();
                return {
                    currentPhase: settings?.currentPhase || 'preference',
                    deadlines: deadlines || {},
                    matchingCompleted: settings?.matchingCompleted ?? false
                };
            } catch (err) {
                console.error('[getSystemStatus] MongoDB error:', err.message);
            }
        }
        return {
            currentPhase: 'preference',
            deadlines: deadlines || {},
            matchingCompleted: false
        };
    },

    getDeadlines: async () => {
        if (checkDBConnection() && SystemSettingsModel) {
            try {
                const settings = await SystemSettingsModel.findOne({ key: 'system' }).lean().exec();
                console.log('[getDeadlines] settings found:', settings ? 'yes' : 'no', '| deadlines:', JSON.stringify(settings?.deadlines));
                if (settings && settings.deadlines) {
                    return {
                        studentSelfProposal: settings.deadlines.studentSelfProposal ? settings.deadlines.studentSelfProposal.toISOString() : null,
                        preference: settings.deadlines.preference ? settings.deadlines.preference.toISOString() : null,
                        teacherProposalReview: settings.deadlines.teacherProposalReview ? settings.deadlines.teacherProposalReview.toISOString() : null,
                        teacherSelfProposal: settings.deadlines.teacherSelfProposal ? settings.deadlines.teacherSelfProposal.toISOString() : null
                    };
                }
                console.log('[getDeadlines] No settings found — returning empty deadlines');
            } catch (err) {
                console.error('[getDeadlines] MongoDB error:', err.message);
            }
        } else {
            console.log('[getDeadlines] DB not connected — trying local file fallback');
            const fileDeadlines = loadDeadlinesFromFile();
            if (fileDeadlines) return fileDeadlines;
            console.log('[getDeadlines] No local file fallback — returning empty deadlines');
        }
        return {};
    },

    updateDeadlines: async (partial) => {
        const allowed = [
            'studentSelfProposal',
            'preference',
            'teacherProposalReview',
            'teacherSelfProposal',
        ];

        if (checkDBConnection() && SystemSettingsModel) {
            try {
                const updateObj = {};
                for (const key of allowed) {
                    if (partial && Object.prototype.hasOwnProperty.call(partial, key)) {
                        const val = partial[key];
                        if (val == null || val === '') continue;
                        const d = new Date(val);
                        if (!isNaN(d.getTime())) {
                            updateObj[`deadlines.${key}`] = d;
                        }
                    }
                }

                if (Object.keys(updateObj).length > 0) {
                    await SystemSettingsModel.findOneAndUpdate(
                        { key: 'system' },
                        {
                            $set: {
                                ...updateObj,
                                updatedAt: new Date()
                            },
                            $setOnInsert: { key: 'system' }
                        },
                        { upsert: true, new: true }
                    ).exec();
                }

                const settings = await SystemSettingsModel.findOne({ key: 'system' }).lean().exec();
                const dl = settings?.deadlines;
                const deadlines = {
                    studentSelfProposal: dl?.studentSelfProposal ? dl.studentSelfProposal.toISOString() : null,
                    preference: dl?.preference ? dl.preference.toISOString() : null,
                    teacherProposalReview: dl?.teacherProposalReview ? dl.teacherProposalReview.toISOString() : null,
                    teacherSelfProposal: dl?.teacherSelfProposal ? dl.teacherSelfProposal.toISOString() : null
                };
                // Also persist to local file so it survives restarts without DB
                saveDeadlinesToFile(deadlines);
                return { success: true, deadlines };
            } catch (err) {
                console.error('[updateDeadlines] MongoDB error:', err.message);
            }
        } else {
            console.log('[updateDeadlines] DB not connected — saving to local file');
            // Build updated deadlines from existing file + incoming partial
            const existing = loadDeadlinesFromFile() || {};
            const updated = { ...existing };
            for (const key of allowed) {
                if (partial && Object.prototype.hasOwnProperty.call(partial, key)) {
                    const val = partial[key];
                    if (val != null && val !== '') {
                        updated[key] = val; // already ISO string
                    }
                }
            }
            if (saveDeadlinesToFile(updated)) {
                return { success: true, deadlines: updated };
            }
            return { success: false, message: 'Database unavailable — cannot update deadlines' };
        }
    },
    
    // Run matching using student-proposing Gale–Shapley with GPA tie-breaker and project capacities
    runMatching: async () => {
        if (checkDBConnection() && StudentModel && ProjectModel) {
            console.log('[runMatching] Starting matching algorithm...');
            
            // clear previous assignments only (keep proposalSubmitted status)
            await StudentModel.updateMany({}, { $set: { assignedProject: null } }).exec();
            console.log('[runMatching] Cleared previous assignments');

            // fetch students who submitted preferences
            // preferencesSubmitted: new field; fall back to legacy proposalSubmitted+prefs for old data
            const studentDocs = await StudentModel.find({
                $or: [
                    { preferencesSubmitted: true },
                    { proposalSubmitted: true, proposedProject: null, preferences: { $exists: true, $ne: [] } }
                ],
                preferences: { $exists: true, $ne: [] }
            }).lean().exec();
            console.log(`[runMatching] Found ${studentDocs.length} students with submitted preferences`);

            // Consistent with getAvailableProjects: accept all teacher projects except explicitly rejected
            const projectDocs = await ProjectModel.find({
                type: 'teacher',
                isActive: true
            }).lean().exec();

            const byStatus = { approved: 0, active: 0, other: 0, rejected: 0 };
            projectDocs.forEach(p => {
                const s = String(p.status || '').toLowerCase();
                if (s === 'approved') byStatus.approved++;
                else if (s === 'active') byStatus.active++;
                else if (s === 'rejected') byStatus.rejected++;
                else byStatus.other++;
            });
            console.log(`[runMatching] ${projectDocs.length} teacher projects by status: approved=${byStatus.approved}, active=${byStatus.active}, other=${byStatus.other}, rejected=${byStatus.rejected}`);

            // build quick lookup by possible identifiers (must cover all ways preferences are stored)
            const projectLookup = {};
            projectDocs.forEach(p => {
                const key = String(p._id);
                projectLookup[key] = p;
                if (p.id != null) projectLookup[String(p.id)] = p;
                if (p.code) projectLookup[String(p.code)] = p;
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
                console.log(`[runMatching] Student ${s.id}: ${prefs.length} preferences:`, prefs);
            });

            const freeQueue = Object.keys(studentMap);
            console.log(`[runMatching] Starting with ${freeQueue.length} students in queue`);

            function resolvePrefToProjectKey(pref) {
                if (!pref && pref !== 0) return null;
                const asString = String(pref);
                
                // Try to find project via lookup
                if (projectLookup[asString]) {
                    return String(projectLookup[asString]._id);
                }
                
                // If pref is already in ObjectId format, use directly
                const mongoose = require('mongoose');
                if (mongoose.Types.ObjectId.isValid(asString)) {
                    if (projectsMap[asString]) {
                        return asString;
                    }
                }
                
                // If not found, log warning
                console.warn(`[runMatching] Cannot resolve preference ID: ${asString}`);
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
                            projectCode: proj.doc.code || null,
                            projectTitle: proj.doc.title || null,
                            assignedAt: new Date().toISOString()
                        });
                    }
                }
            }

            console.log(`[runMatching] Matching completed: ${assignments.length} students assigned`);

            if (SystemSettingsModel) {
                try {
                    await SystemSettingsModel.findOneAndUpdate(
                        { key: 'system' },
                        { $set: { matchingCompleted: true } },
                        { upsert: true }
                    ).exec();
                } catch (e) {
                    console.error('[runMatching] Could not set matchingCompleted flag:', e.message);
                }
            }

            return { 
                success: true, 
                assignments,
                totalStudents: studentDocs.length,
                matchedStudents: assignments.length
            };
        }

        return { success: false, message: 'Database unavailable — cannot run matching' };
    },
    
    // Return current matching results (based on assignments if available)
    getMatchingResults: async () => {
        if (checkDBConnection() && StudentModel && ProjectModel) {
            const projects = await ProjectModel.find({}).lean().exec();
            const students = await StudentModel.find({ assignedProject: { $ne: null } }).lean().exec();

            // Global "matching finished" locks preference editing for all students — must not be
            // inferred from "any student assigned" (that wrongly locked everyone during partial tests).
            let matchingCompleted = false;
            if (SystemSettingsModel) {
                try {
                    const settings = await SystemSettingsModel.findOne({ key: 'system' }).lean().exec();
                    matchingCompleted = settings?.matchingCompleted ?? false;
                } catch (e) {
                    console.error('[getMatchingResults] SystemSettings read failed:', e.message);
                }
            }

            const results = [];
            for (const project of projects) {
                const assigned = students.find(s => String(s.assignedProject) === String(project._id));
                results.push({
                    projectId: String(project._id),
                    projectCode: project.code || null,
                    title: project.title,
                    supervisor: project.supervisor,
                    projectType: project.type === 'student' ? 'student' : 'teacher',
                    studentId: assigned ? (assigned.id || null) : null,
                    studentName: assigned ? (assigned.name || null) : null,
                    studentGpa: assigned ? (assigned.gpa || null) : null,
                    matchRank: assigned ? 1 : null,
                    assignedAt: assigned ? (assigned.updatedAt ? assigned.updatedAt.toISOString() : null) : null
                });
            }

            // Return results and matching completion flag
            return { results, matchingCompleted };
        }

        return { results: [], matchingCompleted: false };
    },

    // Get all student list (DB-backed if available)
    getAllStudents: async () => {
        if (checkDBConnection() && StudentModel) {
            const docs = await StudentModel.find({}).lean().exec();
            return docs.map(d => ({
                id: d.id,
                name: d.name,
                email: d.email,
                gpa: (typeof d.gpa === 'number') ? d.gpa.toString() : (d.gpa || null),
                major: d.major,
                year: d.year,
                preferences: Array.isArray(d.preferences) ? d.preferences.map(p => String(p)) : [],
                preferencesSubmitted: !!d.preferencesSubmitted,
                proposalSubmitted: !!d.proposalSubmitted,
                assignedProject: d.assignedProject || null
            }));
        }
        return [];
    },
    
    // Reset state to initial test state (clear assignments and student submissions)
    resetState: async () => {
        if (checkDBConnection() && StudentModel) {
            try {
                // Reset all students' preferences and submission status
                await StudentModel.updateMany(
                    {},
                    {
                        $set: {
                            preferences: [],
                            preferencesSubmitted: false,
                            proposalSubmitted: false,
                            assignedProject: null,
                            proposalStatus: 'none',
                            proposedProject: null,
                            proposalApproved: false
                        }
                    }
                ).exec();
                
                // Reset all projects' popularity and proposal-related status
                if (ProjectModel) {
                    await ProjectModel.updateMany(
                        {},
                        { 
                            $set: { 
                                popularity: 0,
                                proposalStatus: 'pending',
                                isProposed: false,
                                proposedBy: null,
                                proposedByEmail: null,
                                status: 'Under Review'
                            }
                        }
                    ).exec();
                }
                
                if (SystemSettingsModel) {
                    await SystemSettingsModel.findOneAndUpdate(
                        { key: 'system' },
                        { $set: { matchingCompleted: false } },
                        { upsert: true }
                    ).exec();
                }

                console.log('[resetState] Database reset completed');
                return { success: true, message: 'Database reset completed. All students can now submit preferences and proposals again.' };
            } catch (err) {
                console.error('[resetState] Error:', err);
                return { success: false, message: 'Reset failed: ' + err.message };
            }
        }
        
        return { success: false, message: 'Database unavailable' };
    },
    updateStudentProfile: async (studentId, updates) => {
        if (!checkDBConnection() || !StudentModel) {
            return { success: false, message: 'Database unavailable' };
        }
        const allowed = ['name', 'year', 'gpa', 'major'];
        const patch = {};
        if (updates && typeof updates === 'object') {
            for (const k of allowed) {
                if (Object.prototype.hasOwnProperty.call(updates, k)) patch[k] = updates[k];
            }
        }
        if (Object.keys(patch).length === 0) {
            return { success: false, message: 'No valid fields to update' };
        }
        const student = await StudentModel.findOneAndUpdate({ id: studentId }, { $set: patch }, { new: true }).exec();
        if (!student) return { success: false, message: 'Student not found' };
        return { success: true, message: 'Profile updated successfully' };
    }
};

module.exports = studentService;