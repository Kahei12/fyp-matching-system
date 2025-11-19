import React from 'react';

function SupervisionList({ showNotification }) {
  const supervisees = [
    {
      id: 1,
      name: 'John Chen',
      project: 'AI Learning System',
      gpa: 3.85,
      department: 'Computer Science',
      email: 'john.chen@student.edu'
    },
    {
      id: 2,
      name: 'Emily Zhang',
      project: 'Mobile App Development',
      gpa: 3.91,
      department: 'Software Engineering',
      email: 'emily.zhang@student.edu'
    },
    {
      id: 3,
      name: 'Mike Liu',
      project: 'AI Learning System',
      gpa: 3.68,
      department: 'Computer Science',
      email: 'mike.liu@student.edu'
    }
  ];

  const academicYear = '2024-2025';

  const handleExportList = () => {
    showNotification('Exporting supervisee list...', 'info');
    setTimeout(() => {
      showNotification('List exported successfully!', 'success');
    }, 1000);
  };

  const handleScheduleMeeting = () => {
    showNotification('Opening meeting scheduler...', 'info');
  };

  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>{academicYear} Supervisees</h1>
      </div>

      <div className="supervision-section">
        <div className="supervisees-card">
          <h2>{academicYear} Supervisees</h2>
          <div className="supervisees-list">
            {supervisees.map(supervisee => (
              <div key={supervisee.id} className="supervisee-item">
                <div className="supervisee-name">{supervisee.name}</div>
                <div className="supervisee-details">
                  <div className="detail-row">
                    <span className="detail-label">Project:</span>
                    <span className="detail-value">{supervisee.project}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">GPA:</span>
                    <span className="detail-value">{supervisee.gpa}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Department:</span>
                    <span className="detail-value">{supervisee.department}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{supervisee.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

