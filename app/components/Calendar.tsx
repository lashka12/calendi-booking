'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  isBefore,
  startOfDay,
  getMonth,
  getYear,
} from 'date-fns';
import { Language, translations } from '@/app/lib/i18n/translations';

interface CalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
  language?: Language;
}

export default function Calendar({ selectedDate, onSelectDate, minDate, language = 'en' }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  
  const isRTL = language === 'he' || language === 'ar';
  const t = translations[language];
  const weekdays = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];
  
  // Month names from translations
  const monthNames = [
    t.january, t.february, t.march, t.april, t.may, t.june,
    t.july, t.august, t.september, t.october, t.november, t.december
  ];
  
  const getMonthYearDisplay = () => {
    const month = monthNames[getMonth(currentMonth)];
    const year = getYear(currentMonth);
    return `${month} ${year}`;
  };

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const daysArray = eachDayOfInterval({ start, end });
    const startDayOfWeek = start.getDay();
    const paddingDays = Array(startDayOfWeek).fill(null);
    return [...paddingDays, ...daysArray];
  }, [currentMonth]);

  // Trigger animation on mount
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, []);

  const goToPreviousMonth = () => {
    setDirection(-1);
    setCurrentMonth(subMonths(currentMonth, 1));
    setAnimationKey(prev => prev + 1);
  };

  const goToNextMonth = () => {
    setDirection(1);
    setCurrentMonth(addMonths(currentMonth, 1));
    setAnimationKey(prev => prev + 1);
  };

  const isPastDate = (date: Date) => {
    if (!date) return false;
    const today = startOfDay(new Date());
    return isBefore(date, today) || (minDate && isBefore(date, startOfDay(minDate)));
  };

  const isDateDisabled = (date: Date) => {
    if (!date) return true;
    if (isPastDate(date)) return true;
    return false;
  };

  const canGoPrevious = !isBefore(subMonths(currentMonth, 1), startOfMonth(new Date()));

  // Calculate row and column for stagger effect
  const getDelay = (index: number) => {
    const row = Math.floor(index / 7);
    const col = index % 7;
    // Diagonal wave effect
    return (row + col) * 0.03;
  };

  return (
    <div className="card p-4 sm:p-6">
      {/* Header - always LTR layout, arrows point in navigation direction */}
      <div className="flex items-center justify-between mb-5 sm:mb-6" dir="ltr">
        {/* Previous month - always on left, arrow points left */}
        <motion.button
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:bg-accent-light disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight className="w-6 h-6 text-secondary rotate-180" />
        </motion.button>
        
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`${getMonth(currentMonth)}-${getYear(currentMonth)}`}
            initial={{ opacity: 0, y: direction > 0 ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction > 0 ? -10 : 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-[16px] sm:text-[18px] font-semibold text-primary"
          >
            {getMonthYearDisplay()}
          </motion.span>
        </AnimatePresence>
        
        {/* Next month - always on right, arrow points right */}
        <motion.button
          onClick={goToNextMonth}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:bg-accent-light"
        >
          <ChevronRight className="w-6 h-6 text-secondary" />
        </motion.button>
      </div>

      {/* Weekdays - same order regardless of language */}
      <div className="grid grid-cols-7 mb-3">
        {weekdays.map((day, i) => (
          <motion.div
            key={`${day}-${i}-${animationKey}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.3,
              delay: i * 0.04,
              ease: "easeOut"
            }}
            className="text-center text-[11px] sm:text-[12px] font-semibold text-secondary py-2 uppercase tracking-wide"
          >
            {day}
          </motion.div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1.5 sm:gap-y-2">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const isDisabled = isDateDisabled(day);
          const isPast = isPastDate(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const delay = getDelay(index);

          return (
            <motion.button
              key={`${day.toISOString()}-${animationKey}`}
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                duration: 0.3,
                delay: delay,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              onClick={() => !isDisabled && onSelectDate(day)}
              disabled={isDisabled}
              whileHover={!isDisabled ? { scale: 1.1, transition: { duration: 0.15 } } : {}}
              whileTap={!isDisabled ? { scale: 0.9 } : {}}
              className={`
                aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center text-[14px] sm:text-[16px]
                transition-colors duration-150
                ${isDisabled 
                  ? 'cursor-not-allowed pointer-events-none' 
                  : ''
                }
                ${isSelected 
                  ? 'bg-accent-solid text-white shadow-lg font-medium' 
                  : isTodayDate
                    ? 'text-accent font-semibold bg-accent-light'
                    : isDisabled
                      ? 'text-secondary'
                      : 'text-primary hover:bg-accent-light font-medium'
                }
              `}
              style={isPast && !isSelected ? { color: 'rgb(var(--text-secondary) / 0.35)' } : undefined}
            >
              {day.getDate()}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
