import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'Student':
        return '/dashboard/student';
      case 'Mentor':
        return '/dashboard/mentor';
      case 'Investor':
        return '/dashboard/investor';
      case 'Admin':
        return '/dashboard/admin';
      default:
        return '/';
    }
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl md:text-3xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
              ENGIVERSE
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/projects" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md transition-colors font-medium">
                  Explore Projects
                </Link>
                <Link to={getDashboardLink()} className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md transition-colors font-medium">
                  Dashboard
                </Link>
                <Link to="/profile" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md transition-colors font-medium">
                  Profile
                </Link>
                <span className="text-gray-700 px-3 py-2 text-sm">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md transition-colors font-medium">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setMenuOpen(!menuOpen)} 
              className="text-gray-700 hover:text-primary-600 p-2"
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 animate-fade-in">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link 
                  to="/projects" 
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Explore Projects
                </Link>
                <Link 
                  to={getDashboardLink()} 
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/profile" 
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                <div className="px-3 py-2 text-sm text-gray-500">
                  {user.email}
                </div>
                <button 
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }} 
                  className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link 
                  to="/login" 
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

