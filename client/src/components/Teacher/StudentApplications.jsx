import React, { useState, useEffect } from 'react';

function StudentApplications({ showNotification }) {
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [projectsWithApplicants, setProjectsWithApplicants] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentNote, setStudentNote] = useState('');
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' or 'proposals'
  const userEmail = sessionStorage.getItem('userEmail') || 'teacher@hkmu.edu.hk';

  useEffect(() => {
    fetchStudentApplications();
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await fetch('/api/proposals/all');
      const data = await response.json();
      if (data.success && data.proposals) {
        setProposals(data.proposals);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    }
  };

  const handleApproveProposal = async (proposalId) => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          supervisorEmail: userEmail,
          supervisorName: sessionStorage.getItem('userName') || 'Teacher'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        showNotification('Proposal approved! Student has been auto-matched.', 'success');
        fetchProposals(); // Refresh proposals
      } else {
        showNotification(data.message || 'Failed to approve proposal', 'error');
      }
    } catch (error) {
      console.error('Error approving proposal:', error);
      showNotification('Failed to approve proposal', 'error');
    }
  };

  const handleRejectProposal = async (proposalId) => {
    if (!window.confirm('Are you sure you want to reject this proposal?')) return;
    
    try {
      const response = await fetch(`/api/proposals/${proposalId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      
      const data = await response.json();
      if (data.success) {
        showNotification('Proposal rejected.', 'info');
        fetchProposals(); // Refresh proposals
      } else {
        showNotification(data.message || 'Failed to reject proposal', 'error');
      }
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      showNotification('Failed to reject proposal', 'error');
    }
  };

  const fetchStudentApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/students?email=${encodeURIComponent(userEmail)}`, {
        headers: {
          'x-teacher-email': userEmail
        }
      });
      const data = await response.json();
      if (data.success && data.projectsWithApplicants) {
        setProjectsWithApplicants(data.projectsWithApplicants);
      }
    } catch (error) {
      console.error('Error fetching student applications:', error);
      // Fallback to mock data
      setProjectsWithApplicants([
        {
          projectId: '1',
          projectCode: 'L12',
          projectTitle: 'FYP Matching System',
          capacity: 3,
          applicants: [
            {
              id: 'S001',
              name: 'John Chen',
              gpa: 3.85,
              preferenceRank: 1,
              status: 'Matched'
            },
            {
              id: 'S002',
              name: 'Sarah Wang',
              gpa: 3.72,
              preferenceRank: 2,
              status: 'Pending'
            },
            {
              id: 'S003',
              name: 'Mike Liu',
              gpa: 3.68,
              preferenceRank: 1,
              status: 'Pending'
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleProjectDetails = (projectId) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setStudentNote('');
  };

  const handleAddNote = async () => {
    if (!selectedStudent || !studentNote.trim()) {
      showNotification('Please enter a note', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/teacher/students/${selectedStudent.id}/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-email': userEmail
        },
        body: JSON.stringify({ note: studentNote })
      });

      const data = await response.json();
      if (data.success) {
        showNotification('Note added successfully!', 'success');
        setSelectedStudent(null);
        setStudentNote('');
      } else {
        showNotification(data.message || 'Failed to add note', 'error');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      showNotification('Failed to add note', 'error');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'matched':
        return 'status-matched';
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  if (loading) {
    return (
      <section className="content-section active">
        <div className="loading-spinner">Loading student applications...</div>
      </section>
    );
  }

  return (
    <section className="content-section active">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          📋 My Projects & Applicants
        </button>
        <button 
          className={`tab-button ${activeTab === 'proposals' ? 'active' : ''}`}
          onClick={() => setActiveTab('proposals')}
        >
          📝 Student Proposals
          {proposals.filter(p => p.proposalStatus === 'pending').length > 0 && (
            <span className="tab-badge">{proposals.filter(p => p.proposalStatus === 'pending').length}</span>
          )}
        </button>
      </div>

      {/* Student Proposals Section */}
      {activeTab === 'proposals' && (
        <div className="proposals-review-section">
          <h2>Student Proposed Topics</h2>
          
          {proposals.length === 0 ? (
            <div className="empty-state">
              <p>No student proposals yet.</p>
            </div>
          ) : (
            <div className="proposals-list">
              {proposals.map(proposal => (
                <div key={proposal._id} className="proposal-review-card">
                  {/* 统一信息框 - 表格形式 */}
                  <div className="proposal-info-box">
                    <table className="proposal-info-table">
                      <tbody>
                        <tr>
                          <td className="info-label">Title</td>
                          <td className="info-value-title">{proposal.title}</td>
                          <td className="info-label">Status</td>
                          <td>
                            <span className={`proposal-status-badge ${proposal.proposalStatus || 'pending'}`}>
                              {proposal.proposalStatus === 'pending' ? 'Pending Review' : 
                               proposal.proposalStatus === 'approved' ? 'Approved' :
                               proposal.proposalStatus === 'rejected' ? 'Rejected' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="info-label">Name</td>
                          <td className="info-value">{proposal.studentName}</td>
                          <td className="info-label">Student ID</td>
                          <td className="info-value">{proposal.studentId}</td>
                          <td className="info-label">GPA</td>
                          <td className="info-value gpa-value">{proposal.studentGpa}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="proposal-description">
                    <strong>Description:</strong>
                    <p>{proposal.description}</p>
                  </div>
                  
                  {proposal.skills && proposal.skills.length > 0 && (
                    <div className="proposal-skills">
                      <strong>Required Skills:</strong>
                      <div className="skills-tags">
                        {proposal.skills.map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {proposal.proposalStatus === 'pending' && (
                    <div className="proposal-actions">
                      <button 
                        className="btn-approve-proposal"
                        onClick={() => handleApproveProposal(proposal._id)}
                      >
                        Approve & Auto-Match
                      </button>
                      <button 
                        className="btn-reject-proposal"
                        onClick={() => handleRejectProposal(proposal._id)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Existing Projects & Applicants Section */}
      {activeTab === 'projects' && (
      <div className="applications-section">
        <h2>My Projects & Applicants</h2>
        
        {projectsWithApplicants.length === 0 ? (
          <div className="empty-state">
            <p>You don't have any projects with applicants yet.</p>
            <p>Create a project first to start receiving applications.</p>
          </div>
        ) : (
          projectsWithApplicants.map(project => (
            <div key={project.projectId} className="project-applicants-card">
              <div className="project-header-applicants">
                <div className="project-title-section">
                  <h3>{project.projectTitle}</h3>
                  {project.projectCode && (
                    <span className="project-code-badge">{project.projectCode}</span>
                  )}
                </div>
                <div className="project-header-actions">
                  <span className="applicant-count-badge">
                    {project.applicants.length} applicant{project.applicants.length !== 1 ? 's' : ''} / {project.capacity} spots
                  </span>
                  <button 
                    className="btn-view-details"
                    onClick={() => toggleProjectDetails(project.projectId)}
                  >
                    {expandedProjects.has(project.projectId) ? '▼ Hide Details' : '▶ View Details'}
                  </button>
                </div>
              </div>

              {/* Project Details Section */}
              {expandedProjects.has(project.projectId) && (
                <div className="project-details-section">
                  <div className="project-detail-grid">
                    <div className="detail-item">
                      <strong>Capacity:</strong>
                      <span>{project.capacity} students</span>
                    </div>
                    <div className="detail-item">
                      <strong>Applicants:</strong>
                      <span>{project.applicants.length}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Available Spots:</strong>
                      <span>{Math.max(0, project.capacity - project.applicants.filter(a => a.status === 'Matched').length)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="applicants-list">
                <div className="applicants-header">
                  <h4>Applicants ({project.applicants.length})</h4>
                </div>
                {project.applicants.length === 0 ? (
                  <p className="no-applicants">No applicants for this project yet.</p>
                ) : (
                  project.applicants.map(applicant => (
                    <div key={applicant.id} className="applicant-item">
                      <div className="applicant-info">
                        <div className="applicant-name">{applicant.name}</div>
                        <div className="applicant-details">
                          <span>GPA: {applicant.gpa}</span>
                          <span>Preference #{applicant.preferenceRank}</span>
                          {applicant.major && <span>Major: {applicant.major}</span>}
                        </div>
                      </div>
                      <div className="applicant-actions">
                        <span className={`applicant-status ${getStatusBadgeClass(applicant.status)}`}>
                          {applicant.status || 'Pending'}
                        </span>
                        <button 
                          className="btn-view-student"
                          onClick={() => handleViewStudent(applicant)}
                          title="View Details & Add Note"
                        >
                          📝 Note
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content student-detail-modal" onClick={e => e.stopPropagation()}>
            <h2>Student Details</h2>
            <div className="student-detail-info">
              <div className="detail-row">
                <strong>Name:</strong>
                <span>{selectedStudent.name}</span>
              </div>
              <div className="detail-row">
                <strong>Student ID:</strong>
                <span>{selectedStudent.id}</span>
              </div>
              <div className="detail-row">
                <strong>GPA:</strong>
                <span>{selectedStudent.gpa}</span>
              </div>
              {selectedStudent.major && (
                <div className="detail-row">
                  <strong>Major:</strong>
                  <span>{selectedStudent.major}</span>
                </div>
              )}
              {selectedStudent.email && (
                <div className="detail-row">
                  <strong>Email:</strong>
                  <span>{selectedStudent.email}</span>
                </div>
              )}
              <div className="detail-row">
                <strong>Preference Rank:</strong>
                <span>#{selectedStudent.preferenceRank}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span className={`status-badge ${getStatusBadgeClass(selectedStudent.status)}`}>
                  {selectedStudent.status || 'Pending'}
                </span>
              </div>
            </div>
            
            <div className="add-note-section">
              <h3>Add Note</h3>
              <textarea
                value={studentNote}
                onChange={e => setStudentNote(e.target.value)}
                placeholder="Add notes about this student..."
                rows={4}
              />
              <div className="modal-actions">
                <button className="btn-submit" onClick={handleAddNote}>Save Note</button>
                <button className="btn-cancel" onClick={() => setSelectedStudent(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default StudentApplications;
