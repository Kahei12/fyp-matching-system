import React, { useState, useEffect } from 'react';

function StudentApplications({ showNotification }) {
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState([]);
  const userEmail = sessionStorage.getItem('userEmail') || 'teacher@hkmu.edu.hk';

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/proposals/all');
      const data = await response.json();
      if (data.success && data.proposals) {
        setProposals(data.proposals);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProposal = async (proposalId) => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          supervisorEmail: userEmail,
          supervisorName: sessionStorage.getItem('userName') || 'Teacher'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        showNotification('Proposal approved! Student has been auto-matched.', 'success');
        fetchProposals(); // Refresh proposals
      } else {
        showNotification(data.message || 'Failed to approve proposal', 'error');
      }
    } catch (error) {
      console.error('Error approving proposal:', error);
      showNotification('Failed to approve proposal', 'error');
    }
  };

  const handleRejectProposal = async (proposalId) => {
    if (!window.confirm('Are you sure you want to reject this proposal?')) return;
    
    try {
      const response = await fetch(`/api/proposals/${proposalId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      
      const data = await response.json();
      if (data.success) {
        showNotification('Proposal rejected.', 'info');
        fetchProposals(); // Refresh proposals
      } else {
        showNotification(data.message || 'Failed to reject proposal', 'error');
      }
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      showNotification('Failed to reject proposal', 'error');
    }
  };

  if (loading) {
    return (
      <section className="content-section active">
        <div className="loading-spinner">Loading student applications...</div>
      </section>
    );
  }

  return (
    <section className="content-section active">
      {/* Student Proposals Section */}
      <div className="proposals-review-section">
        <h2>Student Proposed Topics</h2>
          
          {proposals.length === 0 ? (
            <div className="empty-state">
              <p>No student proposals yet.</p>
            </div>
          ) : (
            <div className="proposals-list">
              {proposals.map(proposal => (
                <div key={proposal._id} className="proposal-review-card">
                  {/* 统一信息框 - 表格形式 */}
                  <div className="proposal-info-box">
                    <table className="proposal-info-table">
                      <tbody>
                        <tr>
                          <td className="info-label">Title</td>
                          <td className="info-value-title">{proposal.title}</td>
                          <td className="info-label">Status</td>
                          <td>
                            <span className={`proposal-status-badge ${proposal.proposalStatus || 'pending'}`}>
                              {proposal.proposalStatus === 'pending' ? 'Pending Review' : 
                               proposal.proposalStatus === 'approved' ? 'Approved' :
                               proposal.proposalStatus === 'rejected' ? 'Rejected' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="info-label">Name</td>
                          <td className="info-value">{proposal.studentName}</td>
                          <td className="info-label">Student ID</td>
                          <td className="info-value">{proposal.studentId}</td>
                          <td className="info-label">GPA</td>
                          <td className="info-value gpa-value">{proposal.studentGpa}</td>
                        </tr>
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
                  
                  {proposal.proposalStatus === 'pending' && (
                    <div className="proposal-actions">
                      <button 
                        className="btn-approve-proposal"
                        onClick={() => handleApproveProposal(proposal._id)}
                      >
                        Approve & Auto-Match
                      </button>
                      <button 
                        className="btn-reject-proposal"
                        onClick={() => handleRejectProposal(proposal._id)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
    </section>
  );
}

export default StudentApplications;
