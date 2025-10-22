console.log('🔧 script.js 已載入');

// 確保 DOM 完全載入後再綁定事件
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM 已載入完成');
    
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
        console.error('❌ 找不到登入表單！');
        return;
    }
    
    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        console.log('🎯 表單提交被觸發');

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        console.log('📧 輸入的 Email:', email);
        console.log('🔑 輸入的 Password:', password);

        try {
            console.log('🔄 發送請求到後端...');
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            console.log('📨 後端回傳狀態:', response.status);
            const result = await response.json();
            console.log('📦 後端回傳資料:', result);

            if (result.success) {
                // 顯示成功訊息（替代 alert）
                showMessage('✅ Login successful! Redirecting...', 'success');
                console.log('👤 用戶角色:', result.user.role);
                
                // 儲存登入狀態
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('userEmail', email);
                sessionStorage.setItem('userRole', result.user.role);
                
                // 根據角色導向不同頁面 - 修正這裡！
                setTimeout(() => {
                    let redirectTo;
                    switch(result.user.role) {
                        case 'admin':
                            redirectTo = '/admin.html';
                            console.log('➡️ 導向 Admin 儀表板');
                            break;
                        case 'student':
                            redirectTo = '/student.html';
                            console.log('➡️ 導向 Student 儀表板');
                            break;
                        case 'teacher':
                            redirectTo = '/teacher.html';
                            console.log('➡️ 導向 Teacher 儀表板');
                            break;
                        default:
                            redirectTo = '/';
                            console.log('➡️ 導向首頁');
                    }
                    window.location.href = redirectTo;
                }, 1500); // 1.5秒後跳轉
                
            } else {
                showMessage('❌ Login failed: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('💥 發生錯誤:', error);
            showMessage('🚨 Network error, please try again later', 'error');
        }
    });
    
    console.log('🎯 表單事件綁定完成');
});

// 顯示訊息函數（替代 alert）
function showMessage(message, type) {
    console.log('💬 顯示訊息:', message);
    
    // 移除現有的訊息
    const existingMessage = document.querySelector('.message-popup');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-popup';
    messageDiv.textContent = message;
    
    // 樣式設定
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        z-index: 10000;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
        max-width: 300px;
        ${type === 'success' ? 
            'background: #27ae60;' : 
            'background: #e74c3c;'
        }
    `;
    
    document.body.appendChild(messageDiv);
    
    // 3秒後自動消失
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 300);
    }, 3000);
}