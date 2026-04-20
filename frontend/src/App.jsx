import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Courses from './pages/admin/Courses';
import Faculty from './pages/admin/Faculty';
import Classrooms from './pages/admin/Classrooms';
import Groups from './pages/admin/Groups';
import Constraints from './pages/admin/Constraints';
import Generate from './pages/admin/Generate';
import Timetables from './pages/admin/Timetables';
import Import from './pages/admin/Import';

// Faculty Pages
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyPreferences from './pages/faculty/Preferences';
import FacultyTimetable from './pages/faculty/Timetable';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentTimetable from './pages/student/Timetable';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'admin':
      return <Navigate to="admin" replace />;
    case 'faculty':
      return <Navigate to="faculty" replace />;
    case 'student':
      return <Navigate to="student" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

function App() {
  return (
    <Routes>
      {/* Public Routes – at top level */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Dashboard Layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardRedirect />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/courses" element={<Courses />} />
        <Route path="admin/faculty" element={<Faculty />} />
        <Route path="admin/classrooms" element={<Classrooms />} />
        <Route path="admin/groups" element={<Groups />} />
        <Route path="admin/constraints" element={<Constraints />} />
        <Route path="admin/generate" element={<Generate />} />
        <Route path="admin/timetables" element={<Timetables />} />
        <Route path="admin/import" element={<Import />} />


        <Route path="faculty" element={<FacultyDashboard />} />
        <Route path="faculty/preferences" element={<FacultyPreferences />} />
        <Route path="faculty/timetable" element={<FacultyTimetable />} />

        <Route path="student" element={<StudentDashboard />} />
        <Route path="student/timetable" element={<StudentTimetable />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;