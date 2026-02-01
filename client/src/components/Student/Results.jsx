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
        
        console.log('[Results] Match results data:', data);
        
        if (resp.ok && data.success) {
          const results = data.results || [];
          const matchingCompleted = data.matchingCompleted || false;
          
          // 查找當前學生的分配結果
          const my = results.find(r => r.studentId === studentId);
          
          if (my && my.studentId && my.title) {
            setAssignment({
              title: my.title,
              supervisor: my.supervisor || 'TBD',
              studentId: my.studentId,
              studentGpa: my.studentGpa || 'N/A',
              assignedAt: my.assignedAt || new Date().toISOString()
            });
            setStatusText('Assigned');
            return;
          }
          
          // 如果匹配已完成但沒有分配
          if (matchingCompleted) {
            setAssignment(null);
            setStatusText('Unassigned');
            return;
          }
        }
        
        // 如果匹配未完成，顯示 pending
        setAssignment(null);
        setStatusText('Pending');
      } catch (err) {
        console.error('Fetch match results error:', err);
        setAssignment(null);
        setStatusText('Pending');
      }
    };

    fetchAssignment();
    
    // 每 5 秒刷新一次結果（可選）
    const interval = setInterval(fetchAssignment, 5000);
    return () => clearInterval(interval);
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

