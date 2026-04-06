import React, { useState } from 'react';
import './CreateStudentAccount.css';

function CreateStudentAccount({ showNotification }) {
  const [accountType, setAccountType] = useState('student'); // 'student' | 'teacher'
  const [students, setStudents] = useState([
    { id: 1, studentId: '', name: '', major: '', password: '', studentIdError: '', nameError: '', majorError: '', passwordError: '' }
  ]);
  const [teachers, setTeachers] = useState([
    { id: 1, teacherId: '', name: '', major: '', password: '', teacherIdError: '', nameError: '', majorError: '', passwordError: '' }
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
      { id: generateId(prev), studentId: '', name: '', major: '', password: '', studentIdError: '', nameError: '', majorError: '', passwordError: '' }
    ]);
  };

  const handleRemoveStudentRow = (id) => {
    if (students.length <= 1) return;
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleAddTeacherRow = () => {
    setTeachers(prev => [
      ...prev,
      { id: generateId(prev), teacherId: '', name: '', major: '', password: '', teacherIdError: '', nameError: '', majorError: '', passwordError: '' }
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
        if (field === 'password') newS.passwordError = '';
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
        if (field === 'password') newT.passwordError = '';
        return newT;
      }
      return t;
    }));
  };

  const validateStudentRow = (student) => {
    let valid = true;
    let newStudent = { ...student, studentIdError: '', nameError: '', majorError: '', passwordError: '' };

    // 格式：1-10位數字，如 001, 002, ..., 9999999999
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

    if (!student.password) {
      newStudent.passwordError = 'Required';
      valid = false;
    } else if (student.password.length < 8) {
      newStudent.passwordError = 'Min 8 characters';
      valid = false;
    }

    return { valid, newStudent };
  };

  const validateTeacherRow = (teacher) => {
    let valid = true;
    let newTeacher = { ...teacher, teacherIdError: '', nameError: '', majorError: '', passwordError: '' };

    // 格式：1-10位數字，如 001, 002, ..., 9999999999
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

    if (!teacher.password) {
      newTeacher.passwordError = 'Required';
      valid = false;
    } else if (teacher.password.length < 8) {
      newTeacher.passwordError = 'Min 8 characters';
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
            password: s.password
          }))
        : teachers.map(t => ({
            teacherId: 't' + t.teacherId,
            name: t.name,
            major: t.major,
            password: t.password
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
              return { id: s.id, studentId: '', name: '', major: '', password: '', studentIdError: '', nameError: '', majorError: '', passwordError: '' };
            }));
          } else {
            setTeachers(prev => prev.map((t, i) => {
              if (!result.results[i].success) {
                return {
                  ...t,
                  teacherIdError: result.results[i].message?.includes('already exists') ? 'Already exists' : '',
                };
              }
              return { id: t.id, teacherId: '', name: '', major: '', password: '', teacherIdError: '', nameError: '', majorError: '', passwordError: '' };
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
      { id: 1, studentId: '', name: '', major: '', password: '', studentIdError: '', nameError: '', majorError: '', passwordError: '' }
    ]);
    setTeachers([
      { id: 1, teacherId: '', name: '', major: '', password: '', teacherIdError: '', nameError: '', majorError: '', passwordError: '' }
    ]);
    setResults(null);
  };

  const handleDownloadStudentTemplate = () => {
    const csvContent = [
      ['Student Number', 'Name', 'Major', 'Password'],
      ['001', 'John Chan', 'Computer and Cyber Security', 'changeme123'],
      ['002', 'Mary Lee', 'Electronics and Computer Engineering', 'changeme123'],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'student_template.csv';
    link.click();
  };

  const handleDownloadTeacherTemplate = () => {
    const csvContent = [
      ['Teacher Number', 'Name', 'Major', 'Password'],
      ['001', 'Dr. Bell Liu', 'Electronics and Computer Engineering', 'changeme123'],
      ['002', 'Dr. Alex Wong', 'Computer and Cyber Security', 'changeme123'],
      ['003', 'Dr. Chris Lee', 'Computer and Cyber Security + Electronics and Computer Engineering', 'changeme123'],
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
        const parts = line.split(',').map(s => s.trim());
        return {
          id: generateId(students) + index,
          studentId: parts[0] || '',
          name: parts[1] || '',
          major: parts[2] || '',
          password: parts[3] || '',
          studentIdError: '',
          nameError: '',
          majorError: '',
          passwordError: '',
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
        const parts = line.split(',').map(s => s.trim());
        return {
          id: generateId(teachers) + index,
          teacherId: parts[0] || '',
          name: parts[1] || '',
          major: parts[2] || '',
          password: parts[3] || '',
          teacherIdError: '',
          nameError: '',
          majorError: '',
          passwordError: '',
        };
      });

      setTeachers(newTeachers);
      showNotification(`Imported ${newTeachers.length} teachers from CSV`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 生成學生登入郵箱預覽：s001@hkmu.edu.hk
  const getStudentPreviewEmail = (studentId) => {
    if (studentId) {
      return `s${studentId}@hkmu.edu.hk`;
    }
    return '';
  };

  // 生成老師登入郵箱預覽：t001@hkmu.edu.hk
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
                  <th className="col-password">
                    Password <span className="required">*</span>
                  </th>
                  <th className="col-action"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id} className={student.studentIdError || student.nameError || student.majorError || student.passwordError ? 'row-error' : ''}>
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
                    <td className="col-password">
                      <input
                        type="password"
                        value={student.password}
                        onChange={(e) => handleStudentChange(student.id, 'password', e.target.value)}
                        placeholder="Min 8 characters"
                        className={student.passwordError ? 'error' : ''}
                      />
                      {student.passwordError && (
                        <span className="cell-error">{student.passwordError}</span>
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
                  <th className="col-password">
                    Password <span className="required">*</span>
                  </th>
                  <th className="col-action"></th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher, index) => (
                  <tr key={teacher.id} className={teacher.teacherIdError || teacher.nameError || teacher.majorError || teacher.passwordError ? 'row-error' : ''}>
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
                    <td className="col-password">
                      <input
                        type="password"
                        value={teacher.password}
                        onChange={(e) => handleTeacherChange(teacher.id, 'password', e.target.value)}
                        placeholder="Min 8 characters"
                        className={teacher.passwordError ? 'error' : ''}
                      />
                      {teacher.passwordError && (
                        <span className="cell-error">{teacher.passwordError}</span>
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
            <li>Student Number: Enter 1-10 digits (e.g., 001, 002, 1234567890)</li>
            <li>Major options: Computer and Cyber Security, Electronics and Computer Engineering</li>
            <li>Email is auto-generated as s[Number]@hkmu.edu.hk (e.g., s001@hkmu.edu.hk)</li>
            <li>Password: each row has its own password field (minimum 8 characters)</li>
            <li>Download CSV template for bulk import (includes password column)</li>
            <li>After creation, students can login with their generated credentials</li>
          </ul>
        ) : (
          <ul>
            <li>Teacher ID: Enter 1-10 digits (e.g., 001, 002, 1234567890)</li>
            <li>Major options: Computer and Cyber Security, Electronics and Computer Engineering, or Both</li>
            <li>Email is auto-generated as t[ID]@hkmu.edu.hk (e.g., t001@hkmu.edu.hk)</li>
            <li>Password: each row has its own password field (minimum 8 characters)</li>
            <li>Download CSV template for bulk import (includes password column)</li>
            <li>After creation, teachers can login with their generated credentials</li>
          </ul>
        )}
      </div>
    </div>
  );
}

export default CreateStudentAccount;
