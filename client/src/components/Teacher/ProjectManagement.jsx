import React, { useState, useEffect } from 'react';

function ProjectManagement({ showNotification }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    skills: '',
    capacity: 2,
    department: 'Computer Science',
    category: 'General'
  });

  const userEmail = sessionStorage.getItem('userEmail') || 'teacher@hkmu.edu.hk';

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching projects for email:', userEmail);
      const response = await fetch(`/api/teacher/projects?email=${encodeURIComponent(userEmail)}`, {
        headers: {
          'x-teacher-email': userEmail
        }
      });
      const data = await response.json();
      console.log('📥 Projects API response:', data);
      if (data.success && data.projects) {
        console.log('✅ Found projects:', data.projects.length);
        setProjects(data.projects);
      } else {
        console.log('⚠️ No projects found or API error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Fallback to mock data
      setProjects([
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
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) {
      showNotification('Please enter a project title', 'error');
      return;
    }

    try {
      const skillsArray = newProject.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const response = await fetch('/api/teacher/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-email': userEmail
        },
        body: JSON.stringify({
          ...newProject,
          skills: skillsArray,
          teacherEmail: userEmail
        })
      });

      const data = await response.json();
      if (data.success) {
        showNotification('Project created successfully!', 'success');
        setShowCreateModal(false);
        setNewProject({
          title: '',
          description: '',
          skills: '',
          capacity: 2,
          department: 'Computer Science',
          category: 'General'
        });
        fetchProjects();
      } else {
        showNotification(data.message || 'Failed to create project', 'error');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      showNotification('Failed to create project', 'error');
    }
  };

  const handleEditProject = async () => {
    if (!editingProject) return;

    try {
      // Use _id first, then fall back to id
      const projectId = editingProject._id || editingProject.id;
      console.log('🔧 Editing project:', { 
        id: projectId, 
        _id: editingProject._id, 
        idField: editingProject.id,
        title: editingProject.title 
      });
      
      if (!projectId) {
        showNotification('Error: Project ID not found', 'error');
        return;
      }
      
      const skillsArray = typeof editingProject.skills === 'string'
        ? editingProject.skills.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : editingProject.skills;

      const response = await fetch(`/api/teacher/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-email': userEmail
        },
        body: JSON.stringify({
          ...editingProject,
          skills: skillsArray,
          teacherEmail: userEmail
        })
      });

      const data = await response.json();
      console.log('📝 Update response:', data);
      if (data.success) {
        showNotification('Project updated successfully!', 'success');
        setEditingProject(null);
        fetchProjects();
      } else {
        showNotification(data.message || 'Failed to update project', 'error');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      showNotification('Failed to update project', 'error');
    }
  };

  const handleDeleteProject = async (projectId) => {
    const project = projects.find(p => (p._id || p.id) === projectId);
    if (project && window.confirm(`Are you sure you want to delete "${project.title}"?`)) {
      try {
        const response = await fetch(`/api/teacher/projects/${projectId}`, {
          method: 'DELETE',
          headers: {
            'x-teacher-email': userEmail
          }
        });

        const data = await response.json();
        if (data.success) {
          showNotification('Project deleted successfully!', 'success');
          fetchProjects();
        } else {
          showNotification(data.message || 'Failed to delete project', 'error');
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        showNotification('Failed to delete project', 'error');
      }
    }
  };

  const stats = {
    published: projects.filter(p => p.status === 'Approved').length,
    underReview: projects.filter(p => p.status === 'Under Review').length,
    total: projects.length
  };

  if (loading) {
    return (
      <section className="content-section active">
        <div className="loading-spinner">Loading projects...</div>
      </section>
    );
  }

  return (
    <section className="content-section active">
      {/* My Projects Section */}
      <div className="section-header">
        <button className="btn-create-project" onClick={() => setShowCreateModal(true)}>
          <span>+</span> Create New Project
        </button>
      </div>

      <div className="projects-section">
        <h2>My Projects</h2>
        
        {/* Stats Cards */}
        <div className="project-stats-cards">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Projects</div>
          </div>
          <div className="stat-card published">
            <div className="stat-number">{stats.published}</div>
            <div className="stat-label">Published</div>
          </div>
          <div className="stat-card review">
            <div className="stat-number">{stats.underReview}</div>
            <div className="stat-label">Under Review</div>
          </div>
        </div>

        <div className="project-list">
          {projects.length === 0 ? (
            <div className="empty-state">
              <p style={{ color: '#95a5a6', fontSize: '1rem' }}>*You haven't created any projects yet.</p>
            </div>
          ) : (
            projects.map(project => (
              <div key={project._id || project.id} className="project-item">
                <div className="project-main">
                  <div className="project-title-row">
                    <h3>{project.title}</h3>
                    <span className={`status-badge ${(project.status || 'Under Review').toLowerCase().replace(' ', '-')}`}>
                      {project.status || 'Under Review'}
                    </span>
                  </div>
                  <p className="project-description">
                    {project.description || 'No description provided'}
                  </p>
                  <div className="project-meta">
                    {project.popularity > 0 && <span className="project-popularity">Applicants: {project.popularity}</span>}
                  </div>
                  {project.skills && project.skills.length > 0 && (
                    <div className="skills-tags">
                      {project.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="project-actions">
                  <button 
                    className="btn-edit" 
                    onClick={() => setEditingProject(project)}
                    title="Edit"
                  >
                    ✎ Edit
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDeleteProject(project._id || project.id)}
                    title="Delete"
                  >
                    ⊗ Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-project-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  Project Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={newProject.title}
                  onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="Enter project title"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={newProject.description}
                  onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Describe the project..."
                  rows={5}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Required Skills</label>
                <input
                  type="text"
                  className="form-input"
                  value={newProject.skills}
                  onChange={e => setNewProject({ ...newProject, skills: e.target.value })}
                  placeholder="e.g., Python, Machine Learning, Web Development"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={newProject.department}
                    onChange={e => setNewProject({ ...newProject, department: e.target.value })}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronic Engineering">Electronic Engineering</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Information Technology">Information Technology</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={newProject.category}
                    onChange={e => setNewProject({ ...newProject, category: e.target.value })}
                  >
                    <option value="General">General</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Security">Security</option>
                    <option value="Network">Network</option>
                    <option value="IoT">IoT</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-submit" onClick={handleCreateProject}>Create Project</button>
              <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="modal-overlay" onClick={() => setEditingProject(null)}>
          <div className="modal-content edit-project-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Project</h2>
              <button className="modal-close-btn" onClick={() => setEditingProject(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  Project Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editingProject.title || ''}
                  onChange={e => setEditingProject({ ...editingProject, title: e.target.value })}
                  placeholder="Enter project title"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={editingProject.description || ''}
                  onChange={e => setEditingProject({ ...editingProject, description: e.target.value })}
                  rows={5}
                  placeholder="Describe the project..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Required Skills</label>
                <input
                  type="text"
                  className="form-input"
                  value={Array.isArray(editingProject.skills) ? editingProject.skills.join(', ') : (editingProject.skills || '')}
                  onChange={e => setEditingProject({ ...editingProject, skills: e.target.value })}
                  placeholder="e.g., Python, Machine Learning, Web Development"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={editingProject.status || 'Under Review'}
                  onChange={e => setEditingProject({ ...editingProject, status: e.target.value })}
                >
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-submit" onClick={handleEditProject}>Save Changes</button>
              <button className="btn-cancel" onClick={() => setEditingProject(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProjectManagement;
