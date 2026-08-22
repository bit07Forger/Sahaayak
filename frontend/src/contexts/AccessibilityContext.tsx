import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import type { UserPreferences } from '../services/api';
import { useAuth } from './AuthContext';

interface AccessibilityContextType {
  textSize: string; // normal, large, xlarge
  contrast: string; // normal, high
  voiceSpeed: string; // slow, normal, fast
  voiceEnabled: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  speak: (text: string) => void;
  speakStop: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  
  const [textSize, setTextSize] = useState('normal');
  const [contrast, setContrast] = useState('normal');
  const [voiceSpeed, setVoiceSpeed] = useState('normal');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('sahaayak_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Toggle theme mode
  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('sahaayak_theme', next);
      return next;
    });
  };

  // Synchronize state with authenticated user preferences
  useEffect(() => {
    if (user?.preferences) {
      const { textSize, contrast, voiceSpeed, voiceEnabled } = user.preferences;
      setTextSize(textSize || 'normal');
      setContrast(contrast || 'normal');
      setVoiceSpeed(voiceSpeed || 'normal');
      setVoiceEnabled(!!voiceEnabled);
    }
  }, [user]);

  // Apply Theme attribute to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Apply HTML root and body classes
  useEffect(() => {
    // Sizing
    const html = document.documentElement;
    html.className = ''; // reset
    html.classList.add(`text-scale-${textSize}`);

    // Contrast Theme
    const body = document.body;
    body.className = ''; // reset
    if (contrast === 'high') {
      body.classList.add('theme-high-contrast');
    } else {
      body.classList.add('theme-normal');
    }
  }, [textSize, contrast]);

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    // Optimistic UI updates
    if (newPrefs.textSize) setTextSize(newPrefs.textSize);
    if (newPrefs.contrast) setContrast(newPrefs.contrast);
    if (newPrefs.voiceSpeed) setVoiceSpeed(newPrefs.voiceSpeed);
    if (newPrefs.voiceEnabled !== undefined) setVoiceEnabled(newPrefs.voiceEnabled);

    // Save backend updates if authenticated
    if (localStorage.getItem('sahaayak_token')) {
      try {
        await api.updatePreferences(newPrefs);
        await refreshUser();
      } catch (error) {
        console.error('Error syncing preferences to backend:', error);
      }
    }
  };

  // Text-To-Speech (TTS) Voice Engine
  const speak = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;

    // Stop current synthesis before playing new text
    window.speechSynthesis.cancel();

    // Clean text by stripping markdown or raw brackets for screen clarity
    const cleanText = text.replace(/[*_`#]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Configure rate speed
    let rate = 1.0;
    if (voiceSpeed === 'slow') rate = 0.75;
    if (voiceSpeed === 'fast') rate = 1.25;
    
    utterance.rate = rate;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  };

  const speakStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        textSize,
        contrast,
        voiceSpeed,
        voiceEnabled,
        theme,
        toggleTheme,
        updatePreferences,
        speak,
        speakStop,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
