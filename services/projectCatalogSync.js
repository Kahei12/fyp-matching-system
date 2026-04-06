/**
 * Maps each catalogue project (by numeric id) to supervisor display name + t00X email.
 * CCS teachers (t001–t004): Bell Liu, Alex Foster, Farah Khan, Adam Lee → projects 1–15
 * ECE teachers (t005–t008): Hugh Wang, Steven Chen, Tabitha Ng, Yaru Zhang → projects 16–30
 *
 * CRITICAL: mockData.js hardcoded supervisors are IGNORED — this mapping is the ONLY
 * source of truth. Apply happens at mockData require-time and during seed catalog sync.
 */
const TEACHER_BY_PROJECT_ID = {
  // ── CCS Projects (1–15) ─────────────────────────────────────────────────────
  1:  { supervisor: 'Prof. Bell Liu',    supervisorId: 'T001', supervisorEmail: 't001@hkmu.edu.hk' },
  2:  { supervisor: 'Prof. Alex Foster', supervisorId: 'T002', supervisorEmail: 't002@hkmu.edu.hk' },
  3:  { supervisor: 'Prof. Alex Foster', supervisorId: 'T002', supervisorEmail: 't002@hkmu.edu.hk' },
  4:  { supervisor: 'Prof. Farah Khan',  supervisorId: 'T003', supervisorEmail: 't003@hkmu.edu.hk' },
  5:  { supervisor: 'Prof. Farah Khan',  supervisorId: 'T003', supervisorEmail: 't003@hkmu.edu.hk' },
  6:  { supervisor: 'Prof. Bell Liu',    supervisorId: 'T001', supervisorEmail: 't001@hkmu.edu.hk' },
  7:  { supervisor: 'Prof. Bell Liu',    supervisorId: 'T001', supervisorEmail: 't001@hkmu.edu.hk' },
  8:  { supervisor: 'Prof. Alex Foster', supervisorId: 'T002', supervisorEmail: 't002@hkmu.edu.hk' },
  9:  { supervisor: 'Prof. Adam Lee',   supervisorId: 'T004', supervisorEmail: 't004@hkmu.edu.hk' },
  10: { supervisor: 'Prof. Farah Khan', supervisorId: 'T003', supervisorEmail: 't003@hkmu.edu.hk' },
  11: { supervisor: 'Prof. Bell Liu',   supervisorId: 'T001', supervisorEmail: 't001@hkmu.edu.hk' },
  12: { supervisor: 'Prof. Adam Lee',   supervisorId: 'T004', supervisorEmail: 't004@hkmu.edu.hk' },
  13: { supervisor: 'Prof. Bell Liu',   supervisorId: 'T001', supervisorEmail: 't001@hkmu.edu.hk' },
  14: { supervisor: 'Prof. Alex Foster', supervisorId: 'T002', supervisorEmail: 't002@hkmu.edu.hk' },
  15: { supervisor: 'Prof. Adam Lee',   supervisorId: 'T004', supervisorEmail: 't004@hkmu.edu.hk' },

  // ── ECE Projects (16–30) ─────────────────────────────────────────────────────
  16: { supervisor: 'Prof. Hugh Wang',    supervisorId: 'T005', supervisorEmail: 't005@hkmu.edu.hk' },
  17: { supervisor: 'Prof. Hugh Wang',    supervisorId: 'T005', supervisorEmail: 't005@hkmu.edu.hk' },
  18: { supervisor: 'Prof. Yaru Zhang',   supervisorId: 'T008', supervisorEmail: 't008@hkmu.edu.hk' },
  19: { supervisor: 'Prof. Tabitha Ng',   supervisorId: 'T007', supervisorEmail: 't007@hkmu.edu.hk' },
  20: { supervisor: 'Prof. Tabitha Ng',   supervisorId: 'T007', supervisorEmail: 't007@hkmu.edu.hk' },
  21: { supervisor: 'Prof. Hugh Wang',   supervisorId: 'T005', supervisorEmail: 't005@hkmu.edu.hk' },
  22: { supervisor: 'Prof. Yaru Zhang',   supervisorId: 'T008', supervisorEmail: 't008@hkmu.edu.hk' },
  23: { supervisor: 'Prof. Yaru Zhang',   supervisorId: 'T008', supervisorEmail: 't008@hkmu.edu.hk' },
  24: { supervisor: 'Prof. Tabitha Ng',   supervisorId: 'T007', supervisorEmail: 't007@hkmu.edu.hk' },
  25: { supervisor: 'Prof. Yaru Zhang',   supervisorId: 'T008', supervisorEmail: 't008@hkmu.edu.hk' },
  26: { supervisor: 'Prof. Hugh Wang',    supervisorId: 'T005', supervisorEmail: 't005@hkmu.edu.hk' },
  27: { supervisor: 'Prof. Yaru Zhang',   supervisorId: 'T008', supervisorEmail: 't008@hkmu.edu.hk' },
  28: { supervisor: 'Prof. Steven Chen',  supervisorId: 'T006', supervisorEmail: 't006@hkmu.edu.hk' },
  29: { supervisor: 'Prof. Tabitha Ng',   supervisorId: 'T007', supervisorEmail: 't007@hkmu.edu.hk' },
  30: { supervisor: 'Prof. Yaru Zhang',   supervisorId: 'T008', supervisorEmail: 't008@hkmu.edu.hk' },
};

function applySupervisorsToMockProjects(projects) {
  return (projects || []).map((p) => {
    const m = TEACHER_BY_PROJECT_ID[p.id];
    if (!m || p.type === 'student') return p;
    return { ...p, ...m };
  });
}

module.exports = { TEACHER_BY_PROJECT_ID, applySupervisorsToMockProjects };
