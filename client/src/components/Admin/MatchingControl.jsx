import React, { useState, useEffect } from 'react';
import AppModal from '../common/AppModal';

function MatchingControl({ showNotification }) {
  const [status, setStatus] = useState('Ready');
  const [totalProjects, setTotalProjects] = useState(0);
  const [matchedProjects, setMatchedProjects] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // 從數據庫獲取真實統計數據
  const fetchStats = async () => {
    try {
      // 獲取項目總數
      const projResp = await fetch('/api/admin/all-projects');
      const projJson = await projResp.json();
      const projects = projJson.projects || [];
      const projectCount = projects.length;

      // 獲取配對結果
      const resResp = await fetch('/api/match/results');
      const resJson = await resResp.json();
      const results = resJson.results || [];
      const matched = results.filter(r => r.studentId).length;

      setTotalProjects(projectCount);
      setMatchedProjects(matched);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // 組件載入時獲取初始數據
  useEffect(() => {
    fetchStats();
  }, []);

  const runStartMatching = async () => {
    try {
      showNotification('Start Matching...', 'info');
      setStatus('Running');

      const runResp = await fetch('/api/match/run', { method: 'POST' });
      const runResult = await runResp.json();
      if (!runResp.ok) {
        throw new Error(runResult && runResult.message ? runResult.message : 'Match run failed');
      }

      await fetchStats();
      setStatus('Completed');

      showNotification(`Matching completed`, 'success');
    } catch (err) {
      console.error('Matching error:', err);
      setStatus('Error');
      showNotification(`Matching failed: ${err.message || err}`, 'error');
    }
  };

  const startMatching = () => {
    setConfirmDialog({
      title: 'Start matching',
      message:
        'Start matching algorithm? This will assign students to projects based on preferences and GPA.',
      primaryLabel: 'Start',
      onConfirm: () => {
        setConfirmDialog(null);
        runStartMatching();
      },
    });
  };

  const runResetServer = async () => {
    try {
      showNotification('Resetting server state...', 'info');
      setStatus('Running');
      const resp = await fetch('/api/admin/reset', { method: 'POST' });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json && json.message ? json.message : 'Reset failed');

      await fetchStats();
      setStatus('Ready');
      showNotification(json.message || 'Server reset completed', 'success');
    } catch (err) {
      console.error('Reset error:', err);
      setStatus('Error');
      showNotification(`Reset failed: ${err.message || err}`, 'error');
    }
  };

  const resetServer = () => {
    setConfirmDialog({
      title: 'Reset server state',
      message:
        'Reset server state? This will clear all preferences and assignments.',
      primaryLabel: 'Reset',
      onConfirm: () => {
        setConfirmDialog(null);
        runResetServer();
      },
    });
  };

  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>Matching Control</h1>
      </div>

      <div className="matching-control-panel">
        <h2>Matching System Control</h2>
        
        <div className="phase-info">
          <div className="current-phase">
            <strong>Current Stage:</strong> 
            <span className="phase-dates">
              2024-03-21 00:01 [Init: 2024-04-05 23:39]
            </span>
          </div>
        </div>

        <div className="control-buttons">
          <button className="btn-primary" onClick={startMatching}>Start Matching</button>
          <button className="btn-danger" onClick={resetServer} style={{ marginLeft: '8px' }}>Reset Server</button>
          <button className="btn-secondary" onClick={fetchStats} style={{ marginLeft: '8px' }}>Refresh Stats</button>
        </div>

        <div className="live-statistics">
          <h3>Live Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Matched Projects:</span>
              <span className="stat-value">{matchedProjects}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Available Projects:</span>
              <span className="stat-value">{totalProjects}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Matching Algorithm Status:</span>
              <span className={`stat-value ${status === 'Ready' ? 'status-ready' : status === 'Running' ? 'status-running' : status === 'Completed' ? 'status-completed' : 'status-error'}`}>{status}</span>
            </div>
          </div>
        </div>
      </div>

      <AppModal
        open={!!confirmDialog}
        title={confirmDialog?.title || ''}
        onClose={() => setConfirmDialog(null)}
        footer="actions"
        primaryLabel={confirmDialog?.primaryLabel || 'Confirm'}
        onPrimary={() => confirmDialog?.onConfirm?.()}
        onSecondary={() => {}}
      >
        <p>{confirmDialog?.message}</p>
      </AppModal>
    </section>
  );
}

export default MatchingControl;

