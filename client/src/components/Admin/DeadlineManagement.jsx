import React, { useState, useEffect, useCallback } from 'react';
import AppModal from '../common/AppModal';

const PHASE_CONFIG = [
  {
    key: 'proposal',
    adminKey: 'proposal',
    title: 'Proposal Phase',
    description: 'Submit your project proposal',
  },
  {
    key: 'matching',
    adminKey: 'preference',
    title: 'Matching Phase',
    description: 'Select your project preferences',
  },
  {
    key: 'project',
    adminKey: 'results',
    title: 'Project Management',
    description: 'Submit project updates and reviews',
  },
];

function toDatetimeLocalValue(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDeadlineDisplay(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DeadlineManagement({ showNotification }) {
  const [deadlines, setDeadlines] = useState({});
  const [loading, setLoading] = useState(true);
  const [editPhase, setEditPhase] = useState(null);
  const [draftLocal, setDraftLocal] = useState('');
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

  const openEdit = (phase) => {
    const adminKey = PHASE_CONFIG.find((p) => p.key === phase)?.adminKey;
    const iso = adminKey ? deadlines[adminKey] : null;
    setEditPhase(phase);
    setDraftLocal(iso ? toDatetimeLocalValue(iso) : '');
  };

  const handleSaveDeadline = async () => {
    if (!editPhase) return;
    const cfg = PHASE_CONFIG.find((p) => p.key === editPhase);
    if (!cfg) return;
    if (!draftLocal) {
      showNotification('Please choose a date and time', 'error');
      return;
    }

    const picked = new Date(draftLocal);
    if (Number.isNaN(picked.getTime())) {
      showNotification('Invalid date', 'error');
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

  const activeCfg = editPhase ? PHASE_CONFIG.find((p) => p.key === editPhase) : null;

  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>Deadline Management</h1>
      </div>

      <div className="deadline-management-panel">
        <div className="management-header">
          <h2>System Deadlines</h2>
          <p>Manage deadlines for different phases of the FYP matching process.</p>
        </div>

        {loading ? (
          <p style={{ color: '#6c757d', padding: '0.5rem 0' }}>Loading deadlines…</p>
        ) : (
          <div className="deadline-list-admin">
            {PHASE_CONFIG.map((phase) => {
              const iso = deadlines[phase.adminKey];
              return (
                <div key={phase.key} className="deadline-card">
                  <div className="deadline-header">
                    <h3>{phase.title}</h3>
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
                      <strong>Overview</strong>
                      <div className="deadline-date">
                        {iso ? formatDeadlineDisplay(iso) : 'Not set'}
                      </div>
                      <p className="deadline-description">{phase.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="deadline-tips">
          <h3>Tips for Setting Deadlines</h3>
          <ul>
            <li>Set realistic deadlines that give students and teachers sufficient time</li>
            <li>Consider weekends and holidays when setting deadlines</li>
            <li>Communicate any deadline changes to all users</li>
            <li>Student and teacher pages read these values from the server when you save</li>
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
        <p style={{ marginBottom: '1rem' }}>{activeCfg?.description}</p>
        <label className="app-modal-form-label" htmlFor="deadline-datetime">
          New deadline <span className="required">*</span>
        </label>
        <input
          id="deadline-datetime"
          type="datetime-local"
          className="app-modal-input"
          value={draftLocal}
          onChange={(e) => setDraftLocal(e.target.value)}
          disabled={saving}
        />
      </AppModal>
    </section>
  );
}

export default DeadlineManagement;
