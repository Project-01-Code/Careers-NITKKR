import React, { useRef } from 'react';

/**
 * A modern, individual-box OTP input component.
 * @param {string} value  - The current 6-digit OTP value
 * @param {Function} onChange - Callback receiving the updated 6-digit string
 */
const OtpInput = ({ value = '', onChange }) => {
  const inputRefs = useRef([]);

  // Ensure digits array is always 6 elements
  const digits = value.split('').slice(0, 6);
  while (digits.length < 6) digits.push('');

  const handleChange = (e, index) => {
    const char = e.target.value.slice(-1); // Only take the last character
    if (!/^\d*$/.test(char)) return; // Only allow digits

    const newDigits = [...digits];
    newDigits[index] = char;
    const newValue = newDigits.join('');
    onChange(newValue);

    // If entered a digit, move to next box
    if (char && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // If box is empty, move to previous box and clear it
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[index - 1].focus();
      } else if (digits[index]) {
        // If box has digit, just clear it
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    
    onChange(pastedData.padEnd(6, ''));
    
    // Focus the next empty box or the last one
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex].focus();
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={digit}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="w-10 h-12 sm:w-12 sm:h-14 bg-gray-50 border border-gray-200 rounded-xl text-center text-xl font-bold text-secondary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
        />
      ))}
    </div>
  );
};

export default OtpInput;
