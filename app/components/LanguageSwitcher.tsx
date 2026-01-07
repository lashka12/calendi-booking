'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/app/lib/i18n';
import { languages, Language } from '@/app/lib/i18n/translations';

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { language, setLanguage, isRTL } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div className={`fixed bottom-4 z-50 ${isRTL ? 'right-20' : 'left-4'}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-14 rounded-2xl shadow-xl border p-2 min-w-[120px]"
            style={{ 
              [isRTL ? 'right' : 'left']: 0,
              backgroundColor: 'rgb(var(--bg-card))',
              borderColor: 'rgb(var(--accent-200))'
            }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as Language);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                style={{
                  backgroundColor: language === lang.code ? 'rgb(var(--accent-100))' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (language !== lang.code) {
                    e.currentTarget.style.backgroundColor = 'rgb(var(--accent-50))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (language !== lang.code) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span className="text-sm font-medium text-primary">{lang.nativeName}</span>
                {language === lang.code && (
                  <svg className="w-4 h-4 text-secondary ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center border-2"
        style={{ 
          backgroundColor: 'rgb(var(--bg-card))',
          borderColor: 'rgb(var(--accent-200))',
          color: 'rgb(var(--accent-600))' 
        }}
      >
        <span className="text-sm font-bold">{currentLang.code.toUpperCase()}</span>
      </motion.button>
    </div>
  );
}

