/**
 * One-time / idempotent seed: mock catalogue → MongoDB (projects, system settings, test accounts).
 * Safe to run on every server start: only inserts when collections are empty or upserts keyed docs.
 */
const bcrypt = require('bcryptjs');
const mockData = require('./mockData');
const { majorToFilterCode } = require('./majorMapping');
const { applySupervisorsToMockProjects } = require('./projectCatalogSync');

function escapeRegex(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mapMockStatus(s, type) {
  const x = String(s || '').toLowerCase();
  if (type === 'student') return 'Under Review';
  if (x === 'active' || x === 'approved') return 'Approved';
  return 'Approved';
}

function guessSupervisorEmail(p) {
  if (p.supervisorEmail && String(p.supervisorEmail).includes('@')) return p.supervisorEmail;
  if (p.supervisorId && /^t\d+$/i.test(String(p.supervisorId))) {
    return `${String(p.supervisorId).toLowerCase()}@hkmu.edu.hk`;
  }
  return 't001@hkmu.edu.hk';
}

function projectMajorForMock(p, index) {
  if (p.major) return majorToFilterCode(p.major) || 'CCS';
  // mockData now has explicit major on each project
  return p.major || 'CCS';
}

async function ensureSystemSettings(SystemSettings) {
  const d = mockData.system?.deadlines || {};
  await SystemSettings.findOneAndUpdate(
    { key: 'system' },
    {
      $setOnInsert: {
        key: 'system',
        deadlines: {
          studentSelfProposal: d.studentSelfProposal ? new Date(d.studentSelfProposal) : undefined,
          preference: d.preference ? new Date(d.preference) : undefined,
          teacherProposalReview: d.teacherProposalReview ? new Date(d.teacherProposalReview) : undefined,
          teacherSelfProposal: d.teacherSelfProposal ? new Date(d.teacherSelfProposal) : undefined,
        },
        matchingCompleted: !!mockData.system?.matchingCompleted,
        currentPhase: mockData.system?.currentPhase || 'preference',
      },
    },
    { upsert: true, new: true }
  ).exec();
}

async function ensureProjects(Project) {
  const count = await Project.countDocuments().exec();
  if (count > 0) {
    console.log(`✅ [seed] Projects already present (${count}), skip bulk insert`);
    return;
  }

  const catalogue = applySupervisorsToMockProjects(mockData.projects || []);
  const docs = catalogue.map((p, i) => {
    const type = p.type === 'student' ? 'student' : 'teacher';
    return {
      code: p.code || `P${p.id ?? i}`,
      title: p.title,
      description: p.description || '',
      skills: Array.isArray(p.skills) ? p.skills : [],
      capacity: p.capacity ?? 2,
      popularity: p.popularity ?? 0,
      type,
      category: p.category || 'General',
      department: 'FYP',
      major: projectMajorForMock(p, i),
      status: mapMockStatus(p.status, type),
      supervisor: p.supervisor || 'TBD',
      supervisorId: p.supervisorId || '',
      supervisorEmail: guessSupervisorEmail(p),
      proposedBy: p.proposedBy || undefined,
      proposedByName: p.proposedByName,
      proposedByEmail: p.proposedByEmail,
      proposalStatus: p.proposalStatus || 'pending',
      isActive: true,
    };
  });

  if (docs.length) {
    await Project.insertMany(docs);
    console.log(`✅ [seed] Inserted ${docs.length} projects from catalogue`);
  }
}

/** Bump when cohort definition changes — triggers one-time wipe + re-seed of s002–s050 */
const STUDENT_COHORT_TARGET_VERSION = 4;

/** Bump when catalogue supervisor/skills mapping must be pushed to existing Project docs */
const PROJECT_CATALOG_SYNC_TARGET_VERSION = 2;

function randomGpaForSeed() {
  const g = Math.random() * (3.8 - 2.5) + 2.5;
  return Math.round(g * 100) / 100;
}

const COHORT_FIRST_NAMES = [
  'James', 'Emily', 'Daniel', 'Sophie', 'Ryan', 'Chloe', 'Kevin', 'Yan', 'Marcus', 'Karen',
  'Jason', 'Michelle', 'Brian', 'Eric', 'Grace', 'Alex', 'Joanna', 'Peter', 'Natalie', 'Simon',
  'Andrew', 'Katie', 'Michael', 'Charlotte', 'Nathan', 'Vivian', 'David', 'Lucy', 'Thomas', 'Emma',
  'Jack', 'Olivia', 'William', 'Anna', 'Benjamin', 'Lily', 'Samuel', 'Rachel', 'Jonathan', 'Amy',
  'Patrick', 'Nicole', 'Matthew', 'Jessica', 'Anthony', 'Stephanie', 'Richard', 'Christine', 'Steven', 'Kelly',
];

const COHORT_LAST_NAMES = [
  'Chan', 'Wong', 'Lee', 'Ng', 'Cheung', 'Lam', 'Ho', 'Au', 'Tang', 'Yeung',
  'Lau', 'Chow', 'Fung', 'Kwan', 'Tsang', 'Yip', 'Mak', 'Leung', 'Cheng', 'Tam',
  'Smith', 'Brown', 'Johnson', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas',
  'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Lewis',
  'Walker', 'Hall', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Hill', 'Adams',
];

function cohortDisplayName(seqIndex) {
  const fi = seqIndex % COHORT_FIRST_NAMES.length;
  const li = (seqIndex * 17 + 3) % COHORT_LAST_NAMES.length;
  return `${COHORT_FIRST_NAMES[fi]} ${COHORT_LAST_NAMES[li]}`;
}

/**
 * One-time (per cohort version): remove all students except s001, then create s002–s050.
 * Majors: s001 (existing) CCS + s002–s025 CCS (24) + s026–s050 ECE (25) → 25 CCS / 25 ECE total.
 */
async function ensureStudentCohort(Student, SystemSettings) {
  let marker = await SystemSettings.findOne({ key: 'student_cohort' }).exec();
  if (marker && marker.cohortVersion >= STUDENT_COHORT_TARGET_VERSION) {
    return;
  }

  const CCS = 'Computer and Cyber Security';
  const ECE = 'Electronics and Computer Engineering';

  const removed = await Student.deleteMany({ id: { $ne: 's001' } }).exec();
  console.log(`🗑️ [seed] Removed ${removed.deletedCount} student(s) (kept s001 only)`);

  const bulk = [];
  for (let n = 2; n <= 50; n++) {
    const sid = `s${String(n).padStart(3, '0')}`;
    const seq = n - 2;
    const major = n <= 25 ? CCS : ECE;
    const pin = String(n).padStart(8, '0');
    const password = await bcrypt.hash(pin, 10);
    bulk.push({
      id: sid,
      name: cohortDisplayName(seq),
      email: `${sid}@hkmu.edu.hk`,
      password,
      gpa: randomGpaForSeed(),
      major,
      year: 'Year 4',
      preferences: [],
      proposalSubmitted: false,
      assignedProject: null,
      proposedProject: null,
      proposalApproved: false,
      proposalStatus: 'none',
      teacherNotes: [],
      mustChangePassword: false,
      initialPassword: pin,
    });
  }

  if (bulk.length) {
    await Student.insertMany(bulk);
    console.log(`✅ [seed] Inserted ${bulk.length} students (s002–s050), passwords 00000002–00000050, no forced password change`);
  }

  await SystemSettings.findOneAndUpdate(
    { key: 'student_cohort' },
    {
      $set: {
        key: 'student_cohort',
        cohortVersion: STUDENT_COHORT_TARGET_VERSION,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  ).exec();
}

async function ensureTestStudent(Student) {
  const password = await bcrypt.hash('00000000', 10);
  let student = await Student.findOne({ email: 's001@hkmu.edu.hk' }).exec();
  if (!student) {
    student = new Student({
      id: 's001',
      name: 'Chan Tai Man',
      email: 's001@hkmu.edu.hk',
      password,
      gpa: 3.45,
      major: 'Computer and Cyber Security',
      year: 'Year 4',
      preferences: [],
      proposalSubmitted: false,
      mustChangePassword: true,
      initialPassword: '00000000',
    });
    await student.save();
    console.log('✅ [seed] Created test student s001@hkmu.edu.hk');
    return;
  }
  student.id = 's001';
  student.major = 'Computer and Cyber Security';
  if (!student.password) {
    student.password = password;
    student.mustChangePassword = true;
    student.initialPassword = '00000000';
  }
  await student.save();
  console.log('✅ [seed] Test student s001 ensured (CCS)');
}

// ─── Seeded teachers (8) — align with projectCatalogSync / catalogue ───────────
const TEACHERS = [
  { teacherId: 't001', name: 'Prof. Bell Liu', email: 't001@hkmu.edu.hk', major: 'Computer and Cyber Security' },
  { teacherId: 't002', name: 'Prof. Alex Foster', email: 't002@hkmu.edu.hk', major: 'Computer and Cyber Security' },
  { teacherId: 't003', name: 'Prof. Farah Khan', email: 't003@hkmu.edu.hk', major: 'Computer and Cyber Security' },
  { teacherId: 't004', name: 'Prof. Adam Lee', email: 't004@hkmu.edu.hk', major: 'Computer and Cyber Security' },
  { teacherId: 't005', name: 'Prof. Hugh Wang', email: 't005@hkmu.edu.hk', major: 'Electronics and Computer Engineering' },
  { teacherId: 't006', name: 'Prof. Steven Chen', email: 't006@hkmu.edu.hk', major: 'Electronics and Computer Engineering' },
  { teacherId: 't007', name: 'Prof. Tabitha Ng', email: 't007@hkmu.edu.hk', major: 'Electronics and Computer Engineering' },
  { teacherId: 't008', name: 'Prof. Yaru Zhang', email: 't008@hkmu.edu.hk', major: 'Electronics and Computer Engineering' },
];

const TEACHER_EMAIL_ALLOWLIST = TEACHERS.map((t) => t.email.toLowerCase());

async function ensureTestTeacher(Teacher) {
  const removed = await Teacher.deleteMany({
    email: { $nin: TEACHER_EMAIL_ALLOWLIST },
  }).exec();
  if (removed.deletedCount) {
    console.log(`🗑️ [seed] Removed ${removed.deletedCount} teacher(s) not in catalogue allowlist`);
  }

  for (const t of TEACHERS) {
    const pin = String(parseInt(t.teacherId.replace(/\D/g, ''), 10) || 1).padStart(8, '0');
    const password = await bcrypt.hash(pin, 10);

    let teacher = await Teacher.findOne({
      email: { $regex: new RegExp(`^${escapeRegex(t.email)}$`, 'i') },
    }).exec();
    if (!teacher) {
      teacher = new Teacher({
        teacherId: t.teacherId,
        name: t.name,
        email: t.email,
        department: 'FYP',
        major: t.major,
        password,
        mustChangePassword: false,
        initialPassword: pin,
      });
      await teacher.save();
      console.log(`✅ [seed] Created teacher ${t.email} (${t.name})`);
    } else {
      teacher.teacherId = t.teacherId;
      teacher.name = t.name;
      teacher.major = t.major;
      teacher.password = password;
      teacher.mustChangePassword = false;
      teacher.initialPassword = pin;
      await teacher.save();
      console.log(`✅ [seed] Teacher ${t.email} updated (${t.name}, pin ${pin}, no forced password change)`);
    }
  }
}

/**
 * Push catalogue supervisor, skills, major onto existing MongoDB projects (by title).
 */
async function ensureProjectCatalogSynced(Project, SystemSettings) {
  let marker = await SystemSettings.findOne({ key: 'project_catalog' }).exec();
  if (marker && marker.catalogVersion >= PROJECT_CATALOG_SYNC_TARGET_VERSION) {
    return;
  }

  const catalogue = applySupervisorsToMockProjects(mockData.projects || []);
  let n = 0;
  for (const p of catalogue) {
    if (p.type === 'student') continue;
    const title = p.title;
    if (!title) continue;
    const major = projectMajorForMock(p, 0);
    const res = await Project.updateOne(
      { title },
      {
        $set: {
          supervisor: p.supervisor || 'TBD',
          supervisorId: p.supervisorId || '',
          supervisorEmail: (guessSupervisorEmail(p) || '').toLowerCase(),
          skills: Array.isArray(p.skills) ? p.skills : [],
          major,
        },
      }
    ).exec();
    if (res.matchedCount) n += 1;
  }

  await SystemSettings.findOneAndUpdate(
    { key: 'project_catalog' },
    {
      $set: {
        key: 'project_catalog',
        catalogVersion: PROJECT_CATALOG_SYNC_TARGET_VERSION,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  ).exec();

  console.log(`✅ [seed] Project catalogue sync v${PROJECT_CATALOG_SYNC_TARGET_VERSION}: updated ${n} project(s) by title`);
}

/**
 * Call when mongoose.connection.readyState === 1
 */
async function ensureDatabaseSeeded() {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) return;

  const Project = require('../models/Project');
  const Student = require('../models/Student');
  const Teacher = require('../models/Teacher');
  const SystemSettings = require('../models/SystemSettings');

  try {
    await ensureSystemSettings(SystemSettings);
    await ensureProjects(Project);
    await ensureProjectCatalogSynced(Project, SystemSettings);
    await ensureTestStudent(Student);
    await ensureStudentCohort(Student, SystemSettings);
    await ensureTestTeacher(Teacher);
  } catch (e) {
    console.error('❌ [seed] ensureDatabaseSeeded:', e.message);
  }
}

module.exports = { ensureDatabaseSeeded };
