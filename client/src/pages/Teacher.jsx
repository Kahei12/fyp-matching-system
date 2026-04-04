import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Teacher.css';
import Sidebar from '../components/Teacher/Sidebar';
import StageOverview from '../components/Teacher/StageOverview';
import ProjectManagement from '../components/Teacher/ProjectManagement';
import StudentApplications from '../components/Teacher/StudentApplications';
import SupervisionList from '../components/Teacher/SupervisionList';
import MatchingResults from '../components/Teacher/MatchingResults';
import AppModal from '../components/common/AppModal';

const DEFAULT_TEACHER_DEADLINES = {
  preference: '2025-04-15T23:59:00',
  results: '2025-05-30T23:59:00',
};

function fmtDaysLeft(days) {
  return days < 0 ? 'Overdue' : `${days} days left`;
}

function Teacher() {
  const [currentSection, setCurrentSection] = useState('student-applications');
  const [projectStats, setProjectStats] = useState({ total: 0, approved: 0, underReview: 0 });
  const [systemDeadlines, setSystemDeadlines] = useState(DEFAULT_TEACHER_DEADLINES);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
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

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/system/status');
        const d = await r.json();
        if (d.success && d.deadlines) {
          setSystemDeadlines((prev) => ({ ...prev, ...d.deadlines }));
        }
      } catch (_) {
        /* defaults */
      }
    })();
  }, []);

  const handleLogout = () => {
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    sessionStorage.clear();
    navigate('/');
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

  const userEmail = sessionStorage.getItem('userEmail') || 'teacher@hkmu.edu.hk';

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');

    if (!isLoggedIn || userRole !== 'teacher') {
      navigate('/');
      return;
    }
    fetchProjectStats();
  }, [navigate]);

  const fetchProjectStats = async () => {
    try {
      // 获取该老师自己的项目
      const projectsResponse = await fetch(`/api/teacher/projects?email=${encodeURIComponent(userEmail)}`, {
        headers: { 'x-teacher-email': userEmail }
      });
      const projectsData = await projectsResponse.json();
      
      // 获取该老师批准的学生提案
      const proposalsResponse = await fetch(`/api/teacher/student-proposals?email=${encodeURIComponent(userEmail)}`, {
        headers: { 'x-teacher-email': userEmail }
      });
      const proposalsData = await proposalsResponse.json();
      
      // My Projects: 该老师自己创建的项目数量
      const myProjectsCount = projectsData.success && projectsData.projects ? projectsData.projects.length : 0;
      
      // Approved: 该老师已批准的学生提案数量
      const approvedCount = proposalsData.success && proposalsData.proposals 
        ? proposalsData.proposals.filter(p => p.myDecision === 'approve').length 
        : 0;
      
      // Under Review: 待审批的学生提案数量
      const underReviewCount = proposalsData.success && proposalsData.proposals 
        ? proposalsData.proposals.filter(p => !p.myDecision).length 
        : 0;
      
      setProjectStats({
        total: myProjectsCount,
        approved: approvedCount,
        underReview: underReviewCount
      });
    } catch (error) {
      console.error('Error fetching project stats:', error);
    }
  };
  const now = new Date();
  const applicationDeadline = new Date(
    systemDeadlines.preference || DEFAULT_TEACHER_DEADLINES.preference
  );
  const projectUpdateDeadline = new Date(
    systemDeadlines.results || DEFAULT_TEACHER_DEADLINES.results
  );

  const applicationDaysLeft = Math.ceil((applicationDeadline - now) / (1000 * 60 * 60 * 24));
  const projectUpdateDaysLeft = Math.ceil((projectUpdateDeadline - now) / (1000 * 60 * 60 * 24));
  const fmtLine = (d) =>
    d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

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
    const applicationDeadlineDate = new Date(
      systemDeadlines.preference || DEFAULT_TEACHER_DEADLINES.preference
    );
    const projectDeadlineDate = new Date(
      systemDeadlines.results || DEFAULT_TEACHER_DEADLINES.results
    );
    const now = new Date();

    const titles = {
      'student-applications': 'Student Proposals',
      'project-management': 'Teacher Proposals',
      'results': 'Matching Result'
    };

    const deadlines = {
      'student-applications': {
        date: applicationDeadlineDate,
        label: 'Student Proposal Review'
      },
      'project-management': {
        date: projectDeadlineDate,
        label: 'Teacher Proposal Updates & Reviews'
      },
      'results': {
        date: projectDeadlineDate,
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
    const deadlineLabel = fmtDaysLeft(daysLeft);

    return (
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title-with-deadline">
          <h1>{title}</h1>
          <span className="deadline-hint">⏰ Deadline: {formattedDate} ({deadlineLabel})</span>
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
        return <StudentApplications showNotification={showNotification} projectStats={projectStats} onStatsChange={fetchProjectStats} />;
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
                  <span className="deadline-name">Student Proposal Review</span>
                  <span className="deadline-date">{fmtLine(applicationDeadline)}</span>
                  <span className="deadline-days">{fmtDaysLeft(applicationDaysLeft)}</span>
                </div>
                <div className="deadline-item">
                  <span className="deadline-name">Teacher Proposal Updates & Reviews</span>
                  <span className="deadline-date">{fmtLine(projectUpdateDeadline)}</span>
                  <span className="deadline-days">{fmtDaysLeft(projectUpdateDaysLeft)}</span>
                </div>
              </div>
            </div>
          )}

          {/* My Project Stats - 在首頁顯示 */}
          {currentSection === 'student-applications' && (
            <div className="project-stats-cards">
              <div className="stat-card">
                <div className="stat-number">{projectStats.total}</div>
                <div className="stat-label">My Projects</div>
              </div>
              <div className="stat-card approved">
                <div className="stat-number">{projectStats.approved}</div>
                <div className="stat-label">Approved</div>
              </div>
              <div className="stat-card review">
                <div className="stat-number">{projectStats.underReview}</div>
                <div className="stat-label">Under Review</div>
              </div>
              <div className="stat-card total">
                <div className="stat-number">{projectStats.total + projectStats.approved}</div>
                <div className="stat-label">Total Projects</div>
              </div>
            </div>
          )}
        </div>

        {renderSection()}
      </main>

      <AppModal
        open={logoutConfirmOpen}
        title="Logout"
        onClose={() => setLogoutConfirmOpen(false)}
        footer="actions"
        primaryLabel="Logout"
        secondaryLabel="Cancel"
        onPrimary={confirmLogout}
        onSecondary={() => {}}
      >
        <p>Are you sure you want to logout?</p>
      </AppModal>
    </div>
  );
}


function getSectionTitle(sectionId) {
  const titles = {
    'student-applications': 'Student Proposals',
    'project-management': 'Teacher Proposals',
    'results': 'Matching Result',
    'supervision-list': 'Supervision List'
  };
  return titles[sectionId] || 'Student Proposals';
}

export default Teacher;

