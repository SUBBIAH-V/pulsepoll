import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SpaceBackground } from './components/SpaceBackground';

import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { CreatePoll } from './pages/CreatePoll';
import { PollView } from './pages/PollView';
import { PollAnalytics } from './pages/PollAnalytics';
import { PollHistory } from './pages/PollHistory';
import { Contact } from './pages/Contact';
import { NotFound } from './pages/NotFound';

export const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-[#0B0B0B] text-[#F5F3EE] relative overflow-hidden font-sans selection:bg-[#C62828] selection:text-[#F5F3EE]">
            {/* Dark Industrial Grid Canvas */}
            <SpaceBackground />
            
            <div className="relative z-10 flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/poll/:id" element={<PollView />} />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <PollHistory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/create-poll"
                    element={
                      <ProtectedRoute>
                        <CreatePoll />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/poll/:id/analytics"
                    element={
                      <ProtectedRoute>
                        <PollAnalytics />
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
