import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Student.css';
import Sidebar from '../components/Student/Sidebar';
import Proposal from '../components/Student/Proposal';
import ProjectBrowse from '../components/Student/ProjectBrowse';
import MyPreferences from '../components/Student/MyPreferences';
import Results from '../components/Student/Results';
import Profile from '../components/Student/Profile';

function Student() {
  const [currentSection, setCurrentSection] = useState('proposal');
  const [studentData, setStudentData] = useState({
    name: 'Chan Tai Man',
    studentId: 'S001',
    gpa: '3.45',
    email: '',
    major: 'Computer Science',
    year: 'Year 4'
  });
  const [preferences, setPreferences] = useState([]);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // 檢查登入狀態
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');
    
    if (!isLoggedIn || userRole !== 'student') {
      navigate('/');
      return;
    }

    // 載入學生數據
    loadStudentData();
    loadProjects();
  }, [navigate]);

  const loadStudentData = async () => {
    const studentId = sessionStorage.getItem('studentId') || 'S001';
    const userEmail = sessionStorage.getItem('userEmail') || '';
    
    console.log('[SEARCH] 載入學生數據，studentId:', studentId);
    
    // 更新本地狀態
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
        setStudentData({
          ...result.student,
          email: userEmail
        });
        
        // 載入偏好
        await loadPreferences(studentId);
      } else {
        // API 失敗，使用 sessionStorage 數據
        console.log('API returned failure, using local data');
        await loadPreferences(studentId);
      }
    } catch (error) {
      console.error('載入學生數據錯誤:', error);
      // 使用本地偏好
      await loadPreferences(studentId);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/student/projects');
      const result = await response.json();
      
      if (result.success) {
        setProjects(result.projects);
      }
    } catch (error) {
      console.error('載入項目錯誤:', error);
      // 使用後備數據
      setProjects(getFallbackProjects());
    }
  };

  const loadPreferences = async (studentId) => {
    try {
      const response = await fetch(`/api/student/${studentId}/preferences`);
      const result = await response.json();
      
      if (result.success) {
        setPreferences(result.preferences);
      }
    } catch (error) {
      console.error('載入偏好錯誤:', error);
      const saved = localStorage.getItem(`studentPreferences_${studentId}`);
      setPreferences(saved ? JSON.parse(saved) : []);
    }
  };

  const getFallbackProjects = () => [
    {
      id: 1,
      title: 'AI-based Learning System',
      supervisor: 'Dr. Bell Liu',
      description: 'Develop an intelligent learning platform that adapts to student learning patterns using machine learning algorithms.',
      skills: ['Python', 'Machine Learning', 'Web Development'],
      popularity: 15,
      capacity: 3,
      status: 'active'
    },
    {
      id: 2,
      title: 'IoT Smart Campus',
      supervisor: 'Prof. Zhang Wei',
      description: 'Build an IoT system to monitor and optimize campus resource usage.',
      skills: ['IoT', 'Embedded Systems', 'Python'],
      popularity: 8,
      capacity: 2,
      status: 'active'
    },
    {
      id: 3,
      title: 'Blockchain Security Analysis',
      supervisor: 'Dr. Sarah Chen',
      description: 'Analyze security vulnerabilities in blockchain systems.',
      skills: ['Blockchain', 'Cryptography', 'Security'],
      popularity: 12,
      capacity: 2,
      status: 'active'
    },
    {
      id: 4,
      title: 'Mobile Health App',
      supervisor: 'Prof. David Wong',
      description: 'Create a mobile application for health monitoring.',
      skills: ['Mobile Development', 'Healthcare', 'Data Analysis'],
      popularity: 6,
      capacity: 3,
      status: 'active'
    },
    {
      id: 5,
      title: 'Data Visualization Platform',
      supervisor: 'Dr. Emily Zhao',
      description: 'Develop an interactive platform for visualizing complex datasets.',
      skills: ['Data Visualization', 'JavaScript', 'D3.js'],
      popularity: 9,
      capacity: 2,
      status: 'active'
    }
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      sessionStorage.clear();
      navigate('/');
    }
  };

  const handleAddPreference = async (projectId) => {
    // 獲取當前 studentId
    const currentStudentId = studentData.studentId || sessionStorage.getItem('studentId') || 'S001';
    
    console.log('Adding preference:', { projectId, currentStudentId, currentPreferencesCount: preferences.length });
    
    if (preferences.some(p => p.id === projectId)) {
      showNotification('Project already in preferences!', 'error');
      return;
    }

    if (preferences.length >= 5) {
      showNotification('Maximum 5 preferences allowed!', 'error');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      console.error('Project not found:', projectId);
      return;
    }

    try {
      console.log('Sending API request:', `/api/student/${currentStudentId}/preferences`);
      
      const response = await fetch(`/api/student/${currentStudentId}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });

      const result = await response.json();
      console.log('API response:', result);
      
      if (result.success) {
        // 重新載入偏好
        await loadPreferences(currentStudentId);
        showNotification(result.message, 'success');
        setCurrentSection('my-preferences');
      } else {
        console.error('API returned error:', result.message);
        showNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Add preference network error:', error);
      // 使用本地存儲作為後備
      const newPref = {
        id: project.id,
        title: project.title,
        supervisor: project.supervisor,
        popularity: project.popularity
      };
      const newPreferences = [...preferences, newPref];
      setPreferences(newPreferences);
      localStorage.setItem(`studentPreferences_${currentStudentId}`, JSON.stringify(newPreferences));
      showNotification('Project added to preferences (saved locally)!', 'success');
      setCurrentSection('my-preferences');
    }
  };

  const handleRemovePreference = async (projectId) => {
    const currentStudentId = studentData.studentId || sessionStorage.getItem('studentId') || 'S001';
    
    console.log('Removing preference:', { projectId, currentStudentId });
    
    try {
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
      // 本地後備
      const newPreferences = preferences.filter(p => p.id !== projectId);
      setPreferences(newPreferences);
      localStorage.setItem(`studentPreferences_${currentStudentId}`, JSON.stringify(newPreferences));
      showNotification('Project removed (saved locally)!', 'success');
    }
  };

  const handleSubmitPreferences = async () => {
    const currentStudentId = studentData.studentId || sessionStorage.getItem('studentId') || 'S001';
    
    if (preferences.length === 0) {
      showNotification('Please add at least one project!', 'error');
      return;
    }

    if (window.confirm(`Submit ${preferences.length} project preferences? This action cannot be undone.`)) {
      try {
        console.log('Submitting preferences:', currentStudentId);
        
        const response = await fetch(`/api/student/${currentStudentId}/preferences/submit`, {
          method: 'POST'
        });

        const result = await response.json();
        console.log('Submit response:', result);
        
        if (result.success) {
          showNotification(result.message, 'success');
        } else {
          showNotification(result.message, 'error');
        }
      } catch (error) {
        console.error('Submit preferences error:', error);
        showNotification('Preferences saved locally!', 'success');
      }
    }
  };

  const handleClearPreferences = () => {
    const currentStudentId = studentData.studentId || sessionStorage.getItem('studentId') || 'S001';
    
    if (preferences.length === 0) {
      showNotification('No preferences to clear!', 'info');
      return;
    }

    if (window.confirm('Clear all project preferences? This action cannot be undone.')) {
      console.log('Clear preferences:', currentStudentId);
      
      setPreferences([]);
      localStorage.removeItem(`studentPreferences_${currentStudentId}`);
      showNotification('All preferences cleared!', 'success');
      
      // 嘗試調用 API 清空（如果有的話）
      fetch(`/api/student/${currentStudentId}/preferences/clear`, {
        method: 'DELETE'
      }).catch(err => console.log('API clear failed (expected behavior)'));
    }
  };

  const handleMovePreference = async (projectId, direction) => {
    const currentStudentId = studentData.studentId || sessionStorage.getItem('studentId') || 'S001';
    
    console.log('[MOVE] Moving preference:', { projectId, direction, currentStudentId });
    
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
      // Local fallback
      const currentIndex = preferences.findIndex(p => p.id === projectId);
      if (currentIndex === -1) return;
      
      const newPreferences = [...preferences];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex < 0 || targetIndex >= newPreferences.length) return;
      
      // Swap positions
      [newPreferences[currentIndex], newPreferences[targetIndex]] = 
        [newPreferences[targetIndex], newPreferences[currentIndex]];
      
      setPreferences(newPreferences);
      localStorage.setItem(`studentPreferences_${currentStudentId}`, JSON.stringify(newPreferences));
      showNotification('Order updated (saved locally)!', 'success');
    }
  };

  const handleReorderPreferences = async (newPreferences) => {
    const currentStudentId = studentData.studentId || sessionStorage.getItem('studentId') || 'S001';
    
    console.log('[REORDER] Reordering preferences via drag-drop:', { currentStudentId });
    
    // 立即更新 UI 以獲得流暢的體驗
    setPreferences(newPreferences);
    
    try {
      // 提取項目 ID 的順序
      const newOrder = newPreferences.map(p => p.id);
      
      const response = await fetch(`/api/student/${currentStudentId}/preferences/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      });

      const result = await response.json();
      console.log('Reorder response:', result);
      
      if (result.success) {
        // 重新載入以確保與服務器同步
        await loadPreferences(currentStudentId);
        showNotification('Order updated successfully!', 'success');
      } else {
        // 如果 API 失敗，使用本地存儲
        localStorage.setItem(`studentPreferences_${currentStudentId}`, JSON.stringify(newPreferences));
        showNotification('Order updated (saved locally)!', 'success');
      }
    } catch (error) {
      console.error('Reorder preference error:', error);
      // API 失敗時使用本地後備
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

  // 获取phase信息
  const getPhaseInfo = (section) => {
    const phaseMap = {
      'proposal': { phase: 1, name: 'Proposal' },
      'project-browse': { phase: 2, name: 'Matching' },
      'my-preferences': { phase: 2, name: 'Matching' },
      'results': { phase: 3, name: 'Clearing' }
    };
    return phaseMap[section] || null;
  };

  // 渲染主标题和 deadline 提示
  const renderPageTitleWithDeadline = (section) => {
    const preferenceDeadline = new Date('2025-04-15T22:59:00');
    const now = new Date();
    const daysLeft = Math.ceil((preferenceDeadline - now) / (1000 * 60 * 60 * 24));
    const formattedDate = preferenceDeadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const titles = {
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
            <span className="deadline-hint">⏰ Deadline: {formattedDate} ({daysLeft} days left)</span>
          )}
        </div>
        {phaseInfo && (
          <div className="phase-indicator">
            Current Phase: <strong>Phase {phaseInfo.phase} — {phaseInfo.name}</strong>
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
        />;
      case 'project-browse':
        return <ProjectBrowse 
          projects={projects}
          preferences={preferences}
          onAddPreference={handleAddPreference}
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
        />;
      case 'results':
        return <Results />;
      case 'profile':
        return <Profile studentData={studentData} />;
      default:
        return <Proposal preferences={preferences} onSwitchSection={setCurrentSection} />;
    }
  };

  return (
    <div className="student-container">
      <Sidebar 
        currentSection={currentSection}
        onSwitchSection={setCurrentSection}
        studentData={studentData}
        onLogout={handleLogout}
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
            {/* 主标题和 deadline 提示 */}
            {renderPageTitleWithDeadline(currentSection)}
            <StageOverview 
              currentSection={currentSection} 
              onStageChange={setCurrentSection}
              preferencesCount={preferences.length}
            />
          </div>
        )}
        
        {renderSection()}
      </main>
    </div>
  );
}

function StageOverview({ currentSection, onStageChange, preferencesCount }) {
  const stages = [
    {
      id: 'project-browse',
      badgeLabel: 'Stage 1 (Proposal)',
      title: 'Browse Projects',
      description: 'Explore available FYP projects and add to preferences.',
      icon: '✍',
      stageClass: 'stage-1',
      cardClass: 'status-card-stage-1'
    },
    {
      id: 'my-preferences',
      badgeLabel: 'Stage 2 (Matching)',
      title: 'My Preferences',
      description: `Manage your project preferences (${preferencesCount}/5 selected).`,
      icon: '★',
      stageClass: 'stage-2',
      cardClass: 'status-card-stage-2'
    },
    {
      id: 'results',
      badgeLabel: 'Stage 3 (Clearing)',
      title: 'Results',
      description: 'View your project assignment and matching results.',
      icon: '☰',
      stageClass: 'stage-3',
      cardClass: 'status-card-stage-3'
    }
  ];

  return (
    <div className="status-cards stage-status-cards">
      {stages.map(stage => (
        <div
          key={stage.id}
          className={`status-card ${stage.cardClass} ${currentSection === stage.id ? 'active' : ''}`}
          onClick={() => onStageChange(stage.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onStageChange(stage.id);
            }
          }}
        >
          <span className={`stage-badge ${stage.stageClass}`}>
            {stage.badgeLabel}
          </span>
          <div className="status-icon">{stage.icon}</div>
          <div className="status-content">
            <h3>{stage.title}</h3>
            <p>{stage.description}</p>
            <button 
              className="action-btn"
              onClick={(e) => {
                e.stopPropagation();
                // If on My Preferences page, the button should go to Browse Projects
                if (currentSection === 'my-preferences' && stage.id === 'my-preferences') {
                  onStageChange('project-browse');
                } else {
                  onStageChange(stage.id);
                }
              }}
            >
              {currentSection === 'my-preferences' && stage.id === 'my-preferences' 
                ? 'Browse Projects' 
                : `Go to ${stage.title}`}
            </button>
          </div>
        </div>
      ))}
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

