'use client';

import { useState, useEffect, useCallback } from 'react';
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
  getServiceName
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

// Error Toast Component
function ErrorToast({ message, onClose, isRTL = false }: { message: string; onClose: () => void; isRTL?: boolean }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-24 left-4 right-4 z-50 max-w-lg mx-auto"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={`bg-red-50 border border-red-200 rounded-2xl p-4 shadow-lg flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-red-600" />
        </div>
        <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
          <p className="text-[14px] font-medium text-red-900">Something went wrong</p>
          <p className="text-[13px] text-red-700 mt-0.5">{message}</p>
        </div>
        <button onClick={onClose} className={`p-1 ${isRTL ? '-ml-1' : '-mr-1'} -mt-1 rounded-full hover:bg-red-100`}>
          <X className="w-4 h-4 text-red-400" />
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
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Toast error state
  const [toastError, setToastError] = useState<string | null>(null);

  // Get service name in current language
  const langCode = language === 'he' ? 'he' : language === 'ar' ? 'ar' : 'en';
  const serviceName = selectedService ? getServiceName(selectedService, langCode) : '';

  // Load services
  useEffect(() => {
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
      case 4: return name.trim().length > 0 && phone.length === 10;
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

  const verify = async (code: string) => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    setOtpVerifying(true);
    setOtpError(null);
    try {
      await createBooking({
        serviceId: selectedService.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        clientName: name.trim(),
        phone: phone.trim(),
        code,
      });
      setStep(6);
    } catch (e: any) {
      const friendlyMsg = getFriendlyError(e.message || 'Invalid code');
      setOtpError(friendlyMsg);
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
                    <div key={i} className="h-[120px] rounded-2xl skeleton" />
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
            <motion.div key="s4" {...pageTransition} className="px-4 pt-6">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-[24px] sm:text-[28px] font-bold text-primary mb-2">{t('almostThere')}</h1>
                <p className="text-[14px] text-secondary">{t('enterYourDetails')}</p>
              </div>

              {/* Compact Booking Summary - Inline */}
              <div className="flex items-center justify-center gap-4 mb-8">
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
              <div className="space-y-5 px-6 sm:px-8">
                {/* Name Input */}
                <div>
                  <label className="block text-[11px] font-bold text-secondary uppercase tracking-wide mb-2">
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
                      className={`w-full h-[52px] ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-[15px] rounded-xl transition-all duration-200 outline-none`}
                      style={{ 
                        backgroundColor: 'rgb(var(--accent-50))',
                        color: 'rgb(var(--text-primary))'
                      }}
                      onFocus={e => {
                        e.target.style.backgroundColor = 'rgb(var(--bg-card))';
                        e.target.style.boxShadow = '0 0 0 2px rgb(var(--accent-400))';
                      }}
                      onBlur={e => {
                        e.target.style.backgroundColor = 'rgb(var(--accent-50))';
                        e.target.style.boxShadow = 'none';
                      }}
                      autoComplete="name"
                    />
                  </div>
                </div>

                {/* Phone Input */}
                <div>
                  <label className="block text-[11px] font-bold text-secondary uppercase tracking-wide mb-2">
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
                      className={`w-full h-[52px] ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-[15px] tracking-wide rounded-xl transition-all duration-200 outline-none font-medium`}
                      style={{ 
                        backgroundColor: 'rgb(var(--accent-50))',
                        color: 'rgb(var(--text-primary))'
                      }}
                      onFocus={e => {
                        e.target.style.backgroundColor = 'rgb(var(--bg-card))';
                        e.target.style.boxShadow = '0 0 0 2px rgb(var(--accent-400))';
                      }}
                      onBlur={e => {
                        e.target.style.backgroundColor = 'rgb(var(--accent-50))';
                        e.target.style.boxShadow = 'none';
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
            <motion.div key="s5" {...pageTransition} className="px-4 pt-4 sm:pt-6">
              {/* Verification Header */}
              <div className="text-center mb-8 sm:mb-10">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 bg-accent-solid rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg"
                  style={{ boxShadow: '0 10px 25px -5px rgb(var(--accent-500) / 0.3)' }}
                >
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </motion.div>
                
                <h1 className="text-[20px] sm:text-[24px] font-bold text-primary mb-1.5 sm:mb-2">{t('verification')}</h1>
                <p className="text-[13px] sm:text-[14px] text-secondary">
                  {t('enterCode')}
                </p>
                <p className="text-[14px] sm:text-[15px] font-semibold text-primary mt-1 tracking-wide" dir="ltr">{phone}</p>
              </div>

              {/* OTP Input Area */}
              <div className="card p-6 mb-6">
                <OTPInput length={4} onComplete={verify} disabled={otpVerifying} />
                
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
                    <p className={`text-[13px] text-red-700 leading-relaxed ${isRTL ? 'text-right' : ''}`}>{otpError}</p>
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
                  <div className={`inline-flex items-center gap-2 bg-accent-light rounded-full px-4 py-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-5 h-5 rounded-full bg-accent-medium flex items-center justify-center">
                      <span className="text-[11px] font-bold text-accent-dark">{countdown}</span>
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="px-4 pt-10 sm:pt-12 pb-8 text-center"
            >
              {/* Animated Success Icon */}
              <div className="relative inline-block mb-4 sm:mb-5">
                {/* Single pulsing ring - CSS animation for smoothness */}
                <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: 'rgb(var(--accent-400) / 0.3)', animationDuration: '2s' }} />
                
                {/* Main success circle */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="relative w-16 h-16 sm:w-20 sm:h-20 bg-accent-solid rounded-full flex items-center justify-center shadow-xl"
                  style={{ boxShadow: '0 20px 40px -10px rgb(var(--accent-500) / 0.4)' }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                  >
                    <Check className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={3} />
                  </motion.div>
                </motion.div>
              </div>

              {/* Success Message */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <h1 className="text-[20px] sm:text-[24px] font-bold text-primary mb-1">{t('requestSent')}</h1>
                <p className="text-[13px] sm:text-[14px] text-secondary mb-5 sm:mb-6">
                  {t('requestSubmitted')}
                </p>
              </motion.div>

              {/* Request Details Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className={`card p-4 sm:p-5 mb-4 sm:mb-5 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {/* Service & Price header */}
                <div className={`flex justify-between items-start pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-accent ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <p className="text-[10px] sm:text-[11px] text-accent font-semibold uppercase tracking-wider mb-0.5">{t('service')}</p>
                    <p className="text-[14px] sm:text-[16px] font-bold text-primary">{serviceName}</p>
                  </div>
                  <div className={isRTL ? 'text-left' : 'text-right'}>
                    <p className="text-[10px] sm:text-[11px] text-secondary uppercase tracking-wider mb-0.5">{t('price')}</p>
                    <p className="text-[15px] sm:text-[17px] font-bold text-primary">₪{selectedService?.price}</p>
                  </div>
                </div>
                
                {/* Date & Time blocks */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="info-block">
                    <p className="info-block-label">{t('date')}</p>
                    <p className="info-block-value text-[13px] sm:text-[15px]">
                      {selectedDate && formatDateShortWithWeekday(selectedDate, language)}
                    </p>
                  </div>
                  <div className="info-block">
                    <p className="info-block-label">{t('time')}</p>
                    <p className="info-block-value text-[13px] sm:text-[15px]">{selectedTime}</p>
                  </div>
                </div>
              </motion.div>

              {/* Info note */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-[12px] sm:text-[13px] text-secondary mb-5 sm:mb-6"
              >
                {t('notifyWhatsapp')}
              </motion.p>

              {/* Action Button */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <button 
                  onClick={() => location.reload()} 
                  className="btn-primary"
                >
                  {t('submitAnother')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      {step < 5 && (
        <footer className="fixed bottom-0 inset-x-0 border-t border-accent safe-bottom" style={{ backgroundColor: 'rgb(var(--bg-main))' }}>
          <div className="max-w-lg mx-auto px-4 py-3" dir="ltr">
            <button onClick={next} disabled={!canContinue() || otpSending} className="btn-primary">
              {otpSending ? t('sendingCode') : (
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
