import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Student.css';
import Sidebar from '../components/Student/Sidebar';
import Proposal from '../components/Student/Proposal';
import ProjectBrowse from '../components/Student/ProjectBrowse';
import MyPreferences from '../components/Student/MyPreferences';
import Results from '../components/Student/Results';
import Profile from '../components/Student/Profile';
import AppModal from '../components/common/AppModal';
import OverdueNotice from '../components/common/OverdueNotice';
import { StageGlyph } from '../components/common/StageGlyphs';
import { formatDateTime24 } from '../utils/formatDateTime24';

const DEFAULT_SYSTEM_DEADLINES = {
  studentSelfProposal: '2025-03-20T23:59:00',
  preference: '2025-04-15T22:59:00',
  teacherProposalReview: '2025-04-15T23:59:00',
  teacherSelfProposal: '2025-05-30T23:59:00',
};

/** Return 'N days left' or 'Overdue' (no negative numbers) */
function fmtDaysLeft(days) {
  return days < 0 ? 'Overdue' : `${days} days left`;
}

function Student() {
  const [currentSection, setCurrentSection] = useState('proposal');
  const [studentData, setStudentData] = useState({
    name: sessionStorage.getItem('userName') || '',
    studentId: sessionStorage.getItem('studentId') || 's001',
    gpa: sessionStorage.getItem('userGPA') || '',
    email: sessionStorage.getItem('userEmail') || '',
    major: sessionStorage.getItem('userMajor') || '',
    year: 'Year 4'
  });
  const [preferences, setPreferences] = useState([]);
  const [projects, setProjects] = useState([]);
  const [matchingCompleted, setMatchingCompleted] = useState(false);
  const [isAssigned, setIsAssigned] = useState(false);
  const [assignmentType, setAssignmentType] = useState(null);
  const [systemDeadlines, setSystemDeadlines] = useState(DEFAULT_SYSTEM_DEADLINES);
  const [expiredDeadlineKeys, setExpiredDeadlineKeys] = useState(new Set());
  const [confirmDialog, setConfirmDialog] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check login status
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');
    
    if (!isLoggedIn || userRole !== 'student') {
      navigate('/');
      return;
    }

    (async () => {
      await loadStudentData();
      loadProjects();
      loadMatchingStatus();
      loadAssignmentStatus();
    })();
  }, [navigate]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/system/status');
        const d = await r.json();
        if (d.success && d.deadlines) {
          setSystemDeadlines((prev) => ({ ...prev, ...d.deadlines }));
        }
      } catch (_) {
        /* keep defaults */
      }
    })();
  }, []);

  // Recompute expired deadlines whenever deadlines change
  useEffect(() => {
    const now = new Date();
    const expired = new Set();
    Object.entries(systemDeadlines).forEach(([key, iso]) => {
      if (iso && new Date(iso) < now) {
        expired.add(key);
      }
    });
    setExpiredDeadlineKeys(expired);
  }, [systemDeadlines]);

  const loadMatchingStatus = async () => {
    try {
      const resp = await fetch('/api/match/results');
      const data = await resp.json();
      if (resp.ok && data && typeof data.matchingCompleted !== 'undefined') {
        setMatchingCompleted(!!data.matchingCompleted);
      } else {
        setMatchingCompleted(false);
      }
    } catch (err) {
      console.error('loadMatchingStatus error', err);
      setMatchingCompleted(false);
    }
  };

  const loadAssignmentStatus = async () => {
    try {
      const studentId = sessionStorage.getItem('studentId') || 's001';
      const resp = await fetch(`/api/student/${studentId}/assignment-status`);
      const data = await resp.json();
      
      if (data.success) {
        setIsAssigned(data.isAssigned);
        setAssignmentType(data.assignmentType);
        
        // If assigned via proposal, also update matchingCompleted to lock preferences
        if (data.isAssigned) {
          setMatchingCompleted(true);
        }
      }
    } catch (err) {
      console.error('loadAssignmentStatus error', err);
    }
  };

  const loadStudentData = async () => {
    const studentId = sessionStorage.getItem('studentId') || 's001';
    const userEmail = sessionStorage.getItem('userEmail') || '';
    
    console.log('[SEARCH] Loading student data, studentId:', studentId);

    // Update local state
    setStudentData(prev => ({
      ...prev,
      studentId: studentId,
      name: sessionStorage.getItem('userName') || prev.name,
      email: userEmail,
      gpa: sessionStorage.getItem('userGPA') || prev.gpa,
      major: sessionStorage.getItem('userMajor') || prev.major
    }));
    
    try {
      const response = await fetch(`/api/student/${studentId}`);
      const result = await response.json();
      
      if (result.success) {
        const s = result.student || {};
        const resolvedId = s.studentId || s.id || studentId;
        const gpaStr = s.gpa != null ? String(s.gpa) : '';
        if (s.major) sessionStorage.setItem('userMajor', s.major);
        if (gpaStr) sessionStorage.setItem('userGPA', gpaStr);
        sessionStorage.setItem('studentId', resolvedId);
        setStudentData({
          ...s,
          studentId: resolvedId,
          email: s.email || userEmail
        });
        
        // Load preferences
        await loadPreferences(resolvedId);
      } else {
        // API failed, use sessionStorage data
        console.log('API returned failure, using local data');
        await loadPreferences(studentId);
      }
    } catch (error) {
      console.error('Failed to load student data:', error);
      // Use local preferences
      await loadPreferences(studentId);
    }
  };

  const loadProjects = async () => {
    const studentMajor = sessionStorage.getItem('userMajor') || '';
    console.log('[loadProjects] studentMajor from session:', studentMajor);
    try {
      const queryParam = studentMajor ? `?major=${encodeURIComponent(studentMajor)}` : '';
      const response = await fetch(`/api/student/projects${queryParam}`);
      const result = await response.json();
      console.log('[loadProjects] success:', result.success, '| projects count:', result.projects?.length ?? 0);
      if (result.success && result.projects) {
        setProjects(result.projects);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('[loadProjects] error:', error);
      setProjects([]);
    }
  };

  const loadPreferences = async (studentId) => {
    try {
      const response = await fetch(`/api/student/${studentId}/preferences`);
      const result = await response.json();
      
      if (result.success) {
        // If server has no preferences but localStorage has (and student not yet submitted), use localStorage
        const saved = localStorage.getItem(`studentPreferences_${studentId}`);
        if ((!result.preferences || result.preferences.length === 0) && saved) {
          // only use local saved preferences if server indicates not submitted
          const serverStudent = mockStudentDataFallback(); // helper to read current studentData state
          const submittedFlag = serverStudent ? serverStudent.proposalSubmitted : (sessionStorage.getItem('proposalSubmitted') === 'true');
          if (!submittedFlag) {
            setPreferences(JSON.parse(saved));
            return;
          }
        }
        setPreferences(result.preferences);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      const saved = localStorage.getItem(`studentPreferences_${studentId}`);
      setPreferences(saved ? JSON.parse(saved) : []);
    }
  };

  // helper to obtain studentData from current state/session for loadPreferences decision
  const mockStudentDataFallback = () => {
    // try state first
    if (studentData && typeof studentData === 'object') return studentData;
    // fallback to sessionStorage
    const sid = sessionStorage.getItem('studentId');
    if (!sid) return null;
    return {
      studentId: sid,
      proposalSubmitted: sessionStorage.getItem('proposalSubmitted') === 'true'
    };
  };

  const handleLogout = () => {
    setConfirmDialog({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      primaryLabel: 'Logout',
      onConfirm: () => {
        setConfirmDialog(null);
        sessionStorage.clear();
        navigate('/');
      },
    });
  };

  const handleAddPreference = async (projectId) => {
    // Buffer preference locally; only submit to server on Submit Preferences
    const currentStudentId = studentData.studentId || sessionStorage.getItem('studentId') || 's001';

    // Check if already submitted or matching completed
    const submittedFlag = studentData.proposalSubmitted || sessionStorage.getItem('proposalSubmitted') === 'true';
    const locked = submittedFlag || matchingCompleted;
    
    if (locked) {
      showNotification('Preferences are locked. You cannot add more projects after submission.', 'error');
      return;
    }

    if (preferences.some(p => p.id === projectId)) {
      showNotification('Project already in preferences!', 'error');
      return;
    }

    if (preferences.length >= 10) {
      showNotification('Maximum 10 preferences allowed!', 'error');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      console.error('Project not found:', projectId);
      return;
    }

    const newPref = {
      id: project.id,
      title: project.title,
      supervisor: project.supervisor,
      popularity: project.popularity
    };
    const newPreferences = [...preferences, newPref];
    setPreferences(newPreferences);
    localStorage.setItem(`studentPreferences_${currentStudentId}`, JSON.stringify(newPreferences));
    showNotification(`Project added to preferences (${newPreferences.length}/10). Please go to My Preferences to check.`, 'success');
    // Do not auto-navigate, let user continue adding projects
  };

  const handleRemovePreference = async (projectId) => {
    const currentStudentId = studentData.studentId || sessionStorage.getItem('studentId') || 's001';
    
    console.log('Removing preference:', { projectId, currentStudentId });
    
    try {
      // If preferences haven't been submitted to server or matching completed, remove locally only
      const submittedFlag = studentData.proposalSubmitted || sessionStorage.getItem('proposalSubmitted') === 'true';
      const locked = submittedFlag || matchingCompleted;
      if (!submittedFlag && !matchingCompleted) {
        const newPreferences = preferences.filter(p => p.id !== projectId);
        setPreferences(newPreferences);
        localStorage.setItem(`studentPreferences_${currentStudentId}`, JSON.stringify(newPreferences));
        showNotification('Project removed (local)', 'success');
        return;
      }

      const response = await fetch(`/api/student/${currentStudentId}/preferences/${projectId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      console.log('Remove response:', result);
      
      if (result.success) {
        await loadPreferences(currentStudentId);
        showNotification(result.message, 'success');
      } else {
        showNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Remove preference error:', error);
      // Local fallback
      const newPreferences = preferences.filter(p => p.id !== projectId);
      setPreferences(newPreferences);
      localStorage.setItem(`studentPreferences_${currentStudentId}`, JSON.stringify(newPreferences));
      showNotification('Project removed (saved locally)!', 'success');
    }
  };

  const runSubmitPreferences = async () => {
    const currentStudentId = studentData.studentId || sessionStorage.getItem('studentId') || 's001';
    try {
      console.log('Submitting preferences to server:', currentStudentId);
      const prefIds = preferences.map((p) => p.id);
      const response = await fetch(`/api/student/${currentStudentId}/preferences/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefIds }),
      });

      const result = await response.json();
      console.log('Set preferences response:', result);

      if (response.ok && result.success) {
        setStudentData((prev) => ({ ...prev, proposalSubmitted: true }));
        sessionStorage.setItem('proposalSubmitted', 'true');
        await loadPreferences(currentStudentId);
        localStorage.removeItem(`studentPreferences_${currentStudentId}`);
        showNotification(result.message || 'Preferences submitted successfully!', 'success');
      } else {
        showNotification(result.message || 'Failed to submit preferences', 'error');
      }
    } catch (error) {
      console.error('Submit preferences error:', error);
      showNotification('Failed to submit preferences. Please try again.', 'error');
    }
  };

  const handleSubmitPreferences = () => {
    if (preferences.length === 0) {
      showNotification('Please add at least one project!', 'error');
      return;
    }

    setConfirmDialog({
      title: 'Submit preferences',
      message: `Submit ${preferences.length} project preferences? This action cannot be undone.`,
      primaryLabel: 'Submit',
      onConfirm: () => {
        setConfirmDialog(null);
        runSubmitPreferences();
      },
    });
  };

  const handleClearPreferences = () => {
    const currentStudentId = studentData.studentId || sessionStorage.getItem('studentId') || 's001';
    
    // Check if already submitted
    const submittedFlag = studentData.proposalSubmitted || sessionStorage.getItem('proposalSubmitted') === 'true';
    const matchingCompleted = false; // Can be fetched from API
    
    if (submittedFlag || matchingCompleted) {
      showNotification('Cannot clear preferences after submission or matching completion.', 'error');
      return;
    }
    
    if (preferences.length === 0) {
      showNotification('No preferences to clear!', 'info');
      return;
    }

    setConfirmDialog({
      title: 'Clear preferences',
      message: 'Clear all project preferences? This action cannot be undone.',
      primaryLabel: 'Clear all',
      onConfirm: () => {
        setConfirmDialog(null);
        console.log('Clear preferences:', currentStudentId);
        setPreferences([]);
        localStorage.removeItem(`studentPreferences_${currentStudentId}`);
        showNotification('All preferences cleared!', 'success');
      },
    });
  };

  const handleMovePreference = async (projectId, direction) => {
    const currentStudentId = studentData.studentId || sessionStorage.getItem('studentId') || 's001';
    
    console.log('[MOVE] Moving preference:', { projectId, direction, currentStudentId });

    const submittedFlag = studentData.proposalSubmitted || sessionStorage.getItem('proposalSubmitted') === 'true';
    const locked = submittedFlag || matchingCompleted;

    // If not submitted and not locked, perform local optimistic reorder only
    if (!submittedFlag && !matchingCompleted) {
      const currentIndex = preferences.findIndex(p => p.id === projectId);
      if (currentIndex === -1) return;
      const newPreferences = [...preferences];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= newPreferences.length) return;
      [newPreferences[currentIndex], newPreferences[targetIndex]] = [newPreferences[targetIndex], newPreferences[currentIndex]];
      setPreferences(newPreferences);
      localStorage.setItem(`studentPreferences_${currentStudentId}`, JSON.stringify(newPreferences));
      // call reorder handler to sync if parent supports it
      if (onReorderPreferences) onReorderPreferences(newPreferences);
      showNotification('Order updated (local)', 'success');
      return;
    }

    // Otherwise (submitted or matching completed), call server API to move
    try {
      const response = await fetch(`/api/student/${currentStudentId}/preferences/${projectId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction })
      });

      const result = await response.json();
      console.log('Move response:', result);
      
      if (result.success) {
        await loadPreferences(currentStudentId);
        showNotification('Order updated successfully!', 'success');
      } else {
        showNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Move preference error:', error);
      showNotification('Failed to update order on server', 'error');
    }
  };

  const handleReorderPreferences = async (newPreferences) => {
    const currentStudentId = studentData.studentId || sessionStorage.getItem('studentId') || 's001';
    
    console.log('[REORDER] Reordering preferences via drag-drop:', { currentStudentId });
    
    // Immediately update UI for smooth experience
    setPreferences(newPreferences);
    
    try {
      // Extract the order of project IDs
      const newOrder = newPreferences.map(p => p.id);
      
      const response = await fetch(`/api/student/${currentStudentId}/preferences/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      });

      const result = await response.json();
      console.log('Reorder response:', result);
      
      if (result.success) {
        // Reload to ensure sync with server
        await loadPreferences(currentStudentId);
        showNotification('Order updated successfully!', 'success');
      } else {
        // If API failed, use local storage
        localStorage.setItem(`studentPreferences_${currentStudentId}`, JSON.stringify(newPreferences));
        showNotification('Order updated (saved locally)!', 'success');
      }
    } catch (error) {
      console.error('Reorder preference error:', error);
      // Use local fallback when API fails
      localStorage.setItem(`studentPreferences_${currentStudentId}`, JSON.stringify(newPreferences));
      showNotification('Order updated (saved locally)!', 'success');
    }
  };

  const showNotification = (message, type) => {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      z-index: 10000;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      ${type === 'success' ? 'background: #27ae60;' : 
        type === 'error' ? 'background: #e74c3c;' : 
        'background: #3498db;'}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  };

  const stageSections = ['project-browse', 'my-preferences', 'results'];
  const shouldShowStageOverview = stageSections.includes(currentSection);

  // Get phase info
  const getPhaseInfo = (section) => {
    const phaseMap = {
      'proposal': { phase: 1, name: 'Proposal' },
      'project-browse': { phase: 2, name: 'Matching' },
      'my-preferences': { phase: 2, name: 'Matching' },
      'results': { phase: 3, name: 'Clearing' }
    };
    return phaseMap[section] || null;
  };

  // Render page title with deadline hint
  const renderPageTitleWithDeadline = (section) => {
    // Per-section deadline mapping
    const sectionDeadlineKey = {
      proposal: 'studentSelfProposal',
      'project-browse': 'preference',
      'my-preferences': 'preference',
    }[section];
    const deadlineKey = sectionDeadlineKey || 'preference';
    const deadlineDate = new Date(systemDeadlines[deadlineKey] || DEFAULT_SYSTEM_DEADLINES[deadlineKey]);
    const now = new Date();
    const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    const formattedDate = formatDateTime24(deadlineDate);
    const deadlineLabel = fmtDaysLeft(daysLeft);

    const titles = {
      'proposal': 'Proposal',
      'project-browse': 'Browse Projects',
      'my-preferences': 'My Preferences',
      'results': 'Assignment Results'
    };

    const title = titles[section];
    if (!title) return null;

    const phaseInfo = getPhaseInfo(section);

    return (
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title-with-deadline">
          <h1>{title}</h1>
          {section !== 'results' && (
            <span className="deadline-hint">Deadline: {formattedDate} ({deadlineLabel})</span>
          )}
        </div>
        {phaseInfo && (
          <div className="phase-indicator">
            Current Stage: <strong>Stage {phaseInfo.phase} — {phaseInfo.name}</strong>
          </div>
        )}
      </div>
    );
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'proposal':
        return <Proposal
          preferences={preferences}
          onSwitchSection={setCurrentSection}
          isAssigned={isAssigned}
          assignmentType={assignmentType}
          currentSection={currentSection}
          systemDeadlines={systemDeadlines}
          expiredDeadlineKeys={expiredDeadlineKeys}
          proposalSubmitted={studentData.proposalSubmitted}
        />;
      case 'project-browse':
        return <ProjectBrowse
          projects={projects}
          preferences={preferences}
          onAddPreference={handleAddPreference}
          isAssigned={isAssigned}
          expiredDeadlineKeys={expiredDeadlineKeys}
        />;
      case 'my-preferences':
        return <MyPreferences
          preferences={preferences}
          onRemovePreference={handleRemovePreference}
          onSubmitPreferences={handleSubmitPreferences}
          onClearPreferences={handleClearPreferences}
          onMovePreference={handleMovePreference}
          onReorderPreferences={handleReorderPreferences}
          onSwitchSection={setCurrentSection}
          submitted={studentData.proposalSubmitted}
          matchingCompleted={matchingCompleted}
        />;
      case 'results':
        return <Results />;
      case 'profile':
        return <Profile studentData={studentData} />;
      default:
        return (
          <Proposal
            preferences={preferences}
            onSwitchSection={setCurrentSection}
            studentId={studentData.studentId}
            isAssigned={isAssigned}
            assignmentType={assignmentType}
            systemDeadlines={systemDeadlines}
            expiredDeadlineKeys={expiredDeadlineKeys}
            proposalSubmitted={studentData.proposalSubmitted}
          />
        );
    }
  };

  return (
    <div className="student-container">
      <Sidebar 
        currentSection={currentSection}
        onSwitchSection={setCurrentSection}
        studentData={studentData}
        onLogout={handleLogout}
        isAssigned={isAssigned}
      />
      
      <main className="main-content">
        <div className="breadcrumb">
          <span 
            className="breadcrumb-link" 
            onClick={() => setCurrentSection('proposal')}
            style={{ cursor: 'pointer' }}
          >
            Home
          </span>
          <span className="breadcrumb-separator">→</span>
          <span>{getSectionTitle(currentSection)}</span>
        </div>

        {shouldShowStageOverview && (
          <div className="page-overview">
            {/* Page title and deadline hint */}
            {renderPageTitleWithDeadline(currentSection)}
            <StageOverview
              currentSection={currentSection}
              onStageChange={setCurrentSection}
              preferencesCount={preferences.length}
              expiredDeadlineKeys={expiredDeadlineKeys}
              isAssigned={isAssigned}
            />
            {(currentSection === 'project-browse' || currentSection === 'my-preferences') &&
              expiredDeadlineKeys.has('preference') && (
                <OverdueNotice title="Project Preference Selection deadline has passed">
                  The Project Preference Selection deadline has passed. You can no longer add or change project
                  preferences in Browse Projects or My Preferences.
                </OverdueNotice>
              )}
          </div>
        )}
        
        {renderSection()}
      </main>

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
    </div>
  );
}

function StageOverview({ currentSection, onStageChange, preferencesCount, expiredDeadlineKeys = new Set(), isAssigned = false }) {
  // Map stage IDs to deadline keys
  const stageDeadlineMap = {
    proposal: 'studentSelfProposal',
    'project-browse': 'preference',
  };

  // Disabled if: already assigned OR the corresponding deadline has passed
  const isStageDisabled = (stageId) => {
    if (isAssigned) return true;
    const dk = stageDeadlineMap[stageId];
    return dk ? expiredDeadlineKeys.has(dk) : false;
  };

  // Determine which tag should be active
  const getActiveStageId = () => {
    if (currentSection === 'my-preferences') {
      return 'project-browse';
    }
    return currentSection;
  };

  // Determine button text based on current page
  const getButtonText = (stage) => {
    if (stage.id === 'project-browse' && currentSection === 'my-preferences') {
      return 'Go to Browse Project';
    }
    return stage.buttonText;
  };

  const activeStageId = getActiveStageId();

  const stages = [
    {
      id: 'proposal',
      badgeLabel: 'Stage 1 (Proposal)',
      title: 'Student Self-proposal',
      description: 'Propose your own project',
      glyph: 'pencil',
      stageClass: 'stage-1',
      cardClass: 'status-card-stage-1',
      buttonText: 'Submit Proposal',
      targetSection: 'proposal',
    },
    {
      id: 'project-browse',
      badgeLabel: 'Stage 2 (Matching)',
      title: 'Teacher Project List',
      description: 'View the project list and manage your project preferences',
      glyph: 'star',
      stageClass: 'stage-2',
      cardClass: 'status-card-stage-2',
      buttonText: 'Go to My Preference',
      targetSection: 'my-preferences',
    },
    {
      id: 'results',
      badgeLabel: 'Stage 3 (Clearing)',
      title: 'Result',
      description: 'View your project assignment and matching results',
      glyph: 'list',
      stageClass: 'stage-3',
      cardClass: 'status-card-stage-3',
      buttonText: 'Go to Result',
      targetSection: 'results',
    },
  ];

  return (
    <div className="status-cards stage-status-cards">
      {stages.map((stage) => {
        const disabled = isStageDisabled(stage.id);
        return (
          <div
            key={stage.id}
            className={[
              'status-card',
              stage.cardClass,
              activeStageId === stage.id ? 'active' : '',
              disabled ? 'stage-disabled' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => !disabled && onStageChange(stage.id)}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onStageChange(stage.id);
              }
            }}
            style={disabled ? { opacity: 0.55, cursor: 'not-allowed' } : {}}
          >
            <span className={`stage-badge ${stage.stageClass}`}>
              {stage.badgeLabel}
            </span>
            {disabled && stage.id !== 'results' && (
              <span className="stage-overdue-tag">Overdue</span>
            )}
            <div className="status-icon" aria-hidden>
              <StageGlyph name={stage.glyph} />
            </div>
            <div className="status-content">
              <h3>{stage.title}</h3>
              <p>{stage.description}</p>
              <button
                className="action-btn"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) onStageChange(stage.targetSection);
                }}
              >
                {disabled ? (stage.id === 'proposal' ? 'Closed' : 'Closed') : getButtonText(stage)}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getSectionTitle(sectionId) {
  const titles = {
    'proposal': 'Proposal',
    'project-browse': 'Browse Projects',
    'my-preferences': 'My Preferences',
    'results': 'Results',
    'profile': 'Profile'
  };
  return titles[sectionId] || 'Proposal';
}

export default Student;

