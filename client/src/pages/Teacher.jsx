import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Teacher.css';
import Sidebar from '../components/Teacher/Sidebar';
import StageOverview from '../components/Teacher/StageOverview';
import DeadlineBanner from '../components/Teacher/DeadlineBanner';
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

  const sectionDeadlines = {
    'student-applications': {
      date: '2025-04-15 23:59',
      status: 'Overdue',
      description: 'Select your project preferences'
    },
    'project-management': {
      date: '2025-05-30 23:59',
      status: 'Upcoming',
      description: 'Submit project updates and reviews'
    }
  };

  const activeDeadline = sectionDeadlines[currentSection];

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
            onClick={() => setCurrentSection('project-management')}
            style={{ cursor: 'pointer' }}
          >
            Home
          </span>
          <span className="breadcrumb-separator">→</span>
          <span>{getSectionTitle(currentSection)}</span>
        </div>

        <div className="page-overview">
          {activeDeadline && (
            <DeadlineBanner deadline={activeDeadline} />
          )}

          {currentSection !== 'supervision-list' && (
            <StageOverview 
              currentSection={currentSection} 
              onStageChange={setCurrentSection} 
            />
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

