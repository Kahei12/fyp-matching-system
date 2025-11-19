import React, { useState } from 'react';

function StudentApplications({ showNotification }) {
  const [expandedProjects, setExpandedProjects] = useState(new Set());

  const projectsWithApplicants = [
    {
      id: 1,
      title: 'AI Learning System',
      applicantCount: 23,
      status: 'Approved',
      description: 'Develop an intelligent learning platform that adapts to student learning patterns using machine learning algorithms. This project will create a personalized learning experience that adjusts content difficulty based on individual student performance.',
      skills: ['Python', 'Machine Learning', 'Web Development', 'TensorFlow', 'React'],
      capacity: 3,
      supervisor: 'Dr. Bell Liu',
      department: 'Computer Science',
      createdDate: '2025-03-15',
      applicants: [
        {
          id: 1,
          name: 'John Chen',
          gpa: 3.85,
          preference: 1,
          status: 'Matched'
        },
        {
          id: 2,
          name: 'Sarah Wang',
          gpa: 3.72,
          preference: 2,
          status: 'Pending'
        },
        {
          id: 3,
          name: 'Mike Liu',
          gpa: 3.68,
          preference: 1,
          status: 'Pending'
        }
      ]
    },
    {
      id: 2,
      title: 'Mobile App Development',
      applicantCount: 18,
      status: 'Approved',
      description: 'Build a mobile application for campus services including library booking, cafeteria menu, and event notifications. The app will use React Native for cross-platform compatibility.',
      skills: ['React Native', 'JavaScript', 'Mobile Development', 'Firebase', 'UI/UX Design'],
      capacity: 2,
      supervisor: 'Dr. Bell Liu',
      department: 'Software Engineering',
      createdDate: '2025-03-20',
      applicants: [
        {
          id: 4,
          name: 'Emily Zhang',
          gpa: 3.91,
          preference: 1,
          status: 'Pending'
        },
        {
          id: 5,
          name: 'David Lee',
          gpa: 3.65,
          preference: 3,
          status: 'Pending'
        }
      ]
    }
  ];

  const toggleProjectDetails = (projectId) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // 學生提議的題目
  const studentProposals = [
    {
      id: 1,
      studentName: 'Alex Wong',
      studentId: 'S123',
      gpa: 3.78,
      proposedTitle: 'Blockchain-based Voting System',
      description: 'A secure and transparent voting system using blockchain technology to ensure election integrity.',
      status: 'Pending Review',
      submittedDate: '2025-04-10'
    },
    {
      id: 2,
      studentName: 'Lisa Chen',
      studentId: 'S124',
      gpa: 3.92,
      proposedTitle: 'AI-Powered Healthcare Assistant',
      description: 'An intelligent healthcare assistant that helps patients with symptom analysis and appointment scheduling.',
      status: 'Under Review',
      submittedDate: '2025-04-12'
    },
    {
      id: 3,
      studentName: 'Tom Zhang',
      studentId: 'S125',
      gpa: 3.65,
      proposedTitle: 'Smart Campus Energy Management',
      description: 'An IoT-based system to monitor and optimize energy consumption across campus facilities.',
      status: 'Pending Review',
      submittedDate: '2025-04-08'
    }
  ];

  const handleViewProposal = (proposalId) => {
    const proposal = studentProposals.find(p => p.id === proposalId);
    if (proposal) {
      showNotification(`Viewing proposal: ${proposal.proposedTitle}`, 'info');
    }
  };

  const handleApproveProposal = (proposalId) => {
    const proposal = studentProposals.find(p => p.id === proposalId);
    if (proposal && window.confirm(`Approve proposal "${proposal.proposedTitle}"?`)) {
      showNotification(`Proposal "${proposal.proposedTitle}" approved!`, 'success');
    }
  };

  const handleRejectProposal = (proposalId) => {
    const proposal = studentProposals.find(p => p.id === proposalId);
    if (proposal && window.confirm(`Reject proposal "${proposal.proposedTitle}"?`)) {
      showNotification(`Proposal "${proposal.proposedTitle}" rejected.`, 'error');
    }
  };

  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>My Projects & Applicants</h1>
      </div>

      {/* Student Proposals Section */}
      <div className="student-proposals-section">
        <h2>Student Proposed Topics</h2>
        <div className="proposals-list">
          {studentProposals.map(proposal => (
            <div key={proposal.id} className="proposal-card">
              <div className="proposal-header">
                <div className="proposal-title-row">
                  <h3>{proposal.proposedTitle}</h3>
                  <span className={`proposal-status-badge ${proposal.status.toLowerCase().replace(' ', '-')}`}>
                    {proposal.status}
                  </span>
                </div>
                <div className="proposal-student-info">
                  <span className="proposal-student-name">{proposal.studentName}</span>
                  <span className="proposal-student-id">({proposal.studentId})</span>
                  <span className="proposal-gpa">GPA: {proposal.gpa}</span>
                </div>
              </div>
              <div className="proposal-description">
                <strong>Description:</strong>
                <p>{proposal.description}</p>
              </div>
              <div className="proposal-footer">
                <div className="proposal-date">
                  Submitted: {proposal.submittedDate}
                </div>
                <div className="proposal-actions">
                  <button 
                    className="btn-view-proposal" 
                    onClick={() => handleViewProposal(proposal.id)}
                  >
                    ◉ View Details
                  </button>
                  <button 
                    className="btn-approve-proposal" 
                    onClick={() => handleApproveProposal(proposal.id)}
                  >
                    ✔ Approve
                  </button>
                  <button 
                    className="btn-reject-proposal" 
                    onClick={() => handleRejectProposal(proposal.id)}
                  >
                    ✖ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Existing Projects & Applicants Section */}
      <div className="applications-section">
        <h2>My Projects & Applicants</h2>
        {projectsWithApplicants.map(project => (
          <div key={project.id} className="project-applicants-card">
            <div className="project-header-applicants">
              <div className="project-title-section">
                <h3>{project.title}</h3>
                <span className={`project-status-badge ${project.status.toLowerCase().replace(' ', '-')}`}>
                  {project.status}
                </span>
              </div>
              <div className="project-header-actions">
                <span className="applicant-count-badge">{project.applicantCount} applicants</span>
                <button 
                  className="btn-view-details"
                  onClick={() => toggleProjectDetails(project.id)}
                >
                  {expandedProjects.has(project.id) ? '▼ Hide Details' : '▶ View Details'}
                </button>
              </div>
            </div>

            {/* Project Details Section */}
            {expandedProjects.has(project.id) && (
              <div className="project-details-section">
                <div className="project-detail-row">
                  <div className="detail-group">
                    <strong>Description:</strong>
                    <p>{project.description}</p>
                  </div>
                </div>
                <div className="project-detail-row">
                  <div className="detail-group">
                    <strong>Required Skills:</strong>
                    <div className="skills-tags">
                      {project.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="project-detail-grid">
                  <div className="detail-item">
                    <strong>Capacity:</strong>
                    <span>{project.capacity} students</span>
                  </div>
                  <div className="detail-item">
                    <strong>Supervisor:</strong>
                    <span>{project.supervisor}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Department:</strong>
                    <span>{project.department}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Created Date:</strong>
                    <span>{project.createdDate}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="applicants-list">
              <div className="applicants-header">
                <h4>Applicants ({project.applicants.length})</h4>
              </div>
              {project.applicants.map(applicant => (
                <div key={applicant.id} className="applicant-item">
                  <div className="applicant-info">
                    <div className="applicant-name">{applicant.name}</div>
                    <div className="applicant-details">
                      <span>GPA: {applicant.gpa}</span>
                      <span>Preference #{applicant.preference}</span>
                    </div>
                  </div>
                  <span className={`applicant-status ${applicant.status.toLowerCase()}`}>
                    {applicant.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StudentApplications;

