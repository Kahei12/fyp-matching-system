import React, { useState, useEffect } from 'react';
import AppModal from '../common/AppModal';
import { majorToFilterCode } from '../../utils/majorMapping';
import { PROPOSAL_SKILL_OPTIONS } from '../../constants/proposalSkills';

function ProjectManagement({ showNotification, expiredDeadlineKeys = new Set() }) {
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingSkills, setEditingSkills] = useState([]);
  const [editingOtherSkills, setEditingOtherSkills] = useState('');
  const [editingShowOther, setEditingShowOther] = useState(false);
  const [activeTab, setActiveTab] = useState('my-projects');
  /** Teacher Proposal → Student Proposals: Filter reviewed list (All / Approved only / Rejected only) */
  const [reviewedProposalFilter, setReviewedProposalFilter] = useState('all');
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    skills: [],
    otherSkills: '',
    projectMajor: '',
    capacity: 1,
    category: 'General',
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Major-related stats
  const [teacherMajor, setTeacherMajor] = useState('');
  const [projectStats, setProjectStats] = useState({
    eceNeeded: 0,
    ccsNeeded: 0,
    ecePerTeacherTarget: 0,
    ccsPerTeacherTarget: 0,
    eceCreated: 0,
    ccsCreated: 0,
    eceTeachers: 0,
    ccsTeachers: 0,
    bothTeachers: 0,
  });

  const isSelfProposalExpired = expiredDeadlineKeys.has('teacherSelfProposal');

  const userEmail = sessionStorage.getItem('userEmail') || 't001@hkmu.edu.hk';
  const userEmailLower = userEmail.toLowerCase();

  const getMyReview = (proposal) =>
    proposal.teacherReviews?.find((r) => r.teacherEmail?.toLowerCase() === userEmailLower);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.skills-dropdown')) {
        document.querySelectorAll('.skills-dropdown-list').forEach(list => {
          list.style.display = 'none';
        });
      }
    };
    document.addEventListener('click', handleClickOutside);

    // 初始化数据
    fetchTeacherMajor();
    fetchProjects();
    fetchProposals();

    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // When teacher major loads while create modal is open, lock single-programme major
  useEffect(() => {
    const tm = majorToFilterCode(teacherMajor);
    if (showCreateModal && (tm === 'ECE' || tm === 'CCS')) {
      setNewProject((p) => ({ ...p, projectMajor: tm }));
    }
  }, [teacherMajor, showCreateModal]);

  const fetchTeacherMajor = async () => {
    try {
      const response = await fetch(`/api/teachers/${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      if (data.success && data.teacher) {
        setTeacherMajor(data.teacher.major || '');
      }
    } catch (error) {
      console.error('Error fetching teacher major:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('[ProjectManagement] Fetching projects for email:', userEmail);

      // Fetch teacher's own projects and global project stats in parallel
      const [projRes, statsRes] = await Promise.all([
        fetch(`/api/teacher/projects?email=${encodeURIComponent(userEmail)}`, {
          headers: { 'x-teacher-email': userEmail }
        }),
        fetch('/api/admin/project-stats')
      ]);

      const projData = await projRes.json();
      const statsData = await statsRes.json();
      const globalStats = statsData.success ? (statsData.stats || {}) : {};

      console.log('[ProjectManagement] Projects API response:', projData);
      if (projData.success && projData.projects) {
        console.log('[ProjectManagement] Found projects:', projData.projects.length);
        setProjects(projData.projects);
        // Calculate own ECE/CCS counts + merge global student/project deficit counts
        calculateProjectStats(projData.projects, globalStats);
      } else {
        console.log('[ProjectManagement] No projects or API error:', projData.message);
        setProjects([]);
        calculateProjectStats([], globalStats);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Per-teacher targets from admin stats (student count ÷ supervisors); own progress = my projects only
  const calculateProjectStats = (myProjects, globalStats) => {
    const stats = globalStats || {};
    const eceDenom = Math.max(1, (stats.eceTeachers || 0) + (stats.bothTeachers || 0));
    const ccsDenom = Math.max(1, (stats.ccsTeachers || 0) + (stats.bothTeachers || 0));
    const eceTarget =
      stats.ecePerTeacherTarget != null
        ? stats.ecePerTeacherTarget
        : Math.ceil((stats.eceStudents || 0) / eceDenom);
    const ccsTarget =
      stats.ccsPerTeacherTarget != null
        ? stats.ccsPerTeacherTarget
        : Math.ceil((stats.ccsStudents || 0) / ccsDenom);
    const myEceProjects = myProjects.filter((p) => {
      const c = majorToFilterCode(p.major);
      return c === 'ECE' || c === 'ECE+CCS';
    }).length;
    const myCcsProjects = myProjects.filter((p) => {
      const c = majorToFilterCode(p.major);
      return c === 'CCS' || c === 'ECE+CCS';
    }).length;
    setProjectStats({
      eceNeeded: Math.max(0, (stats.eceStudents || 0) - (stats.eceProjects || 0)),
      ccsNeeded: Math.max(0, (stats.ccsStudents || 0) - (stats.ccsProjects || 0)),
      ecePerTeacherTarget: eceTarget,
      ccsPerTeacherTarget: ccsTarget,
      eceCreated: myEceProjects,
      ccsCreated: myCcsProjects,
      eceTeachers: stats.eceTeachers || 0,
      ccsTeachers: stats.ccsTeachers || 0,
      bothTeachers: stats.bothTeachers || 0,
    });
  };

  const fetchProposals = async () => {
    try {
      const response = await fetch(`/api/teacher/student-proposals?email=${encodeURIComponent(userEmail)}`, {
        headers: {
          'x-teacher-email': userEmail
        }
      });
      const data = await response.json();
      console.log('[ProjectManagement] Fetched student proposals:', data);
      if (data.success && data.proposals) {
        setProposals(data.proposals);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    }
  };

  const openCreateModal = () => {
    const tm = majorToFilterCode(teacherMajor);
    setNewProject({
      title: '',
      description: '',
      skills: [],
      otherSkills: '',
      projectMajor: tm === 'ECE' ? 'ECE' : tm === 'CCS' ? 'CCS' : '',
      capacity: 1,
      category: 'General',
    });
    setShowCreateModal(true);
  };

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) {
      showNotification('Please enter a project title', 'error');
      return;
    }
    const tm = majorToFilterCode(teacherMajor);
    if (tm === 'ECE+CCS' && !newProject.projectMajor) {
      showNotification('Please select project major (ECE or CCS).', 'error');
      return;
    }
    if (!newProject.skills || newProject.skills.length === 0) {
      showNotification('Select at least one required skill.', 'error');
      return;
    }
    if (newProject.skills.includes('Other') && !String(newProject.otherSkills || '').trim()) {
      showNotification('Please specify skills for "Other".', 'error');
      return;
    }

    let skillsPayload = [...newProject.skills];
    if (skillsPayload.includes('Other')) {
      skillsPayload = skillsPayload.filter((s) => s !== 'Other');
      const extra = String(newProject.otherSkills || '').trim();
      if (extra) skillsPayload.push(extra);
    }

    try {
      const response = await fetch('/api/teacher/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-email': userEmail,
        },
        body: JSON.stringify({
          title: newProject.title.trim(),
          description: newProject.description,
          skills: skillsPayload,
          major: newProject.projectMajor,
          capacity: newProject.capacity,
          category: newProject.category,
          teacherEmail: userEmail,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showNotification('Project created successfully!', 'success');
        setShowCreateModal(false);
        const tmOk = majorToFilterCode(teacherMajor);
        setNewProject({
          title: '',
          description: '',
          skills: [],
          otherSkills: '',
          projectMajor: tmOk === 'ECE' ? 'ECE' : tmOk === 'CCS' ? 'CCS' : '',
          capacity: 1,
          category: 'General',
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

    const hasOther = editingShowOther && editingOtherSkills.trim();
    const skillsToSave = [...editingSkills.filter(s => s !== 'Other')];
    if (hasOther) skillsToSave.push(editingOtherSkills.trim());

    if (skillsToSave.length === 0) {
      showNotification('Select at least one required skill.', 'error');
      return;
    }
    if (hasOther && !editingOtherSkills.trim()) {
      showNotification('Please specify skills for "Other".', 'error');
      return;
    }

    try {
      const projectId = editingProject._id || editingProject.id;
      if (!projectId) {
        showNotification('Error: Project ID not found', 'error');
        return;
      }

      const response = await fetch(`/api/teacher/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-email': userEmail
        },
        body: JSON.stringify({
          title: editingProject.title,
          description: editingProject.description,
          skills: skillsToSave,
          capacity: editingProject.capacity,
          major: majorToFilterCode(editingProject.major) || editingProject.major,
          teacherEmail: userEmail
        })
      });

      const data = await response.json();
      if (data.success) {
        showNotification('Project updated successfully!', 'success');
        setEditingProject(null);
        setEditingSkills([]);
        setEditingOtherSkills('');
        setEditingShowOther(false);
        fetchProjects();
      } else {
        showNotification(data.message || 'Failed to update project', 'error');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      showNotification('Failed to update project', 'error');
    }
  };

  const runDeleteProject = async (projectId) => {
    try {
      const response = await fetch(`/api/teacher/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'x-teacher-email': userEmail,
        },
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
  };

  const handleDeleteProject = (projectId) => {
    const project = projects.find((p) => (p._id || p.id) === projectId);
    if (!project) return;
    setDeleteConfirm({ projectId, title: project.title });
  };

  // Calculate number of reviewed proposals in Student Proposals tab (for badge)
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
          My Projects
        </button>
        <button 
          className={`tab-button ${activeTab === 'student-proposals' ? 'active' : ''}`}
          onClick={() => setActiveTab('student-proposals')}
        >
          Student Proposals
          {reviewedProposalsCount > 0 && (
            <span className="tab-badge">({reviewedProposalsCount})</span>
          )}
        </button>
      </div>

      {/* My Projects Section - projects created by the teacher */}
      {activeTab === 'my-projects' && (
        <>
          <div className="section-header">
            <h2>My Projects (Teacher-Proposed)</h2>
            {!isSelfProposalExpired && (
              <button type="button" className="btn-create-project" onClick={openCreateModal}>
                <span>+</span> Create New Project
              </button>
            )}
          </div>

          {/* Project Requirements Hint */}
          {!isSelfProposalExpired && (() => {
            const tm = majorToFilterCode(teacherMajor);
            const stillEce = Math.max(0, (projectStats.ecePerTeacherTarget || 0) - projectStats.eceCreated);
            const stillCcs = Math.max(0, (projectStats.ccsPerTeacherTarget || 0) - projectStats.ccsCreated);
            const showEce = tm === 'ECE' || tm === 'ECE+CCS' || !tm;
            const showCcs = tm === 'CCS' || tm === 'ECE+CCS' || !tm;
            return (
            <div className="project-requirements-hint">
              {showCcs && (
                <p className="requirement-item ccs">
                  You still need to propose <strong>{stillCcs}</strong> CCS project{stillCcs !== 1 ? '(s)' : ''}.
                </p>
              )}
              {showEce && (
                <p className="requirement-item ece">
                  You still need to propose <strong>{stillEce}</strong> ECE project{stillEce !== 1 ? '(s)' : ''}.
                </p>
              )}
            </div>
            );
          })()}

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
                        disabled={isSelfProposalExpired}
                        onClick={() => {
                          if (!isSelfProposalExpired) {
                            const rawSkills = project.skills || [];
                            const parsedSkills = typeof rawSkills === 'string'
                              ? rawSkills.split(',').map(s => s.trim()).filter(s => s.length > 0)
                              : rawSkills;
                            const hasOther = !PROPOSAL_SKILL_OPTIONS.includes(parsedSkills[parsedSkills.length - 1]) && parsedSkills.length > 0;
                            setEditingSkills(parsedSkills.filter(s => PROPOSAL_SKILL_OPTIONS.includes(s)));
                            setEditingOtherSkills(hasOther ? parsedSkills[parsedSkills.length - 1] : '');
                            setEditingShowOther(hasOther);
                            setEditingProject(project);
                          }
                        }}
                        title="Edit"
                      >
                        ✎ Edit
                      </button>
                      <button
                        className="btn-delete"
                        disabled={isSelfProposalExpired}
                        onClick={() => !isSelfProposalExpired && handleDeleteProject(project._id || project.id)}
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

      {/* Student Proposals Section - only shows teacher-reviewed student-proposed projects */}
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
                              {decision === 'approve' && (
                                <span className="decision-tag decision-approved">✓ Approved</span>
                              )}
                              {decision === 'reject' && (
                                <span className="decision-tag decision-rejected">✗ Rejected</span>
                              )}
                              {!decision && <span className="your-decision">—</span>}
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
          <div className="modal-content create-project-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Teacher Project</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowCreateModal(false)}>×</button>
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
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="Enter project title"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Describe the project..."
                  rows={10}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Required Skills <span className="required">*</span>
                </label>
                <div className="skills-dropdown">
                  <div
                    className="skills-dropdown-display"
                    onClick={() => {
                      const dropdown = document.querySelector('.create-project-modal .skills-dropdown');
                      const list = dropdown?.querySelector('.skills-dropdown-list');
                      if (list) list.style.display = list.style.display === 'block' ? 'none' : 'block';
                    }}
                  >
                    {newProject.skills.length === 0 ? (
                      <span className="skills-placeholder">Select skills...</span>
                    ) : (
                      newProject.skills.map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))
                    )}
                    <span className="skills-dropdown-arrow">▼</span>
                  </div>
                  <div className="skills-dropdown-list">
                    {PROPOSAL_SKILL_OPTIONS.map((skill) => (
                      <label key={skill} className="skill-option">
                        <input
                          type="checkbox"
                          checked={newProject.skills.includes(skill)}
                          onChange={() => {
                            const newSkills = newProject.skills.includes(skill)
                              ? newProject.skills.filter(s => s !== skill)
                              : [...newProject.skills, skill];
                            setNewProject(prev => ({ ...prev, skills: newSkills }));
                          }}
                        />
                        <span>{skill}</span>
                      </label>
                    ))}
                    <label className="skill-option">
                      <input
                        type="checkbox"
                        checked={newProject.skills.includes('Other')}
                        onChange={() => {
                          const newSkills = newProject.skills.includes('Other')
                            ? newProject.skills.filter(s => s !== 'Other')
                            : [...newProject.skills, 'Other'];
                          setNewProject(prev => ({ ...prev, skills: newSkills, otherSkills: '' }));
                        }}
                      />
                      <span>Other</span>
                    </label>
                  </div>
                </div>
                {newProject.skills.includes('Other') && (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Specify other skills"
                    value={newProject.otherSkills}
                    onChange={(e) => setNewProject({ ...newProject, otherSkills: e.target.value })}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="create-project-major">
                    Major (ECE/CCS) <span className="required">*</span>
                  </label>
                  {majorToFilterCode(teacherMajor) === 'ECE+CCS' ? (
                    <select
                      id="create-project-major"
                      className="form-select"
                      value={newProject.projectMajor}
                      onChange={(e) => setNewProject({ ...newProject, projectMajor: e.target.value })}
                      required
                    >
                      <option value="">Select major…</option>
                      <option value="ECE">ECE</option>
                      <option value="CCS">CCS</option>
                    </select>
                  ) : (
                    <select
                      id="create-project-major"
                      className="form-select"
                      value={newProject.projectMajor}
                      onChange={(e) => setNewProject({ ...newProject, projectMajor: e.target.value })}
                      disabled
                    >
                      {majorToFilterCode(teacherMajor) === 'ECE' && <option value="ECE">ECE</option>}
                      {majorToFilterCode(teacherMajor) === 'CCS' && <option value="CCS">CCS</option>}
                      {!majorToFilterCode(teacherMajor) && (
                        <>
                          <option value="">Select major…</option>
                          <option value="ECE">ECE</option>
                          <option value="CCS">CCS</option>
                        </>
                      )}
                    </select>
                  )}
                  <small className="form-hint">
                    {majorToFilterCode(teacherMajor) === 'ECE+CCS'
                      ? 'Choose whether this project is for ECE or CCS students.'
                      : 'Locked to your teaching programme.'}
                  </small>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="create-capacity">Capacity</label>
                  <input
                    id="create-capacity"
                    type="number"
                    min={1}
                    max={10}
                    className="form-input"
                    value={newProject.capacity}
                    onChange={(e) =>
                      setNewProject({ ...newProject, capacity: Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)) })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={newProject.category}
                    onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
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
              <button type="button" className="btn-submit" onClick={handleCreateProject}>
                Create Project
              </button>
              <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
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
                <div className="skills-dropdown">
                  <div
                    className="skills-dropdown-display"
                    onClick={() => {
                      const dropdown = document.querySelector('.edit-project-modal .skills-dropdown');
                      const list = dropdown?.querySelector('.skills-dropdown-list');
                      if (list) list.style.display = list.style.display === 'block' ? 'none' : 'block';
                    }}
                  >
                    {editingSkills.length === 0 && !editingShowOther ? (
                      <span className="skills-placeholder">Select skills...</span>
                    ) : (
                      <>
                        {editingSkills.map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                        {editingShowOther && editingOtherSkills && (
                          <span className="skill-tag">{editingOtherSkills}</span>
                        )}
                      </>
                    )}
                    <span className="skills-dropdown-arrow">▼</span>
                  </div>
                  <div className="skills-dropdown-list">
                    {PROPOSAL_SKILL_OPTIONS.map((skill) => (
                      <label key={skill} className="skill-option">
                        <input
                          type="checkbox"
                          checked={editingSkills.includes(skill)}
                          onChange={() => {
                            const newSkills = editingSkills.includes(skill)
                              ? editingSkills.filter(s => s !== skill)
                              : [...editingSkills, skill];
                            setEditingSkills(newSkills);
                          }}
                        />
                        <span>{skill}</span>
                      </label>
                    ))}
                    <label className="skill-option">
                      <input
                        type="checkbox"
                        checked={editingShowOther}
                        onChange={() => {
                          const hasOther = !editingShowOther;
                          setEditingShowOther(hasOther);
                          if (!hasOther) setEditingOtherSkills('');
                        }}
                      />
                      <span>Other</span>
                    </label>
                  </div>
                </div>
                {editingShowOther && (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Specify other skills"
                    value={editingOtherSkills}
                    onChange={(e) => setEditingOtherSkills(e.target.value)}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Major (ECE/CCS)</label>
                {majorToFilterCode(teacherMajor) === 'ECE+CCS' ? (
                  <select
                    className="form-select"
                    value={majorToFilterCode(editingProject.major) || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, major: e.target.value })}
                  >
                    <option value="ECE">ECE</option>
                    <option value="CCS">CCS</option>
                  </select>
                ) : (
                  <select
                    className="form-select"
                    value={majorToFilterCode(editingProject.major) || (majorToFilterCode(teacherMajor) === 'ECE' ? 'ECE' : 'CCS')}
                    disabled
                  >
                    {majorToFilterCode(teacherMajor) === 'ECE' ? (
                      <option value="ECE">ECE</option>
                    ) : (
                      <option value="CCS">CCS</option>
                    )}
                  </select>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-submit" onClick={handleEditProject}>Save Changes</button>
              <button className="btn-cancel" onClick={() => {
                setEditingProject(null);
                setEditingSkills([]);
                setEditingOtherSkills('');
                setEditingShowOther(false);
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <AppModal
        open={!!deleteConfirm}
        title="Delete project"
        onClose={() => setDeleteConfirm(null)}
        footer="actions"
        primaryLabel="Delete"
        secondaryLabel="Cancel"
        onPrimary={() => {
          if (deleteConfirm) {
            const id = deleteConfirm.projectId;
            setDeleteConfirm(null);
            runDeleteProject(id);
          }
        }}
        onSecondary={() => {}}
      >
        <p>
          Are you sure you want to delete &quot;{deleteConfirm?.title}&quot;?
        </p>
      </AppModal>
    </section>
  );
}

export default ProjectManagement;
