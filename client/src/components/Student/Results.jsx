import React, { useEffect, useState } from 'react';
import {
  BellOutlineGlyph,
  CheckCircleGlyph,
  ClockOutlineGlyph,
} from '../common/StageGlyphs';
import { formatDateTime24 } from '../../utils/formatDateTime24';

function Results() {
  const [assignment, setAssignment] = useState(null);
  const [statusText, setStatusText] = useState('Pending');
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [lastAssignmentData, setLastAssignmentData] = useState(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchAssignment = async () => {
      try {
        const studentId = sessionStorage.getItem('studentId') || 's001';
        
        // Prevent concurrent / overlapping polls
        if (fetchAssignment._busy) return;
        fetchAssignment._busy = true;

        // Fetch from matching results API
        const resp = await fetch('/api/match/results');
        const data = await resp.json();
        
        if (!mounted) return;
        
        if (resp.ok && data.success) {
          const results = data.results || [];
          const matchingCompleted = data.matchingCompleted || false;
          
          // Find current student's assignment
          const my = results.find(r => r.studentId === studentId);
          
          // Also check from matched students API for real-time data
          const matchedResp = await fetch('/api/admin/matched-students');
          const matchedData = await matchedResp.json();
          if (!mounted) return;
          const isMatchedStudent = matchedData.success && matchedData.students 
            ? matchedData.students.find(s => s.id === studentId)
            : null;
          
          // Check if there's a change notification
          if (isMatchedStudent) {
            const currentAssignment = {
              title: isMatchedStudent.projectTitle,
              supervisor: isMatchedStudent.supervisor || 'TBD',
              studentId: isMatchedStudent.id,
              studentGpa: isMatchedStudent.gpa || 'N/A',
              assignedAt: isMatchedStudent.assignedAt || new Date().toISOString(),
              projectCode: isMatchedStudent.projectCode
            };
            
            if (lastAssignmentData && 
                lastAssignmentData.title !== currentAssignment.title) {
              setShowUpdateBanner(true);
              setNotificationMessage('Your matching result has been updated. Please check your new project assignment below.');
              setTimeout(() => setShowUpdateBanner(false), 10000);
            }
            
            setLastAssignmentData(currentAssignment);
            setAssignment(currentAssignment);
            setStatusText('Assigned');
            fetchAssignment._busy = false;
            return;
          }
          
          if (my && my.studentId && my.title) {
            const currentAssignment = {
              title: my.title,
              supervisor: my.supervisor || 'TBD',
              studentId: my.studentId,
              studentGpa: my.studentGpa || 'N/A',
              assignedAt: my.assignedAt || new Date().toISOString()
            };
            
            if (lastAssignmentData && 
                lastAssignmentData.title !== currentAssignment.title) {
              setShowUpdateBanner(true);
              setNotificationMessage('Your matching result has been updated. Please check your new project assignment below.');
              setTimeout(() => setShowUpdateBanner(false), 10000);
            }
            
            setLastAssignmentData(currentAssignment);
            setAssignment(currentAssignment);
            setStatusText('Assigned');
            fetchAssignment._busy = false;
            return;
          }
          
          if (lastAssignmentData && !isMatchedStudent && !my?.title) {
            setShowUpdateBanner(true);
            setNotificationMessage('Your previous project assignment has been cleared. Please wait patiently for the latest assignment from the admin.');
            setTimeout(() => setShowUpdateBanner(false), 10000);
            setLastAssignmentData(null);
          }
          
          if (matchingCompleted && !isMatchedStudent && !my?.title) {
            setAssignment(null);
            setStatusText('Unassigned');
            fetchAssignment._busy = false;
            return;
          }
        }
        
        setAssignment(null);
        setStatusText('Pending');
      } catch (err) {
        // Silently handle — network errors are normal during polling
      } finally {
        fetchAssignment._busy = false;
      }
    };

    fetchAssignment();
    
    const interval = setInterval(fetchAssignment, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissBanner = () => {
    setShowUpdateBanner(false);
  };

  return (
    <section className="content-section active">
      <div className="section-header">
        <div className="results-status">
          Status: <strong>{statusText}</strong>
        </div>
      </div>

      {/* Update notification banner */}
      {showUpdateBanner && notificationMessage && (
        <div className="update-banner">
          <div className="update-banner-icon" aria-hidden>
            <BellOutlineGlyph className="stage-glyph-svg result-banner-glyph" />
          </div>
          <div className="update-banner-content">
            <strong>Update Notice</strong>
            <p>{notificationMessage}</p>
          </div>
          <button className="update-banner-close" onClick={dismissBanner}>×</button>
        </div>
      )}

      <div className="assignment-result">
        {assignment ? (
          <div className="result-card assigned">
            <div className="result-icon" aria-hidden>
              <CheckCircleGlyph className="stage-glyph-svg result-card-glyph" />
            </div>
            <div className="result-content">
              <h3>Assigned: {assignment.title}</h3>
              <p>Supervisor: {assignment.supervisor}</p>
              <p>Student ID: {assignment.studentId}</p>
              <p>GPA: {assignment.studentGpa || 'N/A'}</p>
              <p className="result-date">Assigned at: {assignment.assignedAt ? formatDateTime24(new Date(assignment.assignedAt)) : 'N/A'}</p>
            </div>
          </div>
        ) : (
          <div className="result-card pending">
            <div className="result-icon" aria-hidden>
              <ClockOutlineGlyph className="stage-glyph-svg result-card-glyph" />
            </div>
            <div className="result-content">
              <h3>Assignment Pending</h3>
              <p>Your project assignment will be announced after the matching phase completes.</p>
              <p>Please wait patiently for the admin to process your assignment.</p>
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
            <span className="stat-value">--</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Your Preferences:</span>
            <span className="stat-value">--</span>
          </div>
        </div>
      </div>

      <style>{`
        .update-banner {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .update-banner-content {
          flex: 1;
        }
        
        .update-banner-content strong {
          display: block;
          margin-bottom: 0.25rem;
          font-size: 1rem;
        }
        
        .update-banner-content p {
          margin: 0;
          font-size: 0.9rem;
          opacity: 0.95;
        }
        
        .update-banner-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          transition: background 0.2s ease;
        }
        
        .update-banner-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .result-card {
          padding: 2rem;
          border-radius: 12px;
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }
        
        .result-card.assigned {
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
          border: 2px solid #27ae60;
        }
        
        .result-card.pending {
          background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);
          border: 2px solid #f39c12;
        }
        
        .result-icon {
          flex-shrink: 0;
          line-height: 0;
          color: #2c3e50;
        }

        .result-card-glyph {
          width: 3rem;
          height: 3rem;
        }

        .result-card.assigned .result-icon {
          color: #27ae60;
        }

        .result-card.pending .result-icon {
          color: #f39c12;
        }

        .update-banner-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
          flex-shrink: 0;
          color: rgba(255, 255, 255, 0.95);
        }

        .result-banner-glyph {
          width: 2rem;
          height: 2rem;
        }
        
        .result-content h3 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          font-size: 1.5rem;
        }
        
        .result-content .project-code {
          color: #3498db;
          font-weight: 600;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }
        
        .result-content p {
          margin: 0.5rem 0;
          color: #555;
          font-size: 1rem;
        }
        
        .result-date {
          margin-top: 1rem !important;
          font-size: 0.9rem !important;
          color: #888 !important;
        }
        
        .statistics-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .statistics-section h3 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          font-size: 1.1rem;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          background: white;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }
        
        .stat-label {
          color: #6c757d;
          font-size: 0.9rem;
        }
        
        .stat-value {
          font-weight: 600;
          color: #2c3e50;
        }
      `}</style>
    </section>
  );
}

export default Results;
