'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Language, translations } from '@/app/lib/i18n/translations';

interface TimeSlotsProps {
  slots: string[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  isLoading: boolean;
  language?: Language;
}

export default function TimeSlots({ slots, selectedTime, onSelectTime, isLoading, language = 'en' }: TimeSlotsProps) {
  const t = translations[language];
  const isRTL = language === 'he' || language === 'ar';

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-12 skeleton rounded-xl" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-primary text-[15px] font-medium mb-1">{t.noAvailableTimes}</p>
        <p className="text-secondary text-[13px]">{t.tryAnotherDate}</p>
      </div>
    );
  }

  // Group by period
  const morning = slots.filter(t => parseInt(t.split(':')[0]) < 12);
  const afternoon = slots.filter(t => {
    const hour = parseInt(t.split(':')[0]);
    return hour >= 12 && hour < 17;
  });
  const evening = slots.filter(t => parseInt(t.split(':')[0]) >= 17);

  const renderPeriod = (title: string, times: string[], startDelay: number) => {
    if (times.length === 0) return null;
    
    return (
      <div className="mb-5 last:mb-0">
        {/* Period label - centered with lines on both sides */}
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="flex-1 h-[1px]"
            style={{ backgroundColor: 'rgb(var(--accent-200))' }}
          />
          <span 
            className="text-[11px] font-bold uppercase tracking-wider flex-shrink-0"
            style={{ color: 'rgb(var(--accent-500))' }}
          >
            {title}
          </span>
          <div 
            className="flex-1 h-[1px]"
            style={{ backgroundColor: 'rgb(var(--accent-200))' }}
          />
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-4 gap-2">
          {times.map((time, index) => {
            const isSelected = selectedTime === time;

            return (
            <motion.button
              key={time}
                initial={false}
              onClick={() => onSelectTime(time)}
                whileTap={{ scale: 0.95 }}
              className={`
                  relative h-12 rounded-xl text-[14px] font-semibold tabular-nums
                  transition-all duration-200 animate-cardEntrance
                  ${isSelected 
                    ? 'text-white shadow-lg' 
                    : 'text-primary'
                  }
                `}
                style={{
                  backgroundColor: isSelected 
                    ? 'rgb(var(--accent-500))' 
                    : 'rgb(var(--bg-card))',
                  border: isSelected 
                    ? 'none'
                    : '1px solid rgb(var(--accent-200))',
                  boxShadow: isSelected 
                    ? '0 4px 12px rgb(var(--accent-500) / 0.3)'
                    : 'none',
                  animationDelay: `${index * 30}ms`
                }}
            >
              {time}

                {/* Checkmark badge */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} w-[18px] h-[18px] rounded-full flex items-center justify-center`}
                      style={{ 
                        backgroundColor: 'rgb(var(--btn-bg))',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                      }}
                    >
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>
            </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="card p-4">
      {renderPeriod(t.morning, morning, 0)}
      {renderPeriod(t.afternoon, afternoon, 0.1)}
      {renderPeriod(t.evening, evening, 0.2)}
    </div>
  );
}
