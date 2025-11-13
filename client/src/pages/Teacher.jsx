import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Teacher.css';

function Teacher() {
  const [currentSection, setCurrentSection] = useState('project-management');
  const navigate = useNavigate();

  useEffect(() => {
    // 檢查登入狀態
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');
    
    if (!isLoggedIn || userRole !== 'teacher') {
      navigate('/');
      return;
    }
  }, [navigate]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      sessionStorage.clear();
      navigate('/');
    }
  };

  const showNotification = (message, type) => {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      z-index: 10000;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      ${type === 'success' ? 'background: #27ae60;' : 
        type === 'error' ? 'background: #e74c3c;' : 
        'background: #3498db;'}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 3000);
  };

  const menuItems = [
    { id: 'project-management', label: 'Project Management' },
    { id: 'student-applications', label: 'Student Applications' },
    { id: 'supervision-list', label: 'Supervision List' }
  ];

  const renderSection = () => {
    switch (currentSection) {
      case 'project-management':
        return <ProjectManagement showNotification={showNotification} />;
      case 'student-applications':
        return <StudentApplications showNotification={showNotification} />;
      case 'supervision-list':
        return <SupervisionList showNotification={showNotification} />;
      default:
        return <ProjectManagement showNotification={showNotification} />;
    }
  };

  const userName = sessionStorage.getItem('userName') || 'Admin Wang';

  return (
    <div className="teacher-container">
      {/* 側邊欄導航 */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>HKMU FYP Matching System</h2>
          <p>Teacher Portal</p>
        </div>
        
        <ul className="sidebar-menu">
          {menuItems.map(item => (
            <li key={item.id} className="menu-item">
              <a 
                href={`#${item.id}`}
                className={`menu-link ${currentSection === item.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentSection(item.id);
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        
        <div className="sidebar-footer">
          <div className="user-welcome">
            <p>Welcome, {userName}</p>
            <button className="logout-btn" onClick={handleLogout}>
              <span>→</span> Logout
            </button>
          </div>
        </div>
      </nav>

      {/* 主內容區域 */}
      <main className="main-content">
        {/* 麵包屑導航 */}
        <div className="breadcrumb">
          <span 
            className="breadcrumb-link" 
            onClick={() => setCurrentSection('project-management')}
            style={{ cursor: 'pointer' }}
          >
            Home
          </span>
          <span className="breadcrumb-separator">→</span>
          <span>{getSectionTitle(currentSection)}</span>
        </div>

        {renderSection()}
      </main>
    </div>
  );
}

// Project Management 組件
function ProjectManagement({ showNotification }) {
  const [projects, setProjects] = useState([
    {
      id: 1,
      title: 'AI Learning System',
      status: 'Approved',
      description: 'Develop an intelligent learning platform that adapts to student learning patterns using machine learning algorithms.',
      skills: ['Python', 'Machine Learning', 'Web Development']
    },
    {
      id: 2,
      title: 'Mobile App Development',
      status: 'Approved',
      description: 'Build a mobile application for campus services.',
      skills: ['React Native', 'JavaScript', 'Mobile Development']
    },
    {
      id: 3,
      title: 'Advanced Database System',
      status: 'Under Review',
      description: 'Design and implement an advanced database management system.',
      skills: ['Database', 'SQL', 'System Design']
    }
  ]);

  const deadline = {
    date: '2025-05-30 23:59',
    status: 'Overdue',
    description: 'Submit project updates and reviews'
  };

  const stats = {
    published: projects.filter(p => p.status === 'Approved').length,
    underReview: projects.filter(p => p.status === 'Under Review').length
  };

  const handleCreateProject = () => {
    const title = prompt('Enter project title:');
    if (title) {
      const newProject = {
        id: projects.length + 1,
        title,
        status: 'Under Review',
        description: '',
        skills: []
      };
      setProjects([...projects, newProject]);
      showNotification('Project created successfully!', 'success');
    }
  };

  const handleEditProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      showNotification(`Editing project: ${project.title}`, 'info');
    }
  };

  const handleDeleteProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project && window.confirm(`Are you sure you want to delete "${project.title}"?`)) {
      setProjects(projects.filter(p => p.id !== projectId));
      showNotification('Project deleted successfully!', 'success');
    }
  };

  return (
    <section className="content-section active">
      {/* Deadline Notification */}
      <div className="deadline-notification">
        <div className="deadline-label">Deadline:</div>
        <div className="deadline-info">
          <span className="deadline-date">{deadline.date}</span>
          <span className={`deadline-status ${deadline.status.toLowerCase()}`}>
            {deadline.status}
          </span>
        </div>
        <div className="deadline-description">{deadline.description}</div>
      </div>

      {/* My Projects Section */}
      <div className="section-header">
        <h1>My Projects</h1>
        <button className="btn-create-project" onClick={handleCreateProject}>
          <span>+</span> Create New Project
        </button>
      </div>

      <div className="projects-section">
        <h2>My Projects</h2>
        <div className="project-list">
          {projects.map(project => (
            <div key={project.id} className="project-item">
              <div className="project-main">
                <div className="project-title-row">
                  <h3>{project.title}</h3>
                  <span className={`status-badge ${project.status.toLowerCase().replace(' ', '-')}`}>
                    {project.status}
                  </span>
                </div>
              </div>
              <div className="project-actions">
                <button 
                  className="btn-edit" 
                  onClick={() => handleEditProject(project.id)}
                  title="Edit"
                >
                  ✎ Edit
                </button>
                <button 
                  className="btn-delete" 
                  onClick={() => handleDeleteProject(project.id)}
                  title="Delete"
                >
                  ⊗ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="project-stats">
          Stats: Published {stats.published} | Under Review {stats.underReview}
        </div>
      </div>
    </section>
  );
}

// Student Applications 組件
function StudentApplications({ showNotification }) {
  const [expandedProjects, setExpandedProjects] = useState(new Set());

  const deadline = {
    date: '2025-04-15 23:59',
    status: 'Overdue',
    description: 'Select your project preferences'
  };

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
      {/* Deadline Notification */}
      <div className="deadline-notification">
        <div className="deadline-label">Deadline:</div>
        <div className="deadline-info">
          <span className="deadline-date">{deadline.date}</span>
          <span className={`deadline-status ${deadline.status.toLowerCase()}`}>
            {deadline.status}
          </span>
        </div>
        <div className="deadline-description">{deadline.description}</div>
      </div>

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

// Supervision List 組件
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

function getSectionTitle(sectionId) {
  const titles = {
    'project-management': 'Project Management',
    'student-applications': 'Student Applications',
    'supervision-list': 'Supervision List'
  };
  return titles[sectionId] || 'Project Management';
}

export default Teacher;

