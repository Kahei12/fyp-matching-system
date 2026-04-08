import React, { useState, useEffect } from 'react';
import { formatDateTime24 } from '../../utils/formatDateTime24';

function MatchingResults({ showNotification }) {
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({
    totalMatched: 0
  });
  const userEmail = sessionStorage.getItem('userEmail') || 't001@hkmu.edu.hk';
  const userName = sessionStorage.getItem('userName') || '';

  useEffect(() => {
    fetchMatchingResults();
  }, []);

  const fetchMatchingResults = async () => {
    try {
      setLoading(true);
      const email = userEmail || sessionStorage.getItem('userEmail') || 't001@hkmu.edu.hk';
      const response = await fetch(`/api/teacher/matching-results?email=${encodeURIComponent(email)}`, {
        headers: {
          'x-teacher-email': email
        }
      });
      const data = await response.json();

      if (data.success && data.results) {
        setResults(data.results);

        const matched = data.results.filter(r => r.assignedStudent).length;

        setSummary({
          totalMatched: matched
        });

        const matchedWithDate = data.results.find(r => r.assignedStudent?.assignedAt);
        if (matchedWithDate) {
          setLastUpdated(formatDateTime24(new Date(matchedWithDate.assignedStudent.assignedAt)));
        }
      }
    } catch (error) {
      console.error('Error fetching matching results:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const statusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'matched': return 'status-matched';
      case 'available': return 'status-available';
      case 'pending': return 'status-pending';
      default: return 'status-draft';
    }
  };

  const sourceTagClass = (type) => type === 'student' ? 'source-student' : 'source-teacher';
  const sourceTagLabel = (type) => type === 'student' ? 'Student Proposed' : 'Teacher';
  const sourceTagTitle = (type) => type === 'student' ? 'Proposed by a student' : 'Proposed by teacher';

  const handleDownloadReport = async () => {
    try {
      showNotification('Generating result report...', 'info');

      const response = await fetch(`/api/teacher/matching-results?email=${encodeURIComponent(userEmail)}`, {
        headers: { 'x-teacher-email': userEmail }
      });
      const data = await response.json();

      if (!data.success || !data.results) {
        showNotification('Failed to fetch results', 'error');
        return;
      }

      const rows = data.results.map((r, i) => {
        const a = r.assignedStudent;
        const projectCode = r.projectType !== 'student' ? (r.projectCode || '') : '';
        return [
          projectCode,
          r.projectTitle || '',
          r.capacity || 1,
          sourceTagLabel(r.projectType),
          a ? a.id || '' : 'Unassigned',
          a ? a.name || '' : 'Unassigned',
          a ? a.email || '' : 'Unassigned',
          a ? (a.gpa || 'N/A') : 'Unassigned',
          r.status || 'Available'
        ].join(',');
      });

      const header = 'Project Code,Project Title,Capacity,Source,Student ID,Student Name,Student Email,Student GPA,Status';
      const csv = [header, ...rows].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `matching_results_${userName.replace(/\s+/g, '_') || 'teacher'}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showNotification('Report downloaded successfully!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showNotification('Failed to download report', 'error');
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
          {lastUpdated ? `Last updated: ${lastUpdated}` : 'No matching results yet'}
        </div>
        <button className="btn-secondary" onClick={handleDownloadReport} disabled={results.length === 0}>
          Download Report
        </button>
      </div>

      <div className="results-summary-grid">
        <div className="results-summary-card results-summary-card-wide">
          <span className="summary-label">Total Matched</span>
          <span className="summary-value">{summary.totalMatched}</span>
          <span className="summary-helper">students assigned</span>
        </div>
      </div>

      <div className="matching-results-list">
        {results.length === 0 ? (
          <div className="empty-state">
            <p>No matching results available yet.</p>
            <p>Results will appear after the matching process is completed by the admin.</p>
          </div>
        ) : (
          results.map((project, idx) => {
            const a = project.assignedStudent;
            return (
              <div key={project.projectId || idx} className="matching-card">
                <div className="matching-card-header">
                  <div>
                    <h3>
                      {project.projectType !== 'student' && project.projectCode && (
                        <span className="project-code-badge">{project.projectCode}</span>
                      )}
                      {project.projectTitle}
                      {project.projectType && (
                        <span
                          className={`project-source-tag ${sourceTagClass(project.projectType)}`}
                          title={sourceTagTitle(project.projectType)}
                        >
                          {sourceTagLabel(project.projectType)}
                        </span>
                      )}
                    </h3>
                  </div>
                  <span className={`matching-status ${statusClass(project.status)}`}>
                    {project.status || 'Available'}
                  </span>
                </div>
                <div className="matching-card-body">
                  <div className="matching-meta">
                    <span>Capacity: {project.capacity || 1}</span>
                    <span>{a ? 'Filled' : 'Open'}</span>
                  </div>
                  {a ? (
                    <div className="matched-students">
                      <div className="matched-student">
                        <div className="matched-index">#1</div>
                        <div className="matched-info">
                          <strong>{a.name || 'Unknown'}</strong>
                          <span>ID: {a.id || 'N/A'}</span>
                          <span>Email: {a.email || 'N/A'}</span>
                          {a.major && <span>Major: {a.major}</span>}
                        </div>
                        <div className="matched-gpa">
                          {a.gpa != null ? `GPA ${a.gpa}` : ''}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-matched-students">
                      No students assigned yet.
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default MatchingResults;
