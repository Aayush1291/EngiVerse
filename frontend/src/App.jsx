import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Toast from './components/Toast.jsx';

// Pages
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ProfileSetup from './pages/ProfileSetup.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import MentorDashboard from './pages/MentorDashboard.jsx';
import InvestorDashboard from './pages/InvestorDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminProjects from './pages/AdminProjects.jsx';
import ExploreProjects from './pages/ExploreProjects.jsx';
import ProjectDetails from './pages/ProjectDetails.jsx';
import CreateProject from './pages/CreateProject.jsx';
import EditProject from './pages/EditProject.jsx';
import Profile from './pages/Profile.jsx';
import Error403 from './pages/Error403.jsx';
import Error404 from './pages/Error404.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ResendVerification from './pages/ResendVerification.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';

function App() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login showToast={showToast} />} />
            <Route path="/signup" element={<Signup showToast={showToast} />} />
            <Route path="/forgot-password" element={<ForgotPassword showToast={showToast} />} />
            <Route path="/verify-email" element={<VerifyEmail showToast={showToast} />} />
            <Route path="/resend-verification" element={<ResendVerification showToast={showToast} />} />
            <Route
              path="/profile-setup"
              element={
                <PrivateRoute>
                  <ProfileSetup showToast={showToast} />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/student"
              element={
                <PrivateRoute allowedRoles={['Student']}>
                  <StudentDashboard showToast={showToast} />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/mentor"
              element={
                <PrivateRoute allowedRoles={['Mentor']}>
                  <MentorDashboard showToast={showToast} />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/investor"
              element={
                <PrivateRoute allowedRoles={['Investor']}>
                  <InvestorDashboard showToast={showToast} />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <AdminDashboard showToast={showToast} />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/projects"
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <AdminProjects showToast={showToast} />
                </PrivateRoute>
              }
            />
            <Route path="/projects" element={<ExploreProjects showToast={showToast} />} />
            <Route path="/projects/:id" element={<ProjectDetails showToast={showToast} />} />
            <Route
              path="/projects/create"
              element={
                <PrivateRoute allowedRoles={['Student']}>
                  <CreateProject showToast={showToast} />
                </PrivateRoute>
              }
            />
            <Route
              path="/projects/:id/edit"
              element={
                <PrivateRoute>
                  <EditProject showToast={showToast} />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile showToast={showToast} />
                </PrivateRoute>
              }
            />
            <Route path="/403" element={<Error403 />} />
            <Route path="*" element={<Error404 />} />
          </Routes>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

