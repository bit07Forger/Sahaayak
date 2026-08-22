import React from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAccessibility } from '../contexts/AccessibilityContext';

export interface LanguageDropdownProps {
  id?: string;
  className?: string;
  onAnnounce?: (msg: string) => void;
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  id = 'language-select',
  className = '',
  onAnnounce,
}) => {
  const { locale, setLocale } = useLanguage();
  const { contrast } = useAccessibility();
  const isHighContrast = contrast === 'high';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLoc = e.target.value as 'en' | 'kn';
    setLocale(newLoc);
    const msg = newLoc === 'kn' ? 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ' : 'Language changed to English';
    if (onAnnounce) {
      onAnnounce(msg);
    }
  };

  return (
    <div
      className={`relative inline-flex items-center gap-2 px-3 h-10 min-h-[44px] rounded-xl text-xs font-bold font-hyperlegible transition-all cursor-pointer ${
        isHighContrast
          ? 'bg-black text-white border-2 border-yellow-400 focus-within:border-yellow-400'
          : 'bg-[var(--surface-soft)] border border-[var(--border-subtle)] text-[var(--ink-primary)] hover:bg-[var(--surface-panel)] shadow-sm'
      } ${className}`}
    >
      <Globe size={16} className="text-[#D98310] shrink-0 pointer-events-none" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">
        {locale === 'kn' ? 'ಭಾಷೆ' : 'Language'}
      </label>
      <div className="relative flex items-center">
        <select
          id={id}
          value={locale}
          onChange={handleChange}
          className="bg-transparent text-inherit font-bold font-hyperlegible outline-none cursor-pointer appearance-none pr-5 text-xs h-full"
          aria-label={locale === 'kn' ? 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ' : 'Select UI Language'}
        >
          <option value="en" className="bg-[var(--surface-panel)] text-[var(--ink-primary)] font-bold">
            English
          </option>
          <option value="kn" className="bg-[var(--surface-panel)] text-[var(--ink-primary)] font-bold">
            ಕನ್ನಡ
          </option>
        </select>
        <ChevronDown size={14} className="absolute right-0 text-[var(--ink-secondary)] pointer-events-none" aria-hidden="true" />
      </div>
    </div>
  );
};
