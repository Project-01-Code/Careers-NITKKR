import React from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars

const Stepper = ({ steps, currentStep, maxReachedStep, completedSteps, onStepClick }) => {
  return (
    <div className="relative">
      {/* Connector Line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100 -z-10" />

      <ul className="space-y-6">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = completedSteps?.has(stepNumber);
          const isReachable = stepNumber <= (maxReachedStep || 1);

          return (
            <li key={index} className="flex gap-4 group">
              <button
                type="button"
                onClick={() => isReachable && onStepClick?.(stepNumber)}
                disabled={!isReachable}
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold transition-all border-2
                  ${isActive
                    ? 'bg-primary border-primary text-white ring-4 ring-primary/10'
                    : isCompleted
                      ? 'bg-primary border-primary text-white'
                      : isReachable
                        ? 'bg-white border-primary/30 text-primary'
                        : 'bg-white border-gray-200 text-gray-400'
                  }
                  ${isReachable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                `}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined text-white text-[18px]">check</span>
                ) : (
                  stepNumber
                )}
              </button>

              <div
                className={`flex flex-col pt-1 ${isReachable ? 'cursor-pointer' : ''}`}
                onClick={() => isReachable && onStepClick?.(stepNumber)}
              >
                <span className={`text-sm font-semibold transition-colors hover:text-primary relative
                  ${isActive ? 'text-primary' : isReachable ? 'text-gray-900' : 'text-gray-400'}
                `}>
                  {label}
                  {isActive && (
                    <motion.div 
                      layoutId="stepper-underline"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Stepper;
