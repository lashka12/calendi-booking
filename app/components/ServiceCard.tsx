'use client';

import { motion } from 'framer-motion';
import { Check, Clock } from 'lucide-react';
import { Service, getServiceName, getServiceDescription } from '@/app/lib/firebase/booking';
import { Language, translations } from '@/app/lib/i18n/translations';

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  language?: Language;
}

export default function ServiceCard({ service, isSelected, onSelect, index, language = 'en' }: ServiceCardProps) {
  const langCode = language === 'he' ? 'he' : language === 'ar' ? 'ar' : 'en';
  const name = getServiceName(service, langCode);
  const description = getServiceDescription(service, langCode);
  const isRTL = language === 'he' || language === 'ar';
  const minutesText = translations[language]?.minutes || 'min';

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        w-full relative overflow-hidden rounded-2xl transition-all duration-300
        ${isSelected 
          ? 'ring-2 shadow-lg' 
          : 'hover:shadow-md'
        }
      `}
      style={{ 
        '--tw-ring-color': isSelected ? 'rgb(var(--accent-500))' : 'transparent',
        backgroundColor: isSelected ? 'rgb(var(--accent-50))' : 'rgb(var(--bg-card))',
      } as React.CSSProperties}
    >
      <div className="p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Top row: Service name + Checkbox */}
        <div className={`flex items-start justify-between gap-3 mb-2`}>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-[16px] leading-tight text-primary ${isRTL ? 'text-right' : 'text-left'}`}>
              {name}
            </h3>
          </div>
          
          {/* Checkbox */}
          <div 
            className={`
              w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center
              transition-all duration-200
              ${isSelected 
                ? '' 
                : 'border-2'
              }
            `}
            style={{ 
              backgroundColor: isSelected ? 'rgb(var(--accent-500))' : 'transparent',
              borderColor: isSelected ? 'transparent' : 'rgb(var(--accent-300))'
            }}
          >
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className={`text-secondary text-[13px] leading-relaxed mb-3 line-clamp-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            {description}
          </p>
        )}

        {/* Bottom row: Duration + Price */}
        <div className={`flex items-center justify-between pt-2 border-t`} style={{ borderColor: 'rgb(var(--accent-100))' }}>
          {/* Duration */}
          <div className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Clock className="w-3.5 h-3.5 text-secondary" />
            <span className="text-[12px] text-secondary font-medium">
              {service.duration} {minutesText}
            </span>
          </div>
          
          {/* Price */}
          <div 
            className="px-3 py-1 rounded-full text-[14px] font-bold"
            style={{ 
              backgroundColor: isSelected ? 'rgb(var(--accent-500))' : 'rgb(var(--accent-100))',
              color: isSelected ? 'white' : 'rgb(var(--accent-700))'
            }}
          >
            ₪{service.price}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
