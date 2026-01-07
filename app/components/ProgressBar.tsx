'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-1.5">
      {[...Array(totalSteps)].map((_, i) => (
        <motion.div
          key={i}
          className="h-1 rounded-full transition-colors duration-300"
          style={{ backgroundColor: i < currentStep ? 'rgb(var(--accent-500))' : 'rgb(var(--accent-200))' }}
          initial={false}
          animate={{ width: i === currentStep - 1 ? 24 : 8 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        />
      ))}
    </div>
  );
}
