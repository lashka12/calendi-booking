'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const themes = [
  // Light themes
  { id: 'sage', name: 'Sage', color: '#567d56' },
  { id: 'graphite', name: 'Graphite', color: '#3f3f46' },
  { id: 'ocean', name: 'Ocean', color: '#3b82f6' },
  { id: 'rose', name: 'Rose', color: '#f43f5e' },
  { id: 'midnight', name: 'Midnight', color: '#6366f1' },
  { id: 'ember', name: 'Ember', color: '#f97316' },
  { id: 'teal', name: 'Teal', color: '#14b8a6' },
  { id: 'wine', name: 'Wine', color: '#be185d' },
  { id: 'forest', name: 'Forest', color: '#059669' },
  { id: 'copper', name: 'Copper', color: '#b45309' },
  { id: 'violet', name: 'Violet', color: '#a855f7' },
  { id: 'slate', name: 'Slate', color: '#64748b' },
  // Dark themes (softer, real-world dark modes)
  { id: 'dark', name: 'Dark', color: '#1c1c1e', isDark: true },
  { id: 'dark-ocean', name: 'Dark Ocean', color: '#141c2a', isDark: true },
  { id: 'dark-forest', name: 'Dark Emerald', color: '#16201c', isDark: true },
  { id: 'dark-rose', name: 'Dark Warm', color: '#201c1a', isDark: true },
];

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);

  useEffect(() => {
    // Read from DOM first (set by the inline script), then localStorage
    const domTheme = document.documentElement.getAttribute('data-theme');
    const saved = domTheme || localStorage.getItem('theme') || 'wine';
    setCurrentTheme(saved === '' ? 'wine' : saved);
  }, []);

  const selectTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem('theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId === 'sage' ? '' : themeId);
    setIsOpen(false);
  };

  // Don't render until theme is loaded
  if (!currentTheme) return null;

  const current = themes.find(t => t.id === currentTheme) || themes[0];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-14 right-0 rounded-2xl shadow-xl border p-2 min-w-[160px] max-h-[70vh] overflow-y-auto"
            style={{
              backgroundColor: 'rgb(var(--bg-card))',
              borderColor: 'rgb(var(--accent-200))'
            }}
          >
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => selectTheme(theme.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                style={{
                  backgroundColor: currentTheme === theme.id ? 'rgb(var(--accent-100))' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (currentTheme !== theme.id) {
                    e.currentTarget.style.backgroundColor = 'rgb(var(--accent-50))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentTheme !== theme.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div
                  className={`w-5 h-5 rounded-full ring-2 shadow-md ${
                    theme.isDark ? 'ring-slate-600' : 'ring-white'
                  }`}
                  style={{ backgroundColor: theme.color }}
                />
                <span className="text-sm font-medium text-primary">
                  {theme.name}
                </span>
                {currentTheme === theme.id && (
                  <svg className="w-4 h-4 ml-auto text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
          backgroundColor: current.color,
          borderColor: 'rgb(var(--bg-main))'
        }}
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </motion.button>
    </div>
  );
}
