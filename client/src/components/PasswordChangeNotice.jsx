import React, { useState, useEffect } from 'react';
import './PasswordChangeNotice.css';

function PasswordChangeNotice({ onPasswordChanged }) {
  const email = sessionStorage.getItem('userEmail') || '';
  const userRole = sessionStorage.getItem('userRole') || '';
  const userName = sessionStorage.getItem('userName') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Block page scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

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
        onPasswordChanged();
      } else {
        setError(result.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pcn-overlay">
      <div className="pcn-backdrop" />
      <div className="pcn-modal">
        <div className="pcn-header">
          <div className="pcn-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="#c0392b" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M12 8v4M12 16h.01" stroke="#c0392b" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2>Password Change Required</h2>
          <p className="pcn-subtitle">
            Welcome, <strong>{userName || email}</strong> ({userRole})
          </p>
          <p className="pcn-desc">
            You are logging in for the first time. Please set a new password before continuing.
          </p>
        </div>

        <form className="pcn-form" onSubmit={handleSubmit}>
          <div className="pcn-form-group">
            <label htmlFor="pcn-email">Email</label>
            <input
              type="email"
              id="pcn-email"
              value={email}
              disabled
              className="pcn-input-disabled"
            />
          </div>

          <div className="pcn-form-group">
            <label htmlFor="pcn-newPassword">
              New Password <span className="pcn-required">*</span>
            </label>
            <input
              type="password"
              id="pcn-newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoFocus
            />
            <span className="pcn-hint">
              Minimum 8 characters. Cannot be the same as the initial password.
            </span>
          </div>

          <div className="pcn-form-group">
            <label htmlFor="pcn-confirmPassword">
              Confirm New Password <span className="pcn-required">*</span>
            </label>
            <input
              type="password"
              id="pcn-confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
            />
          </div>

          {error && <div className="pcn-error">{error}</div>}

          <button type="submit" className="pcn-btn" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PasswordChangeNotice;
