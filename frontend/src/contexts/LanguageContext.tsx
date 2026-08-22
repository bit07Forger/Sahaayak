import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedLocale = 'en' | 'kn';

export interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (loc: SupportedLocale) => void;
  t: (key: string, fallback?: string) => string;
}

const STORAGE_KEY = 'sahaayak-locale';

export const TRANSLATIONS: Record<SupportedLocale, Record<string, string>> = {
  en: {
    // Header & Navigation
    'nav.brand': 'Sahaayak',
    'nav.dashboard': 'Dashboard',
    'nav.selection': 'Preparation Flow',
    'nav.help': 'Help & Voice',
    'nav.languageLabel': 'Language',
    'nav.signOut': 'Sign Out',
    'nav.signedInAs': 'Signed in as',
    'nav.voiceFill': 'Voice Fill',
    'nav.listenSection': 'Listen to Section',
    'nav.backToDashboard': 'Back to dashboard',

    // Accessibility Controls
    'acc.title': 'Quick Accessibility Controls',
    'acc.textSize': 'Text Size',
    'acc.contrast': 'Contrast',
    'acc.voice': 'Voice',
    'acc.speechSpeed': 'Speed',
    'acc.normal': 'Normal',
    'acc.large': 'Large',
    'acc.xLarge': 'Extra Large',
    'acc.highContrast': 'High Contrast',
    'acc.reset': 'Reset',

    // Auth Screens
    'auth.welcomeTitle': 'Welcome to Sahaayak',
    'auth.welcomeSub': 'Your accessible scholarship preparation assistant.',
    'auth.signInTab': 'Sign In',
    'auth.registerTab': 'Create Account',
    'auth.emailLabel': 'Email Address',
    'auth.passwordLabel': 'Password',
    'auth.showPassword': 'Show password',
    'auth.hidePassword': 'Hide password',
    'auth.signInSubmit': 'Sign in to workspace',
    'auth.registerSubmit': 'Register account',
    'auth.toggleToRegister': 'Need an account? Register here',
    'auth.toggleToSignIn': 'Already have an account? Sign in',
    'auth.boundary': 'Sahaayak helps you prepare applications. It does not decide eligibility or submit applications.',

    // Scholarship Home
    'home.heroTitle': 'Prepare your scholarship application, step by step',
    'home.heroSub': 'Sahaayak guides you through profile details, document checklists, and review statements before applying on official portals.',
    'home.startPrep': 'Start application preparation',
    'home.explore': 'Explore preparation options',

    // Selection Page
    'selection.title': 'Select an application preparation flow',
    'selection.sub': 'Choose the template that fits your goal. All entries are saved in-memory as a local draft during this session.',
    'selection.progressTitle': 'PREPARATION PROGRESS',
    'selection.reviewNotice': 'You can review every answer before it is saved.',
    'selection.chooseFlow': 'Choose this preparation flow',
    'selection.exploreFlow': 'Explore preparation',

    // Guided Form Workspace
    'form.step': 'Step',
    'form.previousSection': 'Previous Section',
    'form.backToSelection': 'Back to Selection',
    'form.nextSection': 'Save & Proceed to Next Step →',
    'form.reviewDraftBtn': 'Review Preparation Draft →',
    'form.ocrScanBtn': 'Scan Document with OCR',
    'form.localDraftSaved': 'LOCAL DRAFT SAVED',

    // Review Page
    'review.title': 'Review Your Application Preparation',
    'review.sub': 'Review all prepared answers and document readiness before finalizing your notes.',
    'review.section': 'Section',
    'review.editSection': 'Edit section',
    'review.copyAll': 'Copy all answers',
    'review.downloadDraft': 'Download Draft Summary',
    'review.answersCopied': 'Answers copied to clipboard!',

    // Document Checklist
    'docs.title': 'Required Documents Checklist',
    'docs.sub': 'Keep physical and digital copies of these documents ready for official portal submission.',
    'docs.required': 'REQUIRED',
    'docs.optional': 'OPTIONAL',
    'docs.ready': 'Ready',
    'docs.missing': 'Missing',
    'docs.markReady': 'Mark as Ready',
    'docs.markMissing': 'Mark as Missing',

    // Readiness Summary
    'readiness.title': 'Application Readiness Summary',
    'readiness.readyStatus': 'Ready for Official Submission',
    'readiness.inProgressStatus': 'Preparation In Progress',
    'readiness.questionsComplete': 'Questions Completed',
    'readiness.documentsReady': 'Documents Ready',

    // Chatbot UI
    'chat.title': 'Ask Sahaayak',
    'chat.activeBadge': 'Guidance Only • Active',
    'chat.boundaryNotice': 'Boundary Notice: Sahaayak gives preparation guidance. It does not decide eligibility, submit an application, or replace official advice.',
    'chat.label': 'Ask a question about application preparation',
    'chat.placeholder': 'e.g. How do I write my motivation statement?',
    'chat.disclaimer': 'Maximum 300 characters. Answers are plain-text guidance only and will never alter your form entries.',
    'chat.send': 'Send question',
    'chat.sending': 'Sending...',
    'chat.unavailable': 'The chatbot service is temporarily unavailable. You can complete the guided questions manually using the standard inputs on the screen.',
    'chat.approvedSource': 'Approved Source',

    // OCR Scanner UI
    'ocr.title': 'Scan Document with OCR',
    'ocr.sub': 'Select a clear image or document scan to extract text locally.',
    'ocr.chooseFile': 'Choose document image',
    'ocr.scanning': 'Scanning document text...',
    'ocr.suggestions': 'Extracted Field Suggestions',
    'ocr.useSuggestion': 'Use this suggestion',
    'ocr.clearScan': 'Clear scan data',
    'ocr.done': 'Done Reviewing',
    'ocr.privacy': 'Privacy Notice: OCR processing is performed locally. Document contents are never sent to external servers.',

    // Submission Modal
    'modal.proceed': 'Proceed to next step →',
    'modal.stay': 'Edit later / Stay here',
  },
  kn: {
    // Header & Navigation
    'nav.brand': 'ಸಹಾಯಕ್',
    'nav.dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    'nav.selection': 'ಸಿದ್ಧತಾ ಹಂತಗಳು',
    'nav.help': 'ಸಹಾಯ ಮತ್ತು ಧ್ವನಿ',
    'nav.languageLabel': 'ಭಾಷೆ',
    'nav.signOut': 'ನಿರ್ಗಮಿಸಿ',
    'nav.signedInAs': 'ಸೈನ್ ಇನ್ ಆಗಿರುವವರು',
    'nav.voiceFill': 'ಧ್ವನಿ ಭರ್ತಿ',
    'nav.listenSection': 'ವಿಭಾಗ ಆಲಿಸಿ',
    'nav.backToDashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ',

    // Accessibility Controls
    'acc.title': 'ತ್ವರಿತ ಸುಲಭ ಪ್ರವೇಶ ನಿಯಂತ್ರಣಗಳು',
    'acc.textSize': 'ಪಠ್ಯದ ಗಾತ್ರ',
    'acc.contrast': 'ವ್ಯತ್ಯಾಸ',
    'acc.voice': 'ಧ್ವನಿ',
    'acc.speechSpeed': 'ವೇಗ',
    'acc.normal': 'ಸಾಮಾನ್ಯ',
    'acc.large': 'ದೊಡ್ಡದು',
    'acc.xLarge': 'ಅತಿ ದೊಡ್ಡದು',
    'acc.highContrast': 'ಹೆಚ್ಚಿನ ವ್ಯತ್ಯಾಸ',
    'acc.reset': 'ಮರುಹೊಂದಿಸಿ',

    // Auth Screens
    'auth.welcomeTitle': 'ಸಹಾಯಕ್ ಗೆ ಸ್ವಾಗತ',
    'auth.welcomeSub': 'ನಿಮ್ಮ ಸುಲಭ ಸ್ಕಾಲರ್‌ಶಿಪ್ ಸಿದ್ಧತಾ ಸಹಾಯಕಿ.',
    'auth.signInTab': 'ಸೈನ್ ಇನ್',
    'auth.registerTab': 'ಖಾತೆ ರಚಿಸಿ',
    'auth.emailLabel': 'ಇಮೇಲ್ ವಿಳಾಸ',
    'auth.passwordLabel': 'ಪಾಸ್‌ವರ್ಡ್',
    'auth.showPassword': 'ಪಾಸ್‌ವರ್ಡ್ ತೋರಿಸು',
    'auth.hidePassword': 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆಮಾಚಿ',
    'auth.signInSubmit': 'ವರ್ಕ್‌ಸ್ಪೇಸ್‌ಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ',
    'auth.registerSubmit': 'ಖಾತೆ ನೋಂದಾಯಿಸಿ',
    'auth.toggleToRegister': 'ಖಾತೆ ಬೇಕೆ? ಇಲ್ಲಿ ನೋಂದಾಯಿಸಿ',
    'auth.toggleToSignIn': 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ? ಸೈನ್ ಇನ್ ಮಾಡಿ',
    'auth.boundary': 'ಸಹಾಯಕ್ ಅರ್ಜಿ ಸಿದ್ಧತೆಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ. ಇದು ಅರ್ಹತೆಯನ್ನು ನಿರ್ಧರಿಸುವುದಿಲ್ಲ ಅಥವಾ ಅರ್ಜಿಯನ್ನು ಸಲ್ಲಿಸುವುದಿಲ್ಲ.',

    // Scholarship Home
    'home.heroTitle': 'ನಿಮ್ಮ ಸ್ಕಾಲರ್‌ಶಿಪ್ ಅರ್ಜಿಯನ್ನು ಹಂತ-ಹಂತವಾಗಿ ಸಿದ್ಧಪಡಿಸಿ',
    'home.heroSub': 'ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ಗಳಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ಸಹಾಯಕ್ ನಿಮ್ಮ ಪ್ರೊಫೈಲ್, ದಾಖಲೆ ಪಟ್ಟಿ ಮತ್ತು ಹೇಳಿಕೆಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.',
    'home.startPrep': 'ಅರ್ಜಿ ಸಿದ್ಧತೆ ಪ್ರಾರಂಭಿಸಿ',
    'home.explore': 'ಸಿದ್ಧತಾ ಆಯ್ಕೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ',

    // Selection Page
    'selection.title': 'ಅರ್ಜಿ ಸಿದ್ಧತಾ ಹಂತವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    'selection.sub': 'ನಿಮ್ಮ ಗುರಿಗೆ ಸೂಕ್ತವಾದ ಟೆಂಪ್ಲೇಟ್ ಆಯ್ಕೆಮಾಡಿ. ಎಲ್ಲಾ ವಿವರಗಳು ಸ್ಥಳೀಯ ಕರಡಾಗಿ ಉಳಿತ್ತವೆ.',
    'selection.progressTitle': 'ಸಿದ್ಧತಾ ಪ್ರಗತಿ',
    'selection.reviewNotice': 'ಉಳಿಸುವ ಮೊದಲು ನೀವು ಪ್ರತಿಯೊಂದು ಉತ್ತರವನ್ನು ಪರಿಶೀಲಿಸಬಹುದು.',
    'selection.chooseFlow': 'ಈ ಸಿದ್ಧತಾ ಹಂತ ಆಯ್ಕೆಮಾಡಿ',
    'selection.exploreFlow': 'ಸಿದ್ಧತೆ ಪರಿಶೀಲಿಸಿ',

    // Guided Form Workspace
    'form.step': 'ಹಂತ',
    'form.previousSection': 'ಹಿಂದಿನ ವಿಭಾಗ',
    'form.backToSelection': 'ಆಯ್ಕೆಗೆ ಹಿಂತಿರುಗಿ',
    'form.nextSection': 'ಉಳಿಸಿ ಮತ್ತು ಮುಂದಿನ ಹಂತಕ್ಕೆ ಮುಂದುವರಿಯಿರಿ →',
    'form.reviewDraftBtn': 'ಕರಡು ಸಿದ್ಧತೆ ಪರಿಶೀಲಿಸಿ →',
    'form.ocrScanBtn': 'ಓಸಿಆರ್ ನೊಂದಿಗೆ ದಾಖಲೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    'form.localDraftSaved': 'ಸ್ಥಳೀಯ ಕರಡು ಉಳಿಸಲಾಗಿದೆ',

    // Review Page
    'review.title': 'ನಿಮ್ಮ ಅರ್ಜಿ ಸಿದ್ಧತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ',
    'review.sub': 'ನಿಮ್ಮ ಟಿಪ್ಪಣಿಗಳನ್ನು ಅಂತಿಮಗೊಳಿಸುವ ಮೊದಲು ಎಲ್ಲಾ ಉತ್ತರಗಳನ್ನು ಮತ್ತು ದಾಖಲೆಗಳ ಸಿದ್ಧತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.',
    'review.section': 'ವಿಭಾಗ',
    'review.editSection': 'ವಿಭಾಗ ತಿದ್ದುಪಡಿ ಮಾಡಿ',
    'review.copyAll': 'ಎಲ್ಲಾ ಉತ್ತರಗಳನ್ನು ನಕಲಿಸಿ',
    'review.downloadDraft': 'ಕರಡು ಸಾರಾಂಶ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
    'review.answersCopied': 'ಉತ್ತರಗಳನ್ನು ಕ್ಲಿಪ್‌ಬೋರ್ಡ್‌ಗೆ ನಕಲಿಸಲಾಗಿದೆ!',

    // Document Checklist
    'docs.title': 'ಅಗತ್ಯ ದಾಖಲೆಗಳ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ',
    'docs.sub': 'ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ಗೆ ಸಲ್ಲಿಸಲು ಈ ದಾಖಲೆಗಳ ಪ್ರತಿಗಳನ್ನು ಸಿದ್ಧವಾಗಿಟ್ಟುಕೊಳ್ಳಿ.',
    'docs.required': 'ಅಗತ್ಯವಿದೆ',
    'docs.optional': 'ಐಚ್ಛಿಕ',
    'docs.ready': 'ಸಿದ್ಧವಾಗಿದೆ',
    'docs.missing': 'ಬಾಕಿ ಇದೆ',
    'docs.markReady': 'ಸಿದ್ಧವೆಂದು ಗುರುತಿಸಿ',
    'docs.markMissing': 'ಬಾಕಿ ಎಂದು ಗುರುತಿಸಿ',

    // Readiness Summary
    'readiness.title': 'ಅರ್ಜಿ ಸಿದ್ಧತಾ ಸಾರಾಂಶ',
    'readiness.readyStatus': 'ಅಧಿಕೃತ ಸಲ್ಲಿಕೆಗೆ ಸಿದ್ಧವಾಗಿದೆ',
    'readiness.inProgressStatus': 'ಸಿದ್ಧತೆ ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    'readiness.questionsComplete': 'ಪೂರ್ಣಗೊಂಡ ಪ್ರಶ್ನೆಗಳು',
    'readiness.documentsReady': 'ಸಿದ್ಧವಿರುವ ದಾಖಲೆಗಳು',

    // Chatbot UI
    'chat.title': 'ಸಹಾಯಕ್ ಅನ್ನು ಕೇಳಿ',
    'chat.activeBadge': 'ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ • ಸಕ್ರಿಯ',
    'chat.boundaryNotice': 'ಗಡಿ ಸೂಚನೆ: ಸಹಾಯಕ್ ಸಿದ್ಧತಾ ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತದೆ. ಇದು ಅರ್ಹತೆಯನ್ನು ನಿರ್ಧರಿಸುವುದಿಲ್ಲ, ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದಿಲ್ಲ ಅಥವಾ ಅಧಿಕೃತ ಸಲಹೆಯನ್ನು ಬದಲಾಯಿಸುವುದಿಲ್ಲ.',
    'chat.label': 'ಅರ್ಜಿ ಸಿದ್ಧತೆ ಕುರಿತು ಪ್ರಶ್ನೆ ಕೇಳಿ',
    'chat.placeholder': 'ಉದಾ. ನನ್ನ ಪ್ರೇರಣಾ ಹೇಳಿಕೆಯನ್ನು ಹೇಗೆ ಬರೆಯುವುದು?',
    'chat.disclaimer': 'ಗರಿಷ್ಠ 300 ಅಕ್ಷರಗಳು. ಉತ್ತರಗಳು ಪಠ್ಯ ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ ಮತ್ತು ಎಂದಿಗೂ ನಿಮ್ಮ ಫಾರ್ಮ್ ವಿವರಗಳನ್ನು ಬದಲಾಯಿಸುವುದಿಲ್ಲ.',
    'chat.send': 'ಪ್ರಶ್ನೆ ಕಳುಹಿಸಿ',
    'chat.sending': 'ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...',
    'chat.unavailable': 'ಚಾಟ್‌ಬಾಟ್ ಸೇವೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ. பரದೆಯಲ್ಲಿರುವ ಮಾನದಂಡದ ಇನ್‌ಪುಟ್‌ಗಳನ್ನು ಬಳಸಿ ನೀವು ಪ್ರಶ್ನೆಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಬಹುದು.',
    'chat.approvedSource': 'ಅನುಮೋದಿತ ಮೂಲ',

    // OCR Scanner UI
    'ocr.title': 'ಓಸಿಆರ್ ನೊಂದಿಗೆ ದಾಖಲೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    'ocr.sub': 'ಪಠ್ಯವನ್ನು ಹೊರತೆಗೆಯಲು ಸ್ಪಷ್ಟ ಚಿತ್ರ ಅಥವಾ ದಾಖಲೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    'ocr.chooseFile': 'ದಾಖಲೆ ಚಿತ್ರ ಆಯ್ಕೆಮಾಡಿ',
    'ocr.scanning': 'ದಾಖಲೆ ಪಠ್ಯವನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
    'ocr.suggestions': 'ಹೊರತೆಗೆಯಲಾದ ವಿವರಗಳ ಸಲಹೆಗಳು',
    'ocr.useSuggestion': 'ಈ ಸಲಹೆ ಬಳಸಿ',
    'ocr.clearScan': 'ಸ್ಕ್ಯಾನ್ ಮಾಹಿತಿ ತೆರವುಗೊಳಿಸಿ',
    'ocr.done': 'ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಂಡಿದೆ',
    'ocr.privacy': 'ಗೌಪ್ಯತೆ ಸೂಚನೆ: ಓಸಿಆರ್ ಪ್ರಕ್ರಿಯೆಯು ಸ್ಥಳೀಯವಾಗಿ ನಡೆಯುತ್ತದೆ. ದಾಖಲೆಯ ವಿವರಗಳನ್ನು ಬಾಹ್ಯ ಸರ್ವರ್‌ಗಳಿಗೆ ಕಳುಹಿಸುವುದಿಲ್ಲ.',

    // Submission Modal
    'modal.proceed': 'ಮುಂದಿನ ಹಂತಕ್ಕೆ ಮುಂದುವರಿಯಿರಿ →',
    'modal.stay': 'ನಂತರ ತಿದ್ದುಪಡಿ ಮಾಡಿ / ಇಲ್ಲೇ ಇರಿ',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'kn') {
        return saved;
      }
    } catch {
      // Ignore localStorage errors
    }
    return 'en';
  });

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // Ignore localStorage write errors
    }
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = (key: string, fallback?: string): string => {
    const localeDict = TRANSLATIONS[locale];
    if (localeDict && localeDict[key]) {
      return localeDict[key];
    }
    // Fallback to English dictionary
    if (TRANSLATIONS.en[key]) {
      return TRANSLATIONS.en[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
