import React, { useState } from 'react';

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

export default ProjectManagement;

