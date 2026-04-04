import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AppModal from '../common/AppModal';

const STUDENTS_PER_PAGE = 10;
/** Scroll area height aligned with ~10 student table rows (see Admin.css) */
const FINAL_ASSIGN_LIST_SCROLL_PX = 500;
const PROJECT_ITEM_HEIGHT = 96;

function FinalAssignment({ showNotification }) {
  const [unmatchedStudents, setUnmatchedStudents] = useState([]);
  const [matchedStudents, setMatchedStudents] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [selectAllUnmatched, setSelectAllUnmatched] = useState(false);
  const [selectedUnmatched, setSelectedUnmatched] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [assigningStudent, setAssigningStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [allProjectsForEdit, setAllProjectsForEdit] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Pagination state
  const [unmatchedPage, setUnmatchedPage] = useState(1);
  const [matchedPage, setMatchedPage] = useState(1);

  const projectsPerBatch = useMemo(
    () => Math.max(3, Math.floor(FINAL_ASSIGN_LIST_SCROLL_PX / PROJECT_ITEM_HEIGHT)),
    []
  );

  const [visibleProjectCount, setVisibleProjectCount] = useState(() => projectsPerBatch);
  const projectListRef = useRef(null);

  useEffect(() => {
    setVisibleProjectCount(projectsPerBatch);
  }, [availableProjects, projectsPerBatch]);

  const visibleAvailableProjects = useMemo(
    () => availableProjects.slice(0, visibleProjectCount),
    [availableProjects, visibleProjectCount]
  );
  const hasMoreProjects = visibleProjectCount < availableProjects.length;

  useEffect(() => {
    const el = projectListRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - scrollTop - clientHeight < 80 && visibleProjectCount < availableProjects.length) {
        setVisibleProjectCount((c) => Math.min(c + projectsPerBatch, availableProjects.length));
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [visibleProjectCount, availableProjects.length, projectsPerBatch]);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [unmatchedRes, matchedRes, projectsRes] = await Promise.all([
        fetch('/api/admin/unmatched-students'),
        fetch('/api/admin/matched-students'),
        fetch('/api/admin/available-projects')
      ]);
      
      const [unmatchedData, matchedData, projectsData] = await Promise.all([
        unmatchedRes.json(),
        matchedRes.json(),
        projectsRes.json()
      ]);
      
      if (unmatchedData.success) {
        setUnmatchedStudents(unmatchedData.students || []);
      }
      
      if (matchedData.success) {
        setMatchedStudents(matchedData.students || []);
      }
      
      if (projectsData.success) {
        setAvailableProjects(projectsData.projects || []);
      }
      setUnmatchedPage(1);
      setMatchedPage(1);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectAllUnmatched = (e) => {
    const isChecked = e.target.checked;
    setSelectAllUnmatched(isChecked);
    
    if (isChecked) {
      setSelectedUnmatched(new Set(unmatchedStudents.map(s => s.id)));
    } else {
      setSelectedUnmatched(new Set());
    }
  };

  const handleSelectUnmatched = (studentId) => {
    const newSelected = new Set(selectedUnmatched);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedUnmatched(newSelected);
    setSelectAllUnmatched(newSelected.size === unmatchedStudents.length);
  };

  const handleAssignProject = (student) => {
    setAssigningStudent(student);
    setShowProjectModal(true);
  };

  const handleEditMatched = async (student) => {
    setEditingStudent(student);
    // Admin edit modal: fetch ALL projects (including student-proposed)
    try {
      const res = await fetch('/api/admin/all-projects');
      const data = await res.json();
      if (data.success) {
        setAllProjectsForEdit(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching all projects:', error);
      setAllProjectsForEdit([]);
    }
    setShowProjectModal(true);
  };

  const runAutoAssign = async () => {
    try {
      const response = await fetch('/api/admin/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: Array.from(selectedUnmatched) }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification(data.message, 'success');
        setSelectedUnmatched(new Set());
        setSelectAllUnmatched(false);
        fetchData();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      console.error('Auto-assign error:', error);
      showNotification('Failed to auto-assign students', 'error');
    }
  };

  const handleAutoAssign = () => {
    if (selectedUnmatched.size === 0) {
      showNotification('Please select at least one student', 'error');
      return;
    }

    const n = selectedUnmatched.size;
    setConfirmDialog({
      title: 'Auto-assign students',
      message: `Auto-assign ${n} selected students to available projects?`,
      primaryLabel: 'Auto-assign',
      onConfirm: () => {
        setConfirmDialog(null);
        runAutoAssign();
      },
    });
  };

  const handleConfirmAssign = async (studentId, projectId) => {
    try {
      const response = await fetch('/api/admin/assign-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, projectId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification(data.message, 'success');
        setShowProjectModal(false);
        setAssigningStudent(null);
        fetchData();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      console.error('Assign project error:', error);
      showNotification('Failed to assign project', 'error');
    }
  };

  const runClearAssignment = async (studentId) => {
    try {
      const response = await fetch('/api/admin/clear-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification(data.message, 'success');
        setShowProjectModal(false);
        setEditingStudent(null);
        fetchData();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      console.error('Clear assignment error:', error);
      showNotification('Failed to clear assignment', 'error');
    }
  };

  const handleClearAssignment = (studentId) => {
    setConfirmDialog({
      title: 'Clear assignment',
      message: "Clear this student's project assignment?",
      primaryLabel: 'Clear',
      onConfirm: () => {
        setConfirmDialog(null);
        runClearAssignment(studentId);
      },
    });
  };

  const handleUpdateAssignment = async (studentId, newProjectId) => {
    try {
      const response = await fetch('/api/admin/update-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, newProjectId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification(data.message, 'success');
        setShowProjectModal(false);
        setEditingStudent(null);
        fetchData();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      console.error('Update assignment error:', error);
      showNotification('Failed to update assignment', 'error');
    }
  };

  const handleCloseModal = () => {
    setShowProjectModal(false);
    setAssigningStudent(null);
    setEditingStudent(null);
  };

  const exportReport = async () => {
    try {
      showNotification('Exporting assignment report...', 'info');
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

  if (loading) {
    return (
      <section className="content-section active">
        <div className="section-header">
          <h1>Final Assignment</h1>
        </div>
        <div className="loading-state">Loading data...</div>
      </section>
    );
  }

  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>Final Assignment</h1>
        <button className="btn-secondary" onClick={fetchData}>Refresh</button>
      </div>

      {/* Unmatched Students Section */}
      <div className="assignment-header">
        <h2>Unmatched Students ({unmatchedStudents.length})</h2>
        <button className="btn-primary" onClick={handleAutoAssign} disabled={selectedUnmatched.size === 0}>
          Auto-assign ({selectedUnmatched.size} selected)
        </button>
      </div>

      <div className="assignment-container">
        <div className="students-section">
          <div className="section-controls">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectAllUnmatched}
                onChange={handleSelectAllUnmatched}
              />
              Select all ({unmatchedStudents.length})
            </label>
          </div>

          {unmatchedStudents.length === 0 ? (
            <div className="empty-state">No unmatched students</div>
          ) : (
            <>
              <div className="students-table-scroll-wrap">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectAllUnmatched}
                          onChange={handleSelectAllUnmatched}
                        />
                      </th>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>GPA</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unmatchedStudents
                      .slice((unmatchedPage - 1) * STUDENTS_PER_PAGE, unmatchedPage * STUDENTS_PER_PAGE)
                      .map((student) => (
                        <tr key={student.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedUnmatched.has(student.id)}
                              onChange={() => handleSelectUnmatched(student.id)}
                            />
                          </td>
                          <td>{student.id}</td>
                          <td>{student.name}</td>
                          <td>{student.gpa || 'N/A'}</td>
                          <td>
                            <button className="btn-assign" onClick={() => handleAssignProject(student)}>
                              Assign Project
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination-controls">
                <button
                  className="btn-pagination"
                  onClick={() => setUnmatchedPage((p) => Math.max(1, p - 1))}
                  disabled={unmatchedPage === 1}
                >
                  Prev
                </button>
                <span className="pagination-info">
                  {unmatchedPage} / {Math.ceil(unmatchedStudents.length / STUDENTS_PER_PAGE)}
                </span>
                <button
                  className="btn-pagination"
                  onClick={() =>
                    setUnmatchedPage((p) =>
                      Math.min(Math.ceil(unmatchedStudents.length / STUDENTS_PER_PAGE), p + 1)
                    )
                  }
                  disabled={unmatchedPage >= Math.ceil(unmatchedStudents.length / STUDENTS_PER_PAGE)}
                >
                  Next
                </button>
              </div>
            </>
          )}
          <div style={{ marginTop: '1rem', color: '#6c757d' }}>
            Selected: {selectedUnmatched.size} / {unmatchedStudents.length}
          </div>
        </div>

        <div className="projects-section">
          <h3>Available Projects ({availableProjects.length})</h3>
          <div className="project-list-simple final-assign-project-list" ref={projectListRef}>
            {availableProjects.length === 0 ? (
              <div className="empty-state">No available projects</div>
            ) : (
              <>
                {visibleAvailableProjects.map((project) => (
                  <div key={project.id} className="available-project">
                    <div className="project-info">
                      <span className="project-name">{project.title}</span>
                      <span className="project-code">({project.code})</span>
                    </div>
                    <span className="supervisor">- {project.supervisor}</span>
                    <span className="project-type-badge">
                      {project.type === 'student' ? 'Student Proposed' : 'Teacher Proposed'}
                    </span>
                    <span className="capacity-info">
                      {project.assignedCount}/{project.capacity} assigned
                    </span>
                  </div>
                ))}
                {hasMoreProjects && <div className="final-assign-loading" />}
              </>
            )}
          </div>
          <div className="final-assign-count">
            Showing {Math.min(visibleProjectCount, availableProjects.length)} of {availableProjects.length}
          </div>

          <button className="btn-export" onClick={exportReport}>Export Report</button>
        </div>
      </div>

      {/* Matched Students Section */}
      <div className="matched-section">
        <div className="assignment-header" style={{ marginTop: '2rem' }}>
          <h2>Matched Students ({matchedStudents.length})</h2>
        </div>

        {matchedStudents.length === 0 ? (
          <div className="empty-state">No matched students yet</div>
        ) : (
          <>
            <table className="students-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>GPA</th>
                  <th>Assigned Project</th>
                  <th>Supervisor</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {matchedStudents
                  .slice((matchedPage - 1) * STUDENTS_PER_PAGE, matchedPage * STUDENTS_PER_PAGE)
                  .map((student) => (
                    <tr key={student.id}>
                      <td>{student.id}</td>
                      <td>{student.name}</td>
                      <td>{student.gpa || 'N/A'}</td>
                      <td>
                        <div className="assigned-project">
                          <span className="project-title">{student.projectTitle}</span>
                          <span className="project-code">({student.projectCode})</span>
                        </div>
                      </td>
                      <td>{student.supervisor}</td>
                      <td>
                        <button className="btn-edit" onClick={() => handleEditMatched(student)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="pagination-controls" style={{ marginTop: '1rem' }}>
              <button
                className="btn-pagination"
                onClick={() => setMatchedPage((p) => Math.max(1, p - 1))}
                disabled={matchedPage === 1}
              >
                Prev
              </button>
              <span className="pagination-info">
                {matchedPage} / {Math.ceil(matchedStudents.length / STUDENTS_PER_PAGE)}
              </span>
              <button
                className="btn-pagination"
                onClick={() =>
                  setMatchedPage((p) =>
                    Math.min(Math.ceil(matchedStudents.length / STUDENTS_PER_PAGE), p + 1)
                  )
                }
                disabled={matchedPage >= Math.ceil(matchedStudents.length / STUDENTS_PER_PAGE)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Project Selection Modal */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {assigningStudent 
                  ? `Assign Project to ${assigningStudent.name}` 
                  : `Edit Assignment for ${editingStudent?.name}`
                }
              </h3>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              {assigningStudent && (
                <>
                  <h4>Available Projects</h4>
                  {availableProjects.length === 0 ? (
                    <p className="empty-modal">No available projects</p>
                  ) : (
                    <div className="project-options">
                      {availableProjects.map((project) => (
                        <div 
                          key={project.id} 
                          className="project-option"
                          onClick={() => handleConfirmAssign(assigningStudent.id, project.id)}
                        >
                          <div className="project-option-header">
                            <span className="project-title">{project.title}</span>
                            <span className="project-code">({project.code})</span>
                            <span className={`type-badge ${project.type}`}>
                              {project.type === 'student' ? 'Student' : 'Teacher'}
                            </span>
                          </div>
                          <div className="project-option-details">
                            <span>Supervisor: {project.supervisor}</span>
                            <span>Slots: {project.assignedCount}/{project.capacity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              
              {editingStudent && (
                <>
                  <div className="current-assignment">
                    <h4>Current Assignment</h4>
                    <div className="assignment-info">
                      <p><strong>Project:</strong> {editingStudent.projectTitle}</p>
                      <p><strong>Code:</strong> {editingStudent.projectCode}</p>
                      <p><strong>Supervisor:</strong> {editingStudent.supervisor}</p>
                      <p><strong>Type:</strong> {editingStudent.projectType === 'student' ? 'Student-proposed' : 'Teacher-proposed'}</p>
                    </div>
                  </div>
                  
                  <h4>Change to Another Project</h4>
                  <div className="project-options">
                    {allProjectsForEdit.map((project) => (
                      <div 
                        key={project.id} 
                        className={`project-option ${project.id === editingStudent.assignedProject ? 'current' : ''}`}
                        onClick={() => handleUpdateAssignment(editingStudent.id, project.id)}
                      >
                        <div className="project-option-header">
                          <span className="project-title">{project.title}</span>
                          <span className="project-code">({project.code})</span>
                          <span className={`type-badge ${project.type}`}>
                            {project.type === 'student' ? 'Student' : 'Teacher'}
                          </span>
                          {project.id === editingStudent.assignedProject && (
                            <span className="current-badge">Current</span>
                          )}
                        </div>
                        <div className="project-option-details">
                          <span>Supervisor: {project.supervisor}</span>
                          <span>Slots: {project.assignedCount}/{project.capacity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    className="btn-danger" 
                    onClick={() => handleClearAssignment(editingStudent.id)}
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    Clear Assignment (Student will be unmatched)
                  </button>
                  <p className="clear-warning">
                    Note: Student will need to wait for admin to assign a new project. 
                    They cannot return to the proposal/browse/submit stage.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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

      <style>{`
        .loading-state, .empty-state {
          text-align: center;
          padding: 2rem;
          color: #6c757d;
          font-size: 1.1rem;
        }
        
        .empty-state {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 2rem;
        }
        
        .project-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .project-code {
          font-size: 0.85rem;
          color: #6c757d;
        }
        
        .project-type-badge {
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          background: #e9ecef;
          color: #6c757d;
          display: inline-block;
          margin-top: 0.25rem;
          width: fit-content;
        }
        
        .type-badge {
          font-size: 0.7rem;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          margin-left: auto;
        }
        
        .type-badge.teacher {
          background: #d4edda;
          color: #155724;
        }
        
        .type-badge.student {
          background: #fff3cd;
          color: #856404;
        }
        
        .capacity-info {
          font-size: 0.8rem;
          color: #3498db;
          margin-top: 0.25rem;
        }
        
        .assigned-project {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .assigned-project .project-code {
          font-size: 0.8rem;
        }
        
        .matched-section {
          margin-top: 2rem;
        }
        
        .matched-section .students-table {
          background: #f8f9fa;
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #2c3e50;
          color: white;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }
        
        .modal-close {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        
        .modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }
        
        .modal-body h4 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          font-size: 1rem;
        }
        
        .empty-modal {
          color: #6c757d;
          font-style: italic;
          text-align: center;
          padding: 1rem;
        }
        
        .project-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .project-option {
          padding: 1rem;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .project-option:hover {
          background: #f8f9fa;
          border-color: #3498db;
        }
        
        .project-option.current {
          background: #e8f4fd;
          border-color: #3498db;
        }
        
        .project-option-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .project-option-header .project-title {
          font-weight: 600;
          color: #2c3e50;
        }
        
        .current-badge {
          background: #3498db;
          color: white;
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          margin-left: auto;
        }
        
        .project-option-details {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: #6c757d;
        }
        
        .current-assignment {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #fff3cd;
          border-radius: 8px;
          border: 1px solid #ffc107;
        }
        
        .current-assignment h4 {
          margin: 0 0 0.75rem 0;
          color: #856404;
        }
        
        .assignment-info p {
          margin: 0.25rem 0;
          font-size: 0.95rem;
          color: #856404;
        }
        
        .btn-danger {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background 0.2s ease;
        }
        
        .btn-danger:hover {
          background: #c0392b;
        }
        
        .clear-warning {
          font-size: 0.85rem;
          color: #6c757d;
          margin-top: 0.5rem;
          text-align: center;
        }

        .final-assign-loading {
          text-align: center;
          padding: 0.5rem;
          font-size: 0.85rem;
          color: #6c757d;
        }

        .final-assign-loading::after {
          content: 'Loading more...';
        }

        .final-assign-count {
          text-align: center;
          font-size: 0.85rem;
          color: #6c757d;
          margin-top: 0.5rem;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }

        .btn-pagination {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.4rem 0.85rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background 0.2s;
        }

        .btn-pagination:hover:not(:disabled) {
          background: #5a6268;
        }

        .btn-pagination:disabled {
          background: #ced4da;
          cursor: not-allowed;
          color: #6c757d;
        }

        .pagination-info {
          font-size: 0.9rem;
          color: #495057;
          min-width: 60px;
          text-align: center;
        }
      `}</style>
    </section>
  );
}

export default FinalAssignment;
