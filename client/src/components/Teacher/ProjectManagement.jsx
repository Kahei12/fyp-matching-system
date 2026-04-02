import React, { useState, useEffect } from 'react';

function ProjectManagement({ showNotification }) {
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [activeTab, setActiveTab] = useState('my-projects');
  /** Teacher Proposal → Student Proposals：篩選已審核列表（全部 / 僅 Approved / 僅 Rejected） */
  const [reviewedProposalFilter, setReviewedProposalFilter] = useState('all');
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    skills: '',
    capacity: 1,
    department: 'Computer Science',
    category: 'General'
  });

  const userEmail = sessionStorage.getItem('userEmail') || 'teacher@hkmu.edu.hk';
  const userEmailLower = userEmail.toLowerCase();

  const getMyReview = (proposal) =>
    proposal.teacherReviews?.find((r) => r.teacherEmail?.toLowerCase() === userEmailLower);

  useEffect(() => {
    fetchProjects();
    fetchProposals();
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
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async () => {
    try {
      const response = await fetch(`/api/teacher/student-proposals?email=${encodeURIComponent(userEmail)}`, {
        headers: {
          'x-teacher-email': userEmail
        }
      });
      const data = await response.json();
      console.log('📋 Fetched student proposals:', data);
      if (data.success && data.proposals) {
        setProposals(data.proposals);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
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
          capacity: 1,
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
      const projectId = editingProject._id || editingProject.id;
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

  // 計算 Student Proposals 分頁中已審核的提案數量（用於括號 badge）
  const reviewedProposalsCount = proposals.filter((p) => getMyReview(p)).length;

  if (loading) {
    return (
      <section className="content-section active">
        <div className="loading-spinner">Loading projects...</div>
      </section>
    );
  }

  return (
    <section className="content-section active">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'my-projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-projects')}
        >
          📋 My Projects
        </button>
        <button 
          className={`tab-button ${activeTab === 'student-proposals' ? 'active' : ''}`}
          onClick={() => setActiveTab('student-proposals')}
        >
          📝 Student Proposals
          {reviewedProposalsCount > 0 && (
            <span className="tab-badge">({reviewedProposalsCount})</span>
          )}
        </button>
      </div>

      {/* My Projects Section - 老師自己創建的項目 */}
      {activeTab === 'my-projects' && (
        <>
          <div className="section-header">
            <h2>My Projects (Teacher-Proposed)</h2>
            <button className="btn-create-project" onClick={() => setShowCreateModal(true)}>
              <span>+</span> Create New Project
            </button>
          </div>

          <div className="projects-section">
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
                        <span className="project-code">Code: {project.code}</span>
                        <span className="project-category">Category: {project.category}</span>
                        <span className="project-capacity">Capacity: {project.capacity || 1}</span>
                        {project.popularity > 0 && (
                          <span className="project-popularity">Popularity: {project.popularity}</span>
                        )}
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
        </>
      )}

      {/* Student Proposals Section - 只顯示老師已審核的 student-proposed 項目 */}
      {activeTab === 'student-proposals' && (() => {
        const reviewedProposals = proposals.filter((p) => getMyReview(p));
        const filteredReviewed =
          reviewedProposalFilter === 'all'
            ? reviewedProposals
            : reviewedProposals.filter((p) => {
                const d = getMyReview(p)?.decision;
                return reviewedProposalFilter === 'approve' ? d === 'approve' : d === 'reject';
              });

        return (
        <div className="proposals-review-section">
          <div className="proposals-section-header">
            <div>
              <h2>Student Proposed Topics</h2>
              <p className="section-description">
                View your reviewed student proposals. New proposals appear on the Dashboard for review.
              </p>
            </div>
            {reviewedProposals.length > 0 && (
              <div className="reviewed-proposals-filter" role="group" aria-label="Filter by decision">
                <button
                  type="button"
                  className={`filter-pill ${reviewedProposalFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setReviewedProposalFilter('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`filter-pill ${reviewedProposalFilter === 'approve' ? 'active' : ''}`}
                  onClick={() => setReviewedProposalFilter('approve')}
                >
                  Approved
                </button>
                <button
                  type="button"
                  className={`filter-pill ${reviewedProposalFilter === 'reject' ? 'active' : ''}`}
                  onClick={() => setReviewedProposalFilter('reject')}
                >
                  Rejected
                </button>
              </div>
            )}
          </div>

          {reviewedProposals.length === 0 ? (
            <div className="empty-state">
              <p>No reviewed student proposals.</p>
              <p className="empty-hint">Student proposals will appear here after you approve or reject them on the Dashboard (Home → Student Proposals).</p>
            </div>
          ) : filteredReviewed.length === 0 ? (
            <div className="empty-state">
              <p>No proposals in this category.</p>
              <p className="empty-hint">Try switching to &quot;All&quot; or another filter.</p>
            </div>
          ) : (
            <div className="proposals-list">
              {filteredReviewed.map((proposal) => {
                const myReview = getMyReview(proposal);
                const decision = myReview?.decision;
                const cardTone =
                  decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : '';
                return (
                  <div key={proposal._id} className={`proposal-review-card ${cardTone}`.trim()}>
                    <div className="proposal-info-box">
                      <table className="proposal-info-table">
                        <tbody>
                          <tr>
                            <td className="info-label">Title</td>
                            <td className="info-value-title">{proposal.title}</td>
                            <td className="info-label">Your Decision</td>
                            <td>
                              <span className={`your-decision ${decision || ''}`}>
                                {decision === 'approve'
                                  ? '✓ Approved'
                                  : decision === 'reject'
                                    ? '✗ Rejected'
                                    : '—'}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="info-label">Student</td>
                            <td className="info-value">{proposal.proposedByName || 'Unknown'}</td>
                            <td className="info-label">Major</td>
                            <td className="info-value">{proposal.department || 'N/A'}</td>
                          </tr>
                          {myReview?.reviewedAt && (
                            <tr>
                              <td className="info-label">Reviewed At</td>
                              <td colSpan="3">{new Date(myReview.reviewedAt).toLocaleString()}</td>
                            </tr>
                          )}
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

                  </div>
                );
              })}
            </div>
          )}
        </div>
        );
      })()}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-project-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Teacher Project</h2>
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
                  rows={10}
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
                  rows={10}
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
