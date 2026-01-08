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

// Landing Page Component
function LandingPage({ onBookNow }: { onBookNow: () => void }) {
  const { t, isRTL } = useLanguage();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const testimonials = [
    { name: 'Sarah M.', text: t('testimonial1'), rating: 5 },
    { name: 'Maya K.', text: t('testimonial2'), rating: 5 },
    { name: 'Dana L.', text: t('testimonial3'), rating: 5 },
  ];
  
  const showcaseItems = [
    { image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=500&fit=crop', label: t('gelArt') },
    { image: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&h=500&fit=crop', label: t('frenchTips') },
    { image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&h=500&fit=crop', label: t('chrome') },
    { image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&h=500&fit=crop', label: t('ombre') },
    { image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=500&fit=crop', label: t('minimalist') },
  ];
  
  const services = [
    { name: t('classicManicure'), duration: '45', price: '₪120', desc: t('classicManicureDesc') },
    { name: t('gelManicure'), duration: '60', price: '₪180', desc: t('gelManicureDesc'), popular: true },
    { name: t('luxuryPedicure'), duration: '75', price: '₪220', desc: t('luxuryPedicureDesc') },
  ];

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 30);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div 
      className="min-h-screen overflow-x-hidden" 
      dir={isRTL ? 'rtl' : 'ltr'} 
      style={{ backgroundColor: 'rgb(var(--bg-main))' }}
    >
      
      {/* Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'py-2.5' : 'py-4'
        }`}
        style={{ 
          backgroundColor: isScrolled ? 'rgb(var(--bg-card) / 0.85)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none',
          borderBottom: isScrolled ? '1px solid rgb(var(--accent-100))' : 'none'
        }}
      >
        <div className="max-w-lg mx-auto px-5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div 
              className={`rounded-xl flex items-center justify-center transition-all duration-300 ${
                isScrolled ? 'w-9 h-9' : 'w-10 h-10'
              }`}
              style={{ 
                backgroundColor: 'rgb(var(--accent-500))',
                boxShadow: isScrolled ? 'none' : '0 4px 15px -3px rgb(var(--accent-500) / 0.4)'
              }}
            >
              <svg 
                className={`transition-all duration-300 ${isScrolled ? 'w-4 h-4' : 'w-5 h-5'}`}
                viewBox="0 0 24 24" 
                fill="none"
              >
                <path 
                  d="M12 2L14.5 9H22L16 13.5L18 21L12 17L6 21L8 13.5L2 9H9.5L12 2Z" 
                  fill="white"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className={`font-bold text-primary tracking-tight leading-none transition-all duration-300 ${
                isScrolled ? 'text-[14px]' : 'text-[16px]'
              }`}>
                LUXE
              </span>
              <span 
                className={`text-secondary uppercase tracking-[0.15em] transition-all duration-300 ${
                  isScrolled ? 'text-[8px] opacity-0 h-0' : 'text-[9px] opacity-100 h-auto mt-0.5'
                }`}
              >
                {t('nailStudio')}
              </span>
            </div>
          </div>
          
          {/* Book Button */}
          <button
            onClick={onBookNow}
            className={`font-semibold transition-all duration-300 active:scale-95 ${
              isScrolled 
                ? 'px-4 py-2 rounded-lg text-[12px]' 
                : 'px-5 py-2.5 rounded-xl text-[13px]'
            }`}
            style={{ 
              backgroundColor: 'rgb(var(--btn-bg))',
              color: 'white',
              boxShadow: isScrolled ? 'none' : '0 4px 15px -3px rgb(var(--accent-500) / 0.3)'
            }}
          >
            {t('bookNow')}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-8 px-5 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl" 
          style={{ background: 'rgb(var(--accent-400))' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15 blur-3xl" 
          style={{ background: 'rgb(var(--accent-300))' }} />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(rgb(var(--accent-500)) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        
        <div className="relative max-w-lg mx-auto pt-4">
          {/* Main Heading */}
          <div className="text-center mb-8 animate-fadeInUp">
            <h1 className="text-[40px] sm:text-[52px] font-bold text-primary leading-[1.05] tracking-tight mb-5">
              {t('nailArt')}
              <br />
              <span 
                className="relative"
                style={{ color: 'rgb(var(--accent-500))' }}
              >
                {t('redefined')}
                <svg 
                  className="absolute -bottom-1 left-0 w-full h-3" 
                  viewBox="0 0 200 12" 
                  fill="none"
                >
                  <path 
                    d="M2 8C40 4 80 2 100 2C120 2 160 4 198 8" 
                    stroke="rgb(var(--accent-400))" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                </svg>
              </span>
            </h1>
            <p className="text-[16px] sm:text-[17px] text-secondary max-w-[300px] mx-auto leading-relaxed">
              {t('heroDescription')}
            </p>
          </div>

          {/* Call Button */}
          <div className="flex justify-center mb-10 animate-fadeInUp animation-delay-100">
            <a 
              href="tel:+972548998445"
              className="px-6 py-3 rounded-2xl text-[14px] font-medium transition-all active:scale-[0.98] flex items-center gap-2 hover:shadow-md"
              style={{ 
                backgroundColor: 'rgb(var(--bg-card))',
                color: 'rgb(var(--text-primary))',
                border: '1px solid rgb(var(--accent-200))'
              }}
            >
              <svg className="w-4 h-4" style={{ color: 'rgb(var(--accent-500))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {t('callUs')} · <span dir="ltr">054-8998445</span>
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 animate-fadeIn animation-delay-200">
            {[
              { value: '4.9', label: t('rating'), hasStars: true },
              { value: '500+', label: t('clients') },
              { value: `5 ${t('yearsShort')}`, label: t('experience') },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center px-3 sm:px-4"
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[20px] sm:text-[24px] font-bold text-primary">{stat.value}</span>
                  {stat.hasStars && (
                    <svg className="w-4 h-4" style={{ color: 'rgb(var(--accent-500))' }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                </div>
                <p className="text-[10px] sm:text-[11px] text-secondary uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Showcase - Horizontal Scroll */}
      <section className="py-10 overflow-hidden">
        <div className="mb-5 px-5 animate-fadeIn animation-delay-300">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-primary">{t('ourWork')}</h2>
            <span className="text-[12px] text-secondary">{t('swipeToExplore')} {isRTL ? '←' : '→'}</span>
          </div>
        </div>
        
        <div 
          className="flex gap-3 px-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide animate-fadeIn animation-delay-400"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {showcaseItems.map((item) => (
            <div
              key={item.label}
              className="flex-shrink-0 snap-center group cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div 
                className="relative w-36 h-44 rounded-3xl overflow-hidden shadow-lg"
                style={{ boxShadow: '0 8px 32px -12px rgba(0,0,0,0.25)' }}
              >
                {/* Image */}
                <img 
                  src={item.image} 
                  alt={item.label}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                {/* Label */}
                <span className="absolute bottom-4 left-4 text-[14px] font-semibold text-white drop-shadow-md">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="py-10 px-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[22px] font-bold text-primary">{t('services')}</h2>
              <p className="text-[13px] text-secondary mt-0.5">{t('popularTreatments')}</p>
            </div>
            <button 
              onClick={onBookNow}
              className="text-[13px] font-medium flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors"
              style={{ 
                color: 'rgb(var(--accent-600))',
                backgroundColor: 'rgb(var(--accent-100))'
              }}
            >
              {t('viewAll')}
              <svg className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.name}
                onClick={onBookNow}
                className="relative card p-4 rounded-2xl cursor-pointer transition-all group overflow-hidden active:scale-[0.99]"
                style={{
                  boxShadow: service.popular 
                    ? '0 4px 24px -6px rgb(var(--accent-500) / 0.25)' 
                    : '0 2px 12px -3px rgba(0,0,0,0.08)',
                  border: service.popular 
                    ? '1.5px solid rgb(var(--accent-300))' 
                    : '1px solid rgb(var(--accent-100))'
                }}
              >
                {/* Popular badge */}
                {service.popular && (
                  <div 
                    className={`absolute top-0 ${isRTL ? 'left-0 rounded-br-xl' : 'right-0 rounded-bl-xl'} px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white`}
                    style={{ backgroundColor: 'rgb(var(--accent-500))' }}
                  >
                    {t('popular')}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-3">
                    <h3 className="text-[15px] font-semibold text-primary">{service.name}</h3>
                    <p className="text-[12px] text-secondary mt-0.5">{service.desc}</p>
                    <p className="text-[11px] text-secondary mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {service.duration} {t('minutes')}
                    </p>
                  </div>
                  
                  {/* Price */}
                  <div className="text-right shrink-0">
                    <span 
                      className="text-[18px] font-bold"
                      style={{ color: 'rgb(var(--accent-600))' }}
                    >
                      {service.price}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 px-5">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-5">
            <h2 className="text-[22px] font-bold text-primary">{t('clientLove')}</h2>
            <p className="text-[13px] text-secondary mt-1">{t('whatClientsSay')}</p>
          </div>
          
          <div
            className="relative rounded-3xl p-6 pb-5 overflow-hidden"
            style={{ 
              backgroundColor: 'rgb(var(--accent-50))',
              border: '1px solid rgb(var(--accent-100))'
            }}
          >
            {/* Decorative elements */}
            <div 
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30 blur-2xl"
              style={{ backgroundColor: 'rgb(var(--accent-400))' }}
            />
            
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  {/* Avatar */}
                  <div 
                    className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-semibold text-white shadow-md"
                    style={{ 
                      background: `linear-gradient(135deg, rgb(var(--accent-400)), rgb(var(--accent-600)))`
                    }}
                  >
                    {testimonials[activeTestimonial].name.charAt(0)}
                  </div>
                  
                  {/* Stars */}
                  <div className="flex justify-center gap-0.5 mb-3">
                    {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                      <svg key={i} className="w-4 h-4" style={{ color: 'rgb(var(--accent-500))' }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <p className="text-[15px] text-primary leading-relaxed mb-3">
                    &ldquo;{testimonials[activeTestimonial].text}&rdquo;
                  </p>
                  
                  {/* Name */}
                  <p className="text-[14px] font-semibold" style={{ color: 'rgb(var(--accent-700))' }}>
                    {testimonials[activeTestimonial].name}
                  </p>
                </motion.div>
              </AnimatePresence>
              
              {/* Progress dots */}
              <div className="flex justify-center gap-2 mt-5">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className="relative w-8 h-1.5 rounded-full overflow-hidden transition-all"
                    style={{ 
                      backgroundColor: 'rgb(var(--accent-200))'
                    }}
                  >
                    {i === activeTestimonial && (
                      <div
                        className="absolute inset-0 rounded-full animate-progressBar"
                        style={{ backgroundColor: 'rgb(var(--accent-500))' }}
                      />
                    )}
                    {i < activeTestimonial && (
                      <div 
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: 'rgb(var(--accent-500))' }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Hours */}
      <section className="py-10 px-5 pb-32">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-[22px] font-bold text-primary">{t('findUs')}</h2>
            <p className="text-[13px] text-secondary mt-1">{t('locatedIn')}</p>
          </div>
          
          {/* Location Card */}
          <a
            href="https://waze.com/ul?ll=32.0853,34.7818&navigate=yes"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl p-5 text-center active:scale-[0.99] transition-transform"
            style={{ 
              backgroundColor: 'rgb(var(--accent-50))',
              border: '1px solid rgb(var(--accent-100))'
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <svg className="w-5 h-5" style={{ color: 'rgb(var(--accent-500))' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span className="text-[16px] font-semibold text-primary">Main St 45, Nazareth</span>
            </div>
            
            <p className="text-[13px] text-secondary mb-4">
              {t('hoursWeekdays')} 9:00-20:00 · {t('hoursFriday')} 9:00-14:00
            </p>
            
            <span 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium text-white"
              style={{ backgroundColor: 'rgb(var(--btn-bg))' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {t('getDirections')}
            </span>
          </a>

          {/* Social Links */}
          <div className="flex justify-center gap-3 mt-8">
            {[
              { 
                icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z', 
                label: 'Instagram',
                href: 'https://instagram.com/luxenails'
              },
              { 
                icon: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z', 
                label: 'WhatsApp',
                href: 'https://wa.me/972548998445'
              },
              { 
                icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', 
                label: 'Phone',
                href: 'tel:+972501234567',
                isStroke: true
              },
              { 
                icon: 'M12 2C8.13 2 5 5.13 5 9c0 4.17 4.42 9.92 6.24 12.11.4.48 1.13.48 1.53 0C14.58 18.92 19 13.17 19 9c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', 
                label: 'Waze',
                href: 'https://waze.com/ul?ll=32.0853,34.7818&navigate=yes'
              },
            ].map((social) => (
              <a 
                key={social.label}
                href={social.href}
                target={social.href.startsWith('http') ? '_blank' : undefined}
                rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95"
                style={{ 
                  backgroundColor: 'rgb(var(--accent-100))',
                  border: '1px solid rgb(var(--accent-200))'
                }}
              >
                <svg 
                  className="w-5 h-5" 
                  style={{ color: 'rgb(var(--accent-600))' }} 
                  fill={social.isStroke ? 'none' : 'currentColor'} 
                  stroke={social.isStroke ? 'currentColor' : 'none'}
                  strokeWidth={social.isStroke ? 2 : 0}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={social.icon} />
                </svg>
              </a>
            ))}
          </div>
          
          {/* Footer text */}
          <p className="text-center text-[11px] text-secondary mt-8">
            {t('poweredBy')}
          </p>
        </div>
      </section>

      {/* Floating Book Button */}
      <div className="fixed bottom-6 inset-x-0 px-5 z-50 animate-fadeInUp animation-delay-500">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBookNow}
            className="relative w-full py-4 rounded-2xl text-[15px] font-semibold text-white overflow-hidden group"
            style={{ 
              backgroundColor: 'rgb(var(--btn-bg))',
              boxShadow: '0 20px 50px -15px rgb(var(--accent-500) / 0.7), 0 4px 20px -5px rgb(var(--accent-500) / 0.4)'
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {t('bookYourAppointment')}
              <motion.span
                animate={{ x: isRTL ? [0, -4, 0] : [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {isRTL ? '←' : '→'}
              </motion.span>
            </span>
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  const { t, language, isRTL } = useLanguage();
  
  // Landing page state
  const [showBooking, setShowBooking] = useState(false);
  
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

  // Handle navigation to booking
  const handleBookNow = () => {
    setShowBooking(true);
    window.scrollTo(0, 0);
  };

  // Handle back to landing
  const handleBackToLanding = () => {
    setShowBooking(false);
    setStep(1);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setName('');
    setPhone('');
    window.scrollTo(0, 0);
  };

  // Show landing page if not in booking flow
  if (!showBooking) {
    return <LandingPage onBookNow={handleBookNow} />;
  }

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
              ) : (
                <button onClick={handleBackToLanding} className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full active:bg-accent-light">
                  <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )
            )}
            
            <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} labels={[]} />
            
            {/* Right side - empty in LTR, back button in RTL */}
            {isRTL ? (
              step > 1 ? (
                <button onClick={back} className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full active:bg-accent-light">
                  <ArrowLeft className="w-5 h-5 text-secondary rotate-180" />
                </button>
              ) : (
                <button onClick={handleBackToLanding} className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full active:bg-accent-light">
                  <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )
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
