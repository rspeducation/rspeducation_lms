import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, userType, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const getDashboardPath = () => {
    return userType === 'admin' ? '/admin/dashboard' : '/student/dashboard';
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-azure transition-colors focus:outline-none"
      >
        <div className="w-8 h-8 bg-azure text-white rounded-full flex items-center justify-center text-sm font-medium">
          {getUserInitials()}
        </div>
        <span className="hidden md:block text-sm font-medium">{user.name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              {user.course && (
                <p className="text-xs text-gray-400 mt-1">
                  {user.course} • {user.batch}
                </p>
              )}
            </div>

            {/* Navigation Links */}
            <Link
              to={getDashboardPath()}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-azure transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-4 w-4 mr-3" />
              Dashboard
            </Link>

            {userType === 'admin' && (
              <>
                <Link
                  to="/admin/students"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-azure transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="h-4 w-4 mr-3" />
                  Manage Students
                </Link>
                <Link
                  to="/admin/content"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-azure transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Course Content
                </Link>
              </>
            )}

            {userType === 'student' && (
              <>
                <Link
                  to="/student/courses"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-azure transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  My Courses
                </Link>
                <Link
                  to="/student/ResumeBuilder"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-azure transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Resume Templates
                </Link>
              </>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
