import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

function Admin() {
  const [currentSection, setCurrentSection] = useState('project-review');
  const navigate = useNavigate();

  useEffect(() => {
    // 檢查登入狀態
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');
    
    if (!isLoggedIn || userRole !== 'admin') {
      navigate('/');
      return;
    }
  }, [navigate]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      sessionStorage.clear();
      localStorage.clear();
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
    { id: 'project-review', label: 'Project Review' },
    { id: 'matching-control', label: 'Matching Control' },
    { id: 'final-assignment', label: 'Final Assignment' },
    { id: 'deadline-management', label: 'Deadline Management' }
  ];

  const renderSection = () => {
    switch (currentSection) {
      case 'project-review':
        return <ProjectReview showNotification={showNotification} />;
      case 'matching-control':
        return <MatchingControl showNotification={showNotification} />;
      case 'final-assignment':
        return <FinalAssignment showNotification={showNotification} />;
      case 'deadline-management':
        return <DeadlineManagement showNotification={showNotification} />;
      default:
        return <ProjectReview showNotification={showNotification} />;
    }
  };

  return (
    <div className="admin-container">
      {/* 側邊欄導航 */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>HKMU FYP Matching System</h2>
          <p>Admin Portal</p>
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
            <p>Welcome, Admin Wang</p>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      {/* 主內容區域 */}
      <main className="main-content">
        {/* 麵包屑導航 */}
        <div className="breadcrumb">
          <span 
            className="breadcrumb-link" 
            onClick={() => setCurrentSection('project-review')}
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

function ProjectReview({ showNotification }) {
  const [selectAllProjects, setSelectAllProjects] = React.useState(false);
  const [selectedProjects, setSelectedProjects] = React.useState(new Set());

  const pendingProjects = [
    {
      id: 1,
      title: 'Web Development',
      supervisor: 'Prof. Lin',
      description: 'E-commerce platform with modern features',
      skills: 'React, Node.js, Database'
    },
    {
      id: 2,
      title: 'Cybersecurity System',
      supervisor: 'Prof. Wang',
      description: 'Network security monitoring tool',
      skills: 'Security, Networks, Python'
    }
  ];

  const handleSelectAllProjects = (e) => {
    const isChecked = e.target.checked;
    setSelectAllProjects(isChecked);
    
    if (isChecked) {
      setSelectedProjects(new Set(pendingProjects.map(p => p.id)));
    } else {
      setSelectedProjects(new Set());
    }
  };

  const handleSelectProject = (projectId) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
    setSelectAllProjects(newSelected.size === pendingProjects.length);
  };

  const approveProject = (index) => {
    showNotification(`Project "${pendingProjects[index].title}" approved successfully!`, 'success');
  };

  const rejectProject = (index) => {
    if (window.confirm(`Are you sure you want to reject "${pendingProjects[index].title}"?`)) {
      showNotification(`Project "${pendingProjects[index].title}" rejected.`, 'error');
    }
  };

  const addComment = (index) => {
    const comment = prompt(`Enter your comment for "${pendingProjects[index].title}":`);
    if (comment) {
      showNotification('Comment added successfully!', 'info');
    }
  };

  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>Project Review</h1>
        <div className="progress-indicator">
          Review Progress: <strong>25/45 (56%)</strong>
        </div>
      </div>

      <div className="pending-review">
        <h3>Pending Review ({pendingProjects.length})</h3>
        
        <div className="review-controls">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={selectAllProjects}
              onChange={handleSelectAllProjects}
            /> 
            Select all projects ({pendingProjects.length})
          </label>
          {selectedProjects.size > 0 && (
            <span style={{ marginLeft: '1rem', color: '#6c757d' }}>
              ({selectedProjects.size} selected)
            </span>
          )}
        </div>

        <div className="project-list">
          {pendingProjects.map((project, index) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    className="project-checkbox"
                    checked={selectedProjects.has(project.id)}
                    onChange={() => handleSelectProject(project.id)}
                  />
                  <span className="project-title">{project.title}</span>
                </label>
              </div>
              <div className="project-details">
                <p className="supervisor">Supervisor: {project.supervisor}</p>
                <div className="description">
                  <strong>Description:</strong>
                  <ul>
                    <li>{project.description}</li>
                  </ul>
                </div>
                <div className="required-skills">
                  <strong>Required Skills:</strong> {project.skills}
                </div>
              </div>
              <div className="action-buttons">
                <button className="btn-approve" onClick={() => approveProject(index)}>Approve</button>
                <button className="btn-reject" onClick={() => rejectProject(index)}>Reject</button>
                <button className="btn-comment" onClick={() => addComment(index)}>Comment</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MatchingControl({ showNotification }) {
  const startMatching = () => {
    if (window.confirm('Start matching algorithm? This will assign students to projects based on preferences and GPA.')) {
      showNotification('Matching algorithm started...', 'info');
      
      setTimeout(() => {
        showNotification('Matching completed! 84% success rate (38/45 projects matched)', 'success');
      }, 3000);
    }
  };

  const showAdvancedSettings = () => {
    showNotification('Advanced settings panel opened', 'info');
  };

  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>Matching Control</h1>
      </div>

      <div className="matching-control-panel">
        <h2>Matching System Control</h2>
        
        <div className="phase-info">
          <div className="current-phase">
            <strong>Current Phase:</strong> 
            <span className="phase-dates">
              2024-03-21 00:01 [Init: 2024-04-05 23:39]
            </span>
          </div>
        </div>

        <div className="control-buttons">
          <button className="btn-primary" onClick={startMatching}>Start Matching</button>
          <button className="btn-secondary" onClick={showAdvancedSettings}>Advanced Setting</button>
        </div>

        <div className="live-statistics">
          <h3>Live Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Students:</span>
              <span className="stat-value">150</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Submitted Preferences:</span>
              <span className="stat-value">143</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Available Projects:</span>
              <span className="stat-value">45</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Matching Algorithm Status:</span>
              <span className="stat-value status-ready">Ready</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Estimated Completion:</span>
              <span className="stat-value">2024-04-06 12:00</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalAssignment({ showNotification }) {
  const [selectAll, setSelectAll] = React.useState(false);
  const [selectedStudents, setSelectedStudents] = React.useState(new Set());

  const unmatchedStudents = [
    { id: 'S001', name: 'Alex Johnston', gpa: 3.45 },
    { id: 'S002', name: 'Lisa Brown', gpa: 3.52 },
    { id: 'S003', name: 'Michael Chen', gpa: 3.28 },
    { id: 'S004', name: 'Sarah Wang', gpa: 3.67 },
    { id: 'S005', name: 'David Lee', gpa: 3.41 },
    { id: 'S006', name: 'Emily Zhang', gpa: 3.58 },
    { id: 'S007', name: 'James Liu', gpa: 3.33 }
  ];

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);
    
    if (isChecked) {
      setSelectedStudents(new Set(unmatchedStudents.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
    setSelectAll(newSelected.size === unmatchedStudents.length);
  };

  const autoAssignAll = () => {
    if (window.confirm('Auto-assign all unmatched students to available projects?')) {
      showNotification('Auto-assignment in progress...', 'info');
      setTimeout(() => {
        showNotification('All students have been assigned successfully!', 'success');
      }, 2000);
    }
  };

  const assignStudent = (index) => {
    const projectOptions = [
      'Database Optimization - Prof. Zhang',
      'Cloud Computing Platform - Prof. Liu',
      'Network Security Tool - Prof. Yang',
      'Game Development - Prof. Wu',
      'Data Visualization - Prof. Zhao'
    ];
    
    const selectedProject = prompt(`Select project for ${unmatchedStudents[index].name}:\n\n${projectOptions.join('\n')}`);
    
    if (selectedProject) {
      showNotification(`Student assigned to: ${selectedProject}`, 'success');
    }
  };

  const exportReport = () => {
    showNotification('Exporting assignment report...', 'info');
    setTimeout(() => {
      showNotification('Report exported successfully!', 'success');
    }, 1000);
  };

  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>Final Assignment</h1>
      </div>

      <div className="assignment-header">
        <h2>Unmatched Students ({unmatchedStudents.length})</h2>
        <button className="btn-primary" onClick={autoAssignAll}>Auto-assign All</button>
      </div>

      <div className="assignment-container">
        <div className="students-section">
          <div className="section-controls">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={selectAll}
                onChange={handleSelectAll}
              /> 
              Select all students ({unmatchedStudents.length})
            </label>
          </div>

          <table className="students-table">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Student ID</th>
                <th>Name</th>
                <th>GPA</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {unmatchedStudents.map((student, index) => (
                <tr key={student.id}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.has(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                    />
                  </td>
                  <td>{student.id}</td>
                  <td>{student.name}</td>
                  <td>{student.gpa}</td>
                  <td>
                    <button className="btn-assign" onClick={() => assignStudent(index)}>
                      ✉ Assign Projects
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '1rem', color: '#6c757d' }}>
            Selected: {selectedStudents.size} / {unmatchedStudents.length}
          </div>
        </div>

        <div className="projects-section">
          <h3>Available Projects (5)</h3>
          <div className="project-list-simple">
            <div className="available-project">
              <span className="project-name">Database Optimization</span>
              <span className="supervisor">- Prof. Zhang</span>
            </div>
            <div className="available-project">
              <span className="project-name">Cloud Computing Platform</span>
              <span className="supervisor">- Prof. Liu</span>
            </div>
            <div className="available-project">
              <span className="project-name">Network Security Tool</span>
              <span className="supervisor">- Prof. Yang</span>
            </div>
            <div className="available-project">
              <span className="project-name">Game Development</span>
              <span className="supervisor">- Prof. Wu</span>
            </div>
            <div className="available-project">
              <span className="project-name">Data Visualization</span>
              <span className="supervisor">- Prof. Zhao</span>
            </div>
          </div>
          
          <button className="btn-export" onClick={exportReport}>⚑ Export Report</button>
        </div>
      </div>
    </section>
  );
}

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

function getSectionTitle(sectionId) {
  const titles = {
    'project-review': 'Project Review',
    'matching-control': 'Matching Control',
    'final-assignment': 'Final Assignment',
    'deadline-management': 'Deadline Management'
  };
  return titles[sectionId] || 'Project Review';
}

export default Admin;

