import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#212331] text-white py-12 border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-10">
          {/* Column 1: Institute Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-white flex items-center justify-center text-[#212331] font-extrabold text-xl">N</div>
              <div>
                <span className="block text-lg font-bold tracking-tight">NIT Kurukshetra</span>
                <span className="text-xs text-gray-400 uppercase tracking-widest">Recruitment Cell</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              An Institution of National Importance under Ministry of Education, Govt. of India.
            </p>
          </div>

          {/* Column 2: Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-[#c21717] transition-colors">About Institute</a></li>
              <li><a href="#" className="hover:text-[#c21717] transition-colors">Departments</a></li>
              <li><a href="#" className="hover:text-[#c21717] transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-[#c21717] transition-colors">Help Desk</a></li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Contact Info</h4>
            <p className="text-sm text-gray-300">Kurukshetra, Haryana, India - 136119</p>
            <p className="text-sm text-gray-300 mt-2">Phone: +91-1744-233208</p>
            <p className="text-sm text-[#c21717] font-bold mt-2">recruitment@nitkkr.ac.in</p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center md:flex md:justify-between items-center">
          <p className="text-xs text-gray-500 font-medium">
            © 2024 National Institute of Technology, Kurukshetra. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0 justify-center">
            <a href="#" className="text-xs text-gray-500 hover:text-white">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-500 hover:text-white">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;