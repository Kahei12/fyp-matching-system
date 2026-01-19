import React, { useEffect, useState } from 'react';

function Results() {
  const [assignment, setAssignment] = useState(null);
  const [statusText, setStatusText] = useState('Pending');

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const studentId = sessionStorage.getItem('studentId') || 'S001';
    // get match results
        const resp = await fetch('/api/match/results');
        const data = await resp.json();
        if (resp.ok && data.success && data.matchingCompleted) {
          const results = data.results || [];
          const my = results.find(r => r.studentId === studentId);
          if (my && my.studentId) {
            setAssignment(my);
            setStatusText('Assigned');
            return;
          }
        }
        // if matching not completed or no assignment, remain pending
        setAssignment(null);
        setStatusText(data && data.matchingCompleted ? 'Unassigned' : 'Pending');
      } catch (err) {
        console.error('Fetch match results error:', err);
        setAssignment(null);
        setStatusText('Pending');
      }
    };

    fetchAssignment();
  }, []);

  return (
    <section className="content-section active">
      <div className="section-header">
        <div className="results-status">
          Status: <strong>{statusText}</strong>
        </div>
      </div>

      <div className="assignment-result">
        {assignment ? (
          <div className="result-card">
            <div className="result-icon">✅</div>
            <div className="result-content">
              <h3>Assigned: {assignment.title}</h3>
              <p>Supervisor: {assignment.supervisor}</p>
              <p>Student ID: {assignment.studentId}</p>
              <p>GPA: {assignment.studentGpa || 'N/A'}</p>
              <p className="result-date">Assigned at: {assignment.assignedAt || 'N/A'}</p>
            </div>
          </div>
        ) : (
          <div className="result-card">
            <div className="result-icon">⌛</div>
            <div className="result-content">
              <h3>Assignment Pending</h3>
              <p>Your project assignment will be announced after the matching phase completes.</p>
              <p className="result-date">Expected announcement: 2025-04-20</p>
            </div>
          </div>
        )}
      </div>

      <div className="statistics-section">
        <h3>Matching Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Projects Available:</span>
            <span className="stat-value">45</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Your Preferences:</span>
            <span className="stat-value">--</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Results;

