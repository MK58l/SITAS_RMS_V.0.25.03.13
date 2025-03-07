import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, Home, User, LogOut, LogIn, UtensilsCrossed, ChevronDown } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { toast } from 'react-hot-toast';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      // Show success toast message
      toast.success('Logged out successfully!');
      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      // Show error toast message
      toast.error('Failed to log out. Please try again.');
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Check if the current route is /login or /register
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Render only the ThemeToggle on /login and /register pages
  if (isAuthPage) {
    return (
      <div className="fixed top-0 right-0 p-4 z-50">
        <ThemeToggle />
      </div>
    );
  }

  // Render the full navbar for other pages
  return (
    <nav className="fixed top-0 left-0 w-full bg-white dark:bg-gray-800 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left Side: Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <UtensilsCrossed className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-bold text-gray-800 dark:text-white">RestaurantApp</span>
            </Link>
          </div>

          {/* Right Side: Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-200"
            >
              <Home className="h-5 w-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              to="/menu"
              className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-200"
            >
              <Menu className="h-5 w-5" />
              <span className="hidden sm:inline">Menu</span>
            </Link>

            {/* Conditional Rendering for Authenticated Users */}
            {isAuthenticated ? (
              <>
                {/* Dashboard Link (Visible only for Admin) */}
                {user?.user_metadata?.role === 'admin' && (
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-200"
                  >
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                )}

                {/* User Dropdown Toggle */}
                <div className="relative">
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition duration-200"
                  >
                    <User className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {user?.user_metadata?.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {user?.user_metadata?.role}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition duration-200"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Login Link for Unauthenticated Users
              <Link
                to="/login"
                className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-200"
              >
                <LogIn className="h-5 w-5" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;