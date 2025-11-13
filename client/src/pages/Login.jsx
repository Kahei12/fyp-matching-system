import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const showMessage = (message, type) => {
    console.log('[MSG] 顯示訊息:', message);
    
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
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('[TARGET] 表單提交被觸發');
    
    setIsLoading(true);
    console.log('[EMAIL] 輸入的 Email:', email);
    console.log('[PASS] 輸入的 Password:', password);

    try {
      console.log('[SYNC] 發送請求到後端...');
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('[STATUS] 後端回傳狀態:', response.status);
      const result = await response.json();
      console.log('[DATA] 後端回傳資料:', result);

      if (result.success) {
        // 顯示成功訊息
        showMessage('✔ Login successful! Redirecting...', 'success');
        console.log('[ROLE] 用戶角色:', result.user.role);
        
        // 儲存登入狀態
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userEmail', email);
        sessionStorage.setItem('userRole', result.user.role);
        sessionStorage.setItem('userName', result.user.name);
        
        // 根據角色存儲特定信息
        if (result.user.role === 'student') {
          sessionStorage.setItem('studentId', result.user.studentId || 'S001');
          sessionStorage.setItem('userGPA', result.user.gpa || '');
          sessionStorage.setItem('userMajor', result.user.major || '');
        }
        
        // 根據角色導向不同頁面
        setTimeout(() => {
          switch(result.user.role) {
            case 'admin':
              console.log('-> 導向 Admin 儀表板');
              navigate('/admin');
              break;
            case 'student':
              console.log('-> 導向 Student 儀表板');
              navigate('/student');
              break;
            case 'teacher':
              console.log('-> 導向 Teacher 儀表板');
              navigate('/teacher');
              break;
            default:
              console.log('-> 導向首頁');
              navigate('/');
          }
        }, 1500); // 1.5秒後跳轉
        
      } else {
        showMessage('✖ Login failed: ' + result.message, 'error');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('✸ 發生錯誤:', error);
      showMessage('⚠ Network error, please try again later', 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <header>
          {/* Logo 單獨一行在標題上方 */}
          <div className="logo-container">
            <img 
              src="https://www.hkmu.edu.hk/wp-content/uploads/2021/08/HKMU-logo-mb.png" 
              alt="HKMU Logo" 
              className="hkmu-logo"
            />
          </div>
          
          {/* 標題和副標題 */}
          <div className="title-container">
            <h1>HKMU FYP Matching System</h1>
            <p>Sign in to access your dashboard</p>
          </div>
        </header>
    
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
    
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
    
          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
    
        <p className="register-link">
          Don't have an account? <a href="#">Register</a>
        </p>
    
        <footer>
          <p>Hong Kong Metropolitan University © 2025</p>
        </footer>
      </div>
    </div>
  );
}

export default Login;

