import React, { useState } from 'react';
import './CreateStudentAccount.css';

function CreateStudentAccount({ showNotification }) {
  const [formData, setFormData] = useState({
    studentId: '',
    password: '',
    confirmPassword: '',
    name: '',
    major: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const majorOptions = [
    'Computer Science',
    'Information Technology',
    'Business Administration',
    'Accounting',
    'Marketing',
    'English Studies',
    'Chinese Studies',
    'Media Design',
    'Data Science',
    'Artificial Intelligence',
    'Cybersecurity',
    'Digital Media'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Student ID: exactly 8 digits
    if (!formData.studentId) {
      newErrors.studentId = 'Student ID is required';
    } else if (!/^\d{8}$/.test(formData.studentId)) {
      newErrors.studentId = 'Student ID must be exactly 8 digits';
    }

    // Password: at least 8 characters
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Name
    if (!formData.name.trim()) {
      newErrors.name = 'Student name is required';
    }

    // Major
    if (!formData.major) {
      newErrors.major = 'Please select a major';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSuccessData(null);

    try {
      const response = await fetch('/api/admin/students/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId: formData.studentId,
          password: formData.password,
          name: formData.name,
          major: formData.major
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccessData(result);
        showNotification(result.message, 'success');
        
        // Reset form
        setFormData({
          studentId: '',
          password: '',
          confirmPassword: '',
          name: '',
          major: ''
        });
      } else {
        showNotification(result.message || 'Failed to create student account', 'error');
      }
    } catch (error) {
      console.error('Create student account error:', error);
      showNotification('Network error. Please try again later.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      studentId: '',
      password: '',
      confirmPassword: '',
      name: '',
      major: ''
    });
    setErrors({});
    setSuccessData(null);
  };

  // Preview email based on student ID
  const previewEmail = formData.studentId.length >= 7 
    ? formData.studentId.substring(0, 7) + '@hkmu.edu.hk'
    : '';

  return (
    <div className="create-student-container">
      <div className="create-student-header">
        <h2>Create Student Account</h2>
        <p>Create a new student account for the FYP Matching System</p>
      </div>

      {successData && (
        <div className="success-card">
          <div className="success-icon">&#10004;</div>
          <h3>Account Created Successfully!</h3>
          <div className="credentials-box">
            <p><strong>Student ID:</strong> {successData.student.id}</p>
            <p><strong>Student Name:</strong> {successData.student.name}</p>
            <p><strong>Major:</strong> {successData.student.major}</p>
            <div className="login-credentials">
              <h4>Login Credentials</h4>
              <p><strong>Email:</strong> {successData.loginCredentials.email}</p>
              <p><strong>Password:</strong> {successData.loginCredentials.password}</p>
            </div>
          </div>
          <button 
            className="btn-secondary"
            onClick={() => setSuccessData(null)}
          >
            Create Another Account
          </button>
        </div>
      )}

      <form className="create-student-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Student Information</h3>
          
          <div className="form-group">
            <label htmlFor="studentId">
              Student ID <span className="required">*</span>
            </label>
            <input
              type="text"
              id="studentId"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="Enter 8-digit student ID (e.g., 12345678)"
              maxLength={8}
              className={errors.studentId ? 'error' : ''}
            />
            {errors.studentId && <span className="error-message">{errors.studentId}</span>}
            {previewEmail && (
              <span className="email-preview">
                Email will be: <strong>{previewEmail}</strong>
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="name">
              Student Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter student's full name"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="major">
              Major Subject <span className="required">*</span>
            </label>
            <select
              id="major"
              name="major"
              value={formData.major}
              onChange={handleChange}
              className={errors.major ? 'error' : ''}
            >
              <option value="">-- Select Major --</option>
              {majorOptions.map(major => (
                <option key={major} value={major}>{major}</option>
              ))}
            </select>
            {errors.major && <span className="error-message">{errors.major}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3>Login Credentials</h3>
          <p className="section-description">
            The email will be automatically generated as: <strong>[First 7 digits of Student ID]@hkmu.edu.hk</strong>
          </p>
          
          <div className="form-group">
            <label htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
            <span className="password-hint">
              Minimum 8 characters required
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </form>

      <div className="info-box">
        <h4>Information</h4>
        <ul>
          <li>Student ID must be exactly 8 digits</li>
          <li>Email is auto-generated from Student ID (first 7 digits)</li>
          <li>Password must be at least 8 characters</li>
          <li>After creation, the student can login with the generated credentials</li>
          <li>The student profile and preferences will be separate for each student</li>
        </ul>
      </div>
    </div>
  );
}

export default CreateStudentAccount;
