import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const showMessage = (message, type) => {
    console.log('[MSG] Display message:', message);
    
    // Remove existing message
    const existingMessage = document.querySelector('.message-popup');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-popup';
    messageDiv.textContent = message;
    
    // Style settings
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
    
    // Auto-dismiss after 3 seconds
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
    console.log('[TARGET] Form submission triggered');
    
    setIsLoading(true);
    console.log('[EMAIL] Input email:', email);
    console.log('[PASS] Input password:', password);

    try {
      console.log('[SYNC] Sending request to backend...');
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('[STATUS] Backend response status:', response.status);
      const result = await response.json();
      console.log('[DATA] Backend response data:', result);

      if (result.success) {
        // Show success message
        showMessage('Login successful! Redirecting...', 'success');
        console.log('[ROLE] User role:', result.user.role);
        
        // Store login state
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userEmail', String(email || '').trim().toLowerCase());
        sessionStorage.setItem('userRole', result.user.role);
        sessionStorage.setItem('userName', result.user.name);
        sessionStorage.setItem('mustChangePassword', String(!!result.user.mustChangePassword));
        
        // Store role-specific info
        if (result.user.role === 'student') {
          const sid = result.user.studentId || result.user.id || '';
          sessionStorage.setItem('studentId', sid);
          sessionStorage.setItem('userGPA', result.user.gpa || '');
          sessionStorage.setItem('userMajor', result.user.major || '');
        }
        
        // Store teacher's major
        if (result.user.role === 'teacher') {
          sessionStorage.setItem('userMajor', result.user.major || '');
        }
        
        // Navigate based on role
        setTimeout(() => {
          switch(result.user.role) {
            case 'admin':
              console.log('-> Navigate to Admin dashboard');
              navigate('/admin');
              break;
            case 'student':
              console.log('-> Navigate to Student dashboard');
              navigate('/student');
              break;
            case 'teacher':
              console.log('-> Navigate to Teacher dashboard');
              navigate('/teacher');
              break;
            default:
              console.log('-> Navigate to home');
              navigate('/');
          }
        }, 1500); // Redirect after 1.5 seconds
        
      } else {
        showMessage('Login failed: ' + result.message, 'error');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage('Network error, please try again later', 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <header>
          {/* Logo above title */}
          <div className="logo-container">
            <img 
              src="https://www.hkmu.edu.hk/wp-content/uploads/2021/08/HKMU-logo-mb.png" 
              alt="HKMU Logo" 
              className="hkmu-logo"
            />
          </div>
          
          {/* Title and subtitle */}
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

