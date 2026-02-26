import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-secondary text-white pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Column 1: Institute Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-sm">
                N
              </div>
              <span className="font-bold text-lg">NIT Kurukshetra</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              National Institute of Technology Kurukshetra,<br />
              Kurukshetra, Haryana, India - 136119
            </p>
            <div className="pt-2">
              <p className="text-sm text-gray-400">Phone: +91-1744-233208</p>
              <p className="text-sm text-gray-400">Email: registrar@nitkkr.ac.in</p>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-6 text-gray-100">Quick Links</h3>
            <ul className="space-y-3">
              {['About Institute', 'Academic Departments', 'Research', 'Faculty Directory', 'Tenders'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h3 className="font-semibold text-lg mb-6 text-gray-100">Support</h3>
            <ul className="space-y-3">
              {['Help Center', 'Effectiveness', 'Privacy Policy', 'Terms of Service', 'Contact Us'].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Subscribe */}
          <div>
            <h3 className="font-semibold text-lg mb-6 text-gray-100">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to get notifications about new faculty openings.
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 rounded bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded font-medium text-sm transition-colors shadow-lg shadow-primary/20"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} NIT Kurukshetra. All rights reserved.
          </p>
          <div className="flex gap-4">
            {/* Social Icons Placeholders */}
            <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary transition-colors flex items-center justify-center cursor-pointer text-gray-400 hover:text-white">
              <span className="material-symbols-outlined text-sm">public</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary transition-colors flex items-center justify-center cursor-pointer text-gray-400 hover:text-white">
              <span className="material-symbols-outlined text-sm">share</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary transition-colors flex items-center justify-center cursor-pointer text-gray-400 hover:text-white">
              <span className="material-symbols-outlined text-sm">mail</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
