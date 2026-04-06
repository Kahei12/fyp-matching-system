/**
 * Normalize programme majors to short codes for project filtering and APIs.
 * Supports legacy values (ECE/CCS), full names, and "Computer Science".
 */

function majorToFilterCode(major) {
  if (major == null || major === '') return '';
  const m = String(major).trim();
  if (m === 'ECE' || m === 'CCS' || m === 'ECE+CCS') return m;
  const lower = m.toLowerCase();
  if (lower.includes('computer and cyber security') && lower.includes('electronics')) return 'ECE+CCS';
  if (lower.includes('computer and cyber security')) return 'CCS';
  if (lower.includes('electronics and computer engineering')) return 'ECE';
  if (lower.includes('computer science')) return 'CCS';
  return '';
}

/** Teacher can see student proposal if majors align, or teacher is dual-programme. */
function majorsMatchForFilter(teacherMajor, studentMajor) {
  const tc = majorToFilterCode(teacherMajor);
  const sc = majorToFilterCode(studentMajor);
  if (!tc) return true;
  if (tc === 'ECE+CCS') return true;
  if (!sc) return true;
  return sc === tc;
}

module.exports = { majorToFilterCode, majorsMatchForFilter };
