'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Check, AlertCircle, X } from 'lucide-react';
import { format } from 'date-fns';

import ProgressBar from '@/app/components/ProgressBar';
import ServiceCard from '@/app/components/ServiceCard';
import Calendar from '@/app/components/Calendar';
import TimeSlots from '@/app/components/TimeSlots';
import OTPInput from '@/app/components/OTPInput';
import { 
  Service, 
  getServices, 
  getAvailableTimeSlots, 
  sendOTP, 
  createBooking,
  getServiceName,
  OTPErrorCode
} from '@/app/lib/firebase/booking';
import { useLanguage } from '@/app/lib/i18n';
import { formatDateLocalized, formatDateShort, formatDateShortWithWeekday } from '@/app/lib/i18n/translations';

const TOTAL_STEPS = 5;

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] }
};

// Friendly error messages
function getFriendlyError(error: string): string {
  const lower = error.toLowerCase();
  if (lower.includes('too many') || lower.includes('rate limit')) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  if (lower.includes('invalid') && lower.includes('phone')) {
    return 'Please enter a valid phone number.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Connection error. Please check your internet.';
  }
  if (lower.includes('code') || lower.includes('otp') || lower.includes('verification')) {
    return 'Invalid code. Please try again.';
  }
  return error;
}

// Error Snackbar - Minimal bottom notification
function ErrorToast({ message, onClose, isRTL = false }: { message: string; onClose: () => void; isRTL?: boolean }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 80, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 80, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className="fixed bottom-6 inset-x-0 z-[100] flex justify-center px-4"
    >
      <div 
        className="flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-full shadow-xl"
        style={{
          backgroundColor: '#1f1f1f',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Red dot indicator */}
        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
        
        {/* Message */}
        <p className="text-[13px] text-white/90 max-w-[260px] truncate">{message}</p>
        
        {/* Dismiss */}
        <button 
          onClick={onClose} 
          className="ml-1 px-3 py-1 rounded-full text-[12px] font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          OK
        </button>
      </div>
    </motion.div>
  );
}

export default function BookingPage() {
  const { t, language, isRTL } = useLanguage();
  
  const [step, setStep] = useState(1);
  
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpErrorCode, setOtpErrorCode] = useState<OTPErrorCode | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [otpShake, setOtpShake] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Toast error state
  const [toastError, setToastError] = useState<string | null>(null);

  // Get service name in current language
  const langCode = language === 'he' ? 'he' : language === 'ar' ? 'ar' : 'en';
  const serviceName = selectedService ? getServiceName(selectedService, langCode) : '';

  // Load services (with ref to prevent double-call in StrictMode)
  const hasFetchedServices = useRef(false);
  useEffect(() => {
    if (hasFetchedServices.current) return;
    hasFetchedServices.current = true;
    
    (async () => {
      try {
        const data = await getServices();
        setServices(data.filter(s => s.active));
      } catch {
        setLoadError('Unable to load services');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load slots
  const serviceId = selectedService?.id;
  useEffect(() => {
    if (step !== 3 || !selectedDate || !serviceId) return;
    
    (async () => {
      setSlotsLoading(true);
      setSelectedTime(null);
      try {
        const data = await getAvailableTimeSlots(format(selectedDate, 'yyyy-MM-dd'), serviceId);
        setSlots(data);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    })();
  }, [step, selectedDate, serviceId]);

  // Countdown
  useEffect(() => {
    if (step !== 5 || canResend || countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [step, canResend, countdown]);

  useEffect(() => {
    if (countdown === 0) setCanResend(true);
  }, [countdown]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const canContinue = useCallback(() => {
    switch (step) {
      case 1: return !!selectedService;
      case 2: return !!selectedDate;
      case 3: return !!selectedTime;
      case 4: return name.trim().length > 0 && phone.length === 10 && phone.startsWith('05');
      default: return false;
    }
  }, [step, selectedService, selectedDate, selectedTime, name, phone]);

  const next = async () => {
    if (step === 4) {
      setOtpSending(true);
      setToastError(null);
      try {
        await sendOTP(phone);
        setStep(5);
        setCanResend(false);
        setCountdown(60);
      } catch (e: any) {
        const friendlyMsg = getFriendlyError(e.message || 'Failed to send code');
        setToastError(friendlyMsg);
      } finally {
        setOtpSending(false);
      }
    } else {
      setStep(s => s + 1);
    }
  };

  const back = () => {
    setStep(s => s - 1);
    setOtpError(null);
    setOtpErrorCode(null);
    setAttemptsLeft(null);
    setOtpShake(false);
    setOtpSuccess(false);
    setToastError(null);
    if (step === 3) setSelectedTime(null);
  };

  const resend = async () => {
    if (!canResend) return;
    setOtpSending(true);
    setOtpError(null);
    try {
      await sendOTP(phone);
      setCanResend(false);
      setCountdown(60);
    } catch (e: any) {
      const friendlyMsg = getFriendlyError(e.message || 'Failed to send code');
      setOtpError(friendlyMsg);
    } finally {
      setOtpSending(false);
    }
  };

  const triggerShake = () => {
    setOtpShake(true);
    setTimeout(() => setOtpShake(false), 500);
  };

  const verify = async (code: string) => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    setOtpVerifying(true);
    setOtpError(null);
    setOtpErrorCode(null);
    setAttemptsLeft(null);
    
    try {
      const result = await createBooking({
        serviceId: selectedService.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        clientName: name.trim(),
        phone: phone.trim(),
        code,
      });
      
      if (result.success) {
        // Show success state on OTP inputs
        setOtpVerifying(false);
        setOtpSuccess(true);
        // Delay transition to success page for visual feedback
        setTimeout(() => {
          setStep(6);
          setOtpSuccess(false);
        }, 1500);
        return;
      } else {
        // Handle OTP error responses
        setOtpErrorCode(result.code || null);
        setOtpError(result.error || 'Verification failed');
        
        if (result.attemptsLeft !== undefined) {
          setAttemptsLeft(result.attemptsLeft);
        }
        
        // Trigger shake animation for invalid code
        if (result.code === 'OTP_INVALID_CODE') {
          triggerShake();
        }
        
        // Auto-prompt for new code on certain errors
        if (result.code === 'OTP_NOT_FOUND' || result.code === 'OTP_EXPIRED' || result.code === 'OTP_TOO_MANY_ATTEMPTS') {
          setCanResend(true);
        }
      }
    } catch (e: any) {
      const friendlyMsg = getFriendlyError(e.message || 'Verification failed');
      setOtpError(friendlyMsg);
      triggerShake();
    } finally {
      setOtpVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-main">
      {/* Header - hidden on success page */}
      {step < 6 && (
        <header className="sticky top-0 z-50 backdrop-blur-lg" style={{ backgroundColor: 'rgb(var(--bg-main) / 0.9)' }}>
          <div className="max-w-lg mx-auto h-14 px-4 flex items-center justify-between" dir="ltr">
            {/* Left side - back button in LTR, empty in RTL */}
            {isRTL ? (
              <div className="w-10" />
            ) : (
              step > 1 ? (
                <button onClick={back} className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full active:bg-accent-light">
                  <ArrowLeft className="w-5 h-5 text-secondary" />
                </button>
              ) : <div className="w-10" />
            )}
            
            <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} labels={[]} />
            
            {/* Right side - empty in LTR, back button in RTL */}
            {isRTL ? (
              step > 1 ? (
                <button onClick={back} className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full active:bg-accent-light">
                  <ArrowLeft className="w-5 h-5 text-secondary rotate-180" />
                </button>
              ) : <div className="w-10" />
            ) : (
              <div className="w-10" />
            )}
          </div>
        </header>
      )}

      {/* Content */}
      <main className="max-w-lg mx-auto pb-28">
        <AnimatePresence mode="wait">
          {/* Step 1: Service */}
          {step === 1 && (
            <motion.div key="s1" {...pageTransition} className="px-4 pt-4">
              {/* Header */}
              <div className="mb-5 text-center">
                <motion.h1
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-[22px] sm:text-[26px] font-bold text-primary mb-1"
                >
                  {t('selectService')}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="text-[13px] sm:text-[14px] text-secondary"
                >
                  {t('whatToBook')}
                </motion.p>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="card p-4 rounded-[18px]">
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full skeleton flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 w-3/4 skeleton rounded-lg" />
                          <div className="h-3 w-1/2 skeleton rounded-lg" />
                          <div className="border-t border-accent-100 my-3" />
                          <div className="flex justify-between items-center">
                            <div className="h-3 w-16 skeleton rounded-lg" />
                            <div className="h-7 w-14 skeleton rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : loadError ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: 'rgb(var(--accent-100))' }}
                  >
                    <AlertCircle className="w-7 h-7" style={{ color: 'rgb(var(--accent-500))' }} />
                  </div>
                  <p className="text-secondary text-[14px] mb-4">{loadError}</p>
                  <button 
                    onClick={() => location.reload()} 
                    className="px-5 py-2.5 rounded-xl text-[14px] font-medium transition-colors"
                    style={{ 
                      backgroundColor: 'rgb(var(--accent-100))',
                      color: 'rgb(var(--accent-700))'
                    }}
                  >
                    {t('tryAgain')}
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {services.map((s, i) => (
                    <ServiceCard
                      key={s.id}
                      service={s}
                      isSelected={selectedService?.id === s.id}
                      onSelect={() => setSelectedService(s)}
                      index={i}
                      language={language}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Date */}
          {step === 2 && (
            <motion.div key="s2" {...pageTransition} className="px-4 pt-4">
              <div className="text-center mb-5 sm:mb-6">
                <h1 className="text-[20px] sm:text-[22px] md:text-[26px] font-bold text-primary mb-1">{t('chooseDate')}</h1>
                <p className="text-[13px] sm:text-[14px] text-secondary">{serviceName} · {selectedService?.duration} {t('minutes')}</p>
              </div>
              <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} minDate={new Date()} language={language} />
            </motion.div>
          )}

          {/* Step 3: Time */}
          {step === 3 && (
            <motion.div key="s3" {...pageTransition} className="px-4 pt-4">
              <div className="text-center mb-5 sm:mb-6">
                <h1 className="text-[20px] sm:text-[22px] md:text-[26px] font-bold text-primary mb-1">{t('pickTime')}</h1>
                <p className="text-[13px] sm:text-[14px] text-secondary">{selectedDate && formatDateLocalized(selectedDate, language)}</p>
              </div>
              <TimeSlots slots={slots} selectedTime={selectedTime} onSelectTime={setSelectedTime} isLoading={slotsLoading} language={language} />
            </motion.div>
          )}

          {/* Step 4: Details */}
          {step === 4 && (
            <motion.div key="s4" {...pageTransition} className="px-4 pt-4">
              {/* Header */}
              <div className="text-center mb-4">
                <h1 className="text-[22px] sm:text-[26px] font-bold text-primary mb-1">{t('almostThere')}</h1>
                <p className="text-[13px] text-secondary">{t('enterYourDetails')}</p>
              </div>

              {/* Compact Booking Summary - Inline */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" style={{ color: 'rgb(var(--accent-500))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[14px] font-semibold text-primary">
                    {selectedDate && formatDateShort(selectedDate, language)}
                  </span>
                </div>
                <div className="w-px h-4" style={{ backgroundColor: 'rgb(var(--accent-300))' }} />
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" style={{ color: 'rgb(var(--accent-500))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[14px] font-semibold text-primary">{selectedTime}</span>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4 px-4 sm:px-6">
                {/* Name Input */}
                <div>
                  <label className="block text-[11px] font-bold text-secondary uppercase tracking-wide mb-1.5">
                    {t('fullName')}
                  </label>
                  <div className="relative">
                    <div className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2`}>
                      <svg className="w-5 h-5" style={{ color: name ? 'rgb(var(--accent-500))' : 'rgb(var(--text-secondary))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={t('enterYourName')}
                      dir={isRTL ? 'rtl' : 'ltr'}
                      className={`w-full h-[46px] ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} text-[15px] rounded-xl transition-all duration-200 outline-none border`}
                      style={{ 
                        backgroundColor: 'rgb(var(--accent-50))',
                        color: 'rgb(var(--text-primary))',
                        borderColor: 'rgb(var(--accent-200))'
                      }}
                      onFocus={e => {
                        e.target.style.backgroundColor = 'rgb(var(--bg-card))';
                        e.target.style.boxShadow = '0 0 0 2px rgb(var(--accent-400))';
                        e.target.style.borderColor = 'rgb(var(--accent-400))';
                      }}
                      onBlur={e => {
                        e.target.style.backgroundColor = 'rgb(var(--accent-50))';
                        e.target.style.boxShadow = 'none';
                        e.target.style.borderColor = 'rgb(var(--accent-200))';
                      }}
                      autoComplete="name"
                    />
                  </div>
                </div>

                {/* Phone Input */}
                <div>
                  <label className="block text-[11px] font-bold text-secondary uppercase tracking-wide mb-1.5">
                    {t('whatsappNumber')}
                  </label>
                  <div className="relative">
                    <div className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2`}>
                      <svg className="w-5 h-5" style={{ color: phone ? 'rgb(var(--accent-500))' : 'rgb(var(--text-secondary))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      dir="ltr"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="05X XXX XXXX"
                      className={`w-full h-[46px] ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} text-[15px] tracking-wide rounded-xl transition-all duration-200 outline-none font-medium border`}
                      style={{ 
                        backgroundColor: 'rgb(var(--accent-50))',
                        color: 'rgb(var(--text-primary))',
                        borderColor: 'rgb(var(--accent-200))'
                      }}
                      onFocus={e => {
                        e.target.style.backgroundColor = 'rgb(var(--bg-card))';
                        e.target.style.boxShadow = '0 0 0 2px rgb(var(--accent-400))';
                        e.target.style.borderColor = 'rgb(var(--accent-400))';
                      }}
                      onBlur={e => {
                        e.target.style.backgroundColor = 'rgb(var(--accent-50))';
                        e.target.style.boxShadow = 'none';
                        e.target.style.borderColor = 'rgb(var(--accent-200))';
                      }}
                      autoComplete="tel"
                      maxLength={10}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-secondary flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgb(var(--accent-500))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>{t('verificationHint')}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: OTP */}
          {step === 5 && (
            <motion.div 
              key="s5" 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="px-4 pt-8 sm:pt-12"
            >
              {/* Verification Header */}
              <div className="text-center mb-8 sm:mb-10">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg"
                  style={{ 
                    backgroundColor: 'rgb(var(--btn-bg))',
                    boxShadow: '0 10px 25px -5px rgb(var(--accent-500) / 0.3)' 
                  }}
                >
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </motion.div>
                
                <h1 className="text-[20px] sm:text-[24px] font-bold text-primary mb-1.5 sm:mb-2">{t('verification')}</h1>
                <p className="text-[13px] sm:text-[14px] text-secondary">
                  {t('enterCode')}
                </p>
                <p className="text-[14px] sm:text-[15px] font-semibold text-primary mt-1 tracking-wide" dir="ltr">
                  {phone.replace(/(\d{3})(\d{7})/, '$1-$2')}
                </p>
              </div>

              {/* OTP Input Area */}
              <div className="card p-6 mb-6">
                <OTPInput 
                  length={4} 
                  onComplete={verify} 
                  disabled={otpVerifying || otpSuccess} 
                  shake={otpShake}
                  error={!!otpError}
                  success={otpSuccess}
                />
                
                
                {otpVerifying && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 flex items-center justify-center gap-2"
                  >
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgb(var(--accent-500))', borderTopColor: 'transparent' }} />
                    <span className="text-[14px] text-secondary">{t('verifyingCode')}</span>
                  </motion.div>
                )}

                {/* OTP Error */}
                {otpError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                      <p className="text-[13px] text-red-700 leading-relaxed">{otpError}</p>
                      {attemptsLeft !== null && attemptsLeft > 0 && (
                        <p className="text-[12px] text-red-500 mt-1 font-medium">
                          {attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Resend Section */}
              <div className="text-center">
                <p className="text-[13px] text-secondary mb-2">{t('didntReceiveCode')}</p>
                {canResend ? (
                  <button 
                    onClick={resend} 
                    disabled={otpSending} 
                    className="text-[14px] font-semibold text-accent hover:text-accent-dark transition-colors disabled:opacity-50"
                  >
                    {otpSending ? (
                      <span className="flex items-center gap-2 justify-center">
                        <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgb(var(--accent-500))', borderTopColor: 'transparent' }} />
                        {t('sending')}
                      </span>
                    ) : (
                      t('resendCode')
                    )}
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-3" dir={isRTL ? 'rtl' : 'ltr'}>
                    {/* Circular Progress Timer */}
                    <div className="relative w-12 h-12">
                      {/* Background circle */}
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke="rgb(var(--accent-200))"
                          strokeWidth="3"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke="rgb(var(--accent-500))"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={125.6}
                          strokeDashoffset={125.6 * (1 - countdown / 60)}
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>
                      {/* Countdown number */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[16px] font-bold text-primary">{countdown}</span>
                      </div>
                    </div>
                    <span className="text-[13px] text-secondary">{t('secondsToResend')}</span>
                  </div>
                )}
              </div>

              {/* Help text */}
              <p className="text-center text-[12px] text-secondary mt-8 px-4">
                {t('whatsappHelp')}
              </p>
            </motion.div>
          )}

          {/* Step 6: Done - Request Submitted Screen */}
          {step === 6 && (
            <motion.div
              key="s6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className="px-4 min-h-[calc(100vh-100px)] flex flex-col justify-center items-center text-center py-8 relative overflow-hidden"
            >
              {/* Falling confetti from top */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(30)].map((_, i) => {
                  const startX = Math.random() * 100; // Random horizontal position %
                  const delay = Math.random() * 1.5; // Stagger the start
                  const duration = 2.5 + Math.random() * 2; // Fall duration
                  const width = 6 + Math.random() * 6; // 6-12px wide
                  const height = 10 + Math.random() * 14; // 10-24px tall (rectangular strips)
                  const colors = ['--accent-300', '--accent-400', '--accent-500', '--accent-200'];
                  const color = colors[i % 4];
                  const swayAmount = 30 + Math.random() * 40; // How much it sways
                  
                  return (
                    <motion.div
                      key={i}
                      initial={{ 
                        top: -30,
                        left: `${startX}%`,
                        opacity: 1,
                        rotateZ: Math.random() * 360,
                        rotateY: 0,
                      }}
                      animate={{ 
                        top: '110%',
                        left: [`${startX}%`, `${startX + (Math.random() > 0.5 ? swayAmount : -swayAmount) * 0.3}%`, `${startX}%`],
                        opacity: [1, 1, 0.8, 0],
                        rotateZ: Math.random() * 720 - 360,
                        rotateY: [0, 180, 360],
                      }}
                      transition={{
                        duration: duration,
                        delay: delay,
                        ease: "linear",
                        rotateY: {
                          duration: duration * 0.5,
                          repeat: 2,
                          ease: "linear",
                        }
                      }}
                      className="absolute rounded-sm"
                      style={{ 
                        width: width,
                        height: height,
                        backgroundColor: `rgb(var(${color}))`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Success Icon with glow */}
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                className="relative mx-auto mb-6"
              >
                {/* Outer glow ring */}
                <div 
                  className="absolute -inset-3 rounded-full opacity-20"
                  style={{ 
                    background: 'radial-gradient(circle, rgb(var(--accent-400)) 0%, transparent 70%)',
                  }}
                />
                {/* Pulsing ring */}
                <motion.div 
                  className="absolute -inset-2 rounded-full"
                  style={{ border: '2px solid rgb(var(--accent-400))' }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Main circle */}
                <div 
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center bg-accent-solid"
                  style={{ boxShadow: '0 20px 50px -10px rgb(var(--accent-500) / 0.5)' }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <Check className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={2.5} />
                  </motion.div>
                </div>
              </motion.div>

              {/* Success Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mb-6"
              >
                <h1 className="text-[24px] sm:text-[28px] font-bold text-primary mb-2">{t('requestSent')}</h1>
                <p className="text-[14px] sm:text-[15px] text-secondary">
                  {t('requestSubmitted')}
                </p>
              </motion.div>

              {/* Confirmation Card - Ticket Style */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.5 }}
                className="relative mx-auto w-full max-w-sm"
              >
                {/* Card with notch effect */}
                <div 
                  className="card overflow-hidden"
                  style={{ 
                    boxShadow: '0 10px 40px -10px rgb(var(--accent-500) / 0.15)',
                  }}
                >
                  {/* Top accent bar */}
                  <div className="h-1.5 bg-accent-solid" />
                  
                  <div className={`p-5 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {/* Service & Price */}
                    <div className={`flex justify-between items-start mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div>
                        <p className="text-[10px] text-secondary uppercase tracking-wider mb-1">{t('service')}</p>
                        <p className="text-[15px] font-bold text-primary">{serviceName}</p>
                      </div>
                      <div 
                        className="px-3 py-1.5 rounded-lg bg-accent-light"
                      >
                        <p className="text-[16px] font-bold" style={{ color: 'rgb(var(--accent-600))' }}>₪{selectedService?.price}</p>
                      </div>
                    </div>
                    
                    {/* Dashed separator */}
                    <div className="border-t-2 border-dashed border-accent-200 my-4" />
                    
                    {/* Date & Time in row */}
                    <div className={`flex gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="flex-1">
                        <p className="text-[10px] text-secondary uppercase tracking-wider mb-1">{t('date')}</p>
                        <p className="text-[14px] font-semibold text-primary">
                          {selectedDate && formatDateShortWithWeekday(selectedDate, language)}
                        </p>
                      </div>
                      <div className="w-px bg-accent-200" />
                      <div className="flex-1">
                        <p className="text-[10px] text-secondary uppercase tracking-wider mb-1">{t('time')}</p>
                        <p className="text-[14px] font-semibold text-primary">{selectedTime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* WhatsApp note */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-[12px] sm:text-[13px] text-secondary mt-5 mb-6"
              >
                {t('notifyWhatsapp')}
              </motion.p>

              {/* Action Button */}
              <button
                onClick={() => location.reload()} 
                className="btn-secondary px-6 py-3 text-[14px] font-semibold rounded-xl"
              >
                {t('submitAnother')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      {step < 5 && (
        <footer className="fixed bottom-0 inset-x-0 border-t border-accent safe-bottom" style={{ backgroundColor: 'rgb(var(--bg-main))' }}>
          <div className="max-w-lg mx-auto px-4 py-3" dir="ltr">
            <button onClick={next} disabled={!canContinue() || otpSending} className="btn-primary">
              {otpSending ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('sendingCode')}
                </span>
              ) : (
                isRTL ? (
                  <><ChevronRight className="w-5 h-5 -ml-1 rotate-180" />{t('continue')}</>
                ) : (
                  <>{t('continue')}<ChevronRight className="w-5 h-5 -mr-1" /></>
                )
              )}
            </button>
          </div>
        </footer>
      )}

      {/* Error Toast */}
      <AnimatePresence>
        {toastError && (
          <ErrorToast message={toastError} onClose={() => setToastError(null)} isRTL={isRTL} />
        )}
      </AnimatePresence>
    </div>
  );
}
