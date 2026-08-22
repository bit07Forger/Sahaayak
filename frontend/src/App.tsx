import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useAccessibility } from './contexts/AccessibilityContext';
import { useLanguage } from './contexts/LanguageContext';
import { ScholarshipHome } from './components/ScholarshipHome';
import { AuthPage } from './components/AuthPage';
import { ProgressNavigation } from './components/ProgressNavigation';
import { LiquidGlassButton } from './components/LiquidGlassButton';
import { LanguageDropdown } from './components/LanguageDropdown';
import {
  SCHOLARSHIP_TEMPLATES,
  type ApplicationTemplate,
  type ApplicationQuestion
} from './types/scholarshipTemplates';
import { api, type ChatSource } from './services/api';
import {
  performBrowserOcr,
  validateOcrFile,
  type OcrScanResult
} from './services/browserOcr';
import { startListening, speak as speakFromService } from './services/voiceService';
import {
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Settings,
  Edit2,
  RotateCcw,
  Check,
  MessageSquare,
  Send,
  Loader2,
  Scan,
  XCircle,
  Upload,
  Sparkles,
  Sun,
  Moon,
  Mic
} from 'lucide-react';

type AuthenticatedSubView = 'dashboard' | 'selection' | 'form' | 'review';

const App: React.FC = () => {
  const { user, loading, status, login, register, logout } = useAuth();
  const { t } = useLanguage();
  const {
    textSize,
    contrast,
    voiceSpeed,
    voiceEnabled,
    theme,
    toggleTheme,
    updatePreferences,
    speak,
    speakStop
  } = useAccessibility();

  // Auth Form States
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authenticated Workspace State
  const [subView, setSubView] = useState<AuthenticatedSubView>('dashboard');
  const [selectedTemplate, setSelectedTemplate] = useState<ApplicationTemplate | null>(null);
  const [currentSectionIdx, setCurrentSectionIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);
  const [submissionModal, setSubmissionModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onProceed: () => void;
  } | null>(null);

  // Chatbot Assistant State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    status?: string;
    sources?: ChatSource[];
  }>>([]);
  const [chatSending, setChatSending] = useState(false);

  // OCR Assist State
  const [showOcrConsent, setShowOcrConsent] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrScanResult | null>(null);
  const [ocrNotice, setOcrNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenOcrConsent = () => {
    setShowOcrConsent(true);
    setOcrNotice(null);
  };

  const handleAcceptOcrConsent = () => {
    setShowOcrConsent(false);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    const validationErr = validateOcrFile(file);
    if (validationErr) {
      setOcrResult({ status: 'rejected', errorMessage: validationErr });
      setShowOcrModal(true);
      announceAndSpeak(`OCR scan warning: ${validationErr}`);
      return;
    }

    setShowOcrModal(true);
    setOcrScanning(true);
    setOcrProgress(10);
    setOcrStatusText('Initializing local browser OCR engine...');
    announceAndSpeak("Starting local browser OCR scanning...");

    const res = await performBrowserOcr(file, (progress, statusText) => {
      setOcrProgress(progress);
      setOcrStatusText(statusText);
    });

    setOcrResult(res);
    setOcrScanning(false);

    if (res.status === 'success') {
      announceAndSpeak("OCR scan complete. Candidate fields are ready for your review.");
    } else if (res.status === 'rejected') {
      announceAndSpeak(`OCR scan rejected: ${res.errorMessage}`);
    } else if (res.status === 'empty') {
      announceAndSpeak("OCR scan completed but no readable candidate text was found.");
    } else {
      announceAndSpeak(`OCR scan failed: ${res.errorMessage}`);
    }
  };

  const handleApplyOcrSuggestion = (fieldKey: string, value: string) => {
    setAnswers(prev => ({ ...prev, [fieldKey]: value }));
    setFormErrors(prev => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });

    if (ocrResult?.candidates) {
      const updatedCandidates = { ...ocrResult.candidates };
      delete (updatedCandidates as any)[fieldKey];
      setOcrResult({ ...ocrResult, candidates: updatedCandidates });
    }

    setOcrNotice(`Applied suggestion into form field. You can edit it anytime.`);
    announceAndSpeak(`Applied suggestion into form field.`);
  };

  const handleClearOcrData = () => {
    setOcrResult(null);
    setOcrProgress(0);
    setOcrScanning(false);
    setOcrNotice("Local scan data cleared.");
    announceAndSpeak("Local scan data cleared.");
  };

  // Accessibility & Live Announcements
  const [showA11yPanel, setShowA11yPanel] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  // Reference for focusing invalid fields
  const firstErrorRef = useRef<string | null>(null);

  const announceAndSpeak = (text: string) => {
    setLiveAnnouncement(text);
    speak(text);
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMsg = chatInput.trim();
    if (!cleanMsg || chatSending) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg = { id: userMsgId, role: 'user' as const, content: cleanMsg };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatSending(true);
    announceAndSpeak("Sending question to Sahaayak assistant...");

    try {
      const res = await api.sendChatMessage(cleanMsg, 'scholarship-preparation');
      const assistantMsg = {
        id: `asst-${Date.now()}`,
        role: 'assistant' as const,
        content: res.message,
        status: res.status,
        sources: res.sources,
      };
      setChatMessages(prev => [...prev, assistantMsg]);
      announceAndSpeak(`Sahaayak response: ${res.message}`);
    } catch (err: any) {
      let messageText = err.message || '';
      if (!messageText || messageText === 'Failed to fetch' || messageText.includes('fetch')) {
        messageText = 'The chatbot service is temporarily unavailable. You can complete the guided questions manually using the standard inputs on the screen.';
      }
      const errorMsg = {
        id: `asst-err-${Date.now()}`,
        role: 'assistant' as const,
        content: messageText,
        status: 'unavailable',
      };
      setChatMessages(prev => [...prev, errorMsg]);
      announceAndSpeak("Chatbot service unavailable.");
    } finally {
      setChatSending(false);
    }
  };

  useEffect(() => {
    if (loading) return;

    let announceText = '';
    if (status === 'unauthenticated') {
      if (registrationSuccess) {
        announceText = "Registration successful. You can now log in with your email and password.";
      } else {
        announceText = authTab === 'login'
          ? "Welcome to Sahaayak Scholarship Preparation. Please sign in with your email and password."
          : "Create an account for Sahaayak Scholarship Preparation. Enter your email, choose a password of at least 8 characters, and confirm it.";
      }
    } else if (status === 'authenticated') {
      if (subView === 'dashboard') {
        announceText = `Scholarship Workspace Dashboard. Signed in as ${user?.email}.`;
      } else if (subView === 'selection') {
        announceText = "Application Selection View. Choose a template to begin your preparation draft.";
      } else if (subView === 'form' && selectedTemplate) {
        const sec = selectedTemplate.sections[currentSectionIdx];
        announceText = `Section ${currentSectionIdx + 1} of ${selectedTemplate.sections.length}. ${sec.title}. ${sec.description}`;
      } else if (subView === 'review') {
        announceText = "Review Your Preparation Draft. You can review and edit all entered sections before completing.";
      }
    }

    if (announceText) {
      announceAndSpeak(announceText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, authTab, loading, registrationSuccess, subView, currentSectionIdx]);

  // Translate Firebase errors into user-friendly validation messages
  const mapAuthError = (err: any): string => {
    if (!err) return '';
    const code = err.code || '';
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    } else if (code === 'auth/email-already-in-use') {
      return 'This email address is already in use by another account.';
    } else if (code === 'auth/weak-password') {
      return 'The password is too weak. It must be at least 8 characters.';
    } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'We could not sign you in with that email and password. Please check them and try again.';
    } else if (code === 'auth/network-request-failed') {
      return 'A network error occurred. Please check your internet connection.';
    }
    return err.message || 'Authentication failed. Please check your credentials and try again.';
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      const msg = 'Email address is required.';
      setAuthError(msg);
      announceAndSpeak(`Error: ${msg}`);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      const msg = 'Please enter a valid email address.';
      setAuthError(msg);
      announceAndSpeak(`Error: ${msg}`);
      return;
    }

    if (!password) {
      const msg = 'Password is required.';
      setAuthError(msg);
      announceAndSpeak(`Error: ${msg}`);
      return;
    }

    if (authTab === 'register') {
      if (password.length < 8) {
        const msg = 'Password must be at least 8 characters long.';
        setAuthError(msg);
        announceAndSpeak(`Error: ${msg}`);
        return;
      }
      if (password !== confirmPassword) {
        const msg = 'Passwords do not match.';
        setAuthError(msg);
        announceAndSpeak(`Error: ${msg}`);
        return;
      }
    }

    setIsSubmitting(true);
    speakStop();

    try {
      if (authTab === 'register') {
        await register(trimmedEmail, password);
        setRegistrationSuccess(true);
        setAuthTab('login');
        setPassword('');
        setConfirmPassword('');
      } else {
        await login(trimmedEmail, password);
        setSubView('dashboard');
      }
    } catch (err: any) {
      const msg = mapAuthError(err);
      setAuthError(msg);
      announceAndSpeak(`Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    speakStop();
    try {
      await logout();
      setRegistrationSuccess(false);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAuthError(null);
      setSubView('dashboard');
      setSelectedTemplate(null);
      setAnswers({});
      setFormErrors({});
    } catch (err) {
      const msg = 'Logout failed. Please check your connection and try again.';
      announceAndSpeak(`Error: ${msg}`);
    }
  };

  // Form Field Change Handler
  const handleInputChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    if (formErrors[questionId]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  // Template Selection Action
  const handleSelectTemplate = (template: ApplicationTemplate) => {
    setSelectedTemplate(template);
    setCurrentSectionIdx(0);
    setFormErrors({});
    setSubView('form');
    announceAndSpeak(`Selected ${template.title}. Beginning Section 1: ${template.sections[0].title}.`);
  };

  // Section Navigation & Validation
  const handleSectionContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    const currentSection = selectedTemplate.sections[currentSectionIdx];
    const errors: Record<string, string> = {};
    let firstErrId: string | null = null;

    currentSection.questions.forEach((q) => {
      if (q.required) {
        const val = (answers[q.id] || '').trim();
        if (!val) {
          errors[q.id] = `${q.label} is required.`;
          if (!firstErrId) firstErrId = q.id;
        } else if (q.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) {
            errors[q.id] = 'Please enter a valid email address.';
            if (!firstErrId) firstErrId = q.id;
          }
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      firstErrorRef.current = firstErrId;
      const count = Object.keys(errors).length;
      const msg = `Please correct ${count} required field${count > 1 ? 's' : ''} to continue.`;
      announceAndSpeak(msg);

      // Focus first invalid field
      if (firstErrId) {
        setTimeout(() => {
          const el = document.getElementById(firstErrId!);
          if (el) el.focus();
        }, 100);
      }
      return;
    }

    setFormErrors({});

    const executeNextStep = () => {
      if (currentSectionIdx < selectedTemplate.sections.length - 1) {
        const nextIdx = currentSectionIdx + 1;
        setCurrentSectionIdx(nextIdx);
        announceAndSpeak(`Advanced to Section ${nextIdx + 1}: ${selectedTemplate.sections[nextIdx].title}.`);
      } else {
        setSubView('review');
        announceAndSpeak("Section complete. Reached Review Your Preparation Draft screen.");
      }
    };

    // Auditory Voice Response
    const responseSpeech = `Your section answers have been saved as a local draft and can be edited later. Would you like to proceed to the next step now or stay here to edit later?`;
    speakFromService(responseSpeech, { voiceSpeed });

    // Visual Submission Response Modal
    setSubmissionModal({
      isOpen: true,
      title: `✓ Section ${currentSectionIdx + 1} Answers Saved`,
      message: `Your section answers have been saved as a local draft and can be edited later at any time. Do you want to submit now or stay to edit later?`,
      onProceed: executeNextStep,
    });
  };

  const handleSectionBack = () => {
    if (currentSectionIdx > 0) {
      const prevIdx = currentSectionIdx - 1;
      setCurrentSectionIdx(prevIdx);
      announceAndSpeak(`Returned to Section ${prevIdx + 1}: ${selectedTemplate?.sections[prevIdx].title}.`);
    } else {
      setSubView('selection');
      announceAndSpeak("Returned to Application Selection View.");
    }
  };

  // Edit Section from Review
  const handleEditSection = (sectionIdx: number) => {
    setCurrentSectionIdx(sectionIdx);
    setSubView('form');
    announceAndSpeak(`Editing Section ${sectionIdx + 1}: ${selectedTemplate?.sections[sectionIdx].title}.`);
  };

  // Start Over Action
  const handleConfirmStartOver = () => {
    setAnswers({});
    setFormErrors({});
    setSelectedTemplate(null);
    setCurrentSectionIdx(0);
    setShowStartOverConfirm(false);
    setSubView('dashboard');
    announceAndSpeak("Preparation draft cleared. Returned to Dashboard.");
  };

  // Read Aloud Helpers
  const handleReadDashboardOverview = () => {
    const text = "Prepare your scholarship application, one clear step at a time. Sahaayak helps you prepare. It does not decide eligibility or submit an application. First, answer at your pace. Second, review before saving. Third, keep documents organized.";
    speakFromService(text, { voiceSpeed });
    announceAndSpeak(text);
  };

  const handleReadSectionOverview = () => {
    if (!selectedTemplate) return;
    const sec = selectedTemplate.sections[currentSectionIdx];
    const questionLabels = sec.questions.map(q => q.label).join('. ');
    const text = `Section ${currentSectionIdx + 1}: ${sec.title}. ${sec.description}. Questions: ${questionLabels}`;
    speakFromService(text, { voiceSpeed });
    announceAndSpeak(text);
  };

  // Voice Listening State per Question
  const [listeningQuestionId, setListeningQuestionId] = useState<string | null>(null);
  const [stopListeningFn, setStopListeningFn] = useState<(() => void) | null>(null);

  // Sequential Voice Fill Handler: Listens for a question, records the answer, then shifts to the immediate next field and tells the user what to fill!
  const startVoiceListeningForQuestion = (qIdx: number) => {
    if (!selectedTemplate) return;
    const currentSection = selectedTemplate.sections[currentSectionIdx];
    if (!currentSection || qIdx < 0 || qIdx >= currentSection.questions.length) {
      setListeningQuestionId(null);
      setStopListeningFn(null);
      announceAndSpeak("All questions in this section have been filled by voice.");
      return;
    }

    const currentQuestion = currentSection.questions[qIdx];

    if (stopListeningFn) {
      stopListeningFn();
    }

    // 1. Focus the field visually
    setTimeout(() => {
      const el = document.getElementById(currentQuestion.id);
      if (el) el.focus();
    }, 100);

    // 2. Tell the user what to fill in this field
    const guidanceText = currentQuestion.helperText
      ? `Field: ${currentQuestion.label}. Guidance: ${currentQuestion.helperText}. Please speak your answer now.`
      : `Field: ${currentQuestion.label}. Please speak your answer now.`;

    speakFromService(guidanceText, { voiceSpeed });
    announceAndSpeak(guidanceText);
    setListeningQuestionId(currentQuestion.id);

    // 3. Start listening for the answer
    const stop = startListening(
      (result) => {
        if (result.transcript) {
          handleInputChange(currentQuestion.id, result.transcript);
          if (result.isFinal) {
            setListeningQuestionId(null);
            setStopListeningFn(null);

            const nextQIdx = qIdx + 1;
            if (nextQIdx < currentSection.questions.length) {
              const nextQ = currentSection.questions[nextQIdx];
              const transitionMsg = `Recorded answer for ${currentQuestion.label}. Next field is ${nextQ.label}.`;
              announceAndSpeak(transitionMsg);
              speakFromService(transitionMsg, { voiceSpeed });

              // Automatically shift to the immediate next field
              setTimeout(() => {
                startVoiceListeningForQuestion(nextQIdx);
              }, 1800);
            } else {
              const completeMsg = `Recorded answer for ${currentQuestion.label}. All fields in this section are complete.`;
              announceAndSpeak(completeMsg);
              speakFromService(completeMsg, { voiceSpeed });
            }
          }
        }
      },
      (error) => {
        setListeningQuestionId(null);
        setStopListeningFn(null);
        announceAndSpeak(`Voice error on ${currentQuestion.label}: ${error}`);
      }
    );

    if (stop) {
      setStopListeningFn(() => stop);
    } else {
      setListeningQuestionId(null);
    }
  };

  // Global Voice Fill Handler for Top Header Voice Button
  const handleGlobalVoiceFill = () => {
    if (!selectedTemplate) return;
    const currentSection = selectedTemplate.sections[currentSectionIdx];
    if (!currentSection || currentSection.questions.length === 0) return;

    if (listeningQuestionId) {
      if (stopListeningFn) stopListeningFn();
      setListeningQuestionId(null);
      setStopListeningFn(null);
      announceAndSpeak("Voice fill paused.");
      return;
    }

    // Find the first unfilled question index, or start at index 0
    let targetIdx = currentSection.questions.findIndex(q => !answers[q.id]?.trim());
    if (targetIdx === -1) targetIdx = 0;

    startVoiceListeningForQuestion(targetIdx);
  };

  const handleToggleVoiceInput = (questionId: string) => {
    if (listeningQuestionId === questionId) {
      if (stopListeningFn) {
        stopListeningFn();
      }
      setListeningQuestionId(null);
      setStopListeningFn(null);
      announceAndSpeak("Voice listening stopped.");
      return;
    }

    if (stopListeningFn) {
      stopListeningFn();
    }

    announceAndSpeak("Listening for your spoken answer. Speak clearly into your microphone.");
    setListeningQuestionId(questionId);

    const stop = startListening(
      (result) => {
        if (result.transcript) {
          handleInputChange(questionId, result.transcript);
          if (result.isFinal) {
            setListeningQuestionId(null);
            setStopListeningFn(null);
            announceAndSpeak(`Recorded answer: ${result.transcript}`);
          }
        }
      },
      (error) => {
        setListeningQuestionId(null);
        setStopListeningFn(null);
        announceAndSpeak(`Voice error: ${error}`);
      }
    );

    if (stop) {
      setStopListeningFn(() => stop);
    } else {
      setListeningQuestionId(null);
    }
  };

  // Render Form Input Control
  const renderQuestionControl = (q: ApplicationQuestion) => {
    const value = answers[q.id] || '';
    const errorMsg = formErrors[q.id];
    const isListening = listeningQuestionId === q.id;

    const inputBaseClasses = `w-full min-h-[48px] px-4 py-3 rounded-xl transition-all outline-none font-hyperlegible text-base ${
      contrast === 'high'
        ? 'bg-black border-2 border-white focus-visible:border-yellow-400 text-white'
        : errorMsg
          ? 'bg-rose-50/50 border-2 border-[#A83A3A] focus:border-[#A83A3A] text-[#172033]'
          : 'bg-white border border-[#E6E2D9] focus:border-[#34456B] focus:ring-2 focus:ring-[#34456B]/20 text-[#172033]'
    }`;

    return (
      <div key={q.id} className="space-y-3 p-5 sm:p-6 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] transition-all shadow-sm">
        {/* Question Header */}
        <div className="space-y-1">
          <label htmlFor={q.id} className="block text-base sm:text-lg font-bold font-hyperlegible text-[#172033] theme-high-contrast:text-white">
            {q.label} {q.required && <span className="text-[#A83A3A] theme-high-contrast:text-yellow-400 font-bold" aria-hidden="true">*</span>}
          </label>

          {q.helperText && (
            <p id={`${q.id}-help`} className="text-sm text-[#5B6475] theme-high-contrast:text-white/80 font-hyperlegible leading-relaxed">
              {q.helperText}
            </p>
          )}

          {isListening && (
            <p className="text-xs font-bold text-rose-600 animate-pulse flex items-center gap-1.5 font-hyperlegible pt-1">
              <Mic size={14} className="animate-bounce" />
              <span>Listening to your voice... Speak your answer now.</span>
            </p>
          )}
        </div>

        {/* Listening Active Banner */}
        {isListening && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-hyperlegible flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              Microphone active. Speak out your answer clearly...
            </span>
            <button
              type="button"
              onClick={() => handleToggleVoiceInput(q.id)}
              className="text-xs font-bold underline cursor-pointer"
            >
              Stop
            </button>
          </div>
        )}

        {/* Input Control */}
        {q.type === 'textarea' ? (
          <textarea
            id={q.id}
            name={q.id}
            required={q.required}
            rows={5}
            value={value}
            onChange={(e) => handleInputChange(q.id, e.target.value)}
            placeholder={q.placeholder || 'Type or speak out your answer here...'}
            aria-invalid={errorMsg ? 'true' : 'false'}
            aria-describedby={`${q.id}-help ${errorMsg ? `${q.id}-err` : ''}`}
            className={`${inputBaseClasses} min-h-[140px] resize-y`}
          />
        ) : q.type === 'select' ? (
          <select
            id={q.id}
            name={q.id}
            required={q.required}
            value={value}
            onChange={(e) => handleInputChange(q.id, e.target.value)}
            aria-invalid={errorMsg ? 'true' : 'false'}
            aria-describedby={`${q.id}-help ${errorMsg ? `${q.id}-err` : ''}`}
            className={inputBaseClasses}
          >
            {q.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={q.type}
            id={q.id}
            name={q.id}
            required={q.required}
            value={value}
            onChange={(e) => handleInputChange(q.id, e.target.value)}
            placeholder={q.placeholder || 'Type or speak out your answer here...'}
            autoComplete={q.autoComplete}
            aria-invalid={errorMsg ? 'true' : 'false'}
            aria-describedby={`${q.id}-help ${errorMsg ? `${q.id}-err` : ''}`}
            className={inputBaseClasses}
          />
        )}

        {errorMsg && (
          <p id={`${q.id}-err`} className="text-sm text-[#A83A3A] theme-high-contrast:text-red-400 font-bold flex items-center gap-1.5 font-hyperlegible mt-1.5" role="alert">
            <AlertTriangle size={16} className="shrink-0 text-[#A83A3A] theme-high-contrast:text-red-400" />
            <span>{errorMsg}</span>
          </p>
        )}
      </div>
    );
  };

  // Calm accessible loading state
  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors duration-200 ${
          contrast === 'high' ? 'bg-black text-white' : 'bg-[var(--surface-page)] text-[var(--ink-primary)]'
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <div
            className={`animate-spin w-12 h-12 border-4 rounded-full border-t-transparent mx-auto mb-4 ${
              contrast === 'high' ? 'border-yellow-400' : 'border-[var(--ink-primary)]'
            }`}
            aria-hidden="true"
          ></div>
          <p className="font-bold text-lg font-fraunces">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <AuthPage
        authTab={authTab}
        setAuthTab={setAuthTab}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        authError={authError}
        setAuthError={setAuthError}
        registrationSuccess={registrationSuccess}
        isSubmitting={isSubmitting}
        handleAuthSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200`}>
      {/* Skip Link to Main Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-black focus:font-bold focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Screen Reader ARIA Live Region */}
      <div className="sr-only" role="status" aria-live="polite">
        {liveAnnouncement}
      </div>

      <header className={`sticky top-0 z-40 min-h-[72px] py-2 transition-colors duration-200 border-b backdrop-blur-md flex items-center ${
        contrast === 'high'
          ? 'bg-black text-white border-yellow-400'
          : 'bg-[var(--surface-panel)]/90 text-[var(--ink-primary)] border-[var(--border-subtle)] shadow-sm'
      }`}>
        <div className="w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 mx-auto flex items-center justify-between gap-3">
          {/* Left: Enhanced Sahaayak Wordmark Logo */}
          <div
            className="flex items-center gap-3.5 cursor-pointer shrink-0 group transition-all"
            onClick={() => setSubView('dashboard')}
            title="Go to Sahaayak Scholarship Studio Dashboard"
          >
            <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center font-fraunces font-extrabold text-xl shadow-md transition-all duration-200 group-hover:scale-105 ${
              contrast === 'high'
                ? 'bg-yellow-400 text-black border-2 border-yellow-400'
                : 'bg-gradient-to-br from-[#34456B] to-[#172033] text-white border border-white/20'
            }`}>
              <span className="relative z-10 leading-none">S</span>
              <span className="w-2 h-2 rounded-full bg-[#D99020] absolute bottom-1.5 right-1.5 shadow-sm" aria-hidden="true" />
            </div>
            <div>
              <span className="font-fraunces font-bold text-2xl tracking-tight text-[var(--ink-primary)] block leading-none transition-colors group-hover:text-[#34456B]">
                Sahaayak
              </span>
              <span className="font-hyperlegible text-[10px] uppercase tracking-[0.18em] font-bold text-[#D99020] block mt-1">
                SCHOLARSHIP STUDIO
              </span>
            </div>
          </div>

          {/* Center: Preparation Progress Navigation (Single Horizontal Row) */}
          <nav className="hidden lg:flex items-center gap-1.5 font-hyperlegible text-xs font-semibold text-[var(--ink-secondary)]">
            <button
              onClick={() => setSubView('dashboard')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                subView === 'dashboard' ? 'bg-[var(--brand-saffron)]/15 text-[var(--brand-saffron)] font-bold' : 'hover:text-[var(--ink-primary)]'
              }`}
            >
              <span className="font-bold">01</span> Start
            </button>
            <span className="text-[var(--ink-muted)] font-bold text-[10px]">→</span>
            <button
              onClick={() => setSubView('selection')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                subView === 'selection' ? 'bg-[var(--brand-saffron)]/15 text-[var(--brand-saffron)] font-bold' : 'hover:text-[var(--ink-primary)]'
              }`}
            >
              <span className="font-bold">02</span> Profile
            </button>
            <span className="text-[var(--ink-muted)] font-bold text-[10px]">→</span>
            <button
              onClick={() => setSubView('form')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                subView === 'form' ? 'bg-[var(--brand-saffron)]/15 text-[var(--brand-saffron)] font-bold' : 'hover:text-[var(--ink-primary)]'
              }`}
            >
              <span className="font-bold">03</span> Details
            </button>
            <span className="text-[var(--ink-muted)] font-bold text-[10px]">→</span>
            <button
              onClick={() => setSubView('review')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                subView === 'review' ? 'bg-[var(--brand-saffron)]/15 text-[var(--brand-saffron)] font-bold' : 'hover:text-[var(--ink-primary)]'
              }`}
            >
              <span className="font-bold">04</span> Docs
            </button>
            <span className="text-[var(--ink-muted)] font-bold text-[10px]">→</span>
            <button
              onClick={() => setSubView('dashboard')}
              className="px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 hover:text-[var(--ink-primary)]"
            >
              <span className="font-bold text-[var(--brand-sage)]">05</span> Readiness
            </button>
          </nav>

          {/* Right: Accessible Language Dropdown + Accessibility Controls + Theme Toggle + Actions */}
          <div className="flex items-center gap-2 shrink-0 font-hyperlegible">
            {/* Top-Right Accessible Language Selector Dropdown */}
            <LanguageDropdown id="app-header-language-select" onAnnounce={announceAndSpeak} />

            {/* Quick Listen / Speak Overview Button */}
            <button
              onClick={() => {
                if (subView === 'dashboard') handleReadDashboardOverview();
                else if (subView === 'form') handleReadSectionOverview();
                else {
                  const text = "Select an application preparation flow. Choose the template that fits your scholarship goal.";
                  speakFromService(text, { voiceSpeed });
                  announceAndSpeak(text);
                }
              }}
              className="h-10 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-[var(--surface-soft)] border border-[var(--border-subtle)] text-[var(--ink-primary)] hover:bg-[var(--surface-panel)] transition-all cursor-pointer min-h-[44px]"
              aria-label="Listen to page overview audio"
              title="Listen to page overview audio"
            >
              <Volume2 size={16} className="text-[var(--brand-saffron)]" />
              <span className="hidden sm:inline font-bold">Listen</span>
            </button>

            {/* Quick Text Scale Button */}
            <button
              onClick={() => updatePreferences({ textSize: textSize === 'normal' ? 'large' : textSize === 'large' ? 'xlarge' : 'normal' })}
              className="h-10 px-3 rounded-xl text-xs font-bold bg-[var(--surface-soft)] border border-[var(--border-subtle)] text-[var(--ink-primary)] hover:bg-[var(--surface-panel)] transition-all cursor-pointer min-h-[44px]"
              aria-label="Cycle text scale font size"
              title={`Current text size: ${textSize}. Click to cycle.`}
            >
              <span>A+ {textSize.toUpperCase()}</span>
            </button>

            {/* Quick Contrast Mode Toggle Button */}
            <button
              onClick={() => updatePreferences({ contrast: contrast === 'normal' ? 'high' : 'normal' })}
              className={`h-10 px-3 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer min-h-[44px] border ${
                contrast === 'high'
                  ? 'bg-yellow-400 text-black border-yellow-400 font-extrabold'
                  : 'bg-[var(--surface-soft)] border-[var(--border-subtle)] text-[var(--ink-primary)] hover:bg-[var(--surface-panel)]'
              }`}
              aria-label="Toggle high contrast accessibility mode"
              title="Toggle High Contrast mode"
            >
              <span>◐ {contrast === 'high' ? 'High' : 'Contrast'}</span>
            </button>

            {/* Light/Dark Mode Icon Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--surface-soft)] border border-[var(--border-subtle)] text-[var(--ink-primary)] hover:bg-[var(--surface-panel)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--brand-indigo)] min-h-[44px] shrink-0"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun size={18} className="text-[var(--brand-saffron)]" /> : <Moon size={18} className="text-[var(--brand-indigo)]" />}
            </button>

            {/* Full Preferences Panel Toggle */}
            <button
              onClick={() => setShowA11yPanel(!showA11yPanel)}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--surface-soft)] border border-[var(--border-subtle)] text-[var(--ink-primary)] hover:bg-[var(--surface-panel)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--brand-indigo)] min-h-[44px] shrink-0"
              aria-label="Toggle Full Preferences Toolbar"
              aria-expanded={showA11yPanel}
              title="Full Accessibility Settings"
            >
              <Settings size={18} />
            </button>

            {/* Logout Button */}
            {status === 'authenticated' && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 h-10 px-3 rounded-xl text-xs font-bold font-hyperlegible text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all cursor-pointer min-h-[44px] shrink-0"
                aria-label="Log Out"
              >
                <LogOut size={15} />
                <span className="hidden md:inline">Logout</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ACCESSIBILITY PREFERENCES FLOATING BAR */}
      {showA11yPanel && (
        <section
          className={`py-6 border-b transition-all ${
            contrast === 'high'
              ? 'bg-black text-white border-yellow-400'
              : 'bg-slate-50 text-[var(--ink-primary)] border-[var(--border-subtle)] shadow-inner'
          }`}
          aria-label="Accessibility settings panel"
        >
          <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2 font-hyperlegible">1. Text Size</label>
              <div className="flex gap-2">
                {['normal', 'large', 'xlarge'].map((size) => (
                  <button
                    key={size}
                    onClick={() => updatePreferences({ textSize: size })}
                    className={`flex-1 py-2 text-xs uppercase font-bold rounded-lg border-2 ${
                      textSize === size
                        ? (contrast === 'high' ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-[var(--ink-primary)] text-white border-[var(--ink-primary)]')
                        : (contrast === 'high' ? 'bg-black text-white border-white' : 'bg-white border-slate-355 text-slate-700')
                    }`}
                  >
                    {size === 'normal' ? 'Normal' : size === 'large' ? 'Large' : 'Extra'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 font-hyperlegible">2. Color Contrast</label>
              <div className="flex gap-2">
                {[
                  { key: 'normal', label: 'Default' },
                  { key: 'high', label: 'High Contrast' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => updatePreferences({ contrast: item.key })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 ${
                      contrast === item.key
                        ? (contrast === 'high' ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-[var(--ink-primary)] text-white border-[var(--ink-primary)]')
                        : (contrast === 'high' ? 'bg-black text-white border-white' : 'bg-white border-slate-355 text-slate-700')
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 font-hyperlegible">3. Audio Assist (TTS)</label>
              <button
                onClick={() => updatePreferences({ voiceEnabled: !voiceEnabled })}
                className={`w-full py-2 flex items-center justify-center gap-2 text-xs font-bold rounded-lg border-2 ${
                  voiceEnabled
                    ? (contrast === 'high' ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-[var(--ink-primary)] text-white border-[var(--ink-primary)]')
                    : (contrast === 'high' ? 'bg-black text-white border-white' : 'bg-white border-slate-355 text-slate-700')
                }`}
              >
                {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                {voiceEnabled ? 'Read Aloud On' : 'Read Aloud Off'}
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 font-hyperlegible">4. Reading Speed</label>
              <div className="flex gap-2">
                {['slow', 'normal', 'fast'].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => updatePreferences({ voiceSpeed: speed })}
                    disabled={!voiceEnabled}
                    className={`flex-1 py-2 text-xs uppercase font-bold rounded-lg border-2 ${
                      !voiceEnabled
                        ? 'opacity-50 cursor-not-allowed'
                        : voiceSpeed === speed
                          ? (contrast === 'high' ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-[var(--ink-primary)] text-white border-[var(--ink-primary)]')
                          : (contrast === 'high' ? 'bg-black text-white border-white' : 'bg-white border-slate-355 text-slate-700')
                    }`}
                  >
                    {speed}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MAIN CONTAINER WORKSPACE */}
      <main id="main-content" className="flex-1 w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 mx-auto py-6 sm:py-8 focus:outline-none" tabIndex={-1}>

        {/* STATE: SIGNED IN VIEW (AUTHENTICATED SCHOLARSHIP WORKSPACE SHELL) */}
        {status === 'authenticated' && (
          subView === 'dashboard' ? (
            <ScholarshipHome
              userEmail={user?.email || undefined}
              onStartScholarship={() => setSubView('selection')}
              onStartOtherApplication={() => setSubView('selection')}
              onOpenChat={() => {
                const chatElement = document.querySelector('section[aria-label="Ask Sahaayak Chatbot Assistant"]');
                chatElement?.scrollIntoView({ behavior: 'smooth' });
                (chatElement?.querySelector('input') as HTMLInputElement)?.focus();
              }}
              onReadOverview={handleReadDashboardOverview}
            />
          ) : (
            <div className="w-full max-w-[1240px] mx-auto space-y-6">

              {/* SUBVIEW B: APPLICATION SELECTION */}
              {subView === 'selection' && (
                <div className="max-w-[760px] mx-auto space-y-8 py-2">
                  {/* Wayfinding & Progress Navigation Block */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#D99020] font-hyperlegible block">
                          {t('selection.progressTitle', 'PREPARATION PROGRESS')}
                        </span>
                        <p className="text-xs text-[var(--ink-secondary)] font-hyperlegible">
                          {t('selection.reviewNotice', 'You can review every answer before it is saved.')}
                        </p>
                      </div>

                      <LiquidGlassButton
                        type="button"
                        variant="tertiary"
                        onClick={() => setSubView('dashboard')}
                        icon={<ArrowLeft size={16} />}
                      >
                        {t('nav.backToDashboard', 'Back to dashboard')}
                      </LiquidGlassButton>
                    </div>

                    <ProgressNavigation
                      subView={subView}
                      onNavigate={(view) => setSubView(view)}
                    />
                  </div>

                  {/* Page Title & Copy */}
                  <section className="space-y-2 text-left">
                    <h2 className="text-3xl md:text-4xl font-bold font-fraunces tracking-tight text-[var(--ink-primary)]">
                      {t('selection.title', 'Select an application preparation flow')}
                    </h2>
                    <p className="text-sm md:text-base text-[var(--ink-secondary)] font-hyperlegible leading-relaxed">
                      {t('selection.sub', 'Choose the template that fits your goal. All entries are saved in-memory as a local draft during this session.')}
                    </p>
                  </section>

                  {/* Refined PreparationFlowCard Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    {SCHOLARSHIP_TEMPLATES.map((tmpl, index) => {
                      const isPrimary = index === 0;

                      return (
                        <div
                          key={tmpl.id}
                          className={`p-7 rounded-3xl border flex flex-col justify-between space-y-6 transition-all ${
                            isPrimary
                              ? 'bg-[var(--surface-panel)] border-[var(--border-subtle)] shadow-[var(--shadow-soft)]'
                              : 'bg-[var(--surface-soft)] border-[var(--border-subtle)] shadow-sm'
                          }`}
                        >
                          <div className="space-y-3 text-left">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md font-hyperlegible ${
                                  isPrimary
                                    ? 'bg-[#D99020]/15 text-[#D99020]'
                                    : 'bg-[var(--ink-secondary)]/10 text-[var(--ink-secondary)]'
                                }`}
                              >
                                {tmpl.sections.length} SECTIONS • {isPrimary ? 'PRIMARY WORKFLOW' : 'GENERIC TEMPLATE'}
                              </span>
                              <span className="text-xs text-[var(--ink-muted)] font-hyperlegible">
                                Local Draft
                              </span>
                            </div>

                            <h3 className="text-2xl font-semibold font-fraunces text-[var(--ink-primary)]">
                              {tmpl.title}
                            </h3>

                            <p className="text-sm text-[var(--ink-secondary)] font-hyperlegible leading-relaxed">
                              {tmpl.description}
                            </p>

                            <p className="text-xs text-[var(--ink-muted)] italic font-hyperlegible">
                              {tmpl.statusMessage}
                            </p>
                          </div>

                          <div className="pt-2">
                            <LiquidGlassButton
                              type="button"
                              variant={isPrimary ? 'primary' : 'secondary'}
                              onClick={() => handleSelectTemplate(tmpl)}
                              icon={<ArrowRight size={18} />}
                              className="w-full"
                            >
                              {isPrimary ? t('selection.chooseFlow', 'Choose this preparation flow') : t('selection.exploreFlow', 'Explore preparation')}
                            </LiquidGlassButton>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUBVIEW C: GUIDED MULTI-STEP SCHOLARSHIP FORM */}
              {subView === 'form' && selectedTemplate && (
                <div className="max-w-[760px] mx-auto space-y-8 py-2">

                  <ProgressNavigation
                    subView={subView}
                    currentSectionIdx={currentSectionIdx}
                    totalSections={selectedTemplate.sections.length}
                    onNavigate={(view) => setSubView(view)}
                  />

                  {/* Form Workspace Navigation Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={handleSectionBack}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold font-hyperlegible transition-colors ${
                        contrast === 'high'
                          ? 'text-yellow-400 hover:underline'
                          : 'text-[#5B6475] hover:text-[#172033] bg-white border border-[#E6E2D9] shadow-sm'
                      }`}
                    >
                      <ArrowLeft size={16} />
                      <span>{currentSectionIdx === 0 ? t('form.backToSelection', 'Back to Selection') : t('form.previousSection', 'Previous Section')}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Top Voice Fill Button */}
                      <button
                        type="button"
                        onClick={handleGlobalVoiceFill}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-hyperlegible border transition-all cursor-pointer ${
                          listeningQuestionId
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md animate-pulse'
                            : contrast === 'high'
                            ? 'border-yellow-400 text-yellow-400 bg-black hover:bg-yellow-400 hover:text-black'
                            : 'border-[#E6E2D9] text-[#172033] bg-white hover:bg-slate-50 shadow-sm'
                        }`}
                        aria-label="Voice fill form field"
                        title="Voice fill out form field"
                      >
                        <Mic size={16} className={listeningQuestionId ? 'animate-bounce text-white' : 'text-[#D99020]'} />
                        <span>{listeningQuestionId ? 'Listening...' : `🎙️ ${t('nav.voiceFill', 'Voice Fill')}`}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleReadSectionOverview}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-hyperlegible border transition-all cursor-pointer ${
                          contrast === 'high'
                            ? 'border-yellow-400 text-white hover:bg-yellow-400 hover:text-black'
                            : 'border-[#E6E2D9] text-[#172033] bg-white hover:bg-slate-50 shadow-sm'
                        }`}
                        aria-label="Listen to current section instructions"
                      >
                        <Volume2 size={16} className="text-[#D99020]" />
                        <span>{t('nav.listenSection', 'Listen to Section')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const chatElement = document.querySelector('section[aria-label="Ask Sahaayak Chatbot Assistant"]');
                          chatElement?.scrollIntoView({ behavior: 'smooth' });
                          (chatElement?.querySelector('input') as HTMLInputElement)?.focus();
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-hyperlegible bg-indigo-50 border border-indigo-200 text-indigo-900 hover:bg-indigo-100 shadow-sm transition-all"
                      >
                        <Sparkles size={14} className="text-indigo-600" />
                        <span>{t('chat.title', 'Ask Sahaayak')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Form Card Container */}
                  <section
                    className={`p-6 sm:p-9 rounded-3xl border transition-all shadow-sm ${
                      contrast === 'high'
                        ? 'bg-black border-yellow-400 border-4 text-white'
                        : 'bg-white border-[#E6E2D9] text-[#172033]'
                    }`}
                  >
                    {/* Header Eyebrow & Progress */}
                    <div className="mb-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-bold tracking-widest px-3 py-1 rounded-md bg-amber-100/90 text-amber-950 font-hyperlegible">
                          SECTION {currentSectionIdx + 1} OF {selectedTemplate.sections.length}
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#52745C] font-hyperlegible">
                          <CheckCircle2 size={14} />
                          <span>Draft saved locally</span>
                        </span>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-[#34456B] transition-all duration-300 rounded-full"
                          style={{ width: `${((currentSectionIdx + 1) / selectedTemplate.sections.length) * 100}%` }}
                          role="progressbar"
                          aria-valuenow={currentSectionIdx + 1}
                          aria-valuemin={1}
                          aria-valuemax={selectedTemplate.sections.length}
                          aria-label={`Progress: Section ${currentSectionIdx + 1} of ${selectedTemplate.sections.length}`}
                        />
                      </div>

                      {/* Section Title & Description */}
                      <div className="pt-2 space-y-1.5">
                        <h2 className="text-2xl sm:text-3xl font-bold font-fraunces text-[#172033] theme-high-contrast:text-white">
                          {selectedTemplate.sections[currentSectionIdx].title}
                        </h2>
                        <p className="text-sm sm:text-base font-hyperlegible text-[#5B6475] theme-high-contrast:text-white leading-relaxed">
                          {selectedTemplate.sections[currentSectionIdx].description}
                        </p>
                      </div>
                    </div>

                    {/* Optional OCR Assist Banner */}
                    <div className="p-4 mb-6 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-indigo-950 text-xs font-hyperlegible theme-high-contrast:bg-black theme-high-contrast:border-white theme-high-contrast:text-white">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <Scan size={18} className="text-indigo-600 shrink-0" />
                          <span>Optional Local Scan Assist</span>
                        </div>
                        <p className="opacity-85 leading-relaxed">
                          Have a user-created preparation summary note? You can scan it locally in your browser to extract suggestions.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenOcrConsent}
                        className="shrink-0 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs font-hyperlegible bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                      >
                        <Scan size={14} />
                        <span>{t('form.ocrScanBtn', 'Scan Document with OCR')}</span>
                      </button>
                    </div>

                    {ocrNotice && (
                      <div
                        className="p-3.5 mb-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-hyperlegible flex items-center justify-between"
                        role="status"
                        aria-live="polite"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          <span>{ocrNotice}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOcrNotice(null)}
                          className="text-xs font-bold underline opacity-75 hover:opacity-100"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    {/* Guided Form Fields */}
                    <form onSubmit={handleSectionContinue} noValidate className="space-y-7">
                      {selectedTemplate.sections[currentSectionIdx].questions.map((q) => renderQuestionControl(q))}

                      {/* Navigation Action Bar */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E6E2D9]">
                        <button
                          type="button"
                          onClick={handleSectionBack}
                          className="w-full sm:w-auto h-12 min-h-[48px] px-6 rounded-xl font-bold text-base font-hyperlegible text-[#172033] bg-white border border-[#E6E2D9] hover:bg-slate-50 transition-all btn-secondary"
                        >
                          ← {t('form.previousSection', 'Previous Section')}
                        </button>

                        <button
                          type="submit"
                          className="w-full sm:w-auto h-12 min-h-[48px] px-8 rounded-xl font-bold flex items-center justify-center gap-2.5 text-base font-hyperlegible text-white bg-[#34456B] hover:bg-[#263653] shadow-md transition-all btn-primary"
                        >
                          <span>{currentSectionIdx === selectedTemplate.sections.length - 1 ? t('form.reviewDraftBtn', 'Review Preparation Draft →') : t('form.nextSection', 'Save & Proceed to Next Step →')}</span>
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </form>
                  </section>
                </div>
              )}

              {/* SUBVIEW D: REVIEW PREPARATION DRAFT */}
              {subView === 'review' && selectedTemplate && (
                <div className="space-y-6">
                  <section
                    className={`p-6 md:p-8 rounded-2xl border transition-all ${
                      contrast === 'high'
                        ? 'bg-black border-yellow-400 border-4 text-white'
                        : 'bg-[var(--surface-panel)] border-[var(--border-subtle)] shadow-sm text-[var(--ink-primary)]'
                    }`}
                  >
                    <div className="mb-6 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-600 theme-high-contrast:text-yellow-400 font-bold text-xs uppercase tracking-wider">
                        <CheckCircle2 size={16} />
                        Draft Completed
                      </div>
                      <h2 className="text-2xl md:text-3xl font-extrabold font-fraunces">
                        {t('review.title', 'Review Your Application Preparation')}
                      </h2>
                      <p className="text-sm opacity-85 font-hyperlegible">
                        {t('review.sub', 'Review all prepared answers and document readiness before finalizing your notes.')}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border mb-6 text-sm leading-relaxed bg-blue-50/50 border-blue-200 text-blue-900 theme-high-contrast:bg-black theme-high-contrast:border-yellow-400 theme-high-contrast:text-white font-hyperlegible">
                      <p className="font-bold mb-1">Status Summary:</p>
                      {t('selection.reviewNotice', 'You can review every answer before it is saved.')}
                    </div>

                    <div className="space-y-6 mb-8">
                      {selectedTemplate.sections.map((sec, secIdx) => (
                        <div
                          key={sec.id}
                          className={`p-5 rounded-xl border ${
                            contrast === 'high'
                              ? 'border-yellow-400 bg-black text-white'
                              : 'border-[var(--border-subtle)] bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4 border-b border-slate-200 theme-high-contrast:border-yellow-400 pb-2">
                            <h3 className="font-bold font-fraunces text-base">{sec.title}</h3>
                            <button
                              onClick={() => handleEditSection(secIdx)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-hyperlegible transition-colors ${
                                contrast === 'high'
                                  ? 'bg-yellow-400 text-black'
                                  : 'bg-white border border-slate-300 text-[var(--ink-primary)] hover:bg-slate-100'
                              }`}
                              aria-label={`Edit section: ${sec.title}`}
                            >
                              <Edit2 size={14} />
                              <span>{t('review.editSection', 'Edit section')}</span>
                            </button>
                          </div>

                          <dl className="space-y-3 font-hyperlegible text-sm">
                            {sec.questions.map((q) => {
                              const rawVal = answers[q.id];
                              let displayVal = rawVal;
                              if (q.type === 'select' && q.options) {
                                const matchedOpt = q.options.find(o => o.value === rawVal);
                                if (matchedOpt) displayVal = matchedOpt.label;
                              }

                              return (
                                <div key={q.id} className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-1">
                                  <dt className="font-bold text-[var(--ink-secondary)] theme-high-contrast:text-slate-300">
                                    {q.label}:
                                  </dt>
                                  <dd className="sm:col-span-2 text-[var(--ink-primary)] theme-high-contrast:text-white">
                                    {displayVal ? (
                                      <span className="whitespace-pre-wrap">{displayVal}</span>
                                    ) : (
                                      <span className="italic opacity-60">Not provided (Optional)</span>
                                    )}
                                  </dd>
                                </div>
                              );
                            })}
                          </dl>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--border-subtle)]">
                      <button
                        type="button"
                        onClick={() => setShowStartOverConfirm(true)}
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold font-hyperlegible flex items-center justify-center gap-2 transition-colors ${
                          contrast === 'high'
                            ? 'border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black'
                            : 'border border-rose-300 text-rose-700 hover:bg-rose-50'
                        }`}
                      >
                        <RotateCcw size={16} />
                        <span>Start over</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditSection(selectedTemplate.sections.length - 1)}
                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold font-hyperlegible transition-colors ${
                          contrast === 'high'
                            ? 'border-2 border-white text-white hover:bg-white hover:text-black'
                            : 'border border-slate-300 text-[var(--ink-primary)] hover:bg-slate-100'
                        }`}
                      >
                        Back to last section
                      </button>
                    </div>

                  </section>
                </div>
              )}

              {/* ASK SAHAAYAK CHATBOT PANEL (ENLARGED & CURVED EDGES) */}
              <section
                className={`p-7 sm:p-9 rounded-3xl border transition-all mt-10 shadow-[var(--shadow-soft)] ${
                  contrast === 'high'
                    ? 'bg-black border-yellow-400 border-4 text-white'
                    : 'bg-[var(--surface-panel)] border-[var(--border-subtle)] text-[var(--ink-primary)]'
                }`}
                aria-label="Ask Sahaayak Chatbot Assistant"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 font-bold font-fraunces text-xl sm:text-2xl text-[var(--ink-primary)] theme-high-contrast:text-white">
                    <MessageSquare size={24} className="text-[#D99020] theme-high-contrast:text-yellow-400 shrink-0" />
                    <span>{t('chat.title', 'Ask Sahaayak')}</span>
                  </div>
                  <span className="text-xs font-bold font-hyperlegible px-3 py-1.5 rounded-full bg-emerald-100/80 text-emerald-900 theme-high-contrast:bg-yellow-400 theme-high-contrast:text-black">
                    {t('chat.activeBadge', 'Guidance Only • Active')}
                  </span>
                </div>

                <div className="p-4 mb-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs sm:text-sm font-hyperlegible leading-relaxed theme-high-contrast:bg-black theme-high-contrast:border-yellow-400 theme-high-contrast:text-yellow-400">
                  {t('chat.boundaryNotice', 'Boundary Notice: Sahaayak gives preparation guidance. It does not decide eligibility, submit an application, or replace official advice.')}
                </div>

                {/* Conversation History Region */}
                {chatMessages.length > 0 && (
                  <div
                    className="space-y-4 mb-5 min-h-[120px] max-h-[360px] overflow-y-auto p-4 sm:p-5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] theme-high-contrast:bg-black theme-high-contrast:border-white scrollbar-thin"
                    role="log"
                    aria-label="Chatbot conversation history"
                  >
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-2xl text-sm sm:text-base font-hyperlegible shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-amber-100/90 text-amber-950 ml-8 sm:ml-12 theme-high-contrast:bg-yellow-400 theme-high-contrast:text-black font-bold'
                            : 'bg-white border border-slate-200 text-slate-800 mr-8 sm:mr-12 theme-high-contrast:bg-black theme-high-contrast:border-yellow-400 theme-high-contrast:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5 opacity-80">
                          <span className="font-bold">{msg.role === 'user' ? 'You' : '✦ Sahaayak Assistant'}</span>
                          {msg.status && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 theme-high-contrast:bg-white theme-high-contrast:text-black">
                              {msg.status}
                            </span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                        {/* Render Approved Sources if returned */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/80 theme-high-contrast:border-yellow-400 text-xs">
                            <span className="font-bold opacity-75">{t('chat.approvedSource', 'Approved Source')}: </span>
                            {msg.sources.map((s, idx) => (
                              <span key={idx} className="italic opacity-90">
                                {s.label}{s.url ? ` (${s.url})` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Interactive Chat Form */}
                <form onSubmit={handleSendChatMessage} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="chat-input" className="block text-sm font-bold font-hyperlegible text-[var(--ink-primary)]">
                      {t('chat.label', 'Ask a question about application preparation')}
                    </label>
                    <input
                      type="text"
                      id="chat-input"
                      maxLength={300}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatSending}
                      placeholder={t('chat.placeholder', 'e.g. How do I write my motivation statement?')}
                      className={`w-full min-h-[52px] px-5 py-3 rounded-2xl text-sm sm:text-base font-hyperlegible transition-all outline-none shadow-sm ${
                        contrast === 'high'
                          ? 'bg-black border-2 border-white focus-visible:border-yellow-400 text-white'
                          : 'bg-white border border-[#E6E2D9] focus:border-[#34456B] focus:ring-2 focus:ring-[#34456B]/20 text-[#172033]'
                      }`}
                    />
                    <p className="text-xs text-[var(--ink-muted)] font-hyperlegible">
                      {t('chat.disclaimer', 'Maximum 300 characters. Answers are plain-text guidance only and will never alter your form entries.')}
                    </p>
                  </div>

                  <div className="pt-1">
                    <LiquidGlassButton
                      type="submit"
                      variant="primary"
                      disabled={chatSending || !chatInput.trim()}
                      icon={chatSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      className="w-full sm:w-[220px]"
                    >
                      {chatSending ? t('chat.sending', 'Sending...') : t('chat.send', 'Send question')}
                    </LiquidGlassButton>
                  </div>
                </form>
              </section>

            </div>
          )
        )}

      </main>

      {/* CONFIRM START OVER MODAL */}
      {showStartOverConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div
            className={`max-w-md w-full p-6 rounded-2xl border space-y-4 shadow-2xl ${
              contrast === 'high'
                ? 'bg-black border-yellow-400 border-4 text-white'
                : 'bg-[var(--surface-panel)] border-[var(--border-subtle)] text-[var(--ink-primary)]'
            }`}
          >
            <h3 id="confirm-modal-title" className="text-xl font-bold font-fraunces">
              Clear current draft and start over?
            </h3>
            <p className="text-sm opacity-90 font-hyperlegible leading-relaxed">
              This will clear all in-memory answers entered during this session and return you to the main dashboard. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowStartOverConfirm(false)}
                className={`px-4 py-2 rounded-xl text-sm font-bold font-hyperlegible ${
                  contrast === 'high' ? 'border border-white text-white' : 'bg-slate-200 text-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStartOver}
                className={`px-4 py-2 rounded-xl text-sm font-bold font-hyperlegible ${
                  contrast === 'high' ? 'bg-red-500 text-black' : 'bg-rose-600 text-white'
                }`}
              >
                Yes, start over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN FILE INPUT FOR OCR */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelected}
        className="hidden"
        aria-hidden="true"
      />

      {/* OCR CONSENT DISCLOSURE MODAL */}
      {showOcrConsent && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ocr-consent-modal-title"
        >
          <div
            className={`max-w-lg w-full p-6 rounded-2xl border space-y-4 shadow-2xl ${
              contrast === 'high'
                ? 'bg-black border-yellow-400 border-4 text-white'
                : 'bg-[var(--surface-panel)] border-[var(--border-subtle)] text-[var(--ink-primary)]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold font-fraunces text-lg text-indigo-700 theme-high-contrast:text-yellow-400">
              <Scan size={22} />
              <h3 id="ocr-consent-modal-title">Scan a Local Preparation Note</h3>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-hyperlegible leading-relaxed space-y-2 theme-high-contrast:bg-black theme-high-contrast:border-yellow-400 theme-high-contrast:text-yellow-400">
              <p className="font-bold text-sm">Privacy & Safety Disclosure:</p>
              <p>
                “This scan runs only in this browser. Your image is not uploaded or saved. Results can be inaccurate. Review every suggestion before using it. Do not upload identity, financial, medical, or official documents.”
              </p>
            </div>

            <div className="text-xs font-hyperlegible opacity-85 space-y-1.5 leading-relaxed">
              <p><strong>Supported Document:</strong> User-created academic preparation summary or scholarship-preparation note (JPG, PNG, or WebP under 5 MB).</p>
              <p className="text-rose-700 font-bold theme-high-contrast:text-yellow-400">
                <strong>Explicitly Prohibited:</strong> Aadhaar cards, Passports, Driver Licenses, Bank Statements, Medical Records, or official IDs.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOcrConsent(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-hyperlegible ${
                  contrast === 'high' ? 'border border-white text-white' : 'bg-slate-200 text-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAcceptOcrConsent}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-hyperlegible flex items-center gap-2 ${
                  contrast === 'high' ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                }`}
              >
                <Upload size={14} />
                <span>I Understand & Consent — Choose File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OCR SCANNING & REVIEW MODAL */}
      {showOcrModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ocr-review-modal-title"
        >
          <div
            className={`max-w-xl w-full p-6 rounded-2xl border space-y-4 shadow-2xl my-8 ${
              contrast === 'high'
                ? 'bg-black border-yellow-400 border-4 text-white'
                : 'bg-[var(--surface-panel)] border-[var(--border-subtle)] text-[var(--ink-primary)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold font-fraunces text-lg">
                <Scan size={20} className="text-indigo-600 theme-high-contrast:text-yellow-400" />
                <h3 id="ocr-review-modal-title">Local Preparation Note Scan</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowOcrModal(false);
                  handleClearOcrData();
                }}
                aria-label="Close OCR scan review"
                className="p-1 rounded-lg hover:bg-slate-200 theme-high-contrast:hover:bg-yellow-400 theme-high-contrast:hover:text-black"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Scanning Progress Bar */}
            {ocrScanning && (
              <div className="space-y-3 py-6 text-center">
                <Loader2 size={36} className="animate-spin mx-auto text-indigo-600 theme-high-contrast:text-yellow-400" />
                <p className="text-xs font-bold font-hyperlegible">{ocrStatusText}</p>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 theme-high-contrast:bg-yellow-400 transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                    role="progressbar"
                    aria-valuenow={ocrProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
              </div>
            )}

            {/* Scan Rejected Warning */}
            {!ocrScanning && ocrResult?.status === 'rejected' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs font-hyperlegible leading-relaxed theme-high-contrast:bg-black theme-high-contrast:border-yellow-400 theme-high-contrast:text-yellow-400">
                  <p className="font-bold text-sm mb-1">Scan Rejected — Safety & Privacy Policy</p>
                  <p>{ocrResult.errorMessage}</p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOcrModal(false);
                      handleClearOcrData();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-hyperlegible ${
                      contrast === 'high' ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-white'
                    }`}
                  >
                    Close & Return to Form
                  </button>
                </div>
              </div>
            )}

            {/* Scan Empty or Error */}
            {!ocrScanning && (ocrResult?.status === 'empty' || ocrResult?.status === 'error') && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-hyperlegible leading-relaxed theme-high-contrast:bg-black theme-high-contrast:border-white theme-high-contrast:text-white">
                  <p className="font-bold text-sm mb-1">Scan Result Notice</p>
                  <p>{ocrResult.errorMessage}</p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOcrModal(false);
                      handleClearOcrData();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-hyperlegible ${
                      contrast === 'high' ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-white'
                    }`}
                  >
                    Close & Continue Typing
                  </button>
                </div>
              </div>
            )}

            {/* Scan Success Candidates Review */}
            {!ocrScanning && ocrResult?.status === 'success' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs font-hyperlegible leading-relaxed theme-high-contrast:bg-black theme-high-contrast:border-yellow-400 theme-high-contrast:text-yellow-400">
                  <span className="font-bold">Review Suggestions: </span>
                  Suggestions are extracted locally in browser memory. Click "Use this suggestion" to apply a field value to your form draft. Nothing changes until you choose a suggestion.
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {/* Candidate: schoolOrCollege */}
                  {ocrResult.candidates?.schoolOrCollege && (
                    <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 space-y-2 theme-high-contrast:bg-black theme-high-contrast:border-white">
                      <div className="flex items-center justify-between text-xs font-hyperlegible">
                        <span className="font-bold opacity-80">School / College Candidate:</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 theme-high-contrast:bg-yellow-400 theme-high-contrast:text-black">
                          Suggested from local scan
                        </span>
                      </div>
                      <p className="text-xs font-bold font-hyperlegible text-slate-800 theme-high-contrast:text-white">
                        {ocrResult.candidates.schoolOrCollege}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleApplyOcrSuggestion('schoolOrCollege', ocrResult.candidates!.schoolOrCollege!)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-hyperlegible flex items-center gap-1 ${
                            contrast === 'high' ? 'bg-yellow-400 text-black' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          <Check size={12} />
                          <span>Use this suggestion</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Candidate: fieldOfStudy */}
                  {ocrResult.candidates?.fieldOfStudy && (
                    <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 space-y-2 theme-high-contrast:bg-black theme-high-contrast:border-white">
                      <div className="flex items-center justify-between text-xs font-hyperlegible">
                        <span className="font-bold opacity-80">Intended Course / Field Candidate:</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 theme-high-contrast:bg-yellow-400 theme-high-contrast:text-black">
                          Suggested from local scan
                        </span>
                      </div>
                      <p className="text-xs font-bold font-hyperlegible text-slate-800 theme-high-contrast:text-white">
                        {ocrResult.candidates.fieldOfStudy}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleApplyOcrSuggestion('fieldOfStudy', ocrResult.candidates!.fieldOfStudy!)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-hyperlegible flex items-center gap-1 ${
                            contrast === 'high' ? 'bg-yellow-400 text-black' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          <Check size={12} />
                          <span>Use this suggestion</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Candidate: studyLevel */}
                  {ocrResult.candidates?.studyLevel && (
                    <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 space-y-2 theme-high-contrast:bg-black theme-high-contrast:border-white">
                      <div className="flex items-center justify-between text-xs font-hyperlegible">
                        <span className="font-bold opacity-80">Study Level Candidate:</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 theme-high-contrast:bg-yellow-400 theme-high-contrast:text-black">
                          Suggested from local scan
                        </span>
                      </div>
                      <p className="text-xs font-bold font-hyperlegible text-slate-800 theme-high-contrast:text-white">
                        {ocrResult.candidates.studyLevel}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleApplyOcrSuggestion('studyLevel', ocrResult.candidates!.studyLevel!)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-hyperlegible flex items-center gap-1 ${
                            contrast === 'high' ? 'bg-yellow-400 text-black' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          <Check size={12} />
                          <span>Use this suggestion</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Candidate: academicStrengths */}
                  {ocrResult.candidates?.academicStrengths && (
                    <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 space-y-2 theme-high-contrast:bg-black theme-high-contrast:border-white">
                      <div className="flex items-center justify-between text-xs font-hyperlegible">
                        <span className="font-bold opacity-80">Academic Strengths Candidate:</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 theme-high-contrast:bg-yellow-400 theme-high-contrast:text-black">
                          Suggested from local scan
                        </span>
                      </div>
                      <p className="text-xs font-bold font-hyperlegible text-slate-800 theme-high-contrast:text-white">
                        {ocrResult.candidates.academicStrengths}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleApplyOcrSuggestion('academicStrengths', ocrResult.candidates!.academicStrengths!)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-hyperlegible flex items-center gap-1 ${
                            contrast === 'high' ? 'bg-yellow-400 text-black' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          <Check size={12} />
                          <span>Use this suggestion</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {(!ocrResult.candidates || Object.keys(ocrResult.candidates).length === 0) && (
                    <p className="text-xs font-hyperlegible opacity-75 italic text-center py-4">
                      All candidate suggestions have been reviewed or applied.
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleClearOcrData}
                    className="text-xs font-bold text-rose-600 hover:underline theme-high-contrast:text-yellow-400"
                  >
                    Clear scan data
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOcrModal(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-hyperlegible ${
                      contrast === 'high' ? 'bg-yellow-400 text-black' : 'bg-[var(--ink-primary)] text-white'
                    }`}
                  >
                    Done Reviewing
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBMISSION AUDITORY & VISUAL RESPONSE MODAL */}
      {submissionModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-[var(--surface-panel)] border border-[var(--border-subtle)] shadow-2xl space-y-5 text-left font-hyperlegible">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="font-fraunces font-bold text-xl text-[var(--ink-primary)]">
                  {submissionModal.title}
                </h3>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[var(--brand-saffron)]">
                  {t('form.localDraftSaved', 'LOCAL DRAFT SAVED')}
                </span>
              </div>
            </div>

            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              {submissionModal.message}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <LiquidGlassButton
                type="button"
                variant="primary"
                onClick={() => {
                  const callback = submissionModal.onProceed;
                  setSubmissionModal(null);
                  callback();
                }}
                className="w-full sm:flex-1"
              >
                {t('modal.proceed', 'Proceed to next step →')}
              </LiquidGlassButton>

              <LiquidGlassButton
                type="button"
                variant="secondary"
                onClick={() => setSubmissionModal(null)}
                className="w-full sm:w-auto"
              >
                {t('modal.stay', 'Edit later / Stay here')}
              </LiquidGlassButton>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className={`py-6 text-center text-xs border-t transition-colors ${
        contrast === 'high'
          ? 'bg-black text-white border-yellow-400'
          : 'bg-[var(--surface-panel)] text-[var(--ink-secondary)] border-[var(--border-subtle)]'
      }`}>
        <div className="max-w-6xl mx-auto px-4 font-hyperlegible">
          &copy; {new Date().getFullYear()} Sahaayak. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default App;
