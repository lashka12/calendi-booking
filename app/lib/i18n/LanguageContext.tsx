'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, TranslationKey, translations, getDirection, isRTL } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read from localStorage or DOM
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && ['en', 'he', 'ar'].includes(savedLang)) {
      setLanguageState(savedLang);
      applyLanguage(savedLang);
    }
    setMounted(true);
  }, []);

  const applyLanguage = (lang: Language) => {
    const dir = getDirection(lang);
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    applyLanguage(lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const dir = getDirection(language);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <LanguageContext.Provider
        value={{
          language: 'en',
          setLanguage: () => {},
          t: (key) => translations.en[key] || key,
          dir: 'ltr',
          isRTL: false,
        }}
      >
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        dir,
        isRTL: isRTL(language),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

