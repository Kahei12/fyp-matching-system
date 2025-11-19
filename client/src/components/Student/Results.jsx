import React from 'react';

function Results() {
  return (
    <section className="content-section active">
      <div className="section-header">
        <div className="results-status">
          Status: <strong>Pending</strong>
        </div>
      </div>

      <div className="assignment-result">
        <div className="result-card">
          <div className="result-icon">⌛</div>
          <div className="result-content">
            <h3>Assignment Pending</h3>
            <p>Your project assignment will be announced after the matching phase completes.</p>
            <p className="result-date">Expected announcement: 2025-04-20</p>
          </div>
        </div>
      </div>

      <div className="statistics-section">
        <h3>Matching Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Students:</span>
            <span className="stat-value">150</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Projects Available:</span>
            <span className="stat-value">45</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Preferences Submitted:</span>
            <span className="stat-value">143</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Results;

