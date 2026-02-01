import React, { useState } from 'react';

function MatchingControl({ showNotification }) {
  const [status, setStatus] = useState('Ready');
  const [totalProjects, setTotalProjects] = useState(0);
  const [matchedProjects, setMatchedProjects] = useState(0);

  const startMatching = async () => {
    if (!window.confirm('Start matching algorithm? This will assign students to projects based on preferences and GPA.')) return;

    try {
      showNotification('Start Matching...', 'info');
      setStatus('Running');

      const runResp = await fetch('/api/match/run', { method: 'POST' });
      const runResult = await runResp.json();
      if (!runResp.ok) {
        throw new Error(runResult && runResult.message ? runResult.message : 'Match run failed');
      }

      // fetch results to compute stats
      const resResp = await fetch('/api/match/results');
      const resJson = await resResp.json();
      if (!resResp.ok || !resJson.success) {
        throw new Error('Failed to load match results');
      }

      const results = resJson.results || [];
      const total = results.length;
      const matched = results.filter(r => r.studentId).length;

      setTotalProjects(total);
      setMatchedProjects(matched);
      setStatus('Completed');

      showNotification(`Matching completed ${matched}/${total} projects matched`, 'success');
    } catch (err) {
      console.error('Matching error:', err);
      setStatus('Error');
      showNotification(`Matching failed: ${err.message || err}`, 'error');
    }
  };

  const resetServer = async () => {
    if (!window.confirm('Reset server state? This will clear all preferences and assignments.')) return;
    try {
      showNotification('Resetting server state...', 'info');
      setStatus('Running');
      const resp = await fetch('/api/admin/reset', { method: 'POST' });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json && json.message ? json.message : 'Reset failed');

      // refresh results/stats
      const resResp = await fetch('/api/match/results');
      const resJson = await resResp.json();
      const results = resJson.results || [];
      const total = results.length;
      const matched = results.filter(r => r.studentId).length;
      setTotalProjects(total);
      setMatchedProjects(matched);
      setStatus('Ready');
      showNotification(json.message || 'Server reset completed', 'success');
    } catch (err) {
      console.error('Reset error:', err);
      setStatus('Error');
      showNotification(`Reset failed: ${err.message || err}`, 'error');
    }
  };

  const showAdvancedSettings = () => {
    showNotification('Advanced settings panel opened', 'info');
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
          <button className="btn-secondary" onClick={showAdvancedSettings}>Advanced Setting</button>
          <button className="btn-danger" onClick={resetServer} style={{ marginLeft: '8px' }}>Reset Server</button>
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
              <span className="stat-value">{totalProjects || 45}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Matching Algorithm Status:</span>
              <span className={`stat-value ${status === 'Ready' ? 'status-ready' : status === 'Running' ? 'status-running' : status === 'Completed' ? 'status-completed' : 'status-error'}`}>{status}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MatchingControl;

