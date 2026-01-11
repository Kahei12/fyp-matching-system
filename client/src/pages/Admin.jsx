import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';
import Sidebar from '../components/Admin/Sidebar';
import ProjectReview from '../components/Admin/ProjectReview';
import MatchingControl from '../components/Admin/MatchingControl';
import FinalAssignment from '../components/Admin/FinalAssignment';
import DataExport from '../components/Admin/DataExport';
import DeadlineManagement from '../components/Admin/DeadlineManagement';

function Admin() {
  const [currentSection, setCurrentSection] = useState('project-review');
  const navigate = useNavigate();

  useEffect(() => {
    // 檢查登入狀態
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');
    
    if (!isLoggedIn || userRole !== 'admin') {
      navigate('/');
      return;
    }
  }, [navigate]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      sessionStorage.clear();
      localStorage.clear();
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

  const renderSection = () => {
    switch (currentSection) {
      case 'project-review':
        return <ProjectReview showNotification={showNotification} />;
      case 'matching-control':
        return <MatchingControl showNotification={showNotification} />;
      case 'final-assignment':
        return <FinalAssignment showNotification={showNotification} />;
      case 'data-export':
        return <DataExport showNotification={showNotification} />;
      case 'deadline-management':
        return <DeadlineManagement showNotification={showNotification} />;
      default:
        return <ProjectReview showNotification={showNotification} />;
    }
  };

  const userName = 'Admin Wang';

  return (
    <div className="admin-container">
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
            onClick={() => setCurrentSection('project-review')}
            style={{ cursor: 'pointer' }}
          >
            Home
          </span>
          <span className="breadcrumb-separator">→</span>
          <span>{getSectionTitle(currentSection)}</span>
        </div>

        {renderSection()}
      </main>
    </div>
  );
}


function getSectionTitle(sectionId) {
  const titles = {
    'project-review': 'Project Review',
    'matching-control': 'Matching Control',
    'final-assignment': 'Final Assignment',
    'data-export': 'Data Export',
    'deadline-management': 'Deadline Management'
  };
  return titles[sectionId] || 'Project Review';
}

export default Admin;

