console.log('🔧 admin.js 已載入');

// 全局狀態
let currentSection = 'project-review';
let selectedStudents = new Set();
let selectedProjects = new Set();

// 初始化管理員界面
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Admin DOM 已載入完成');
    
    // 檢查登入狀態
    checkLoginStatus();
    
    // 初始化導航
    initializeNavigation();
    
    // 初始化事件監聽器
    initializeEventListeners();
    
    // 載入初始數據
    loadInitialData();
});

// 檢查登入狀態
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userEmail = sessionStorage.getItem('userEmail');
    const userRole = sessionStorage.getItem('userRole');
    
    console.log('🔐 登入狀態檢查:', { isLoggedIn, userEmail, userRole });
    
    if (!isLoggedIn || userRole !== 'admin') {
        alert('❌ Please login as administrator first!');
        window.location.href = '/';
        return;
    }
}

// 初始化導航
function initializeNavigation() {
    console.log('🧭 初始化導航');
    
    // 側邊欄導航點擊事件
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('href').substring(1);
            switchSection(targetSection);
        });
    });
}

// 初始化事件監聽器
function initializeEventListeners() {
    console.log('🎯 初始化事件監聽器');
    
    // 全選項目複選框
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const projectCheckboxes = document.querySelectorAll('.project-checkbox');
            projectCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }
    
    // 全選學生複選框
    const selectAllStudents = document.getElementById('selectAllStudents');
    if (selectAllStudents) {
        selectAllStudents.addEventListener('change', function() {
            const studentRows = document.querySelectorAll('.students-table tbody tr');
            studentRows.forEach(row => {
                const studentId = row.cells[0].textContent;
                if (this.checked) {
                    selectedStudents.add(studentId);
                } else {
                    selectedStudents.delete(studentId);
                }
            });
            updateSelectedCount();
        });
    }
}

// 切換章節
function switchSection(sectionId) {
    console.log('🔄 切換章節:', sectionId);
    
    // 隱藏所有章節
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // 移除所有活動鏈接
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // 顯示目標章節
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // 更新活動鏈接
    const targetLink = document.querySelector(`[href="#${sectionId}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }
    
    // 更新麵包屑
    updateBreadcrumb(sectionId);
    
    currentSection = sectionId;
}

// 更新麵包屑導航
function updateBreadcrumb(sectionId) {
    const breadcrumbElement = document.getElementById('current-page');
    if (!breadcrumbElement) return;
    
    const sectionTitles = {
        'project-review': 'Project Review',
        'matching-control': 'Matching Control',
        'final-assignment': 'Final Assignment',
        'deadline-management': 'Deadline Management'
    };
    
    breadcrumbElement.textContent = sectionTitles[sectionId] || 'Dashboard';
}

// 載入初始數據
function loadInitialData() {
    console.log('📊 載入初始數據');
    
    // 模擬從服務器載入數據
    setTimeout(() => {
        updateLiveStatistics();
        updateReviewProgress();
    }, 500);
}

// 更新實時統計
function updateLiveStatistics() {
    console.log('📈 更新實時統計');
    
    // 模擬實時數據更新
    const stats = {
        totalStudents: 150,
        submittedPreferences: Math.floor(Math.random() * 10) + 140, // 140-150
        availableProjects: 45,
        algorithmStatus: 'Ready',
        estimatedCompletion: '2024-04-06 12:00'
    };
    
    // 更新統計顯示
    const statElements = {
        'totalStudents': stats.totalStudents,
        'submittedPreferences': stats.submittedPreferences,
        'availableProjects': stats.availableProjects
    };
    
    for (const [key, value] of Object.entries(statElements)) {
        const element = document.querySelector(`.stat-value:contains("${key}")`);
        if (element) {
            element.textContent = value;
        }
    }
}

// 更新審核進度
function updateReviewProgress() {
    console.log('📋 更新審核進度');
    
    const progressElement = document.querySelector('.progress-indicator strong');
    if (progressElement) {
        progressElement.textContent = '25/45 (56%)';
    }
}

// 項目審核功能
function approveProject(projectIndex) {
    console.log('✅ 批准項目:', projectIndex);
    showNotification(`Project ${projectIndex + 1} approved successfully!`, 'success');
    
    // 模擬更新界面
    setTimeout(() => {
        const projectCard = document.querySelectorAll('.project-card')[projectIndex];
        if (projectCard) {
            projectCard.style.opacity = '0.5';
            projectCard.style.pointerEvents = 'none';
        }
        updateReviewProgress();
    }, 500);
}

function rejectProject(projectIndex) {
    console.log('❌ 拒絕項目:', projectIndex);
    
    if (confirm('Are you sure you want to reject this project?')) {
        showNotification(`Project ${projectIndex + 1} rejected.`, 'error');
        
        // 模擬更新界面
        setTimeout(() => {
            const projectCard = document.querySelectorAll('.project-card')[projectIndex];
            if (projectCard) {
                projectCard.style.backgroundColor = '#ffe6e6';
            }
            updateReviewProgress();
        }, 500);
    }
}

function addComment(projectIndex) {
    console.log('💬 添加評論:', projectIndex);
    
    const comment = prompt('Enter your comment for this project:');
    if (comment) {
        showNotification('Comment added successfully!', 'info');
    }
}

// 匹配控制功能
function startMatching() {
    console.log('🚀 開始匹配算法');
    
    if (confirm('Start matching algorithm? This will assign students to projects based on preferences and GPA.')) {
        showNotification('Matching algorithm started...', 'info');
        
        // 模擬匹配過程
        simulateMatchingProgress();
    }
}

function simulateMatchingProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        showNotification(`Matching in progress... ${progress}%`, 'info');
        
        if (progress >= 100) {
            clearInterval(interval);
            showNotification('Matching completed! 84% success rate (38/45 projects matched)', 'success');
            
            // 更新界面
            updateAfterMatching();
        }
    }, 500);
}

function updateAfterMatching() {
    // 更新統計
    const stats = document.querySelectorAll('.stat-value');
    if (stats.length >= 4) {
        stats[3].textContent = 'Completed';
        stats[3].className = 'stat-value status-ready';
    }
    
    // 顯示未匹配學生數量
    const unmatchedHeader = document.querySelector('.assignment-header h2');
    if (unmatchedHeader) {
        unmatchedHeader.textContent = 'Unmatched Students (7)';
    }
}

function showAdvancedSettings() {
    console.log('⚙️ 顯示高級設置');
    showNotification('Advanced settings panel opened', 'info');
}

// 最終分配功能
function autoAssignAll() {
    console.log('🤖 自動分配所有學生');
    
    if (confirm('Auto-assign all unmatched students to available projects?')) {
        showNotification('Auto-assignment in progress...', 'info');
        
        setTimeout(() => {
            showNotification('All students have been assigned successfully!', 'success');
            
            // 更新界面
            const assignmentHeader = document.querySelector('.assignment-header h2');
            if (assignmentHeader) {
                assignmentHeader.textContent = 'Unmatched Students (0)';
            }
            
            const studentsTable = document.querySelector('.students-table tbody');
            if (studentsTable) {
                studentsTable.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #27ae60;">All students have been assigned!</td></tr>';
            }
        }, 2000);
    }
}

function assignStudent(studentIndex) {
    console.log('🎯 分配學生:', studentIndex);
    
    // 模擬分配對話框
    const projectOptions = [
        'Database Optimization - Prof. Zhang',
        'Cloud Computing Platform - Prof. Liu',
        'Network Security Tool - Prof. Yang',
        'Game Development - Prof. Wu',
        'Data Visualization - Prof. Zhao'
    ];
    
    const selectedProject = prompt(`Select project for student ${studentIndex + 1}:\n\n${projectOptions.join('\n')}`);
    
    if (selectedProject) {
        showNotification(`Student assigned to: ${selectedProject}`, 'success');
        
        // 從列表中移除學生
        const studentRow = document.querySelectorAll('.students-table tbody tr')[studentIndex];
        if (studentRow) {
            studentRow.style.backgroundColor = '#e8f5e8';
            studentRow.querySelector('.btn-assign').textContent = '✅ Assigned';
            studentRow.querySelector('.btn-assign').disabled = true;
        }
        
        updateUnmatchedCount();
    }
}

function updateUnmatchedCount() {
    const assignButtons = document.querySelectorAll('.btn-assign:not(:disabled)');
    const unmatchedHeader = document.querySelector('.assignment-header h2');
    if (unmatchedHeader) {
        unmatchedHeader.textContent = `Unmatched Students (${assignButtons.length})`;
    }
}

function updateSelectedCount() {
    const selectAllCheckbox = document.getElementById('selectAllStudents');
    if (selectAllCheckbox) {
        const countText = `Select all students (${selectedStudents.size})`;
        selectAllCheckbox.parentElement.textContent = countText;
    }
}

function exportReport() {
    console.log('📊 導出報告');
    showNotification('Exporting assignment report...', 'info');
    
    // 模擬導出過程
    setTimeout(() => {
        showNotification('Report exported successfully!', 'success');
        
        // 創建下載鏈接
        const blob = new Blob(['FYP Assignment Report - Generated on ' + new Date().toLocaleDateString()], 
                            { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fyp-assignment-report.txt';
        a.click();
        URL.revokeObjectURL(url);
    }, 1000);
}

// 截止日期管理功能
function editDeadline(phase) {
    console.log('📅 編輯截止日期:', phase);
    
    const phaseTitles = {
        'proposal': 'Proposal Phase',
        'matching': 'Matching Phase', 
        'project': 'Project Management'
    };
    
    const currentDate = '2025-03-20 23:59'; // 示例日期
    const newDate = prompt(`Enter new deadline for ${phaseTitles[phase]}:`, currentDate);
    
    if (newDate) {
        showNotification(`Deadline updated to: ${newDate}`, 'success');
        
        // 更新界面顯示
        const deadlineCard = document.querySelector(`.deadline-card:nth-child(${getPhaseIndex(phase)})`);
        if (deadlineCard) {
            const dateElement = deadlineCard.querySelector('.deadline-date');
            if (dateElement) {
                dateElement.textContent = newDate;
            }
        }
    }
}

function getPhaseIndex(phase) {
    const phases = ['proposal', 'matching', 'project'];
    return phases.indexOf(phase) + 1;
}

// 通知功能
function showNotification(message, type) {
    console.log('💬 顯示通知:', { message, type });
    
    // 移除現有通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 樣式設定
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
    
    // 3秒後自動消失
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
}

// 登出功能
function logout() {
    console.log('🚪 用戶登出');
    
    if (confirm('Are you sure you want to logout?')) {
        // 清除所有存儲的數據
        sessionStorage.clear();
        localStorage.clear();
        
        // 跳轉到登入頁面
        window.location.href = '/';
    }
}

// 鍵盤快捷鍵
document.addEventListener('keydown', function(e) {
    // Ctrl + L 快速登出
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        logout();
    }
    
    // Esc 鍵返回
    if (e.key === 'Escape') {
        switchSection('project-review');
    }
});

console.log('🎯 Admin 界面功能加載完成');