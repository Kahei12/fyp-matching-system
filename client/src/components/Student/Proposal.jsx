import React, { useState, useEffect, useRef } from 'react';

function Proposal({ preferences, onSwitchSection, studentId, isAssigned = false, assignmentType = null }) {
  const preferencesCount = preferences?.length || 0;
  const proposalTableRef = useRef(null);
  
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredSkills: [],
    otherSkills: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const currentStudentId = studentId || sessionStorage.getItem('studentId') || 'S001';

  useEffect(() => {
    loadProposal();
  }, [currentStudentId]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/${currentStudentId}/proposal`);
      const result = await response.json();
      
      if (result.success && result.proposal) {
        setProposal(result.proposal);
      }
    } catch (error) {
      console.error('Error loading proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmitProposal = () => {
    // 滚动到提案表单
    if (proposalTableRef.current) {
      proposalTableRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除该字段的错误
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 50) {
      errors.description = 'Description must be at least 50 characters';
    }
    
    if (!formData.requiredSkills || formData.requiredSkills.length === 0) {
      errors.requiredSkills = 'Please select at least one required skill';
    }
    
    if (formData.requiredSkills.includes('Other') && !formData.otherSkills?.trim()) {
      errors.otherSkills = 'Please specify other skills';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // If proposal already exists and is pending/approved, don't allow new submission
    if (proposal && (proposal.proposalStatus === 'pending' || proposal.proposalStatus === 'approved')) {
      showNotification('You already have a proposal. Please wait for approval.', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/student/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentStudentId,
          title: formData.title,
          description: formData.description,
          skills: formData.requiredSkills
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Proposal submitted successfully!', 'success');
        
        // Fetch the latest proposal data from server
        try {
          const response = await fetch(`/api/student/${currentStudentId}/proposal`);
          const data = await response.json();
          if (data.success && data.proposal) {
            setProposal(data.proposal);
          }
        } catch (err) {
          console.error('Error fetching proposal:', err);
          setProposal(result.proposal);
        }
        
        // 重置表单
        setFormData({
          title: '',
          description: '',
          requiredSkills: ''
        });
      } else {
        showNotification(result.message || 'Failed to submit proposal', 'error');
      }
    } catch (error) {
      console.error('Error submitting proposal:', error);
      showNotification('Failed to submit proposal. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'Pending Review': 'status-pending',
      'Under Review': 'status-reviewing',
      'Approved': 'status-approved',
      'Rejected': 'status-rejected',
      'pending': 'status-pending',
      'approved': 'status-approved',
      'rejected': 'status-rejected',
      'none': 'status-not-submitted'
    };
    return statusMap[status] || 'status-pending';
  };

  const getDisplayStatus = () => {
    if (!proposal) return 'Not Submitted';
    return proposal.proposalStatus === 'pending' ? 'Pending Review' : 
           proposal.proposalStatus === 'approved' ? 'Approved' :
           proposal.proposalStatus === 'rejected' ? 'Rejected' : 'Not Submitted';
  };

  const isProposalApproved = proposal && proposal.proposalStatus === 'approved';
  
  // Check if student is assigned via matching algorithm (not via proposal)
  const isMatchedViaAlgorithm = isAssigned && assignmentType === 'matching';

  // 计算 deadlines
  const now = new Date();
  const proposalDeadline = new Date('2025-03-20T23:59:00');
  const preferenceDeadline = new Date('2025-04-15T22:59:00');
  
  const proposalDaysLeft = Math.ceil((proposalDeadline - now) / (1000 * 60 * 60 * 24));
  const preferenceDaysLeft = Math.ceil((preferenceDeadline - now) / (1000 * 60 * 60 * 24));
  const formattedProposalDate = proposalDeadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <section className="content-section active">
        <div className="loading-spinner">Loading...</div>
      </section>
    );
  }

  return (
    <section className="content-section active">
      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="section-header">
        <div className="section-title-with-deadline">
          <h1>Proposal</h1>
          <span className="deadline-hint">⏰ Deadline: {formattedProposalDate} ({proposalDaysLeft} days left)</span>
        </div>
        <div className="phase-indicator">
          Current Stage: <strong>Stage 1 — Proposal</strong>
        </div>
      </div>

      {/* Status Cards */}
      <div className="status-cards">
        <div className="status-card status-card-stage-1">
          <span className="stage-badge stage-1">Stage 1 (Proposal)</span>
          <div className="status-icon">✍</div>
          <div className="status-content">
            <h3>Proposal Status</h3>
            <p className="status-value">
              {getDisplayStatus()}
            </p>
            <button 
              className="action-btn" 
              onClick={handleSubmitProposal}
              disabled={isProposalApproved}
            >
              {isProposalApproved ? 'Proposal Approved' : 'Submit Proposal'}
            </button>
          </div>
        </div>
        
        <div className="status-card status-card-stage-2">
          <span className="stage-badge stage-2">Stage 2 (Matching)</span>
          <div className="status-icon">★</div>
          <div className="status-content">
            <h3>Preferences</h3>
            <p className="status-value">{preferencesCount}/5 Selected</p>
            <button 
              className="action-btn" 
              onClick={() => onSwitchSection('project-browse')}
              disabled={isProposalApproved}
            >
              {isProposalApproved ? 'Auto-Matched' : 'Browse Projects'}
            </button>
          </div>
        </div>
        
        <div className="status-card status-card-stage-3">
          <span className="stage-badge stage-3">Stage 3 (Clearing)</span>
          <div className="status-icon">☰</div>
          <div className="status-content">
            <h3>Assignment</h3>
            <p className="status-value">
              {isProposalApproved ? proposal?.title || 'Assigned' : 'Not Assigned'}
            </p>
            <button className="action-btn" onClick={() => onSwitchSection('results')}>
              View Status
            </button>
          </div>
        </div>
      </div>

      {/* Auto-matched notice (via proposal approval) */}
      {isProposalApproved && (
        <div className="auto-matched-notice">
          <h3>Your Project Proposal Has Been Approved</h3>
          <p>You have been automatically matched to the following project:</p>
          
          <div className="matched-project-info">
            <table className="project-details-table">
              <tbody>
                <tr>
                  <td className="detail-label">Project Title</td>
                  <td className="detail-value">{proposal?.title}</td>
                </tr>
                {proposal?.description && (
                  <tr>
                    <td className="detail-label">Description</td>
                    <td className="detail-value">{proposal?.description}</td>
                  </tr>
                )}
                {proposal?.skills && proposal.skills.length > 0 && (
                  <tr>
                    <td className="detail-label">Required Skills</td>
                    <td className="detail-value">{proposal.skills.join(', ')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <p className="notice-detail">You do not need to select preferences or participate in the matching process.</p>
        </div>
      )}

      {/* Matching result notice (via algorithm) */}
      {isMatchedViaAlgorithm && !isProposalApproved && (
        <div className="auto-matched-notice">
          <h3>You Have Been Assigned a Project</h3>
          <p>Based on the matching results, you have been assigned to a project.</p>
          <p className="notice-detail">You do not need to select preferences or participate in the matching process.</p>
        </div>
      )}

      {/* Deadline Reminder */}
      {!isProposalApproved && !isMatchedViaAlgorithm && (
        <div className="deadline-reminder">
          <h3>⏰ Upcoming Deadlines</h3>
          <div className="deadline-list">
            <div className="deadline-item">
              <span className="deadline-name">Proposal Submission</span>
              <span className="deadline-date">2025-03-20 23:59</span>
              <span className="deadline-days">{proposalDaysLeft} days left</span>
            </div>
            <div className="deadline-item">
              <span className="deadline-name">Preference Selection</span>
              <span className="deadline-date">2025-04-15 22:59</span>
              <span className="deadline-days">{preferenceDaysLeft} days left</span>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Status Form Section - hide if already assigned */}
      {!isProposalApproved && !isMatchedViaAlgorithm && (
        <div ref={proposalTableRef} className="proposal-status-section">
          <div className="proposal-section-header">
            <h2>Submit Proposal</h2>
            <p className="proposal-section-subtitle">Fill in the details below to submit your proposal</p>
          </div>

          <div className="proposal-form-container">
            <form onSubmit={handleFormSubmit} className="proposal-form">
              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  Proposal Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`form-input ${formErrors.title ? 'input-error' : ''}`}
                  placeholder="Enter your proposal title"
                  disabled={proposal?.proposalStatus === 'pending'}
                />
                {formErrors.title && (
                  <span className="error-message">{formErrors.title}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`form-textarea ${formErrors.description ? 'input-error' : ''}`}
                  placeholder="Describe your proposal in detail (minimum 50 characters)"
                  rows="6"
                  disabled={proposal?.proposalStatus === 'pending'}
                />
                <div className="char-count">
                  {formData.description.length} characters
                  {formData.description.length < 50 && formData.description.length > 0 && (
                    <span className="char-warning"> (minimum 50 required)</span>
                  )}
                </div>
                {formErrors.description && (
                  <span className="error-message">{formErrors.description}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="requiredSkills" className="form-label">
                  Required Skills <span className="required">*</span>
                </label>
                <div className="skills-select-container">
                  <div className="skills-checkbox-group">
                    {['Python', 'JavaScript', 'Java', 'C/C++', 'Machine Learning', 'Deep Learning', 'Web Development', 'Mobile App', 'Data Science', 'Cloud Computing', 'IoT', 'Cybersecurity', 'Blockchain'].map(skill => (
                      <label key={skill} className="skill-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.requiredSkills.includes(skill)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, requiredSkills: [...formData.requiredSkills, skill] });
                            } else {
                              setFormData({ ...formData, requiredSkills: formData.requiredSkills.filter(s => s !== skill) });
                            }
                          }}
                          disabled={proposal?.proposalStatus === 'pending'}
                        />
                        <span>{skill}</span>
                      </label>
                    ))}
                    <label className="skill-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.requiredSkills.includes('Other')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, requiredSkills: [...formData.requiredSkills, 'Other'] });
                          } else {
                            setFormData({ ...formData, requiredSkills: formData.requiredSkills.filter(s => s !== 'Other') });
                          }
                        }}
                        disabled={proposal?.proposalStatus === 'pending'}
                      />
                      <span>Other</span>
                    </label>
                  </div>
                  {formData.requiredSkills.includes('Other') && (
                    <input
                      type="text"
                      className="form-input other-skills-input"
                      placeholder="Please specify other skills"
                      value={formData.otherSkills || ''}
                      onChange={(e) => setFormData({ ...formData, otherSkills: e.target.value })}
                      disabled={proposal?.proposalStatus === 'pending'}
                    />
                  )}
                </div>
                {formErrors.requiredSkills && (
                  <span className="error-message">{formErrors.requiredSkills}</span>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting || proposal?.proposalStatus === 'pending'}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setFormData({ title: '', description: '', requiredSkills: [], otherSkills: '' });
                    setFormErrors({});
                  }}
                  disabled={isSubmitting || proposal?.proposalStatus === 'pending'}
                >
                  Clear Form
                </button>
              </div>
            </form>
          </div>

          {/* Submitted Proposal */}
          {proposal && (
            <div className="submitted-proposals-section">
              <h3 className="submitted-proposals-title">Your Submitted Proposal</h3>
              <div className="proposal-table-container">
                <table className="proposal-table">
                  <thead>
                    <tr>
                      <th>Proposal Title</th>
                      <th>Description</th>
                      <th>Required Skills</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="proposal-title-cell">
                        <strong>{proposal.title}</strong>
                      </td>
                      <td className="proposal-description-cell">
                        <p>{proposal.description}</p>
                      </td>
                      <td>{proposal.skills?.join(', ')}</td>
                      <td>
                        <span className={`proposal-status-badge ${getStatusBadgeClass(proposal.proposalStatus)}`}>
                          {getDisplayStatus()}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Proposal;
