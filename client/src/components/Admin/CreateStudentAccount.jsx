import React, { useState } from 'react';
import './CreateStudentAccount.css';

// ⚠️  IMPORTANT: Default password for all newly created accounts
// All users (students & teachers) must change this password on first login
// This password is displayed to admin during account creation
const DEFAULT_PASSWORD = 'Changeme123!';

function CreateStudentAccount({ showNotification }) {
  const [accountType, setAccountType] = useState('student'); // 'student' | 'teacher'
  const [students, setStudents] = useState([
    { id: 1, studentId: '', name: '', major: '', studentIdError: '', nameError: '', majorError: '' }
  ]);
  const [teachers, setTeachers] = useState([
    { id: 1, teacherId: '', name: '', major: '', teacherIdError: '', nameError: '', majorError: '' }
  ]);

  const studentMajorOptions = [
    'Computer and Cyber Security',
    'Electronics and Computer Engineering'
  ];

  const teacherMajorOptions = [
    'Computer and Cyber Security',
    'Electronics and Computer Engineering',
    'Computer and Cyber Security + Electronics and Computer Engineering'
  ];
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

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
      { id: generateId(prev), teacherId: '', name: '', major: '', teacherIdError: '', nameError: '', majorError: '' }
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
        if (field === 'teacherId') newT.teacherIdError = '';
        if (field === 'name') newT.nameError = '';
        if (field === 'major') newT.majorError = '';
        return newT;
      }
      return t;
    }));
  };

  const validateStudentRow = (student) => {
    let valid = true;
    let newStudent = { ...student, studentIdError: '', nameError: '', majorError: '' };

    // Format: 1-10 digits, e.g. 001, 002, ..., 9999999999
    if (!student.studentId) {
      newStudent.studentIdError = 'Required';
      valid = false;
    } else if (!/^\d{1,10}$/.test(student.studentId)) {
      newStudent.studentIdError = 'Must be 1-10 digits';
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
    let newTeacher = { ...teacher, teacherIdError: '', nameError: '', majorError: '' };

    // Format: 1-10 digits, e.g. 001, 002, ..., 9999999999
    if (!teacher.teacherId) {
      newTeacher.teacherIdError = 'Required';
      valid = false;
    } else if (!/^\d{1,10}$/.test(teacher.teacherId)) {
      newTeacher.teacherIdError = 'Must be 1-10 digits';
      valid = false;
    }

    if (!teacher.name.trim()) {
      newTeacher.nameError = 'Required';
      valid = false;
    }

    if (!teacher.major) {
      newTeacher.majorError = 'Required';
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataValid = accountType === 'student' ? validateStudentAll() : validateTeacherAll();

    if (!dataValid) {
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
            studentId: 's' + s.studentId,
            name: s.name,
            major: s.major,
            password: DEFAULT_PASSWORD
          }))
        : teachers.map(t => ({
            teacherId: 't' + t.teacherId,
            name: t.name,
            major: t.major,
            password: DEFAULT_PASSWORD
          }));

      const body =
        accountType === 'student'
          ? JSON.stringify({ students: data })
          : JSON.stringify({ accounts: data });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body
      });

      // Check if response is valid JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
      }

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
                  teacherIdError: result.results[i].message?.includes('already exists') ? 'Already exists' : '',
                };
              }
              return { id: t.id, teacherId: '', name: '', major: '', teacherIdError: '', nameError: '', majorError: '' };
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
      const errorMessage = error.message || 'Network error. Please try again later.';
      showNotification(`Failed to create accounts: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStudents([
      { id: 1, studentId: '', name: '', major: '', studentIdError: '', nameError: '', majorError: '' }
    ]);
    setTeachers([
      { id: 1, teacherId: '', name: '', major: '', teacherIdError: '', nameError: '', majorError: '' }
    ]);
    setResults(null);
  };

  const handleDownloadStudentTemplate = () => {
    // CSV template: student number in quotes to preserve leading zeros, no Password column (uses default password)
    const csvContent = [
      ['Student Number', 'Name', 'Major'],
      ['"001"', 'John Chan', 'Computer and Cyber Security'],
      ['"002"', 'Mary Lee', 'Electronics and Computer Engineering'],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'student_template.csv';
    link.click();
  };

  const handleDownloadTeacherTemplate = () => {
    // CSV template: teacher number in quotes to preserve leading zeros, no Password column (uses default password)
    const csvContent = [
      ['Teacher Number', 'Name', 'Major'],
      ['"001"', 'Dr. Bell Liu', 'Electronics and Computer Engineering'],
      ['"002"', 'Dr. Alex Wong', 'Computer and Cyber Security'],
      ['"003"', 'Dr. Chris Lee', 'Computer and Cyber Security + Electronics and Computer Engineering'],
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
        const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, '')); // Remove quotes from ID
        return {
          id: generateId(students) + index,
          studentId: parts[0] || '',
          name: parts[1] || '',
          major: parts[2] || '',
          studentIdError: '',
          nameError: '',
          majorError: '',
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
        const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, '')); // Remove quotes from ID
        return {
          id: generateId(teachers) + index,
          teacherId: parts[0] || '',
          name: parts[1] || '',
          major: parts[2] || '',
          teacherIdError: '',
          nameError: '',
          majorError: '',
        };
      });

      setTeachers(newTeachers);
      showNotification(`Imported ${newTeachers.length} teachers from CSV`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Generate student login email preview: s001@hkmu.edu.hk
  const getStudentPreviewEmail = (studentId) => {
    if (studentId) {
      return `s${studentId}@hkmu.edu.hk`;
    }
    return '';
  };

  // Generate teacher login email preview: t001@hkmu.edu.hk
  const getTeacherPreviewEmail = (teacherId) => {
    if (teacherId) {
      return `t${teacherId}@hkmu.edu.hk`;
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
        {/* ⚠️ Default Password Notice */}
        <div className="default-password-notice">
          <strong>⚠️ Default Password:</strong> <code>Changeme123!</code> (Users must change on first login)
        </div>

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

        <div className="batch-table-container batch-table-panel">
          {accountType === 'student' ? (
            <table className="batch-table batch-table-student">
              <thead>
                <tr>
                  <th className="col-index">#</th>
                  <th className="col-student-id">
                    Student Number <span className="required">*</span>
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
                        placeholder="e.g 001"
                        maxLength={10}
                        className={student.studentIdError ? 'error' : ''}
                      />
                      {student.studentIdError && (
                        <span className="cell-error">{student.studentIdError}</span>
                      )}
                    </td>
                    <td className="col-preview">
                      {getStudentPreviewEmail(student.studentId) ? (
                        <span className="email-preview">{getStudentPreviewEmail(student.studentId)}</span>
                      ) : (
                        <span className="email-preview-placeholder">—</span>
                      )}
                    </td>
                    <td className="col-name">
                      <input
                        type="text"
                        value={student.name}
                        onChange={(e) => handleStudentChange(student.id, 'name', e.target.value)}
                        placeholder="e.g. Chan Tai Man"
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
                        {studentMajorOptions.map(major => (
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
            <table className="batch-table batch-table-teacher">
              <thead>
                <tr>
                  <th className="col-index">#</th>
                  <th className="col-teacher-id">
                    Teacher ID <span className="required">*</span>
                  </th>
                  <th className="col-preview">Email Preview</th>
                  <th className="col-teacher-name">
                    Teacher Name <span className="required">*</span>
                  </th>
                  <th className="col-major">
                    Major <span className="required">*</span>
                  </th>
                  <th className="col-action"></th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher, index) => (
                  <tr key={teacher.id} className={teacher.teacherIdError || teacher.nameError || teacher.majorError ? 'row-error' : ''}>
                    <td className="col-index">{index + 1}</td>
                    <td className="col-teacher-id">
                      <input
                        type="text"
                        value={teacher.teacherId}
                        onChange={(e) => handleTeacherChange(teacher.id, 'teacherId', e.target.value)}
                        placeholder="e.g 001"
                        maxLength={10}
                        className={teacher.teacherIdError ? 'error' : ''}
                      />
                      {teacher.teacherIdError && (
                        <span className="cell-error">{teacher.teacherIdError}</span>
                      )}
                    </td>
                    <td className="col-preview">
                      {getTeacherPreviewEmail(teacher.teacherId) ? (
                        <span className="email-preview">{getTeacherPreviewEmail(teacher.teacherId)}</span>
                      ) : (
                        <span className="email-preview-placeholder">—</span>
                      )}
                    </td>
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
                    <td className="col-major">
                      <select
                        value={teacher.major}
                        onChange={(e) => handleTeacherChange(teacher.id, 'major', e.target.value)}
                        className={teacher.majorError ? 'error' : ''}
                      >
                        <option value="">Select</option>
                        {teacherMajorOptions.map(major => (
                          <option key={major} value={major}>{major}</option>
                        ))}
                      </select>
                      {teacher.majorError && (
                        <span className="cell-error">{teacher.majorError}</span>
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
            <li>Student Number: Enter 1-10 digits (e.g., 001, 002, 1234567890). Use quotes in CSV to preserve leading zeros.</li>
            <li>Major options: Computer and Cyber Security, Electronics and Computer Engineering</li>
            <li>Email is auto-generated as s[Number]@hkmu.edu.hk (e.g., s001@hkmu.edu.hk)</li>
            <li>Default password: Changeme123! (all users must change password on first login)</li>
            <li>Download CSV template for bulk import (no password column needed)</li>
            <li>After creation, students can login with their student ID and default password</li>
          </ul>
        ) : (
          <ul>
            <li>Teacher ID: Enter 1-10 digits (e.g., 001, 002, 1234567890). Use quotes in CSV to preserve leading zeros.</li>
            <li>Major options: Computer and Cyber Security, Electronics and Computer Engineering, or Both</li>
            <li>Email is auto-generated as t[ID]@hkmu.edu.hk (e.g., t001@hkmu.edu.hk)</li>
            <li>Default password: Changeme123! (all users must change password on first login)</li>
            <li>Download CSV template for bulk import (no password column needed)</li>
            <li>After creation, teachers can login with their teacher ID and default password</li>
          </ul>
        )}
      </div>
    </div>
  );
}

export default CreateStudentAccount;
