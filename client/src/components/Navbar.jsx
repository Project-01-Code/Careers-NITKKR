import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const close = () => setDropdownOpen(false);
    if (dropdownOpen) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navLinks = ['Home', 'Jobs', 'Notices', 'Help'];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-md py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10">
            <img src="https://nitkkr.ac.in/wp-content/uploads/2023/09/cropped-nitlogo-1-e1711375918194.png" alt="Logo" />
          </div>
          <div className="flex flex-col">
            <span className={`font-bold text-lg leading-tight transition-colors ${scrolled ? 'text-secondary' : 'text-gray-900'}`}>
              NIT Kurukshetra
            </span>
            <span className={`text-xs font-medium tracking-wide ${scrolled ? 'text-gray-600' : 'text-gray-700'}`}>
              Faculty Recruitment
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((item) => (
            <Link
              key={item}
              to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                scrolled ? 'text-secondary' : 'text-gray-800'
              }`}
            >
              {item}
            </Link>
          ))}
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
                className="flex items-center gap-2 group"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-primary/30 transition-shadow">
                  {user.profile?.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                </div>
                <span className={`hidden sm:block text-sm font-medium transition-colors ${scrolled ? 'text-secondary' : 'text-gray-800'}`}>
                  {user.profile?.firstName || user.email?.split('@')[0]}
                </span>
                <span className={`material-symbols-outlined text-lg transition-transform ${dropdownOpen ? 'rotate-180' : ''} ${scrolled ? 'text-gray-600' : 'text-gray-700'}`}>
                  expand_more
                </span>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-60"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-secondary truncate">{user.email}</p>
                      <p className="text-xs text-gray-400 capitalize">{user.role?.replace('_', ' ')}</p>
                    </div>

                    <div className="py-1">
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-lg">person</span>
                        My Profile
                      </Link>

                      {isAdmin && (
                        <Link to="/admin/jobs" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                          Admin Panel
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className={`text-sm font-medium hover:text-primary transition-colors hidden sm:block ${
                  scrolled ? 'text-secondary' : 'text-gray-800'
                }`}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 shadow-lg overflow-hidden"
          >
            <div className="container mx-auto px-6 py-4 space-y-2">
              {navLinks.map((item) => (
                <Link
                  key={item}
                  to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
                >
                  {item}
                </Link>
              ))}
              {!user && (
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-secondary hover:text-primary">
                    Log In
                  </Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)} className="block bg-primary text-white text-center py-2 rounded-lg text-sm font-medium">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
