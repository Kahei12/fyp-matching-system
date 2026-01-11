import React, { useState } from 'react';

function FinalAssignment({ showNotification }) {
  const [selectAll, setSelectAll] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState(new Set());

  const unmatchedStudents = [
    { id: 'S001', name: 'Alex Johnston', gpa: 3.45 },
    { id: 'S002', name: 'Lisa Brown', gpa: 3.52 },
    { id: 'S003', name: 'Michael Chen', gpa: 3.28 },
    { id: 'S004', name: 'Sarah Wang', gpa: 3.67 },
    { id: 'S005', name: 'David Lee', gpa: 3.41 },
    { id: 'S006', name: 'Emily Zhang', gpa: 3.58 },
    { id: 'S007', name: 'James Liu', gpa: 3.33 }
  ];

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);
    
    if (isChecked) {
      setSelectedStudents(new Set(unmatchedStudents.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
    setSelectAll(newSelected.size === unmatchedStudents.length);
  };

  const autoAssignAll = () => {
    if (window.confirm('Auto-assign all unmatched students to available projects?')) {
      showNotification('Auto-assignment in progress...', 'info');
      setTimeout(() => {
        showNotification('All students have been assigned successfully!', 'success');
      }, 2000);
    }
  };

  const assignStudent = (index) => {
    const projectOptions = [
      'Database Optimization - Prof. Zhang',
      'Cloud Computing Platform - Prof. Liu',
      'Network Security Tool - Prof. Yang',
      'Game Development - Prof. Wu',
      'Data Visualization - Prof. Zhao'
    ];
    
    const selectedProject = prompt(`Select project for ${unmatchedStudents[index].name}:\n\n${projectOptions.join('\n')}`);
    
    if (selectedProject) {
      showNotification(`Student assigned to: ${selectedProject}`, 'success');
    }
  };

  const exportReport = async () => {
    try {
      showNotification('Exporting assignment report...', 'info');

      // 下載配對結果
      const resultsResponse = await fetch('/api/export/matching-results');
      if (resultsResponse.ok) {
        const blob = await resultsResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'matching_results.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      // 下載學生清單
      const studentsResponse = await fetch('/api/export/student-list');
      if (studentsResponse.ok) {
        const blob = await studentsResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_list.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      showNotification('Reports exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Failed to export reports', 'error');
    }
  };

  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>Final Assignment</h1>
      </div>

      <div className="assignment-header">
        <h2>Unmatched Students ({unmatchedStudents.length})</h2>
        <button className="btn-primary" onClick={autoAssignAll}>Auto-assign All</button>
      </div>

      <div className="assignment-container">
        <div className="students-section">
          <div className="section-controls">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={selectAll}
                onChange={handleSelectAll}
              /> 
              Select all students ({unmatchedStudents.length})
            </label>
          </div>

          <table className="students-table">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Student ID</th>
                <th>Name</th>
                <th>GPA</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {unmatchedStudents.map((student, index) => (
                <tr key={student.id}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.has(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                    />
                  </td>
                  <td>{student.id}</td>
                  <td>{student.name}</td>
                  <td>{student.gpa}</td>
                  <td>
                    <button className="btn-assign" onClick={() => assignStudent(index)}>
                      ✉ Assign Projects
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '1rem', color: '#6c757d' }}>
            Selected: {selectedStudents.size} / {unmatchedStudents.length}
          </div>
        </div>

        <div className="projects-section">
          <h3>Available Projects (5)</h3>
          <div className="project-list-simple">
            <div className="available-project">
              <span className="project-name">Database Optimization</span>
              <span className="supervisor">- Prof. Zhang</span>
            </div>
            <div className="available-project">
              <span className="project-name">Cloud Computing Platform</span>
              <span className="supervisor">- Prof. Liu</span>
            </div>
            <div className="available-project">
              <span className="project-name">Network Security Tool</span>
              <span className="supervisor">- Prof. Yang</span>
            </div>
            <div className="available-project">
              <span className="project-name">Game Development</span>
              <span className="supervisor">- Prof. Wu</span>
            </div>
            <div className="available-project">
              <span className="project-name">Data Visualization</span>
              <span className="supervisor">- Prof. Zhao</span>
            </div>
          </div>
          
          <button className="btn-export" onClick={exportReport}>⚑ Export Report</button>
        </div>
      </div>
    </section>
  );
}

export default FinalAssignment;

