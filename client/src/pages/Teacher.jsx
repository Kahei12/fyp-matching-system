import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Teacher.css';
import Sidebar from '../components/Teacher/Sidebar';
import StageOverview from '../components/Teacher/StageOverview';
import ProjectManagement from '../components/Teacher/ProjectManagement';
import StudentApplications from '../components/Teacher/StudentApplications';
import SupervisionList from '../components/Teacher/SupervisionList';
import MatchingResults from '../components/Teacher/MatchingResults';

function Teacher() {
  const [currentSection, setCurrentSection] = useState('student-applications');
  const navigate = useNavigate();

  useEffect(() => {
    // 檢查登入狀態
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');
    
    if (!isLoggedIn || userRole !== 'teacher') {
      navigate('/');
      return;
    }
  }, [navigate]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      sessionStorage.clear();
      navigate('/');
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
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 3000);
  };

  // 计算 deadlines
  const now = new Date();
  const applicationDeadline = new Date('2025-04-15T23:59:00');
  const projectUpdateDeadline = new Date('2025-05-30T23:59:00');
  
  const applicationDaysLeft = Math.ceil((applicationDeadline - now) / (1000 * 60 * 60 * 24));
  const projectUpdateDaysLeft = Math.ceil((projectUpdateDeadline - now) / (1000 * 60 * 60 * 24));

  // 获取phase信息
  const getPhaseInfo = (section) => {
    const phaseMap = {
      'student-applications': { phase: 1, name: 'Proposal' },
      'project-management': { phase: 2, name: 'Matching' },
      'results': { phase: 3, name: 'Clearing' }
    };
    return phaseMap[section] || null;
  };

  // 渲染主标题和 deadline 提示
  const renderPageTitleWithDeadline = (section) => {
    const applicationDeadlineDate = new Date('2025-04-15T23:59:00');
    const projectDeadlineDate = new Date('2025-05-30T23:59:00');
    const resultDeadlineDate = new Date('2025-06-15T23:59:00');
    const now = new Date();

    const titles = {
      'student-applications': 'My Projects & Applicants',
      'project-management': 'Project Management',
      'results': 'Matching Result'
    };

    const deadlines = {
      'student-applications': {
        date: applicationDeadlineDate,
        label: 'Student Application Review'
      },
      'project-management': {
        date: projectDeadlineDate,
        label: 'Project Updates & Reviews'
      },
      'results': {
        date: resultDeadlineDate,
        label: 'Matching Result'
      }
    };

    const title = titles[section];
    if (!title) return null;

    const deadline = deadlines[section];
    const phaseInfo = getPhaseInfo(section);

    if (!deadline) return (
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title-with-deadline">
          <h1>{title}</h1>
        </div>
        {phaseInfo && (
          <div className="phase-indicator">
            Current Stage: <strong>Stage {phaseInfo.phase} — {phaseInfo.name}</strong>
          </div>
        )}
      </div>
    );

    const daysLeft = Math.ceil((deadline.date - now) / (1000 * 60 * 60 * 24));
    const formattedDate = deadline.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title-with-deadline">
          <h1>{title}</h1>
          <span className="deadline-hint">⏰ Deadline: {formattedDate} ({daysLeft} days left)</span>
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
      case 'student-applications':
        return <StudentApplications showNotification={showNotification} />;
      case 'project-management':
        return <ProjectManagement showNotification={showNotification} />;
      case 'results':
        return <MatchingResults showNotification={showNotification} />;
      case 'supervision-list':
        return <SupervisionList showNotification={showNotification} />;
      default:
        return <ProjectManagement showNotification={showNotification} />;
    }
  };

  const userName = sessionStorage.getItem('userName') || 'Admin Wang';

  return (
    <div className="teacher-container">
      <Sidebar 
        currentSection={currentSection}
        onSwitchSection={setCurrentSection}
        userName={userName}
        onLogout={handleLogout}
      />

      {/* 主內容區域 */}
      <main className="main-content">
        {/* 麵包屑導航 */}
        <div className="breadcrumb">
          <span 
            className="breadcrumb-link" 
            onClick={() => setCurrentSection('student-applications')}
            style={{ cursor: 'pointer' }}
          >
            Home
          </span>
          <span className="breadcrumb-separator">→</span>
          <span>{getSectionTitle(currentSection)}</span>
        </div>

        <div className="page-overview">
          {currentSection !== 'supervision-list' && (
            <>
              {/* 主标题和 deadline 提示 */}
              {renderPageTitleWithDeadline(currentSection)}
              <StageOverview 
                currentSection={currentSection} 
                onStageChange={setCurrentSection} 
              />
            </>
          )}

          {/* Upcoming Deadlines - 只在第一页显示 */}
          {currentSection === 'student-applications' && (
            <div className="deadline-reminder">
              <h3>⏰ Upcoming Deadlines</h3>
              <div className="deadline-list">
                <div className="deadline-item">
                  <span className="deadline-name">Student Application Review</span>
                  <span className="deadline-date">2025-04-15 23:59</span>
                  <span className="deadline-days">{applicationDaysLeft} days left</span>
                </div>
                <div className="deadline-item">
                  <span className="deadline-name">Project Updates & Reviews</span>
                  <span className="deadline-date">2025-05-30 23:59</span>
                  <span className="deadline-days">{projectUpdateDaysLeft} days left</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {renderSection()}
      </main>
    </div>
  );
}


function getSectionTitle(sectionId) {
  const titles = {
    'student-applications': 'Student Applications',
    'project-management': 'Project Management',
    'results': 'Matching Result',
    'supervision-list': 'Supervision List'
  };
  return titles[sectionId] || 'Student Applications';
}

export default Teacher;

