import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Cloud } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ProfileDropdown from './ProfileDropdown';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, userType } = useAuth();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Courses', path: '/courses' },
    // { name: 'Placements', path: '/placements' },
    { name: 'Contact', path: '/contact' },
    { name: 'FAQ', path: '/faq' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const getLoginText = () => {
    return userType === 'admin' ? 'Admin Login' : 'Student Login';
  };

  const getLoginPath = () => {
    return userType === 'admin' ? '/admin/login' : '/login';
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row with logo, desktop nav, toggle+profile on mobile */}
        <div className="flex justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img src="./rapeducation.png" alt="RSP Education" className="h-10 w-10" />
              <div>
                <span className="text-xl font-bold text-azure">RSP Education</span>
                <p className="text-xs text-gray-600">Learn Toaday, Lead Tomorrow</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`px-2 py-2 rounded-md text-sm font-medium transition-colors ${isActive(item.path)
                  ? 'text-azure bg-azure-gradient-light'
                  : 'text-gray-700 hover:text-azure hover:bg-gray-50'
                  }`}
              >
                {item.name}
              </Link>
            ))}
            {/* Desktop: Show profile dropdown or login */}
            {isAuthenticated ? (
              <ProfileDropdown />
            ) : (
              <Link
                to={getLoginPath()}
                className="text-white px-4 py-2 rounded-md transition-colors"
                style={{ backgroundColor: '#F97923' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E06A1F'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F97923'}
              >
                {getLoginText()}
              </Link>
            )}
          </div>

          {/* Mobile: Toggle + profile/login side-by-side */}
          <div className="md:hidden flex items-center space-x-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-azure"
              aria-label="Toggle navigation"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            {isAuthenticated ? (
              <ProfileDropdown />
            ) : (
              <Link
                to={getLoginPath()}
                className="text-white px-3 py-2 rounded-md transition-colors text-sm"
                style={{ backgroundColor: '#F97923' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E06A1F'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F97923'}
              >
                {getLoginText()}
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isActive(item.path)
                    ? 'text-azure bg-azure-gradient-light'
                    : 'text-gray-700 hover:text-azure hover:bg-gray-50'
                    }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {/* ProfileDropdown/login IS NOT duplicated here */}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
