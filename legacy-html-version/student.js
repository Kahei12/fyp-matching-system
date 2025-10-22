console.log('🔧 student.js 已載入');

// 全局狀態
let currentSection = 'dashboard';
let studentPreferences = [];
let availableProjects = [];
let currentStudentId = 'S001'; // 默認值

// 搜索過濾狀態
let searchFilters = {
    keyword: '',
    skills: [],
    supervisor: '',
    status: 'active'
};

// 初始化學生界面
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Student DOM 已載入完成');
    
    // 檢查登入狀態
    checkStudentLoginStatus();
    
    // 初始化導航
    initializeStudentNavigation();
    
    // 載入學生數據
    loadStudentData();
    
    // 載入項目數據
    loadProjectsData();
    
    // 初始化搜索過濾器
    initializeSearchFilters();
});

// 檢查學生登入狀態
function checkStudentLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');
    const userEmail = sessionStorage.getItem('userEmail');
    const studentId = sessionStorage.getItem('studentId');
    
    console.log('🔐 學生登入狀態檢查:', { isLoggedIn, userRole, userEmail, studentId });
    
    if (!isLoggedIn || userRole !== 'student') {
        alert('❌ Please login as student first!');
        window.location.href = '/';
        return;
    }
    
    // 設置學生 ID
    currentStudentId = studentId || 'S001';
    console.log('🎯 當前學生 ID:', currentStudentId);
    
    // 更新界面顯示的學生信息
    updateStudentInfo();
}

// 更新學生信息
async function updateStudentInfo() {
    console.log('👤 更新學生信息:', currentStudentId);
    
    try {
        const response = await fetch(`/api/student/${currentStudentId}`);
        console.log('📡 學生信息 API 響應狀態:', response.status);
        
        const result = await response.json();
        console.log('📦 學生信息 API 響應數據:', result);
        
        if (result.success) {
            const studentData = result.student;
            
            // 更新側邊欄
            document.getElementById('studentName').textContent = studentData.name;
            document.getElementById('studentId').textContent = studentData.studentId;
            document.getElementById('studentGPA').textContent = `GPA: ${studentData.gpa}`;
            
            // 更新個人資料頁面
            document.getElementById('profileName').textContent = studentData.name;
            document.getElementById('profileStudentId').textContent = `Student ID: ${studentData.studentId}`;
            document.getElementById('profileEmail').textContent = studentData.email;
            document.getElementById('profileMajor').textContent = studentData.major;
            document.getElementById('profileGPA').textContent = studentData.gpa;
            document.getElementById('profileYear').textContent = studentData.year;
            
            // 載入學生的偏好
            await loadStudentPreferences();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ 獲取學生信息錯誤:', error);
        // 後備方案：使用模擬數據
        useFallbackData();
    }
}

// 後備數據（API 失敗時使用）
function useFallbackData() {
    console.log('🔄 使用後備數據');
    const studentEmail = sessionStorage.getItem('userEmail');
    const studentData = {
        name: 'Chan Tai Man',
        studentId: 'S001',
        gpa: '3.45',
        email: studentEmail || 'student@hkmu.edu.hk',
        major: 'Computer Science',
        year: 'Year 4'
    };
    
    document.getElementById('studentName').textContent = studentData.name;
    document.getElementById('studentId').textContent = studentData.studentId;
    document.getElementById('studentGPA').textContent = `GPA: ${studentData.gpa}`;
    
    document.getElementById('profileName').textContent = studentData.name;
    document.getElementById('profileStudentId').textContent = `Student ID: ${studentData.studentId}`;
    document.getElementById('profileEmail').textContent = studentData.email;
    document.getElementById('profileMajor').textContent = studentData.major;
    document.getElementById('profileGPA').textContent = studentData.gpa;
    document.getElementById('profileYear').textContent = studentData.year;
}

// 初始化導航
function initializeStudentNavigation() {
    console.log('🧭 初始化學生導航');
    
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

// 初始化搜索過濾器
function initializeSearchFilters() {
    console.log('🔍 初始化搜索過濾器');
    
    // 搜索輸入事件
    const searchInput = document.getElementById('projectSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchFilters.keyword = e.target.value.toLowerCase();
            filterAndRenderProjects();
        });
    }
    
    // 技能過濾事件
    const skillFilter = document.getElementById('skillFilter');
    if (skillFilter) {
        skillFilter.addEventListener('change', function(e) {
            searchFilters.skills = Array.from(e.target.selectedOptions).map(option => option.value);
            filterAndRenderProjects();
        });
    }
    
    // 導師過濾事件
    const supervisorFilter = document.getElementById('supervisorFilter');
    if (supervisorFilter) {
        supervisorFilter.addEventListener('change', function(e) {
            searchFilters.supervisor = e.target.value;
            filterAndRenderProjects();
        });
    }
    
    // 狀態過濾事件
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function(e) {
            searchFilters.status = e.target.value;
            filterAndRenderProjects();
        });
    }
    
    // 排序事件
    const sortSelect = document.getElementById('projectSort');
    if (sortSelect) {
        sortSelect.addEventListener('change', function(e) {
            sortProjects(e.target.value);
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
        'dashboard': 'Dashboard',
        'project-browse': 'Browse Projects',
        'my-preferences': 'My Preferences',
        'results': 'Results',
        'profile': 'Profile'
    };
    
    breadcrumbElement.textContent = sectionTitles[sectionId] || 'Dashboard';
}

// 載入學生數據
async function loadStudentData() {
    console.log('📊 載入學生數據');
    await updateStudentInfo();
    updateDashboard();
    updateDeadlines();
}

// 載入項目數據
async function loadProjectsData() {
    console.log('📋 載入項目數據');
    
    try {
        const response = await fetch('/api/student/projects');
        console.log('📡 項目 API 響應狀態:', response.status);
        
        const result = await response.json();
        console.log('📦 項目 API 響應數據:', result);
        
        if (result.success) {
            availableProjects = result.projects;
            renderProjectsGrid();
        } else {
            console.error('❌ 載入項目失敗:', result.message);
            useFallbackProjects();
        }
    } catch (error) {
        console.error('❌ 載入項目錯誤:', error);
        useFallbackProjects();
    }
}

// 後備項目數據
function useFallbackProjects() {
    console.log('🔄 使用後備項目數據');
    availableProjects = [
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
            description: 'Build an IoT system to monitor and optimize campus resource usage including energy, water, and space utilization.',
            skills: ['IoT', 'Embedded Systems', 'Python'],
            popularity: 8,
            capacity: 2,
            status: 'active'
        },
        {
            id: 3,
            title: 'Blockchain Security Analysis',
            supervisor: 'Dr. Sarah Chen',
            description: 'Analyze security vulnerabilities in blockchain systems and develop improved security protocols.',
            skills: ['Blockchain', 'Cryptography', 'Security'],
            popularity: 12,
            capacity: 2,
            status: 'active'
        },
        {
            id: 4,
            title: 'Mobile Health App',
            supervisor: 'Prof. David Wong',
            description: 'Create a mobile application for health monitoring and personalized fitness recommendations.',
            skills: ['Mobile Development', 'Healthcare', 'Data Analysis'],
            popularity: 6,
            capacity: 3,
            status: 'active'
        },
        {
            id: 5,
            title: 'Data Visualization Platform',
            supervisor: 'Dr. Emily Zhao',
            description: 'Develop an interactive platform for visualizing complex datasets with real-time analytics.',
            skills: ['Data Visualization', 'JavaScript', 'D3.js'],
            popularity: 9,
            capacity: 2,
            status: 'active'
        }
    ];
    renderProjectsGrid();
}

// 載入學生偏好
async function loadStudentPreferences() {
    console.log('⭐ 載入學生偏好 - 調試信息:', {
        currentStudentId,
        apiUrl: `/api/student/${currentStudentId}/preferences`
    });
    
    try {
        const response = await fetch(`/api/student/${currentStudentId}/preferences`);
        console.log('📡 偏好 API 響應狀態:', response.status);
        
        const result = await response.json();
        console.log('📦 偏好 API 響應數據:', result);
        
        if (result.success) {
            studentPreferences = result.preferences;
            console.log('✅ 載入的偏好:', studentPreferences);
        } else {
            console.error('❌ API 返回錯誤:', result.message);
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ 載入偏好錯誤:', error);
        // 使用本地存儲作為後備
        const savedPreferences = localStorage.getItem(`studentPreferences_${currentStudentId}`);
        studentPreferences = savedPreferences ? JSON.parse(savedPreferences) : [];
        console.log('🔄 使用本地存儲偏好:', studentPreferences);
    }
    
    renderPreferencesList();
    updateDashboard();
}

// 渲染項目網格
function renderProjectsGrid() {
    const container = document.getElementById('projectsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (availableProjects.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3>No projects available</h3>
                <p>Please check back later or contact administrator</p>
            </div>
        `;
        return;
    }
    
    availableProjects.forEach(project => {
        const projectCard = createProjectCard(project);
        container.appendChild(projectCard);
    });
    
    // 更新結果計數
    updateResultsCount(availableProjects.length);
}

// 創建項目卡片
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    // 檢查是否已在偏好中
    const isInPreferences = studentPreferences.some(pref => pref.id === project.id);
    const addButtonText = isInPreferences ? '✅ Already Added' : '⭐ Add to Preferences';
    const addButtonDisabled = isInPreferences ? 'disabled' : '';
    
    // 創建技能標籤
    const skillTags = Array.isArray(project.skills) 
        ? project.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')
        : `<span class="skill-tag">${project.skills}</span>`;
    
    card.innerHTML = `
        <div class="project-header">
            <h3>${project.title}</h3>
            <span class="popularity-badge">🔥 ${project.popularity} selections</span>
        </div>
        <div class="project-supervisor">
            <strong>Supervisor:</strong> ${project.supervisor}
        </div>
        <div class="project-description">
            ${project.description}
        </div>
        <div class="project-skills">
            <strong>Required Skills:</strong>
            <div class="skill-tags">
                ${skillTags}
            </div>
        </div>
        <div class="project-actions">
            <button class="btn-primary" onclick="addPreference(${project.id})" ${addButtonDisabled}>
                ${addButtonText}
            </button>
            <button class="btn-secondary" onclick="viewProjectDetails(${project.id})">📖 View Details</button>
        </div>
    `;
    
    return card;
}

// 過濾和渲染項目
function filterAndRenderProjects() {
    console.log('🎯 應用過濾器:', searchFilters);
    
    let filteredProjects = availableProjects.filter(project => {
        // 關鍵詞搜索
        if (searchFilters.keyword) {
            const searchText = searchFilters.keyword;
            const matchesKeyword = 
                project.title.toLowerCase().includes(searchText) ||
                project.description.toLowerCase().includes(searchText) ||
                project.supervisor.toLowerCase().includes(searchText);
            if (!matchesKeyword) return false;
        }
        
        // 技能過濾
        if (searchFilters.skills.length > 0) {
            const hasMatchingSkill = searchFilters.skills.some(skill => 
                project.skills.includes(skill)
            );
            if (!hasMatchingSkill) return false;
        }
        
        // 導師過濾
        if (searchFilters.supervisor && project.supervisor !== searchFilters.supervisor) {
            return false;
        }
        
        // 狀態過濾
        if (searchFilters.status === 'active' && project.status !== 'active') {
            return false;
        }
        
        return true;
    });
    
    renderFilteredProjects(filteredProjects);
}

// 渲染過濾後的項目
function renderFilteredProjects(projects) {
    const container = document.getElementById('projectsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 更新結果計數
    updateResultsCount(projects.length);
    
    if (projects.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3>No projects found</h3>
                <p>Try adjusting your search criteria or filters</p>
                <button class="btn-primary" onclick="clearFilters()">Clear All Filters</button>
            </div>
        `;
        return;
    }
    
    projects.forEach(project => {
        const projectCard = createProjectCard(project);
        container.appendChild(projectCard);
    });
}

// 排序項目
function sortProjects(sortBy) {
    console.log('📊 排序項目:', sortBy);
    
    let sortedProjects = [...availableProjects];
    
    switch (sortBy) {
        case 'popularity':
            sortedProjects.sort((a, b) => b.popularity - a.popularity);
            break;
        case 'alphabetical':
            sortedProjects.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'supervisor':
            sortedProjects.sort((a, b) => a.supervisor.localeCompare(b.supervisor));
            break;
    }
    
    renderFilteredProjects(sortedProjects);
}

// 更新結果計數
function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = `${count} project${count !== 1 ? 's' : ''} found`;
    }
}

// 清除所有過濾器
function clearFilters() {
    console.log('🧹 清除所有過濾器');
    
    // 重置搜索狀態
    searchFilters = {
        keyword: '',
        skills: [],
        supervisor: '',
        status: 'active'
    };
    
    // 重置UI元素
    const searchInput = document.getElementById('projectSearch');
    if (searchInput) searchInput.value = '';
    
    const skillFilter = document.getElementById('skillFilter');
    if (skillFilter) skillFilter.selectedIndex = -1;
    
    const supervisorFilter = document.getElementById('supervisorFilter');
    if (supervisorFilter) supervisorFilter.value = '';
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) statusFilter.value = 'active';
    
    const sortSelect = document.getElementById('projectSort');
    if (sortSelect) sortSelect.value = 'popularity';
    
    // 重新渲染所有項目
    renderFilteredProjects(availableProjects);
}

// 更新儀表板
function updateDashboard() {
    console.log('📈 更新儀表板');
    
    // 更新狀態卡片
    const preferencesCount = studentPreferences.length;
    document.getElementById('preferencesStatus').textContent = `${preferencesCount}/5 Selected`;
    
    // 更新提案狀態
    const hasProposal = false;
    document.getElementById('proposalStatus').textContent = hasProposal ? 'Submitted' : 'Not Submitted';
    
    // 更新分配狀態
    document.getElementById('assignmentStatus').textContent = 'Not Assigned';
}

// 更新截止日期
function updateDeadlines() {
    console.log('⏰ 更新截止日期');
    
    // 模擬計算剩餘天數
    const proposalDays = 15;
    const preferenceDays = 41;
    
    document.getElementById('proposalDeadline').textContent = `${proposalDays} days left`;
    document.getElementById('preferenceDeadline').textContent = `${preferenceDays} days left`;
}

// 添加項目到偏好
async function addPreference(projectId) {
    console.log('⭐ 添加項目到偏好:', { projectId, currentStudentId });
    
    // 檢查是否已存在
    if (studentPreferences.some(pref => pref.id === projectId)) {
        showNotification('❌ Project already in preferences!', 'error');
        return;
    }
    
    // 檢查數量限制
    if (studentPreferences.length >= 5) {
        showNotification('❌ Maximum 5 preferences allowed!', 'error');
        return;
    }
    
    const project = availableProjects.find(p => p.id === projectId);
    if (!project) {
        showNotification('❌ Project not found!', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/student/${currentStudentId}/preferences`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ projectId })
        });
        
        console.log('📡 添加偏好 API 響應狀態:', response.status);
        const result = await response.json();
        console.log('📦 添加偏好 API 響應數據:', result);
        
        if (result.success) {
            // API 成功：重新載入偏好
            await loadStudentPreferences();
            showNotification('✅ ' + result.message, 'success');
            
            // 自動跳轉到偏好頁面
            switchSection('my-preferences');
        } else {
            showNotification('❌ ' + result.message, 'error');
        }
    } catch (error) {
        console.error('❌ 添加偏好錯誤:', error);
        // API 失敗：使用本地存儲
        studentPreferences.push({
            id: project.id,
            title: project.title,
            supervisor: project.supervisor,
            popularity: project.popularity
        });
        
        // 保存到本地存儲
        localStorage.setItem(`studentPreferences_${currentStudentId}`, JSON.stringify(studentPreferences));
        
        showNotification('✅ Project added to preferences! (saved locally)', 'success');
        renderPreferencesList();
        renderProjectsGrid();
        updateDashboard();
        
        // 自動跳轉到偏好頁面
        switchSection('my-preferences');
    }
}

// 從偏好中移除項目
async function removePreference(projectId) {
    console.log('🗑️ 移除偏好:', { projectId, currentStudentId });
    
    try {
        const response = await fetch(`/api/student/${currentStudentId}/preferences/${projectId}`, {
            method: 'DELETE'
        });
        
        console.log('📡 移除偏好 API 響應狀態:', response.status);
        const result = await response.json();
        console.log('📦 移除偏好 API 響應數據:', result);
        
        if (result.success) {
            // API 成功：重新載入偏好
            await loadStudentPreferences();
            showNotification('✅ ' + result.message, 'success');
        } else {
            showNotification('❌ ' + result.message, 'error');
        }
    } catch (error) {
        console.error('❌ 移除偏好錯誤:', error);
        // API 失敗：使用本地存儲
        studentPreferences = studentPreferences.filter(pref => pref.id !== projectId);
        
        // 保存到本地存儲
        localStorage.setItem(`studentPreferences_${currentStudentId}`, JSON.stringify(studentPreferences));
        
        showNotification('✅ Project removed from preferences! (saved locally)', 'success');
        renderPreferencesList();
        renderProjectsGrid();
        updateDashboard();
    }
}

// 渲染偏好列表
function renderPreferencesList() {
    const container = document.getElementById('preferencesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (studentPreferences.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">⭐</div>
                <h3>No preferences yet</h3>
                <p>Browse projects and add them to your preferences list</p>
                <button class="btn-primary" onclick="switchSection('project-browse')">Browse Projects</button>
            </div>
        `;
        return;
    }
    
    studentPreferences.forEach((preference, index) => {
        const preferenceItem = document.createElement('div');
        preferenceItem.className = 'preference-item';
        preferenceItem.setAttribute('data-preference', preference.id);
        preferenceItem.innerHTML = `
            <div class="preference-rank">${index + 1}</div>
            <div class="preference-content">
                <h4>${preference.title}</h4>
                <p>${preference.supervisor} · 🔥 ${preference.popularity} selections</p>
            </div>
            <div class="preference-actions">
                <button class="btn-remove" onclick="removePreference(${preference.id})">🗑️ Remove</button>
            </div>
        `;
        container.appendChild(preferenceItem);
    });
}

// 提交偏好
async function submitPreferences() {
    console.log('📤 提交偏好:', currentStudentId);
    
    if (studentPreferences.length === 0) {
        showNotification('❌ Please add at least one project to your preferences!', 'error');
        return;
    }
    
    if (confirm(`Submit ${studentPreferences.length} project preferences? This action cannot be undone.`)) {
        try {
            const response = await fetch(`/api/student/${currentStudentId}/preferences/submit`, {
                method: 'POST'
            });
            
            console.log('📡 提交偏好 API 響應狀態:', response.status);
            const result = await response.json();
            console.log('📦 提交偏好 API 響應數據:', result);
            
            if (result.success) {
                showNotification('✅ ' + result.message, 'success');
                document.getElementById('preferencesStatus').textContent = `${result.preferencesCount}/5 Submitted`;
            } else {
                showNotification('❌ ' + result.message, 'error');
            }
        } catch (error) {
            console.error('❌ 提交偏好錯誤:', error);
            showNotification('✅ Preferences saved locally! (API unavailable)', 'success');
            document.getElementById('preferencesStatus').textContent = `${studentPreferences.length}/5 Saved`;
        }
    }
}

// 清空所有偏好
function clearPreferences() {
    console.log('🧹 清空所有偏好');
    
    if (studentPreferences.length === 0) {
        showNotification('ℹ️ No preferences to clear!', 'info');
        return;
    }
    
    if (confirm('Clear all project preferences? This action cannot be undone.')) {
        // 清空數組
        studentPreferences = [];
        
        // 清除本地存儲
        localStorage.removeItem(`studentPreferences_${currentStudentId}`);
        
        showNotification('✅ All preferences cleared!', 'success');
        renderPreferencesList();
        renderProjectsGrid();
        updateDashboard();
        
        // 嘗試調用 API 清空
        try {
            fetch(`/api/student/${currentStudentId}/preferences/clear`, {
                method: 'DELETE'
            }).catch(error => {
                console.log('⚠️ API 清空失敗，但本地已清除');
            });
        } catch (error) {
            console.log('⚠️ API 清空失敗，但本地已清除');
        }
    }
}

// 提交提案
function submitProposal() {
    console.log('📝 提交提案');
    showNotification('🔄 Redirecting to proposal submission...', 'info');
}

// 查看項目詳情
function viewProjectDetails(projectId) {
    console.log('📖 查看項目詳情:', projectId);
    const project = availableProjects.find(p => p.id === projectId);
    
    if (project) {
        const details = `
Project: ${project.title}
Supervisor: ${project.supervisor}
Description: ${project.description}
Required Skills: ${Array.isArray(project.skills) ? project.skills.join(', ') : project.skills}
Popularity: ${project.popularity} selections
Capacity: ${project.capacity} students
Status: ${project.status}
        `;
        alert(details);
    }
}

// 登出功能
function logout() {
    console.log('🚪 學生登出');
    
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = '/';
    }
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
            notification.remove();
        }
    }, 3000);
}

// 鍵盤快捷鍵
document.addEventListener('keydown', function(e) {
    // Ctrl + L 快速登出
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        logout();
    }
});

console.log('🎯 Student 界面功能加載完成');