'use client';

import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { motion } from 'framer-motion';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
}

export default function OTPInput({ length = 4, onComplete, disabled }: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const onCompleteRef = useRef(onComplete);
  
  onCompleteRef.current = onComplete;

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    const code = values.join('');
    if (code.length === length && values.every(v => v !== '') && !hasSubmitted) {
      setHasSubmitted(true);
      onCompleteRef.current(code);
    }
  }, [values, length, hasSubmitted]);

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!values[index] && index > 0) {
        const newValues = [...values];
        newValues[index - 1] = '';
        setValues(newValues);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newValues = [...values];
        newValues[index] = '';
        setValues(newValues);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    
    if (pastedData) {
      const newValues = Array(length).fill('');
      pastedData.split('').forEach((char, index) => {
        if (index < length) newValues[index] = char;
      });
      setValues(newValues);
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2.5 sm:gap-4" dir="ltr">
      {values.map((value, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="relative"
        >
          <input
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(-1)}
            disabled={disabled}
            className={`
              w-14 h-16 sm:w-16 sm:h-20 text-center text-2xl sm:text-3xl font-bold rounded-xl sm:rounded-2xl
              transition-all duration-200 outline-none
              ${disabled ? 'opacity-40 pointer-events-none' : ''}
              ${value 
                ? 'bg-accent-solid text-white border-2' 
                : focusedIndex === index
                  ? 'border-2 shadow-lg text-primary'
                  : 'bg-accent-light border-2 border-transparent text-primary'
              }
            `}
            style={value 
              ? { borderColor: 'rgb(var(--accent-500))' } 
              : focusedIndex === index 
                ? { 
                    backgroundColor: 'rgb(var(--bg-card))',
                    borderColor: 'rgb(var(--accent-500))', 
                    boxShadow: '0 10px 25px -5px rgb(var(--accent-500) / 0.2)' 
                  } 
                : {}
            }
          />
          
          {/* Focus indicator dot */}
          {focusedIndex === index && !value && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-accent-solid rounded-full"
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}
