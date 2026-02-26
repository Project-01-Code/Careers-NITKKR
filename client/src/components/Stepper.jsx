import React from 'react';
import { motion } from 'framer-motion';

const Stepper = ({ steps, currentStep }) => {
  return (
    <div className="w-full">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        <ul className="relative space-y-6">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep - 1;
            const isCurrent = index === currentStep - 1;
            
            return (
              <li key={index} className="flex items-start group">
                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-300 bg-white ${
                  isCompleted 
                    ? 'border-primary bg-primary text-white' 
                    : isCurrent 
                      ? 'border-primary text-primary' 
                      : 'border-gray-200 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                
                <div className="ml-4 pt-1">
                  <h4 className={`text-sm font-bold transition-colors duration-300 ${
                    isCurrent ? 'text-primary' : isCompleted ? 'text-gray-800' : 'text-gray-400'
                  }`}>
                    {step}
                  </h4>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Stepper;
