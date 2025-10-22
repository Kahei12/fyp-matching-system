import React from 'react';

function Dashboard({ preferences, onSwitchSection }) {
  const preferencesCount = preferences?.length || 0;
  
  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>Student Dashboard</h1>
        <div className="phase-indicator">
          Current Phase: <strong>Proposal Phase</strong>
        </div>
      </div>

      {/* 狀態卡片 */}
      <div className="status-cards">
        <div className="status-card">
          <div className="status-icon">📝</div>
          <div className="status-content">
            <h3>Proposal Status</h3>
            <p className="status-value">Not Submitted</p>
            <button className="action-btn">Submit Proposal</button>
          </div>
        </div>
        
        <div className="status-card">
          <div className="status-icon">⭐</div>
          <div className="status-content">
            <h3>Preferences</h3>
            <p className="status-value">{preferencesCount}/5 Selected</p>
            <button className="action-btn" onClick={() => onSwitchSection('project-browse')}>
              Browse Projects
            </button>
          </div>
        </div>
        
        <div className="status-card">
          <div className="status-icon">📋</div>
          <div className="status-content">
            <h3>Assignment</h3>
            <p className="status-value">Not Assigned</p>
            <button className="action-btn" onClick={() => onSwitchSection('results')}>
              View Status
            </button>
          </div>
        </div>
      </div>

      {/* 截止日期提醒 */}
      <div className="deadline-reminder">
        <h3>⏰ Upcoming Deadlines</h3>
        <div className="deadline-list">
          <div className="deadline-item">
            <span className="deadline-name">Proposal Submission</span>
            <span className="deadline-date">2025-03-20 23:59</span>
            <span className="deadline-days">15 days left</span>
          </div>
          <div className="deadline-item">
            <span className="deadline-name">Preference Selection</span>
            <span className="deadline-date">2025-04-15 22:59</span>
            <span className="deadline-days">41 days left</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;

