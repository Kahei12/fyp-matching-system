import React, { useState, useEffect, useCallback } from 'react';
import AppModal from '../common/AppModal';

const STUDENT_PORTAL_PHASES = [
  {
    key: 'studentSelfProposal',
    adminKey: 'studentSelfProposal',
    title: 'Student Self-proposal',
    description: 'Students can submit their own project proposals.',
    hint: 'Students submit self-proposed project topics.',
  },
  {
    key: 'preference',
    adminKey: 'preference',
    title: 'Project Preference Selection',
    description: 'Students select and rank their preferred projects.',
    hint: 'Students select project preferences.',
  },
];

const TEACHER_PORTAL_PHASES = [
  {
    key: 'teacherProposalReview',
    adminKey: 'teacherProposalReview',
    title: 'Student Proposal Review',
    description: 'Teachers review and approve/reject student-proposed projects.',
    hint: 'Teachers approve or reject student proposals.',
  },
  {
    key: 'teacherSelfProposal',
    adminKey: 'teacherSelfProposal',
    title: 'Teacher Self-proposal',
    description: 'Teachers can create and publish their own project topics.',
    hint: 'Teachers create their own project topics.',
  },
];

const ALL_PHASE_KEYS = [...STUDENT_PORTAL_PHASES, ...TEACHER_PORTAL_PHASES];

function formatDeadlineDisplay(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isExpired(iso) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

function parseDraftDeadline(s) {
  const trimmed = String(s || '').trim();
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[\sT](\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  const d = new Date(y, mo, da, h, mi, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== da) return null;
  return d;
}

/** Parse "YYYY-MM-DD" from a date input value and combine with hour + minute. Returns a local Date. */
function combinePickerToDate(dateStr, hour, minute) {
  if (!dateStr || hour === '' || minute === '') return null;
  const h = Number(hour);
  const mi = Number(minute);
  if (Number.isNaN(h) || Number.isNaN(mi)) return null;
  const d = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/** Extract date + time parts from an ISO string for the date input + selects. */
function toPickerParts(iso) {
  if (!iso) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return {
      date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      hour: '23',
      minute: '59',
    };
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return {
      date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      hour: '23',
      minute: '59',
    };
  }
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    hour: pad(d.getHours()),
    minute: pad(d.getMinutes()),
  };
}

function DeadlineManagement({ showNotification }) {
  const [deadlines, setDeadlines] = useState({});
  const [loading, setLoading] = useState(true);
  const [editPhase, setEditPhase] = useState(null);
  const [draftDate, setDraftDate] = useState('');
  const [draftHour, setDraftHour] = useState('23');
  const [draftMinute, setDraftMinute] = useState('59');
  const [saving, setSaving] = useState(false);

  const loadDeadlines = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/deadlines');
      const data = await res.json();
      if (data.success && data.deadlines) {
        setDeadlines(data.deadlines);
      }
    } catch (e) {
      console.error(e);
      showNotification('Failed to load deadlines', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadDeadlines();
  }, [loadDeadlines]);

  const openEdit = (phaseKey) => {
    const cfg = ALL_PHASE_KEYS.find((p) => p.key === phaseKey);
    if (!cfg) return;
    const iso = deadlines[cfg.adminKey];
    const parts = toPickerParts(iso);
    setEditPhase(phaseKey);
    setDraftDate(parts.date);
    setDraftHour(parts.hour);
    setDraftMinute(parts.minute);
  };

  const handleSaveDeadline = async () => {
    if (!editPhase) return;
    const cfg = ALL_PHASE_KEYS.find((p) => p.key === editPhase);
    if (!cfg) return;
    const picked = combinePickerToDate(draftDate, draftHour, draftMinute);
    if (!picked) {
      showNotification('Please select a complete date and time', 'error');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch('/api/admin/deadlines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [cfg.adminKey]: picked.toISOString() }),
      });
      const data = await res.json();
      if (data.success && data.deadlines) {
        setDeadlines(data.deadlines);
        showNotification(
          `${cfg.title} deadline updated to ${formatDeadlineDisplay(data.deadlines[cfg.adminKey])}`,
          'success'
        );
        setEditPhase(null);
      } else {
        showNotification(data.message || 'Update failed', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Failed to save deadline', 'error');
    } finally {
      setSaving(false);
    }
  };

  const activeCfg = editPhase ? ALL_PHASE_KEYS.find((p) => p.key === editPhase) : null;

  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>Deadline Management</h1>
      </div>

      <div className="deadline-management-panel">
        <div className="management-header">
          <h2>System Deadlines</h2>
          <p>
            Manage deadlines for the student and teacher portals. Expired deadlines are shown in red.
          </p>
        </div>

        {loading ? (
          <p style={{ color: '#6c757d', padding: '0.5rem 0' }}>Loading deadlines…</p>
        ) : (
          <>
            <div className="deadline-portal-section">
              <h3 className="deadline-portal-heading">Student portal</h3>
              <div className="deadline-list-admin">
                {STUDENT_PORTAL_PHASES.map((phase) => {
                  const iso = deadlines[phase.adminKey];
                  const expired = isExpired(iso);
                  return (
                    <div
                      key={phase.key}
                      className={`deadline-card${expired ? ' deadline-card-expired' : ''}`}
                    >
                      <div className="deadline-header">
                        <div className="deadline-title-row">
                          <h3>{phase.title}</h3>
                          {expired && <span className="deadline-expired-tag">Expired</span>}
                        </div>
                        <button
                          type="button"
                          className="btn-edit"
                          onClick={() => openEdit(phase.key)}
                        >
                          Edit
                        </button>
                      </div>
                      <div className="deadline-content">
                        <div className="deadline-overview">
                          <div
                            className={`deadline-date${expired ? ' deadline-date-expired' : ''}`}
                          >
                            {iso ? formatDeadlineDisplay(iso) : 'Not set'}
                          </div>
                          <p className="deadline-description">{phase.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="deadline-portal-section">
              <h3 className="deadline-portal-heading">Teacher portal</h3>
              <div className="deadline-list-admin">
                {TEACHER_PORTAL_PHASES.map((phase) => {
                  const iso = deadlines[phase.adminKey];
                  const expired = isExpired(iso);
                  return (
                    <div
                      key={phase.key}
                      className={`deadline-card${expired ? ' deadline-card-expired' : ''}`}
                    >
                      <div className="deadline-header">
                        <div className="deadline-title-row">
                          <h3>{phase.title}</h3>
                          {expired && <span className="deadline-expired-tag">Expired</span>}
                        </div>
                        <button
                          type="button"
                          className="btn-edit"
                          onClick={() => openEdit(phase.key)}
                        >
                          Edit
                        </button>
                      </div>
                      <div className="deadline-content">
                        <div className="deadline-overview">
                          <div
                            className={`deadline-date${expired ? ' deadline-date-expired' : ''}`}
                          >
                            {iso ? formatDeadlineDisplay(iso) : 'Not set'}
                          </div>
                          <p className="deadline-description">{phase.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div className="deadline-tips">
          <h3>Tips for Setting Deadlines</h3>
          <ul>
            <li>Set realistic deadlines that give students and teachers sufficient time</li>
            <li>Consider weekends and holidays when setting deadlines</li>
            <li>Communicate any deadline changes to all users</li>
            <li>
              Once the <strong>Student Proposal Review</strong> deadline passes,
              all pending proposals will be automatically rejected
            </li>
          </ul>
        </div>
      </div>

      <AppModal
        open={!!activeCfg}
        title={activeCfg ? `Edit deadline — ${activeCfg.title}` : ''}
        onClose={() => !saving && setEditPhase(null)}
        size="md"
        footer="actions"
        primaryLabel={saving ? 'Saving…' : 'Save'}
        secondaryLabel="Cancel"
        onPrimary={() => !saving && handleSaveDeadline()}
        onSecondary={() => {}}
      >
        <p style={{ marginBottom: '1rem' }}>{activeCfg?.hint}</p>
        <div className="deadline-picker-row">
          <div className="deadline-picker-group deadline-date-group">
            <label className="app-modal-form-label" htmlFor="deadline-date">
              Date <span className="required">*</span>
            </label>
            <input
              id="deadline-date"
              type="date"
              className="app-modal-input deadline-date-input"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="deadline-picker-group">
            <label className="app-modal-form-label" htmlFor="deadline-hour">
              Hour <span className="required">*</span>
            </label>
            <select
              id="deadline-hour"
              className="app-modal-input deadline-select"
              value={draftHour}
              onChange={(e) => setDraftHour(e.target.value)}
              disabled={saving}
            >
              <option value="">—</option>
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={String(i).padStart(2, '0')}>
                  {String(i).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
          <div className="deadline-picker-group">
            <label className="app-modal-form-label" htmlFor="deadline-minute">
              Minute <span className="required">*</span>
            </label>
            <select
              id="deadline-minute"
              className="app-modal-input deadline-select"
              value={draftMinute}
              onChange={(e) => setDraftMinute(e.target.value)}
              disabled={saving}
            >
              <option value="">—</option>
              {Array.from({ length: 60 }, (_, i) => (
                <option key={i} value={String(i).padStart(2, '0')}>
                  {String(i).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </AppModal>
    </section>
  );
}

export default DeadlineManagement;
