import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  BookOpenIcon,
  UserGroupIcon,
  BuildingLibraryIcon,
  ClockIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  CalendarIcon,
  ArrowLeftOnRectangleIcon,
  DocumentArrowUpIcon, // ✅ add this import
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';

const adminNav = [
  { name: 'Dashboard', to: '/dashboard/admin', icon: HomeIcon },
  { name: 'Courses', to: '/dashboard/admin/courses', icon: BookOpenIcon },
  { name: 'Faculty', to: '/dashboard/admin/faculty', icon: UserGroupIcon },
  { name: 'Classrooms', to: '/dashboard/admin/classrooms', icon: BuildingLibraryIcon },
  { name: 'Student Groups', to: '/dashboard/admin/groups', icon: AcademicCapIcon },
  { name: 'Constraints', to: '/dashboard/admin/constraints', icon: Cog6ToothIcon },
  { name: 'Generate', to: '/dashboard/admin/generate', icon: ClockIcon },
  { name: 'Timetables', to: '/dashboard/admin/timetables', icon: CalendarIcon },
  { name: 'Import Data', to: '/dashboard/admin/import', icon: DocumentArrowUpIcon },
];

const facultyNav = [
  { name: 'Dashboard', to: '/dashboard/faculty', icon: HomeIcon },
  { name: 'My Preferences', to: '/dashboard/faculty/preferences', icon: CalendarIcon },
  { name: 'My Timetable', to: '/dashboard/faculty/timetable', icon: BookOpenIcon },
];

const studentNav = [
  { name: 'Dashboard', to: '/dashboard/student', icon: HomeIcon },
  { name: 'My Timetable', to: '/dashboard/student/timetable', icon: BookOpenIcon },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigation = user?.role === 'admin' ? adminNav : user?.role === 'faculty' ? facultyNav : studentNav;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      <div className="w-64 bg-gray-900/90 backdrop-blur-md border-r border-white/10 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            AutoSched
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-2">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.fullName?.[0] || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.fullName || 'User'}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={isLoggingOut}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 hover:text-red-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <div className="w-5 h-5 mr-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
                Logout
              </>
            )}
          </button>
        </div>
      </div>

      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Confirm Logout">
        <div className="py-4">
          <p className="text-gray-300">Are you sure you want to logout?</p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowLogoutModal(false)}
            className="px-4 py-2 border border-white/10 rounded-md text-gray-300 hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isLoggingOut ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging out...
              </>
            ) : (
              'Logout'
            )}
          </button>
        </div>
      </Modal>
    </>
  );
}