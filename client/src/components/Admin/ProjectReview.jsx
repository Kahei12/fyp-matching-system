import React, { useState } from 'react';

function ProjectReview({ showNotification }) {
  const [selectAllProjects, setSelectAllProjects] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState(new Set());

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

export default ProjectReview;

