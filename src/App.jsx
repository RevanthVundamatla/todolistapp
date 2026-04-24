import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import TodoApp from './components/TodoApp';
import Hero from './components/Hero';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }
    setLoading(false);
  }, []);

  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userData = urlParams.get('user');
    
    if (token && userData && !user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', userData);
      setUser(JSON.parse(userData));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={
          !user ? (
            <>
              <Hero />
              <Login setUser={setUser} />
            </>
          ) : (
            <Navigate to="/app" />
          )
        } />
        <Route path="/app" element={
          user ? <TodoApp user={user} setUser={setUser} /> : <Navigate to="/" />
        } />
        <Route path="/auth-callback" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
