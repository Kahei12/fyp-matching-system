import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChangePassword.css';

function ChangePassword() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem('userEmail') || '';
  const userRole = sessionStorage.getItem('userRole') || '';
  const userName = sessionStorage.getItem('userName') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword) {
      setError('Password is required');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          // Clear mustChangePassword flag from session
          sessionStorage.removeItem('userEmail');
          sessionStorage.removeItem('userRole');
          sessionStorage.removeItem('userName');
          sessionStorage.removeItem('isLoggedIn');
          sessionStorage.removeItem('studentId');
          sessionStorage.removeItem('userGPA');
          sessionStorage.removeItem('userMajor');
          navigate('/');
        }, 2000);
      } else {
        setError(result.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="change-password-page">
        <div className="change-password-card success-card">
          <div className="success-icon">&#10003;</div>
          <h2>Password Changed</h2>
          <p>Your password has been updated successfully.</p>
          <p className="redirect-hint">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="change-password-page">
      <div className="change-password-card">
        <div className="card-header">
          <h2>Set Your New Password</h2>
          <p className="subtitle">
            Welcome, <strong>{userName || email}</strong> ({userRole})
          </p>
          <p className="hint">
            This is your first login. You must set a new password before continuing.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              disabled
              className="input-disabled"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">
              New Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoFocus
            />
            <span className="password-hint">Minimum 8 characters. Cannot be the same as the initial password.</span>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm New Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
