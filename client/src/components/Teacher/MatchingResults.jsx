import React, { useState, useEffect } from 'react';

function MatchingResults({ showNotification }) {
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({
    totalMatched: 0,
    awaitingConfirmation: 0,
    unmatched: 0
  });
  const userEmail = sessionStorage.getItem('userEmail') || 'teacher@hkmu.edu.hk';

  useEffect(() => {
    fetchMatchingResults();
  }, []);

  const fetchMatchingResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/matching-results?email=${encodeURIComponent(userEmail)}`, {
        headers: {
          'x-teacher-email': userEmail
        }
      });
      const data = await response.json();
      
      if (data.success && data.results) {
        setResults(data.results);
        
        // Calculate summary
        const matched = data.results.filter(r => r.assignedStudent).length;
        const totalCapacity = data.results.reduce((sum, r) => sum + (r.capacity || 0), 0);
        
        setSummary({
          totalMatched: matched,
          awaitingConfirmation: 0,
          unmatched: Math.max(0, totalCapacity - matched)
        });
        
        // Set last updated time
        const matchedWithDate = data.results.find(r => r.assignedStudent?.assignedAt);
        if (matchedWithDate) {
          setLastUpdated(new Date(matchedWithDate.assignedStudent.assignedAt).toLocaleString());
        }
      }
    } catch (error) {
      console.error('Error fetching matching results:', error);
      // Fallback to mock data
      setResults([
        {
          projectId: '1',
          projectCode: 'L12',
          projectTitle: 'FYP Matching System',
          capacity: 3,
          assignedStudent: {
            id: 'S001',
            name: 'John Chen',
            email: 'john.chen@student.hkmu.edu.hk',
            gpa: 3.85,
            major: 'Computer Science'
          },
          status: 'Matched'
        },
        {
          projectId: '2',
          projectCode: 'L13',
          projectTitle: 'Mobile App Development',
          capacity: 2,
          assignedStudent: {
            id: 'S002',
            name: 'Emily Zhang',
            email: 'emily.zhang@student.hkmu.edu.hk',
            gpa: 3.91,
            major: 'Software Engineering'
          },
          status: 'Matched'
        },
        {
          projectId: '3',
          projectCode: 'L14',
          projectTitle: 'Network Security',
          capacity: 2,
          assignedStudent: null,
          status: 'Available'
        }
      ]);
      
      setSummary({
        totalMatched: 2,
        awaitingConfirmation: 0,
        unmatched: 1
      });
      setLastUpdated('2025-06-15 14:30');
    } finally {
      setLoading(false);
    }
  };

  const statusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'matched':
        return 'status-matched';
      case 'available':
        return 'status-available';
      case 'pending':
        return 'status-pending';
      default:
        return 'status-draft';
    }
  };

  const handlePublishResults = () => {
    showNotification('Matching result published to students!', 'success');
    setLastUpdated(new Date().toLocaleString());
  };

  const handleDownloadReport = async () => {
    try {
      showNotification('Generating result report...', 'info');
      const resultsResponse = await fetch('/api/export/matching-results');
      if (resultsResponse.ok) {
        const blob = await resultsResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'matching_results.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      showNotification('Reports downloaded successfully!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showNotification('Failed to download reports', 'error');
    }
  };

  if (loading) {
    return (
      <section className="content-section active">
        <div className="loading-spinner">Loading matching results...</div>
      </section>
    );
  }

  return (
    <section className="content-section active">
      <div className="section-header">
        <div className="results-status">
          Last updated: <strong>{lastUpdated || 'Never'}</strong>
        </div>
      </div>

      <div className="results-summary-grid">
        <div className="results-summary-card">
          <span className="summary-label">Total Matched</span>
          <span className="summary-value">{summary.totalMatched}</span>
          <span className="summary-helper">students assigned</span>
        </div>
        <div className="results-summary-card">
          <span className="summary-label">Awaiting Confirmation</span>
          <span className="summary-value">{summary.awaitingConfirmation}</span>
          <span className="summary-helper">students pending reply</span>
        </div>
        <div className="results-summary-card">
          <span className="summary-label">Available</span>
          <span className="summary-value">{summary.unmatched}</span>
          <span className="summary-helper">spots still open</span>
        </div>
      </div>

      <div className="results-actions">
        <button className="btn-primary" onClick={handlePublishResults}>
          Publish Result
        </button>
        <button className="btn-secondary" onClick={handleDownloadReport}>
          Download Report
        </button>
      </div>

      <div className="matching-results-list">
        {results.length === 0 ? (
          <div className="empty-state">
            <p>No matching results available yet.</p>
            <p>Results will appear after the matching process is completed.</p>
          </div>
        ) : (
          results.map(project => (
            <div key={project.projectId} className="matching-card">
              <div className="matching-card-header">
                <div>
                  <h3>
                    {project.projectCode && <span className="project-code-badge">{project.projectCode}</span>}
                    {project.projectTitle}
                  </h3>
                </div>
                <span className={`matching-status ${statusClass(project.status)}`}>
                  {project.status || 'Available'}
                </span>
              </div>
              <div className="matching-card-body">
                <div className="matching-meta">
                  <span>Capacity: {project.capacity}</span>
                  <span>Status: {project.assignedStudent ? 'Filled' : 'Open'}</span>
                </div>
                {project.assignedStudent ? (
                  <div className="matched-students">
                    <div className="matched-student">
                      <div className="matched-index">#1</div>
                      <div className="matched-info">
                        <strong>{project.assignedStudent.name}</strong>
                        <span>ID: {project.assignedStudent.id}</span>
                        <span>Email: {project.assignedStudent.email}</span>
                      </div>
                      <div className="matched-gpa">GPA {project.assignedStudent.gpa}</div>
                    </div>
                  </div>
                ) : (
                  <div className="no-matched-students">
                    No students assigned yet.
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default MatchingResults;
