import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[400px] z-[9999]"
        >
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 overflow-hidden relative group">
            {/* Subtle Gradient Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
            
            <div className="relative space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-2xl">cookie</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-secondary tracking-tight">Cookie Notice</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Privacy & Experience</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                We use cookies to enhance your experience, analyze site traffic, and personalize content. By clicking "Accept", you agree to our use of cookies.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleAccept}
                  className="flex-1 bg-secondary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-secondary/10 active:scale-[0.98]"
                >
                  Accept All
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="px-6 py-4 bg-gray-100 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all hover:text-gray-600"
                >
                  Decline
                </button>
              </div>
              
              <p className="text-[9px] text-gray-400 font-medium text-center">
                Read our <a href="#" className="text-primary hover:underline font-bold">Privacy Policy</a> to learn more.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
