import React from 'react';
import { motion } from 'framer-motion';

const CategoryCard = ({ title, icon, count, description, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-6 rounded-2xl cursor-pointer group h-full flex flex-col items-center text-center relative overflow-hidden"
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500 ease-out" />
      
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
        <span className="material-symbols-outlined text-3xl transition-transform duration-500 group-hover:rotate-12">
          {icon}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">
        {title}
      </h3>
      
      {count && (
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-3">
          {count} Openings
        </span>
      )}
      
      <p className="text-gray-500 text-sm leading-relaxed">
        {description}
      </p>
      
      <div className="mt-auto pt-4 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
        View Positions <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
      </div>
    </motion.div>
  );
};

export default CategoryCard;
