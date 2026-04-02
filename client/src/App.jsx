import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Student from './pages/Student';
import Admin from './pages/Admin';
import Teacher from './pages/Teacher';
import ChangePassword from './pages/ChangePassword';
import PrivateRoute from './components/PrivateRoute';
import PasswordChangeNotice from './components/PasswordChangeNotice';

function PasswordGate({ children }) {
  const [showNotice, setShowNotice] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const mustChange = sessionStorage.getItem('mustChangePassword');
    console.log('[PasswordGate] mustChangePassword:', mustChange);
    if (mustChange === 'true') {
      setShowNotice(true);
    }
  }, [location.pathname]);

  const handlePasswordChanged = () => {
    sessionStorage.setItem('mustChangePassword', 'false');
    setShowNotice(false);
    // Reload to refresh all auth state
    window.location.reload();
  };

  if (showNotice) {
    return <PasswordChangeNotice onPasswordChanged={handlePasswordChanged} />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/change-password"
        element={
          <PrivateRoute role="any">
            <ChangePassword />
          </PrivateRoute>
        }
      />
      <Route
        path="/student"
        element={
          <PrivateRoute role="student">
            <Student />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute role="admin">
            <Admin />
          </PrivateRoute>
        }
      />
      <Route
        path="/teacher"
        element={
          <PrivateRoute role="teacher">
            <Teacher />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <PasswordGate>
        <AppRoutes />
      </PasswordGate>
    </Router>
  );
}

export default App;
