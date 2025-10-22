import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, role }) {
  const isLoggedIn = sessionStorage.getItem('isLoggedIn');
  const userRole = sessionStorage.getItem('userRole');
  
  console.log('🔐 PrivateRoute 檢查:', { isLoggedIn, userRole, requiredRole: role });
  
  if (!isLoggedIn || isLoggedIn !== 'true') {
    console.log('❌ 未登入，重定向到登入頁');
    return <Navigate to="/" replace />;
  }
  
  if (role && userRole !== role) {
    console.log('❌ 角色不匹配，重定向到登入頁');
    return <Navigate to="/" replace />;
  }
  
  return children;
}

export default PrivateRoute;

