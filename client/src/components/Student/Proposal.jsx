import React, { useState, useRef } from 'react';

function Proposal({ preferences, onSwitchSection }) {
  const preferencesCount = preferences?.length || 0;
  const proposalTableRef = useRef(null);
  
  const [proposals, setProposals] = useState([
    // 示例提案数据，可以根据实际情况从API获取
    // {
    //   id: 1,
    //   title: 'AI-based Learning System',
    //   description: 'Develop an intelligent learning platform that adapts to student learning patterns.',
    //   requiredSkills: 'Python, Machine Learning, React',
    //   status: 'Pending Review',
    //   submittedDate: '2025-03-05',
    //   supervisor: 'Dr. Bell Liu'
    // }
  ]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredSkills: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    if (!formData.requiredSkills.trim()) {
      errors.requiredSkills = 'Required skills are required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: 这里应该调用API提交提案
      // const response = await fetch('/api/proposals', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newProposal = {
        id: proposals.length + 1,
        title: formData.title,
        description: formData.description,
        requiredSkills: formData.requiredSkills,
        status: 'Pending Review',
        submittedDate: new Date().toISOString().split('T')[0],
        supervisor: 'N/A'
      };
      
      setProposals([...proposals, newProposal]);
      
      // 重置表单
      setFormData({
        title: '',
        description: '',
        requiredSkills: ''
      });
      
      alert('Proposal submitted successfully!');
    } catch (error) {
      console.error('Error submitting proposal:', error);
      alert('Failed to submit proposal. Please try again.');
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
      'Not Submitted': 'status-not-submitted'
    };
    return statusMap[status] || 'status-pending';
  };

  // 计算 Proposal Submission deadline
  const proposalDeadline = new Date('2025-03-20T23:59:00');
  const now = new Date();
  const daysLeft = Math.ceil((proposalDeadline - now) / (1000 * 60 * 60 * 24));
  const formattedDate = proposalDeadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <section className="content-section active">
      <div className="section-header">
        <div className="section-title-with-deadline">
          <h1>Proposal</h1>
          <span className="deadline-hint">⏰ Deadline: {formattedDate} ({daysLeft} days left)</span>
        </div>
        <div className="phase-indicator">
          Current Phase: <strong>Phase 1 — Proposal</strong>
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
              {proposals.length > 0 ? proposals[0].status : 'Not Submitted'}
            </p>
            <button className="action-btn" onClick={handleSubmitProposal}>
              Submit Proposal
            </button>
          </div>
        </div>
        
        <div className="status-card status-card-stage-2">
          <span className="stage-badge stage-2">Stage 2 (Matching)</span>
          <div className="status-icon">★</div>
          <div className="status-content">
            <h3>Preferences</h3>
            <p className="status-value">{preferencesCount}/5 Selected</p>
            <button className="action-btn" onClick={() => onSwitchSection('project-browse')}>
              Browse Projects
            </button>
          </div>
        </div>
        
        <div className="status-card status-card-stage-3">
          <span className="stage-badge stage-3">Stage 3 (Clearing)</span>
          <div className="status-icon">☰</div>
          <div className="status-content">
            <h3>Assignment</h3>
            <p className="status-value">Not Assigned</p>
            <button className="action-btn" onClick={() => onSwitchSection('results')}>
              View Status
            </button>
          </div>
        </div>
      </div>

      {/* Deadline Reminder */}
      <div className="deadline-reminder">
        <h3>⏲ Upcoming Deadlines</h3>
        <div className="deadline-list">
          <div className="deadline-item">
            <span className="deadline-name">Proposal Submission</span>
            <span className="deadline-date">2025-03-20 23:59</span>
            <span className="deadline-days">15 days left</span>
          </div>
          <div className="deadline-item">
            <span className="deadline-name">Preference Selection</span>
            <span className="deadline-date">2025-04-15 22:59</span>
            <span className="deadline-days">41 days left</span>
          </div>
        </div>
      </div>

      {/* Proposal Status Form Section */}
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
              <input
                type="text"
                id="requiredSkills"
                name="requiredSkills"
                value={formData.requiredSkills}
                onChange={handleInputChange}
                className={`form-input ${formErrors.requiredSkills ? 'input-error' : ''}`}
                placeholder="e.g., Python, Machine Learning, React, JavaScript"
              />
              <small className="form-hint">Separate multiple skills with commas</small>
              {formErrors.requiredSkills && (
                <span className="error-message">{formErrors.requiredSkills}</span>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setFormData({ title: '', description: '', requiredSkills: '' });
                  setFormErrors({});
                }}
                disabled={isSubmitting}
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>

        {/* Submitted Proposals List */}
        {proposals.length > 0 && (
          <div className="submitted-proposals-section">
            <h3 className="submitted-proposals-title">Submitted Proposals</h3>
            <div className="proposal-table-container">
              <table className="proposal-table">
                <thead>
                  <tr>
                    <th>Proposal Title</th>
                    <th>Description</th>
                    <th>Required Skills</th>
                    <th>Submitted Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((proposal) => (
                    <tr key={proposal.id}>
                      <td className="proposal-title-cell">
                        <strong>{proposal.title}</strong>
                      </td>
                      <td className="proposal-description-cell">
                        <p>{proposal.description}</p>
                      </td>
                      <td>{proposal.requiredSkills}</td>
                      <td>{proposal.submittedDate}</td>
                      <td>
                        <span className={`proposal-status-badge ${getStatusBadgeClass(proposal.status)}`}>
                          {proposal.status}
                        </span>
                      </td>
                      <td>
                        <div className="proposal-actions">
                          <button className="btn-secondary btn-sm">View</button>
                          {proposal.status === 'Pending Review' && (
                            <button className="btn-secondary btn-sm">Edit</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Proposal;

