import React, { useState } from 'react';

function MatchingResults({ showNotification }) {
  const [lastUpdated, setLastUpdated] = useState('2025-04-28 11:20');

  const summary = {
    totalMatched: 8,
    awaitingConfirmation: 2,
    unmatched: 1
  };

  const projectMatches = [
    {
      id: 1,
      title: 'AI Learning System',
      supervisor: 'Dr. Bell Liu',
      status: 'Published',
      capacity: 3,
      matchedStudents: [
        { name: 'John Chen', studentId: 'S101', gpa: 3.85 },
        { name: 'Sarah Wang', studentId: 'S134', gpa: 3.72 },
        { name: 'Mike Liu', studentId: 'S166', gpa: 3.68 }
      ]
    },
    {
      id: 2,
      title: 'Mobile App Development',
      supervisor: 'Prof. David Wong',
      status: 'Pending',
      capacity: 2,
      matchedStudents: [
        { name: 'Emily Zhang', studentId: 'S205', gpa: 3.91 }
      ]
    },
    {
      id: 3,
      title: 'Advanced Database System',
      supervisor: 'Dr. Sarah Chen',
      status: 'Draft',
      capacity: 2,
      matchedStudents: []
    }
  ];

  const statusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'status-published';
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
      console.log('MatchingResults: fetching /api/export/matching-results');

      const resultsResponse = await fetch('/api/export/matching-results');
      console.log('MatchingResults: matching-results status', resultsResponse.status);
      if (resultsResponse.ok) {
        const blob = await resultsResponse.blob();
        console.log('MatchingResults: matching-results blob size', blob.size);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'matching_results.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      console.log('MatchingResults: fetching /api/export/project-list');
      const projectsResponse = await fetch('/api/export/project-list');
      console.log('MatchingResults: project-list status', projectsResponse.status);
      if (projectsResponse.ok) {
        const blob = await projectsResponse.blob();
        console.log('MatchingResults: project-list blob size', blob.size);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project_list.csv';
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

  return (
    <section className="content-section active">
      <div className="section-header">
        <div className="results-status">
          Last updated: <strong>{lastUpdated}</strong>
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
          <span className="summary-label">Unmatched</span>
          <span className="summary-value">{summary.unmatched}</span>
          <span className="summary-helper">students still open</span>
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
        {projectMatches.map(project => (
          <div key={project.id} className="matching-card">
            <div className="matching-card-header">
              <div>
                <h3>{project.title}</h3>
                <p>Supervisor: {project.supervisor}</p>
              </div>
              <span className={`matching-status ${statusClass(project.status)}`}>
                {project.status}
              </span>
            </div>
            <div className="matching-card-body">
              <div className="matching-meta">
                <span>Capacity: {project.capacity}</span>
                <span>Filled: {project.matchedStudents.length}/{project.capacity}</span>
              </div>
              {project.matchedStudents.length > 0 ? (
                <div className="matched-students">
                  {project.matchedStudents.map((student, index) => (
                    <div key={`${project.id}-${student.studentId}`} className="matched-student">
                      <div className="matched-index">#{index + 1}</div>
                      <div className="matched-info">
                        <strong>{student.name}</strong>
                        <span>ID: {student.studentId}</span>
                      </div>
                      <div className="matched-gpa">GPA {student.gpa}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-matched-students">
                  No students assigned yet.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default MatchingResults;

