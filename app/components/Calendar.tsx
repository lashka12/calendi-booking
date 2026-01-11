'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, RefreshCw } from 'lucide-react';
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
  format,
} from 'date-fns';
import { Language, translations } from '@/app/lib/i18n/translations';

interface CalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
  language?: Language;
  // New props for available dates feature
  availableDates?: string[]; // Array of "YYYY-MM-DD" strings
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  onMonthChange?: (startDate: string, endDate: string) => void;
}

export default function Calendar({ 
  selectedDate, 
  onSelectDate, 
  minDate, 
  language = 'en',
  availableDates,
  isLoading = false,
  hasError = false,
  onRetry,
  onMonthChange,
}: CalendarProps) {
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

  // Notify parent when month changes
  const notifyMonthChange = (newMonth: Date) => {
    if (onMonthChange) {
      const start = format(startOfMonth(newMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(newMonth), 'yyyy-MM-dd');
      onMonthChange(start, end);
    }
  };

  const goToPreviousMonth = () => {
    setDirection(-1);
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    setAnimationKey(prev => prev + 1);
    notifyMonthChange(newMonth);
  };

  const goToNextMonth = () => {
    setDirection(1);
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    setAnimationKey(prev => prev + 1);
    notifyMonthChange(newMonth);
  };

  const isPastDate = (date: Date) => {
    if (!date) return false;
    const today = startOfDay(new Date());
    return isBefore(date, today) || (minDate && isBefore(date, startOfDay(minDate)));
  };

  // Check if date is in availableDates array
  const isDateAvailable = (date: Date) => {
    if (!availableDates) return true; // If no availableDates provided, all dates are available
    const dateStr = format(date, 'yyyy-MM-dd');
    return availableDates.includes(dateStr);
  };

  const isDateDisabled = (date: Date) => {
    if (!date) return true;
    if (isPastDate(date)) return true;
    // If availableDates is provided, check if date is available
    if (availableDates && !isDateAvailable(date)) return true;
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

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="card p-4 sm:p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-5 sm:mb-6" dir="ltr">
          <div className="w-10 h-10 rounded-full skeleton" />
          <div className="h-5 w-32 skeleton rounded-lg" />
          <div className="w-10 h-10 rounded-full skeleton" />
        </div>

        {/* Weekdays skeleton */}
        <div className="grid grid-cols-7 mb-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex justify-center py-2">
              <div className="h-3 w-6 skeleton rounded" />
            </div>
          ))}
        </div>

        {/* Days skeleton - 6 rows x 7 cols */}
        <div className="grid grid-cols-7 gap-y-1.5 sm:gap-y-2">
          {[...Array(42)].map((_, i) => (
            <div key={i} className="aspect-square flex items-center justify-center">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl skeleton" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state with retry
  if (hasError) {
    return (
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'rgb(var(--accent-100))' }}
          >
            <RefreshCw className="w-6 h-6" style={{ color: 'rgb(var(--accent-500))' }} />
          </div>
          <p className="text-secondary text-[14px] text-center mb-4">
            {t.errorLoadingDates || 'Unable to load available dates'}
          </p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="px-5 py-2.5 rounded-xl text-[14px] font-medium transition-colors flex items-center gap-2"
              style={{ 
                backgroundColor: 'rgb(var(--accent-100))',
                color: 'rgb(var(--accent-700))'
              }}
            >
              <RefreshCw className="w-4 h-4" />
              {t.tryAgain || 'Try again'}
            </button>
          )}
        </div>
      </div>
    );
  }

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
            const isUnavailable = availableDates && !isDateAvailable(day) && !isPast;
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
                    : isTodayDate && !isUnavailable
                      ? 'text-accent font-semibold bg-accent-light'
                      : isDisabled
                        ? 'text-secondary'
                        : 'text-primary hover:bg-accent-light font-medium'
                  }
                `}
                style={(isPast || isUnavailable) && !isSelected ? { color: 'rgb(var(--text-secondary) / 0.35)' } : undefined}
              >
                {day.getDate()}
              </motion.button>
            );
          })}
      </div>
      
      {/* No available dates message */}
      {availableDates && availableDates.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-xl text-center"
          style={{ backgroundColor: 'rgb(var(--accent-50))' }}
        >
          <p className="text-[13px] text-secondary">
            {t.noAvailableDates || 'No available dates this month. Try next month.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
