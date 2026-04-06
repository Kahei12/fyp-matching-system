/**
 * Align with server services/majorMapping.js — programme → ECE / CCS / ECE+CCS
 */
export function majorToFilterCode(major) {
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
