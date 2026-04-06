import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, role }) {
  const isLoggedIn = sessionStorage.getItem('isLoggedIn');
  const userRole = sessionStorage.getItem('userRole');
  
  console.log('[AUTH] PrivateRoute 檢查:', { isLoggedIn, userRole, requiredRole: role });
  
  if (!isLoggedIn || isLoggedIn !== 'true') {
    console.log('[PrivateRoute] Not logged in, redirect to login');
    return <Navigate to="/" replace />;
  }
  
  if (role && role !== 'any' && userRole !== role) {
    console.log('[PrivateRoute] Role mismatch, redirect to login');
    return <Navigate to="/" replace />;
  }
  
  return children;
}

export default PrivateRoute;

