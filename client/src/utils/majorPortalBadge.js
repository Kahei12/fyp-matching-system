/**
 * Short label for sidebar: Student Portal (CCS) / Teacher Portal (ECE+CCS)
 */
export function majorToPortalBadge(major) {
  if (major == null || major === '') return '—';
  const m = String(major).trim();
  if (m === 'ECE') return 'ECE';
  if (m === 'CCS') return 'CCS';
  if (m === 'ECE+CCS') return 'ECE+CCS';
  const lower = m.toLowerCase();
  if (lower.includes('computer and cyber security') && lower.includes('electronics')) return 'ECE+CCS';
  if (lower.includes('computer and cyber security')) return 'CCS';
  if (lower.includes('electronics and computer engineering')) return 'ECE';
  if (lower.includes('computer science')) return 'CCS';
  return '—';
}
