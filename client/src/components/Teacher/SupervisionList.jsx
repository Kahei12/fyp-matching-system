import React, { useState, useEffect } from 'react';

function SupervisionList({ showNotification }) {
  const [supervisionList, setSupervisionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const userEmail = sessionStorage.getItem('userEmail') || 'teacher@hkmu.edu.hk';

  useEffect(() => {
    fetchSupervisionList();
  }, []);

  const fetchSupervisionList = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/supervision?email=${encodeURIComponent(userEmail)}`, {
        headers: {
          'x-teacher-email': userEmail
        }
      });
      const data = await response.json();
      if (data.success && data.supervisionList) {
        setSupervisionList(data.supervisionList);
      }
    } catch (error) {
      console.error('Error fetching supervision list:', error);
      // Fallback to mock data
      setSupervisionList([
        {
          studentId: 'S001',
          studentName: 'John Chen',
          studentEmail: 'john.chen@student.hkmu.edu.hk',
          studentGpa: 3.85,
          studentMajor: 'Computer Science',
          projectTitle: 'AI Learning System',
          projectCode: 'L12',
          assignedAt: '2025-06-15'
        },
        {
          studentId: 'S002',
          studentName: 'Emily Zhang',
          studentEmail: 'emily.zhang@student.hkmu.edu.hk',
          studentGpa: 3.91,
          studentMajor: 'Software Engineering',
          projectTitle: 'Mobile App Development',
          projectCode: 'L13',
          assignedAt: '2025-06-15'
        },
        {
          studentId: 'S003',
          studentName: 'Mike Liu',
          studentEmail: 'mike.liu@student.hkmu.edu.hk',
          studentGpa: 3.68,
          studentMajor: 'Computer Science',
          projectTitle: 'AI Learning System',
          projectCode: 'L12',
          assignedAt: '2025-06-15'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportList = () => {
    if (supervisionList.length === 0) {
      showNotification('No supervisees to export', 'error');
      return;
    }
    
    // Create CSV content
    const headers = ['Student ID', 'Name', 'Email', 'GPA', 'Major', 'Project Code', 'Project Title', 'Assigned Date'];
    const csvContent = [
      headers.join(','),
      ...supervisionList.map(s => [
        s.studentId,
        s.studentName,
        s.studentEmail,
        s.studentGpa,
        s.studentMajor,
        s.projectCode || '',
        s.projectTitle || '',
        s.assignedAt || ''
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `supervision_list_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showNotification('Supervision list exported successfully!', 'success');
  };

  const handleScheduleMeeting = () => {
    showNotification('Meeting scheduler feature coming soon!', 'info');
  };

  const academicYear = '2025-2026';

  if (loading) {
    return (
      <section className="content-section active">
        <div className="loading-spinner">Loading supervision list...</div>
      </section>
    );
  }

  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>{academicYear} Supervisees</h1>
      </div>

      <div className="supervision-section">
        <div className="supervisees-card">
          <h2>{academicYear} Supervisees</h2>
          
          {supervisionList.length === 0 ? (
            <div className="empty-state">
              <p>You don't have any supervisees yet.</p>
              <p>Once the matching process is complete, your assigned students will appear here.</p>
            </div>
          ) : (
            <>
              <div className="supervisees-list">
                {supervisionList.map(supervisee => (
                  <div key={supervisee.studentId} className="supervisee-item">
                    <div className="supervisee-name">{supervisee.studentName}</div>
                    <div className="supervisee-details">
                      <div className="detail-row">
                        <span className="detail-label">Student ID:</span>
                        <span className="detail-value">{supervisee.studentId}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Project:</span>
                        <span className="detail-value">
                          {supervisee.projectCode && <strong>{supervisee.projectCode}: </strong>}
                          {supervisee.projectTitle}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">GPA:</span>
                        <span className="detail-value">{supervisee.studentGpa}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Major:</span>
                        <span className="detail-value">{supervisee.studentMajor}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">
                          <a href={`mailto:${supervisee.studentEmail}`}>{supervisee.studentEmail}</a>
                        </span>
                      </div>
                      {supervisee.assignedAt && (
                        <div className="detail-row">
                          <span className="detail-label">Assigned:</span>
                          <span className="detail-value">{new Date(supervisee.assignedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="supervision-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Supervisees:</span>
                  <span className="stat-value">{supervisionList.length}</span>
                </div>
              </div>
            </>
          )}
          
          <div className="supervision-actions">
            <button className="btn-export-list" onClick={handleExportList}>
              <span>↓</span> Export List
            </button>
            <button className="btn-schedule-meeting" onClick={handleScheduleMeeting}>
              <span>⏲</span> Schedule Meeting
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SupervisionList;
