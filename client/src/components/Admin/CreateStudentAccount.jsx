import React, { useState } from 'react';
import './CreateStudentAccount.css';

function CreateStudentAccount({ showNotification }) {
  const [mode, setMode] = useState('batch'); // 'batch' | 'single'
  const [students, setStudents] = useState([
    { id: 1, studentId: '', name: '', major: '', studentIdError: '', nameError: '', majorError: '' }
  ]);
  const [commonPassword, setCommonPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

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

  // Generate unique ID for new rows
  const generateId = () => Math.max(0, ...students.map(s => s.id)) + 1;

  const handleAddRow = () => {
    setStudents(prev => [
      ...prev,
      { id: generateId(), studentId: '', name: '', major: '', studentIdError: '', nameError: '', majorError: '' }
    ]);
  };

  const handleRemoveRow = (id) => {
    if (students.length <= 1) return;
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleStudentChange = (id, field, value) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        // Clear error when user starts typing
        const newS = { ...s, [field]: value };
        if (field === 'studentId') newS.studentIdError = '';
        if (field === 'name') newS.nameError = '';
        if (field === 'major') newS.majorError = '';
        return newS;
      }
      return s;
    }));
  };

  const validateRow = (student) => {
    let valid = true;
    let newStudent = { ...student, studentIdError: '', nameError: '', majorError: '' };

    // Student ID: exactly 8 digits
    if (!student.studentId) {
      newStudent.studentIdError = 'Required';
      valid = false;
    } else if (!/^\d{8}$/.test(student.studentId)) {
      newStudent.studentIdError = 'Must be 8 digits';
      valid = false;
    }

    // Name
    if (!student.name.trim()) {
      newStudent.nameError = 'Required';
      valid = false;
    }

    // Major
    if (!student.major) {
      newStudent.majorError = 'Required';
      valid = false;
    }

    return { valid, newStudent };
  };

  const validateAll = () => {
    let allValid = true;
    const updatedStudents = [];

    for (const student of students) {
      const { valid, newStudent } = validateRow(student);
      updatedStudents.push(newStudent);
      if (!valid) allValid = false;
    }

    setStudents(updatedStudents);

    // Validate password
    let passwordValid = true;
    if (!commonPassword) {
      setPasswordError('Password is required');
      passwordValid = false;
    } else if (commonPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      passwordValid = false;
    } else if (commonPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      passwordValid = false;
    } else {
      setPasswordError('');
    }

    return allValid && passwordValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const studentsData = students.map(s => ({
        studentId: s.studentId,
        name: s.name,
        major: s.major,
        password: commonPassword
      }));

      const response = await fetch('/api/admin/students/batch-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ students: studentsData })
      });

      const result = await response.json();

      if (result.success) {
        setResults(result.results);
        const successCount = result.results.filter(r => r.success).length;
        showNotification(`Successfully created ${successCount} out of ${students.length} accounts`, 'success');

        // Keep successful rows, mark failed ones for editing
        if (result.results.some(r => !r.success)) {
          setStudents(prev => prev.map((s, i) => {
            if (!result.results[i].success) {
              return {
                ...s,
                studentIdError: result.results[i].message?.includes('already exists') ? 'Already exists' : '',
              };
            }
            return { id: s.id, studentId: '', name: '', major: '', studentIdError: '', nameError: '', majorError: '' };
          }));
        } else {
          // All succeeded, reset form
          handleReset();
        }
      } else {
        showNotification(result.message || 'Failed to create accounts', 'error');
      }
    } catch (error) {
      console.error('Batch create error:', error);
      showNotification('Network error. Please try again later.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStudents([
      { id: 1, studentId: '', name: '', major: '', studentIdError: '', nameError: '', majorError: '' }
    ]);
    setCommonPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setResults(null);
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      ['StudentID', 'Name', 'Major'],
      ['12345678', 'John Chan', 'Computer Science'],
      ['23456789', 'Mary Lee', 'Data Science'],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'student_template.csv';
    link.click();
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const lines = content.split('\n').filter(line => line.trim());

      // Skip header row
      const dataRows = lines.slice(1);

      if (dataRows.length === 0) {
        showNotification('No data found in CSV file', 'error');
        return;
      }

      const newStudents = dataRows.map((line, index) => {
        const [studentId, name, major] = line.split(',').map(s => s.trim());
        return {
          id: generateId() + index,
          studentId: studentId || '',
          name: name || '',
          major: major || '',
          studentIdError: '',
          nameError: '',
          majorError: ''
        };
      });

      setStudents(newStudents);
      showNotification(`Imported ${newStudents.length} students from CSV`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Preview email based on student ID
  const getPreviewEmail = (studentId) => {
    if (studentId.length >= 7) {
      return studentId.substring(0, 7) + '@hkmu.edu.hk';
    }
    return '';
  };

  return (
    <div className="create-student-container">
      <div className="create-student-header">
        <h2>Batch Create Student Accounts</h2>
        <p>Create multiple student accounts at once for the FYP Matching System</p>
      </div>

      {results && (
        <div className="results-summary">
          <h3>Results Summary</h3>
          <div className="results-stats">
            <span className="stat success">
              Success: {results.filter(r => r.success).length}
            </span>
            <span className="stat failed">
              Failed: {results.filter(r => !r.success).length}
            </span>
          </div>
          <button className="btn-link" onClick={() => setResults(null)}>
            Dismiss
          </button>
        </div>
      )}

      <form className="batch-form" onSubmit={handleSubmit}>
        <div className="batch-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleAddRow}
          >
            + Add Row
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleDownloadTemplate}
          >
            Download CSV Template
          </button>
          <label className="btn-secondary csv-import-btn">
            Import from CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div className="batch-table-container">
          <table className="batch-table">
            <thead>
              <tr>
                <th className="col-index">#</th>
                <th className="col-student-id">
                  Student ID <span className="required">*</span>
                </th>
                <th className="col-preview">Email Preview</th>
                <th className="col-name">
                  Student Name <span className="required">*</span>
                </th>
                <th className="col-major">
                  Major <span className="required">*</span>
                </th>
                <th className="col-action"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id} className={student.studentIdError || student.nameError || student.majorError ? 'row-error' : ''}>
                  <td className="col-index">{index + 1}</td>
                  <td className="col-student-id">
                    <input
                      type="text"
                      value={student.studentId}
                      onChange={(e) => handleStudentChange(student.id, 'studentId', e.target.value)}
                      placeholder="12345678"
                      maxLength={8}
                      className={student.studentIdError ? 'error' : ''}
                    />
                    {student.studentIdError && (
                      <span className="cell-error">{student.studentIdError}</span>
                    )}
                  </td>
                  <td className="col-preview">
                    {getPreviewEmail(student.studentId) && (
                      <span className="email-preview">{getPreviewEmail(student.studentId)}</span>
                    )}
                  </td>
                  <td className="col-name">
                    <input
                      type="text"
                      value={student.name}
                      onChange={(e) => handleStudentChange(student.id, 'name', e.target.value)}
                      placeholder="Student name"
                      className={student.nameError ? 'error' : ''}
                    />
                    {student.nameError && (
                      <span className="cell-error">{student.nameError}</span>
                    )}
                  </td>
                  <td className="col-major">
                    <select
                      value={student.major}
                      onChange={(e) => handleStudentChange(student.id, 'major', e.target.value)}
                      className={student.majorError ? 'error' : ''}
                    >
                      <option value="">Select</option>
                      {majorOptions.map(major => (
                        <option key={major} value={major}>{major}</option>
                      ))}
                    </select>
                    {student.majorError && (
                      <span className="cell-error">{student.majorError}</span>
                    )}
                  </td>
                  <td className="col-action">
                    {students.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => handleRemoveRow(student.id)}
                        title="Remove row"
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="form-section password-section">
          <h3>Common Login Credentials</h3>
          <p className="section-description">
            The same password will be applied to all accounts above.
            Email will be auto-generated as: <strong>[First 7 digits of Student ID]@hkmu.edu.hk</strong>
          </p>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="commonPassword">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="commonPassword"
                value={commonPassword}
                onChange={(e) => {
                  setCommonPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="At least 8 characters"
                className={passwordError ? 'error' : ''}
              />
              <span className="password-hint">Minimum 8 characters</span>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Re-enter password"
                className={passwordError ? 'error' : ''}
              />
            </div>
          </div>

          {passwordError && (
            <span className="error-message">{passwordError}</span>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset All
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : `Create ${students.length} Account${students.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </form>

      <div className="info-box">
        <h4>Batch Registration Instructions</h4>
        <ul>
          <li>Student ID must be exactly 8 digits</li>
          <li>Email is auto-generated from Student ID (first 7 digits)</li>
          <li>All accounts will use the same password</li>
          <li>Download CSV template for bulk import</li>
          <li>After creation, students can login with their generated credentials</li>
        </ul>
      </div>
    </div>
  );
}

export default CreateStudentAccount;
