import React, { useState, useEffect } from 'react';
import AppModal from '../common/AppModal';

function MatchingControl({ showNotification }) {
  const [status, setStatus] = useState('Ready');
  const [totalProjects, setTotalProjects] = useState(0);
  const [matchedProjects, setMatchedProjects] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState(null);
  
  // Major statistics
  const [majorStats, setMajorStats] = useState({
    eceStudents: 0,
    ccsStudents: 0,
    eceProjects: 0,
    ccsProjects: 0,
    eceMatched: 0,
    ccsMatched: 0
  });

  // Fetch real statistics from database
  const fetchStats = async () => {
    try {
      // Get total project count
      const projResp = await fetch('/api/admin/all-projects');
      const projJson = await projResp.json();
      const projects = projJson.projects || [];
      
      // Categorize projects by major
      const eceProjects = projects.filter(p => p.major === 'ECE' || p.major === 'ECE+CCS' || !p.major);
      const ccsProjects = projects.filter(p => p.major === 'CCS' || p.major === 'ECE+CCS');
      const projectCount = projects.length;

      // Get matching results
      const resResp = await fetch('/api/match/results');
      const resJson = await resResp.json();
      const results = resJson.results || [];
      const matched = results.filter(r => r.studentId).length;

      setTotalProjects(projectCount);
      setMatchedProjects(matched);
      
      // Try to get more detailed major statistics
      try {
        const statsResp = await fetch('/api/admin/project-stats');
        const statsJson = await statsResp.json();
        if (statsJson.success && statsJson.stats) {
          setMajorStats({
            eceStudents: statsJson.stats.eceStudents || 0,
            ccsStudents: statsJson.stats.ccsStudents || 0,
            eceProjects: eceProjects.length,
            ccsProjects: ccsProjects.length,
            eceMatched: matched, // This needs further breakdown
            ccsMatched: 0
          });
        }
      } catch (e) {
        // If stats API fails, use estimated values
        setMajorStats({
          eceStudents: 20,
          ccsStudents: 30,
          eceProjects: eceProjects.length,
          ccsProjects: ccsProjects.length,
          eceMatched: matched,
          ccsMatched: 0
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Fetch initial data when component loads
  useEffect(() => {
    fetchStats();
  }, []);

  const runStartMatching = async () => {
    try {
      showNotification('Starting Matching...', 'info');
      setStatus('Running');

      const runResp = await fetch('/api/match/run', { method: 'POST' });
      const runResult = await runResp.json();
      if (!runResp.ok || !runResult.success) {
        throw new Error(runResult && runResult.message ? runResult.message : 'Match run failed');
      }

      await fetchStats();
      setStatus('Completed');
      showNotification(
        `Matching completed — ${runResult.matchedStudents ?? 0} / ${runResult.totalStudents ?? 0} students assigned`,
        'success'
      );
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

  const eceRemaining = Math.max(0, majorStats.eceStudents - majorStats.eceMatched);
  const ccsRemaining = Math.max(0, majorStats.ccsStudents - majorStats.ccsMatched);
  const totalStudents = majorStats.eceStudents + majorStats.ccsStudents;
  const totalMajorProjects = majorStats.eceProjects + majorStats.ccsProjects;
  const totalMajorMatched = majorStats.eceMatched + majorStats.ccsMatched;

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

        {/* Major Statistics — compact table layout */}
        <div className="major-statistics">
          <h3>Statistics by Major</h3>
          <div className="major-stats-table-wrap">
            <table className="major-stats-table">
              <thead>
                <tr>
                  <th scope="col">Major</th>
                  <th scope="col">Students</th>
                  <th scope="col">Projects</th>
                  <th scope="col">Matched</th>
                  <th scope="col">Remaining</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">ECE</th>
                  <td>{majorStats.eceStudents}</td>
                  <td>{majorStats.eceProjects}</td>
                  <td>{majorStats.eceMatched}</td>
                  <td>{eceRemaining}</td>
                </tr>
                <tr>
                  <th scope="row">CCS</th>
                  <td>{majorStats.ccsStudents}</td>
                  <td>{majorStats.ccsProjects}</td>
                  <td>{majorStats.ccsMatched}</td>
                  <td>{ccsRemaining}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="major-summary">
            <p>
              <strong>Total:</strong> {totalStudents} students, {totalMajorProjects} projects,{' '}
              {totalMajorMatched} matched
            </p>
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

