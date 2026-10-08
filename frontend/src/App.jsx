import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PaperDetails from './pages/PaperDetails';
import Chat from './pages/Chat';
import { authAPI } from './services/api';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('papermind_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('papermind_token');
    localStorage.removeItem('papermind_user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar user={user} onLogout={handleLogout} />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route
              path="/"
              element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
            />
            <Route
              path="/login"
              element={!user ? <Login onLoginSuccess={setUser} /> : <Navigate to="/dashboard" replace />}
            />
            <Route
              path="/register"
              element={!user ? <Register /> : <Navigate to="/dashboard" replace />}
            />
            <Route
              path="/dashboard"
              element={user ? <Dashboard /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/papers/:id"
              element={user ? <PaperDetails /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/chat"
              element={user ? <Chat /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
