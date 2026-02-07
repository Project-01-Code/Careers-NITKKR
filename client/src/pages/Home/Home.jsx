import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="font-display bg-gray-50 text-gray-900 antialiased overflow-x-hidden">
      
      {/* Hero Section */}
      <section className="relative w-full h-[500px] lg:h-[600px] overflow-hidden flex items-center">
        {/* Replacing with a high-quality placeholder or your local asset */}
        <img 
          alt="NIT KKR Architectural View" 
          className="absolute inset-0 w-full h-full object-cover transform scale-105" 
          src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1920&q=80"
        />
        <div className="absolute inset-0 bg-slate-900/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-90"></div>
        
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white mb-8 shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c21717]"></span>
              </span>
              <span className="text-xs font-bold tracking-widest uppercase">Faculty Recruitment 2024</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-none">
              Shape the Future of <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">Technical Education.</span>
            </h2>
            
            <p className="text-gray-200 text-lg md:text-xl font-light leading-relaxed max-w-xl mb-10 border-l-4 border-[#c21717] pl-6">
              Join NIT Kurukshetra, an institute of national importance. Discover a platform for groundbreaking research and academic excellence.
            </p>
            
            <Link 
              to="/jobs" 
              className="group bg-white text-gray-900 hover:bg-gray-50 font-bold py-4 px-8 rounded-md shadow-xl transition-all inline-flex items-center gap-3"
            >
              Explore Opportunities
              <span className="material-symbols-outlined text-xl group-hover:translate-y-1 transition-transform">arrow_downward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 -mt-10 relative z-20">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Side: Career Paths */}
          <div className="w-full lg:w-2/3 flex flex-col gap-10">
            <div className="flex flex-col gap-3">
              <h3 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-4">
                <span className="w-1.5 h-8 bg-[#c21717]"></span>
                Browse Career Paths
              </h3>
              <p className="text-gray-500 text-base pl-6">Select a domain to view current openings and eligibility criteria.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card - Teaching Faculty */}
              <Link to="/jobs" className="bg-white/95 backdrop-blur-md p-8 rounded-xl shadow-lg border border-gray-100 hover:scale-[1.02] transition-all group">
                <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-700 mb-6 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-3xl">school</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#c21717]">Teaching Faculty</h4>
                <p className="text-sm text-gray-500 mb-6 h-10">Professors, Associate Professors, and Assistant Professors.</p>
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-xs font-bold text-[#c21717] uppercase tracking-wider bg-red-50 px-2 py-1 rounded">12 Openings</span>
                  <span className="material-symbols-outlined text-gray-400">arrow_forward</span>
                </div>
              </Link>

              {/* Card - Research & Projects */}
              <Link to="/jobs" className="bg-white/95 backdrop-blur-md p-8 rounded-xl shadow-lg border border-gray-100 hover:scale-[1.02] transition-all group">
                <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-700 mb-6 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-3xl">biotech</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#c21717]">Research & Projects</h4>
                <p className="text-sm text-gray-500 mb-6 h-10">JRF, SRF, Project Associates, and Fellowships.</p>
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-xs font-bold text-[#c21717] uppercase tracking-wider bg-red-50 px-2 py-1 rounded">15 Openings</span>
                  <span className="material-symbols-outlined text-gray-400">arrow_forward</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Right Side: Notices Sidebar */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden sticky top-24">
              <div className="px-6 py-4 bg-[#c21717] flex justify-between items-center">
                <h3 className="font-bold text-white text-lg">Notices & Circulars</h3>
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
              </div>
              
              <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                {/* Notice Item */}
                <div className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex gap-4">
                    <div className="text-center min-w-[50px]">
                      <span className="block text-[10px] font-bold text-[#c21717] uppercase">Oct</span>
                      <span className="block text-2xl font-bold text-gray-800">25</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 hover:text-[#c21717]">Corrigendum regarding change in interview schedule</h4>
                      <button className="text-[11px] text-[#c21717] mt-1 flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-sm">picture_as_pdf</span> Download PDF
                      </button>
                    </div>
                  </div>
                </div>
                {/* End Notice Item */}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Home;