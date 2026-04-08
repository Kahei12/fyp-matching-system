import React, { useState, useEffect } from 'react';
import AppModal from '../common/AppModal';

function StudentApplications({ showNotification, onStatsChange, expiredDeadlineKeys = new Set() }) {
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const userEmail = sessionStorage.getItem('userEmail') || 't001@hkmu.edu.hk';
  const userName = sessionStorage.getItem('userName') || 'Teacher';

  // Proposal review deadline has passed → block all actions
  const isReviewExpired = expiredDeadlineKeys.has('teacherProposalReview');

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/student-proposals?email=${encodeURIComponent(userEmail)}`, {
        headers: {
          'x-teacher-email': userEmail
        }
      });
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

  const runApproveProposal = async (proposalId) => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approve',
          supervisorEmail: userEmail,
          supervisorName: userName,
          teacherId: userEmail,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showNotification('Proposal approved! You are now the supervisor of this project.', 'success');
        fetchProposals();
        if (onStatsChange) onStatsChange();
      } else {
        showNotification(data.message || 'Failed to approve proposal', 'error');
      }
    } catch (error) {
      console.error('Error approving proposal:', error);
      showNotification('Failed to approve proposal', 'error');
    }
  };

  const handleApproveProposal = (proposalId) => {
    setConfirmDialog({
      title: 'Approve proposal',
      message:
        'Are you sure you want to approve this proposal? You will become the supervisor of this project.',
      primaryLabel: 'Approve',
      onConfirm: () => {
        setConfirmDialog(null);
        runApproveProposal(proposalId);
      },
    });
  };

  const runRejectProposal = async (proposalId) => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'reject',
          teacherId: userEmail,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showNotification('Proposal rejected.', 'info');
        fetchProposals();
        if (onStatsChange) onStatsChange();
      } else {
        showNotification(data.message || 'Failed to reject proposal', 'error');
      }
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      showNotification('Failed to reject proposal', 'error');
    }
  };

  const handleRejectProposal = (proposalId) => {
    setConfirmDialog({
      title: 'Reject proposal',
      message:
        'Are you sure you want to reject this proposal? The student will be notified.',
      primaryLabel: 'Reject',
      onConfirm: () => {
        setConfirmDialog(null);
        runRejectProposal(proposalId);
      },
    });
  };

  if (loading) {
    return (
      <section className="content-section active">
        <div className="loading-spinner">Loading student proposals...</div>
      </section>
    );
  }

  // Filter proposals based on visibility rules
  // Only show: proposals that this teacher hasn't approved yet
  // Hide if another teacher has approved OR this teacher has rejected
  const visibleProposals = proposals.filter(p => {
    // If teacher has already approved, don't show
    if (p.myDecision === 'approve') {
      return false;
    }
    // If teacher has already rejected, don't show on home page
    if (p.myDecision === 'reject') {
      return false;
    }
    // Hide if another teacher has approved
    const otherApproval = p.teacherReviews?.some(r =>
      r.decision === 'approve' && r.teacherEmail?.toLowerCase() !== userEmail.toLowerCase()
    );
    if (otherApproval) {
      return false;
    }
    // Show all other proposals
    return true;
  });

  return (
    <section className="content-section active">
      {/* Student Proposals Section */}
      <div className="proposals-review-section">
        <h2>Student Proposed Topics</h2>
        <p className="section-description">
          Review and approve student-proposed project topics. Once you approve a proposal, you become its supervisor.
        </p>

          {visibleProposals.length === 0 ? (
            <div className="empty-state">
              <p>No student proposals available for review.</p>
              <p className="empty-hint">Proposals that have been approved by other teachers will not appear here.</p>
            </div>
          ) : (
            <div className="proposals-list">
              {visibleProposals.map(proposal => (
                <div key={proposal._id} className={`proposal-review-card ${proposal.myDecision || ''}`}>
                  {/* Unified info box - table format */}
                  <div className="proposal-info-box">
                    <table className="proposal-info-table">
                      <tbody>
                        <tr>
                          <td className="info-label">Title</td>
                          <td className="info-value-title">{proposal.title}</td>
                          <td className="info-label">Status</td>
                          <td>
                            <span className={`proposal-status-badge ${proposal.myDecision ? proposal.myDecision : 'pending'}`}>
                              {/* If this teacher has reviewed it, show their decision */}
                              {proposal.myDecision === 'approve' ? 'Approved' :
                               proposal.myDecision === 'reject' ? 'Rejected' :
                               /* Teacher hasn't reviewed: show Pending Review */
                               'Pending Review'}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="info-label">Student Name</td>
                          <td className="info-value">{proposal.studentName}</td>
                          <td className="info-label">Student ID</td>
                          <td className="info-value">{proposal.studentId}</td>
                          <td className="info-label">Major</td>
                          <td className="info-value">{proposal.studentMajor}</td>
                        </tr>
                        {proposal.myDecision && (
                          <tr>
                            <td className="info-label">Your Decision</td>
                            <td colSpan="5">
                              {proposal.myDecision === 'approve' && (
                                <span className="decision-tag decision-approved">✓ Approved</span>
                              )}
                              {proposal.myDecision === 'reject' && (
                                <span className="decision-tag decision-rejected">✗ Rejected</span>
                              )}
                              {proposal.myReviewedAt && (
                                <span className="decision-date">
                                  on {new Date(proposal.myReviewedAt).toLocaleDateString()}
                                </span>
                              )}
                            </td>
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
                  
                  {/* Show action buttons if: not yet reviewed by this teacher, or rejected by this teacher */}
                  {/* Hide buttons if teacher already approved */}
                  {!proposal.myDecision || proposal.myDecision === 'reject' ? (
                    <div className="proposal-actions">
                      <button
                        className="btn-approve-proposal"
                        disabled={isReviewExpired}
                        onClick={() => handleApproveProposal(proposal._id)}
                      >
                        Approve as Supervisor
                      </button>
                      <button
                        className="btn-reject-proposal"
                        disabled={isReviewExpired}
                        onClick={() => handleRejectProposal(proposal._id)}
                      >
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

      <AppModal
        open={!!confirmDialog}
        title={confirmDialog?.title || ''}
        onClose={() => setConfirmDialog(null)}
        footer="actions"
        primaryLabel={confirmDialog?.primaryLabel || 'Confirm'}
        onPrimary={() => confirmDialog?.onConfirm?.()}
        onSecondary={() => {}}
      >
        <p>{confirmDialog?.message}</p>
      </AppModal>
    </section>
  );
}

export default StudentApplications;
