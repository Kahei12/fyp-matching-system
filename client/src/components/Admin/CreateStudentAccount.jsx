import React, { useState } from 'react';
import './CreateStudentAccount.css';

function CreateStudentAccount({ showNotification }) {
  const [mode, setMode] = useState('batch'); // 'batch' | 'single'
  const [accountType, setAccountType] = useState('student'); // 'student' | 'teacher'
  const [students, setStudents] = useState([
    { id: 1, studentId: '', name: '', major: '', studentIdError: '', nameError: '', majorError: '' }
  ]);
  const [teachers, setTeachers] = useState([
    { id: 1, name: '', email: '', nameError: '', emailError: '' }
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

  const teacherEmailOptions = [
    'teacherBellLiu@hkmu.edu.hk (Dr. Bell Liu)',
    'teacherAlexWong@hkmu.edu.hk (Dr. Alex Wong)',
    'teacherChrisLee@hkmu.edu.hk (Dr. Chris Lee)',
    'teacherDianaChen@hkmu.edu.hk (Dr. Diana Chen)',
    'teacherEricNg@hkmu.edu.hk (Dr. Eric Ng)',
    'Other (Manual Entry)'
  ];

  // Generate unique ID for new rows
  const generateId = (items) => items.length > 0 ? Math.max(0, ...items.map(item => item.id)) + 1 : 1;

  const handleAddStudentRow = () => {
    setStudents(prev => [
      ...prev,
      { id: generateId(prev), studentId: '', name: '', major: '', studentIdError: '', nameError: '', majorError: '' }
    ]);
  };

  const handleRemoveStudentRow = (id) => {
    if (students.length <= 1) return;
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleAddTeacherRow = () => {
    setTeachers(prev => [
      ...prev,
      { id: generateId(prev), name: '', email: '', nameError: '', emailError: '' }
    ]);
  };

  const handleRemoveTeacherRow = (id) => {
    if (teachers.length <= 1) return;
    setTeachers(prev => prev.filter(t => t.id !== id));
  };

  const handleStudentChange = (id, field, value) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        const newS = { ...s, [field]: value };
        if (field === 'studentId') newS.studentIdError = '';
        if (field === 'name') newS.nameError = '';
        if (field === 'major') newS.majorError = '';
        return newS;
      }
      return s;
    }));
  };

  const handleTeacherChange = (id, field, value) => {
    setTeachers(prev => prev.map(t => {
      if (t.id === id) {
        const newT = { ...t, [field]: value };
        if (field === 'name') newT.nameError = '';
        if (field === 'email') newT.emailError = '';
        return newT;
      }
      return t;
    }));
  };

  const validateStudentRow = (student) => {
    let valid = true;
    let newStudent = { ...student, studentIdError: '', nameError: '', majorError: '' };

    if (!student.studentId) {
      newStudent.studentIdError = 'Required';
      valid = false;
    } else if (!/^\d{8}$/.test(student.studentId)) {
      newStudent.studentIdError = 'Must be 8 digits';
      valid = false;
    }

    if (!student.name.trim()) {
      newStudent.nameError = 'Required';
      valid = false;
    }

    if (!student.major) {
      newStudent.majorError = 'Required';
      valid = false;
    }

    return { valid, newStudent };
  };

  const validateTeacherRow = (teacher) => {
    let valid = true;
    let newTeacher = { ...teacher, nameError: '', emailError: '' };

    if (!teacher.name.trim()) {
      newTeacher.nameError = 'Required';
      valid = false;
    }

    if (!teacher.email.trim()) {
      newTeacher.emailError = 'Required';
      valid = false;
    } else if (!/^[\w.-]+@hkmu\.edu\.hk$/.test(teacher.email)) {
      newTeacher.emailError = 'Invalid email format';
      valid = false;
    }

    return { valid, newTeacher };
  };

  const validateStudentAll = () => {
    let allValid = true;
    const updatedStudents = [];

    for (const student of students) {
      const { valid, newStudent } = validateStudentRow(student);
      updatedStudents.push(newStudent);
      if (!valid) allValid = false;
    }

    setStudents(updatedStudents);
    return allValid;
  };

  const validateTeacherAll = () => {
    let allValid = true;
    const updatedTeachers = [];

    for (const teacher of teachers) {
      const { valid, newTeacher } = validateTeacherRow(teacher);
      updatedTeachers.push(newTeacher);
      if (!valid) allValid = false;
    }

    setTeachers(updatedTeachers);
    return allValid;
  };

  const validatePassword = () => {
    if (!commonPassword) {
      setPasswordError('Password is required');
      return false;
    } else if (commonPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    } else if (commonPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordValid = validatePassword();
    const dataValid = accountType === 'student' ? validateStudentAll() : validateTeacherAll();

    if (!dataValid || !passwordValid) {
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const endpoint = accountType === 'student'
        ? '/api/admin/students/batch-create'
        : '/api/admin/teachers/batch-create';

      const data = accountType === 'student'
        ? students.map(s => ({
            studentId: s.studentId,
            name: s.name,
            major: s.major,
            password: commonPassword
          }))
        : teachers.map(t => ({
            name: t.name,
            email: t.email,
            password: commonPassword
          }));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accounts: data })
      });

      const result = await response.json();

      if (result.success) {
        setResults(result.results);
        const successCount = result.results.filter(r => r.success).length;
        const total = accountType === 'student' ? students.length : teachers.length;
        showNotification(`Successfully created ${successCount} out of ${total} accounts`, 'success');

        if (result.results.some(r => !r.success)) {
          if (accountType === 'student') {
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
            setTeachers(prev => prev.map((t, i) => {
              if (!result.results[i].success) {
                return {
                  ...t,
                  emailError: result.results[i].message?.includes('already exists') ? 'Already exists' : '',
                };
              }
              return { id: t.id, name: '', email: '', nameError: '', emailError: '' };
            }));
          }
        } else {
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
    setTeachers([
      { id: 1, name: '', email: '', nameError: '', emailError: '' }
    ]);
    setCommonPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setResults(null);
  };

  const handleDownloadStudentTemplate = () => {
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

  const handleDownloadTeacherTemplate = () => {
    const csvContent = [
      ['Name', 'Email'],
      ['Dr. Bell Liu', 'teacherBellLiu@hkmu.edu.hk'],
      ['Dr. Alex Wong', 'teacherAlexWong@hkmu.edu.hk'],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'teacher_template.csv';
    link.click();
  };

  const handleImportStudentCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const lines = content.split('\n').filter(line => line.trim());
      const dataRows = lines.slice(1);

      if (dataRows.length === 0) {
        showNotification('No data found in CSV file', 'error');
        return;
      }

      const newStudents = dataRows.map((line, index) => {
        const [studentId, name, major] = line.split(',').map(s => s.trim());
        return {
          id: generateId(students) + index,
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

  const handleImportTeacherCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const lines = content.split('\n').filter(line => line.trim());
      const dataRows = lines.slice(1);

      if (dataRows.length === 0) {
        showNotification('No data found in CSV file', 'error');
        return;
      }

      const newTeachers = dataRows.map((line, index) => {
        const [name, email] = line.split(',').map(s => s.trim());
        return {
          id: generateId(teachers) + index,
          name: name || '',
          email: email || '',
          nameError: '',
          emailError: ''
        };
      });

      setTeachers(newTeachers);
      showNotification(`Imported ${newTeachers.length} teachers from CSV`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getPreviewEmail = (studentId) => {
    if (studentId.length >= 7) {
      return studentId.substring(0, 7) + '@hkmu.edu.hk';
    }
    return '';
  };

  const title = accountType === 'student' ? 'Batch Create Student Accounts' : 'Batch Create Teacher Accounts';
  const subtitle = accountType === 'student'
    ? 'Create multiple student accounts at once for the FYP Matching System'
    : 'Create multiple teacher accounts at once for the FYP Matching System';
  const totalAccounts = accountType === 'student' ? students.length : teachers.length;

  return (
    <div className="create-student-container">
      <div className="create-student-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="account-type-toggle">
        <button
          type="button"
          className={`toggle-btn ${accountType === 'student' ? 'active' : ''}`}
          onClick={() => {
            setAccountType('student');
            setResults(null);
            setPasswordError('');
          }}
        >
          Student
        </button>
        <button
          type="button"
          className={`toggle-btn ${accountType === 'teacher' ? 'active' : ''}`}
          onClick={() => {
            setAccountType('teacher');
            setResults(null);
            setPasswordError('');
          }}
        >
          Teacher
        </button>
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
            onClick={accountType === 'student' ? handleAddStudentRow : handleAddTeacherRow}
          >
            + Add Row
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={accountType === 'student' ? handleDownloadStudentTemplate : handleDownloadTeacherTemplate}
          >
            Download CSV Template
          </button>
          <label className="btn-secondary csv-import-btn">
            Import from CSV
            <input
              type="file"
              accept=".csv"
              onChange={accountType === 'student' ? handleImportStudentCSV : handleImportTeacherCSV}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div className="batch-table-container">
          {accountType === 'student' ? (
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
                          onClick={() => handleRemoveStudentRow(student.id)}
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
          ) : (
            <table className="batch-table teacher-table">
              <thead>
                <tr>
                  <th className="col-index">#</th>
                  <th className="col-teacher-name">
                    Teacher Name <span className="required">*</span>
                  </th>
                  <th className="col-teacher-email">
                    Email <span className="required">*</span>
                  </th>
                  <th className="col-action"></th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher, index) => (
                  <tr key={teacher.id} className={teacher.nameError || teacher.emailError ? 'row-error' : ''}>
                    <td className="col-index">{index + 1}</td>
                    <td className="col-teacher-name">
                      <input
                        type="text"
                        value={teacher.name}
                        onChange={(e) => handleTeacherChange(teacher.id, 'name', e.target.value)}
                        placeholder="Dr. John Smith"
                        className={teacher.nameError ? 'error' : ''}
                      />
                      {teacher.nameError && (
                        <span className="cell-error">{teacher.nameError}</span>
                      )}
                    </td>
                    <td className="col-teacher-email">
                      <input
                        type="email"
                        value={teacher.email}
                        onChange={(e) => handleTeacherChange(teacher.id, 'email', e.target.value)}
                        placeholder="teacherJohnSmith@hkmu.edu.hk"
                        className={teacher.emailError ? 'error' : ''}
                      />
                      {teacher.emailError && (
                        <span className="cell-error">{teacher.emailError}</span>
                      )}
                    </td>
                    <td className="col-action">
                      {teachers.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => handleRemoveTeacherRow(teacher.id)}
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
          )}
        </div>

        <div className="form-section password-section">
          <h3>Common Login Credentials</h3>
          <p className="section-description">
            The same password will be applied to all accounts above.
            {accountType === 'student' ? (
              <>Email will be auto-generated as: <strong>[First 7 digits of Student ID]@hkmu.edu.hk</strong></>
            ) : (
              <>Email must match the teacher's official HKMU email: <strong>teacher[Name]@hkmu.edu.hk</strong></>
            )}
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
            {isLoading ? 'Creating...' : `Create ${totalAccounts} Account${totalAccounts > 1 ? 's' : ''}`}
          </button>
        </div>
      </form>

      <div className="info-box">
        <h4>Batch Registration Instructions</h4>
        {accountType === 'student' ? (
          <ul>
            <li>Student ID must be exactly 8 digits</li>
            <li>Email is auto-generated from Student ID (first 7 digits)</li>
            <li>All accounts will use the same password</li>
            <li>Download CSV template for bulk import</li>
            <li>After creation, students can login with their generated credentials</li>
          </ul>
        ) : (
          <ul>
            <li>Teacher name format: Dr. [First Name] [Last Name]</li>
            <li>Email format: teacher[Name without spaces]@hkmu.edu.hk</li>
            <li>Example: Dr. Bell Liu → teacherBellLiu@hkmu.edu.hk</li>
            <li>All accounts will use the same password</li>
            <li>Download CSV template for bulk import</li>
          </ul>
        )}
      </div>
    </div>
  );
}

export default CreateStudentAccount;
