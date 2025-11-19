import React from 'react';

function DeadlineManagement({ showNotification }) {
  const editDeadline = (phase) => {
    const phaseTitles = {
      'proposal': 'Proposal Phase',
      'matching': 'Matching Phase', 
      'project': 'Project Management'
    };
    
    const currentDate = '2025-03-20 23:59';
    const newDate = prompt(`Enter new deadline for ${phaseTitles[phase]}:`, currentDate);
    
    if (newDate) {
      showNotification(`Deadline updated to: ${newDate}`, 'success');
    }
  };

  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>Deadline Management</h1>
      </div>

      <div className="deadline-management-panel">
        <div className="management-header">
          <h2>System Deadlines</h2>
          <p>Manage deadlines for different phases of the FYP matching process.</p>
        </div>

        <div className="deadline-list-admin">
          {/* Proposal Phase */}
          <div className="deadline-card">
            <div className="deadline-header">
              <h3>Proposal Phase</h3>
              <button className="btn-edit" onClick={() => editDeadline('proposal')}>Edit</button>
            </div>
            <div className="deadline-content">
              <div className="deadline-overview">
                <strong>Overview</strong>
                <div className="deadline-date">2025-03-20 23:59</div>
                <p className="deadline-description">Submit your project proposal</p>
              </div>
            </div>
          </div>

          {/* Matching Phase */}
          <div className="deadline-card">
            <div className="deadline-header">
              <h3>Matching Phase</h3>
              <button className="btn-edit" onClick={() => editDeadline('matching')}>Edit</button>
            </div>
            <div className="deadline-content">
              <div className="deadline-overview">
                <strong>Overview</strong>
                <div className="deadline-date">2025-04-15 22:59</div>
                <p className="deadline-description">Select your project preferences</p>
              </div>
            </div>
          </div>

          {/* Project Management Phase */}
          <div className="deadline-card">
            <div className="deadline-header">
              <h3>Project Management</h3>
              <button className="btn-edit" onClick={() => editDeadline('project')}>Edit</button>
            </div>
            <div className="deadline-content">
              <div className="deadline-overview">
                <strong>Overview</strong>
                <div className="deadline-date">2025-05-30 23:59</div>
                <p className="deadline-description">Submit project updates and reviews</p>
              </div>
            </div>
          </div>
        </div>

        <div className="deadline-tips">
          <h3>Tips for Setting Deadlines</h3>
          <ul>
            <li>Set realistic deadlines that give students and teachers sufficient time</li>
            <li>Consider weekends and holidays when setting deadlines</li>
            <li>Communicate any deadline changes to all users</li>
            <li>System will automatically show urgent warnings 7 days before deadline</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default DeadlineManagement;

