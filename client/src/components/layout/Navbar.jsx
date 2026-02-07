import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-[#1a0f0f]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-[#c21717] flex items-center justify-center text-white text-xl font-bold shadow-lg">
              N
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">NIT KKR</h1>
              <span className="text-[10px] font-bold text-[#c21717] uppercase tracking-wider mt-1">Careers</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[#c21717] transition-colors">Home</Link>
            <Link to="/jobs" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[#c21717] transition-colors">All Jobs</Link>
            <div className="flex items-center gap-3 ml-4">
              <button className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[#c21717]">Log In</button>
              <button className="bg-[#c21717] hover:bg-[#9a1212] text-white text-sm font-semibold py-2 px-6 rounded-full shadow-md transition-all active:scale-95">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;