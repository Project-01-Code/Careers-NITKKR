import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    toast.success('Thank you! You will be notified about new openings.');
    setEmail('');
  };

  return (
    <footer className="bg-secondary text-white pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Institute Info */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <img src="/logoforppt.png" alt="NIT Kurukshetra Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-bold text-lg block leading-tight">NIT Kurukshetra</span>
                <span className="text-xs text-gray-400">Recruitment Portal</span>
              </div>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              National Institute of Technology Kurukshetra. An Institute of National Importance under Ministry of Education, Govt. of India.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://nitkkr.ac.in" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all group">
                <span className="material-symbols-outlined text-gray-400 group-hover:text-white transition-colors">public</span>
              </a>
              <a href="mailto:recruitment@nitkkr.ac.in" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all group">
                <span className="material-symbols-outlined text-gray-400 group-hover:text-white transition-colors">mail</span>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-bold mb-6 text-white uppercase tracking-widest text-xs">Quick Links</h4>
            <ul className="space-y-4">
              <li><a href="https://nitkkr.ac.in/?page_id=237" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">About Institute</a></li>
              <li><Link to="/jobs" className="text-gray-400 hover:text-white text-sm transition-colors">Active Openings</Link></li>
              <li><Link to="/notices" className="text-gray-400 hover:text-white text-sm transition-colors">Recruitment Notices</Link></li>
              <li><a href="https://nitkkr.ac.in/?page_id=648" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">Contact Administration</a></li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h3 className="font-semibold text-lg mb-6 text-gray-100">Support</h3>
            <ul className="space-y-3">
              <li><Link to="/help" className="text-gray-400 hover:text-white text-sm transition-colors">Help Center</Link></li>
              <li><Link to="/notices" className="text-gray-400 hover:text-white text-sm transition-colors">Notices</Link></li>
              <li><Link to="/jobs" className="text-gray-400 hover:text-white text-sm transition-colors">Current Openings</Link></li>
              <li><a href="mailto:recruitment@nitkkr.ac.in" className="text-gray-400 hover:text-white text-sm transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Column 4: Subscribe */}
          <div>
            <h3 className="font-semibold text-lg mb-6 text-gray-100">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to get notifications about new faculty openings.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
