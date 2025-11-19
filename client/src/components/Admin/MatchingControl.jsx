import React from 'react';

function MatchingControl({ showNotification }) {
  const startMatching = () => {
    if (window.confirm('Start matching algorithm? This will assign students to projects based on preferences and GPA.')) {
      showNotification('Matching algorithm started...', 'info');
      
      setTimeout(() => {
        showNotification('Matching completed! 84% success rate (38/45 projects matched)', 'success');
      }, 3000);
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
            <strong>Current Phase:</strong> 
            <span className="phase-dates">
              2024-03-21 00:01 [Init: 2024-04-05 23:39]
            </span>
          </div>
        </div>

        <div className="control-buttons">
          <button className="btn-primary" onClick={startMatching}>Start Matching</button>
          <button className="btn-secondary" onClick={showAdvancedSettings}>Advanced Setting</button>
        </div>

        <div className="live-statistics">
          <h3>Live Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Students:</span>
              <span className="stat-value">150</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Submitted Preferences:</span>
              <span className="stat-value">143</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Available Projects:</span>
              <span className="stat-value">45</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Matching Algorithm Status:</span>
              <span className="stat-value status-ready">Ready</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Estimated Completion:</span>
              <span className="stat-value">2024-04-06 12:00</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MatchingControl;

