import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useAccessibility } from './contexts/AccessibilityContext';
import { api } from './services/api';
import type { ServiceWorkflow, DocumentItem, ReadinessSummary } from './services/api';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  LogOut, 
  Sparkles, 
  FileText, 
  Settings, 
  ShieldCheck,
  RotateCcw,
  Check,
  Edit2
} from 'lucide-react';

const App: React.FC = () => {
  const { user, login, register, logout } = useAuth();
  const { 
    textSize, 
    contrast, 
    voiceSpeed, 
    voiceEnabled, 
    updatePreferences, 
    speak, 
    speakStop 
  } = useAccessibility();

  // Navigation & View States
  // 'landing' | 'auth' | 'explanation' | 'workflow' | 'checklist' | 'summary'
  const [currentView, setCurrentView] = useState<string>('landing');
  
  // Auth Form State
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Workflow / Steps State
  const [workflow, setWorkflow] = useState<ServiceWorkflow | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  // AI & Voice Capture State
  const [isRecording, setIsRecording] = useState(false);
  const [rawSpeechText, setRawSpeechText] = useState('');
  const [aiInterpretation, setAiInterpretation] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [editedInterpretation, setEditedInterpretation] = useState('');
  const [isEditingInterpretation, setIsEditingInterpretation] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);

  // Checklist State
  const [checklist, setChecklist] = useState<DocumentItem[]>([]);
  
  // Summary & Readiness State
  const [readiness, setReadiness] = useState<ReadinessSummary | null>(null);

  // Accessibility Toolbar Collapse
  const [showA11yPanel, setShowA11yPanel] = useState(false);

  // Audio status indicator
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);

  // 1. Fetch Workflow data on login
  useEffect(() => {
    if (user) {
      fetchWorkflowData();
      if (currentView === 'landing' || currentView === 'auth') {
        setCurrentView('explanation');
      }
    } else {
      setCurrentView('landing');
      setWorkflow(null);
    }
  }, [user]);

  // 2. Announce screen load to screen readers & Read Aloud
  useEffect(() => {
    announceAndViewDescription();
  }, [currentView, currentStepIdx]);

  const announceAndViewDescription = () => {
    let textToSpeak = '';
    switch (currentView) {
      case 'landing':
        textToSpeak = "Welcome to Sahaayak, your accessible digital service assistant. Tap Start to login or register.";
        break;
      case 'auth':
        textToSpeak = authTab === 'login' ? "Login page. Enter your email and password." : "Register page. Create a new account with email and password.";
        break;
      case 'explanation':
        textToSpeak = "Accessible Parking Permit service overview. We will guide you through 6 simple questions and a required document checklist. Tap Start Application to begin.";
        break;
      case 'workflow':
        if (workflow && workflow.questions[currentStepIdx]) {
          const q = workflow.questions[currentStepIdx];
          textToSpeak = `Question ${q.order} of ${workflow.questions.length}. ${q.label}. ${q.description}`;
        }
        break;
      case 'checklist':
        textToSpeak = "Document Checklist page. Verify your Proof of Identity and Medical Certification documents.";
        break;
      case 'summary':
        textToSpeak = readiness?.isReady 
          ? "Readiness Summary. Great news! Your application is ready to submit."
          : "Readiness Summary. More information is required. Please check missing questions or documents.";
        break;
      default:
        break;
    }
    if (textToSpeak) {
      setLiveAnnouncement(textToSpeak);
      speak(textToSpeak);
    }
  };

  const fetchWorkflowData = async () => {
    try {
      const data = await api.getCurrentWorkflow();
      setWorkflow(data);
      setCurrentStepIdx(data.currentStep);
      
      // Initialize local answer values from database answers
      const initialAnswers: Record<string, string> = {};
      Object.keys(data.answers).forEach((key) => {
        initialAnswers[key] = data.answers[key].interpretedValue;
      });
      setAnswers(initialAnswers);

      // Fetch checklist & readiness as well
      const docList = await api.getDocuments();
      setChecklist(docList);

      const readinessData = await api.getReadiness();
      setReadiness(readinessData);
    } catch (error) {
      console.error('Error fetching workflow data:', error);
    }
  };

  // 3. User Authentication handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (authTab === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
      speak(`Error: ${err.message || 'Authentication failed.'}`);
    }
  };

  // 4. Voice Speech-to-Text Recognition setup
  const startSpeechCapture = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your answer.");
      return;
    }

    speakStop(); // Stop reading question while capturing user voice
    setIsRecording(true);
    setRawSpeechText('');
    setValidationError(null);

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setRawSpeechText(resultText);
      interpretSpeech(resultText);
    };

    rec.onerror = (err: any) => {
      console.error('Speech recognition error:', err);
      setIsRecording(false);
      announceAndSpeak("We could not hear you clearly. Please try speaking again or write your answer.");
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = rec;
    rec.start();
    announceAndSpeak("Listening. Speak your answer now.");
  };

  const stopSpeechCapture = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const announceAndSpeak = (text: string) => {
    setLiveAnnouncement(text);
    // Explicit override to speak even if voiceEnabled is off, so helper instructions are audible during mic triggers
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceSpeed === 'slow' ? 0.75 : voiceSpeed === 'fast' ? 1.25 : 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 5. Submit voice input to AI parsing endpoint
  const interpretSpeech = async (speechText: string) => {
    if (!workflow) return;
    const currentQ = workflow.questions[currentStepIdx];
    setIsInterpreting(true);
    setAiWarning(null);
    try {
      const data = await api.interpretAnswer(currentQ.key, speechText);
      setAiInterpretation(data.interpretedValue);
      setEditedInterpretation(data.interpretedValue);
      setAiWarning(data.warning || null);
      setShowConfirmModal(true);

      const confirmMessage = `We understood: ${data.interpretedValue}. Tap Confirm to save, or Edit to modify.`;
      announceAndSpeak(confirmMessage);
    } catch (err: any) {
      setValidationError(err.message || 'AI interpretation failed.');
    } finally {
      setIsInterpreting(false);
    }
  };

  // 6. Confirm / Save interpreted answer
  const handleConfirmAnswer = async (finalValue: string) => {
    if (!workflow) return;
    const currentQ = workflow.questions[currentStepIdx];
    setValidationError(null);

    try {
      const response = await api.confirmAnswer(currentQ.key, rawSpeechText || finalValue, finalValue);
      
      // Update local answers state
      setAnswers(prev => ({
        ...prev,
        [currentQ.key]: finalValue
      }));

      setShowConfirmModal(false);
      setRawSpeechText('');
      setIsEditingInterpretation(false);

      // Refresh readiness stats
      const readinessData = await api.getReadiness();
      setReadiness(readinessData);

      // Advance step
      if (response.workflowStatus === 'COMPLETED' || currentStepIdx === workflow.questions.length - 1) {
        setCurrentView('checklist');
      } else {
        setCurrentStepIdx(response.nextStep);
      }
    } catch (err: any) {
      setValidationError(err.message || 'Save failed.');
      announceAndSpeak(`Validation error: ${err.message}`);
    }
  };

  // 7. Manual typed input submit handler
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflow) return;
    const currentQ = workflow.questions[currentStepIdx];
    const value = answers[currentQ.key] || '';
    
    if (!value.trim()) {
      setValidationError('Please enter a response.');
      announceAndSpeak('Please enter a response.');
      return;
    }

    setRawSpeechText(value); // Mimic voice raw structure
    handleConfirmAnswer(value);
  };

  // 8. Document checklist checkbox status updates
  const handleDocumentToggle = async (docKey: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'MISSING' : 'COMPLETED';
    try {
      await api.updateDocumentStatus(docKey, nextStatus);
      // Refresh documents
      const docs = await api.getDocuments();
      setChecklist(docs);

      // Refresh readiness
      const readinessData = await api.getReadiness();
      setReadiness(readinessData);

      announceAndSpeak(`Updated status for ${docKey.replace('_', ' ')} to ${nextStatus.toLowerCase()}`);
    } catch (err) {
      console.error('Error toggling document status:', err);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200`}>
      {/* Screen Reader ARIA Live Region */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite"
      >
        {liveAnnouncement}
      </div>

      {/* TOP HEADER */}
      <header className={`border-b transition-colors duration-200 ${
        contrast === 'high' 
          ? 'bg-black text-white border-hc-border' 
          : 'bg-slate-900/90 text-white border-slate-800'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              contrast === 'high' ? 'bg-hc-accent text-black font-bold' : 'bg-blue-600 text-white'
            }`}>
              <span className="font-extrabold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Sahaayak</h1>
              <p className="text-xs opacity-80">Accessibility First Service Navigator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Toggle Settings Button */}
            <button
              onClick={() => setShowA11yPanel(!showA11yPanel)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all focus-visible:ring-4 ${
                contrast === 'high' 
                  ? 'bg-black text-white border-2 border-hc-border hover:bg-hc-accent hover:text-black' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              aria-label="Toggle Accessibility Preferences Toolbar"
            >
              <Settings size={18} />
              <span className="hidden sm:inline">Preferences</span>
            </button>

            {user && (
              <button
                onClick={() => {
                  logout();
                  setCurrentView('landing');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all focus-visible:ring-4 ${
                  contrast === 'high' 
                    ? 'bg-black text-white border-2 border-hc-border hover:bg-white hover:text-black' 
                    : 'bg-red-950/40 text-red-200 border border-red-900/40 hover:bg-red-900/40'
                }`}
                aria-label="Log Out"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
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
              ? 'bg-black text-white border-hc-border' 
              : 'bg-slate-850 bg-slate-900 text-slate-200 border-slate-800 shadow-inner'
          }`}
          aria-label="Accessibility settings panel"
        >
          <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Text Scale */}
            <div>
              <label className="block text-sm font-bold mb-2">1. Text Size</label>
              <div className="flex gap-2">
                {['normal', 'large', 'xlarge'].map((size) => (
                  <button
                    key={size}
                    onClick={() => updatePreferences({ textSize: size })}
                    className={`flex-1 py-2 text-xs uppercase font-bold rounded-lg border-2 ${
                      textSize === size 
                        ? (contrast === 'high' ? 'bg-hc-accent text-black border-hc-accent' : 'bg-blue-600 text-white border-blue-600') 
                        : (contrast === 'high' ? 'bg-black text-white border-hc-border' : 'bg-slate-800 border-slate-700 text-slate-350')
                    }`}
                  >
                    {size === 'normal' ? 'Normal' : size === 'large' ? 'Large' : 'Extra Large'}
                  </button>
                ))}
              </div>
            </div>

            {/* Contrast Theme */}
            <div>
              <label className="block text-sm font-bold mb-2">2. Color Contrast</label>
              <div className="flex gap-2">
                {[
                  { key: 'normal', label: 'Default Dark' },
                  { key: 'high', label: 'High Contrast' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => updatePreferences({ contrast: item.key })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 ${
                      contrast === item.key 
                        ? (contrast === 'high' ? 'bg-hc-accent text-black border-hc-accent' : 'bg-blue-600 text-white border-blue-600') 
                        : (contrast === 'high' ? 'bg-black text-white border-hc-border' : 'bg-slate-800 border-slate-700 text-slate-350')
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Enabled read-aloud */}
            <div>
              <label className="block text-sm font-bold mb-2">3. Audio Assist (TTS)</label>
              <button
                onClick={() => updatePreferences({ voiceEnabled: !voiceEnabled })}
                className={`w-full py-2 flex items-center justify-center gap-2 text-xs font-bold rounded-lg border-2 ${
                  voiceEnabled 
                    ? (contrast === 'high' ? 'bg-hc-accent text-black border-hc-accent' : 'bg-blue-600 text-white border-blue-600') 
                    : (contrast === 'high' ? 'bg-black text-white border-hc-border' : 'bg-slate-800 border-slate-700 text-slate-350')
                }`}
              >
                {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                {voiceEnabled ? 'Read Aloud On' : 'Read Aloud Off'}
              </button>
            </div>

            {/* Voice Reading Speed */}
            <div>
              <label className="block text-sm font-bold mb-2">4. Reading Speed</label>
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
                          ? (contrast === 'high' ? 'bg-hc-accent text-black border-hc-accent' : 'bg-blue-600 text-white border-blue-600') 
                          : (contrast === 'high' ? 'bg-black text-white border-hc-border' : 'bg-slate-800 border-slate-700 text-slate-350')
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
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        
        {/* VIEW: LANDING */}
        {currentView === 'landing' && (
          <section className="text-center py-12 md:py-20">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">
              Access Public Services <br />
              <span className={contrast === 'high' ? 'text-hc-accent' : 'text-blue-500 bg-gradient-to-r from-blue-450 to-indigo-550 bg-clip-text text-transparent'}>
                Without the Complexity
              </span>
            </h2>
            <p className="max-w-2xl mx-auto text-base md:text-lg mb-10 opacity-90 leading-relaxed">
              Sahaayak simplifies complex government and community applications into clean, sequential, simple-language instructions with full voice transcription support.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => {
                  setAuthTab('login');
                  setCurrentView('auth');
                }}
                className={`px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover-scale focus-visible:ring-4 text-lg ${
                  contrast === 'high' 
                    ? 'bg-hc-accent text-black' 
                    : 'bg-blue-600 text-white shadow-xl shadow-blue-500/25'
                }`}
              >
                Start Now
                <ArrowRight size={20} />
              </button>

              <button
                onClick={() => {
                  speak("Sahaayak is a simplified form-completing interface. If you need text-to-speech assist, activate the preferences in the top toolbar.");
                }}
                className={`px-6 py-4 rounded-xl font-bold flex items-center gap-2 border-2 hover-scale text-base ${
                  contrast === 'high' 
                    ? 'border-hc-border text-white hover:bg-white hover:text-black' 
                    : 'border-slate-700 hover:bg-slate-800 text-slate-200'
                }`}
                aria-label="Listen to explanation"
              >
                <Volume2 size={20} />
                Listen Introduction
              </button>
            </div>

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              {[
                { title: 'Accessibility First', desc: 'Custom font magnifications, screen-contrast toggles, and screen-reader semantics.' },
                { title: 'AI Spoken Assistance', desc: 'Dictate answers using natural speech. Our backend extracts inputs automatically.' },
                { title: 'Document Tracker', desc: 'Interactive checklist checks off required documents before final submission.' }
              ].map((feature, idx) => (
                <div 
                  key={idx} 
                  className={`p-6 rounded-xl border ${
                    contrast === 'high' 
                      ? 'border-hc-border bg-black' 
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <h3 className="font-bold text-lg mb-2 text-blue-400 theme-high-contrast:text-hc-accent">{feature.title}</h3>
                  <p className="text-sm opacity-80 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* VIEW: AUTHENTICATION (LOGIN / REGISTER) */}
        {currentView === 'auth' && (
          <section className="max-w-md mx-auto">
            <div className={`p-6 md:p-8 rounded-2xl border transition-all ${
              contrast === 'high' 
                ? 'bg-black border-hc-border border-4' 
                : 'bg-slate-900/80 backdrop-blur-md border-slate-800 shadow-2xl'
            }`}>
              
              {/* Tab headers */}
              <div className="flex border-b border-slate-800 theme-high-contrast:border-hc-border mb-6">
                <button
                  onClick={() => { setAuthTab('login'); setAuthError(null); }}
                  className={`flex-1 pb-3 text-center font-bold text-lg ${
                    authTab === 'login' 
                      ? (contrast === 'high' ? 'text-hc-accent border-b-4 border-hc-accent' : 'text-blue-500 border-b-2 border-blue-500') 
                      : 'text-slate-450 hover:text-slate-200'
                  }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => { setAuthTab('register'); setAuthError(null); }}
                  className={`flex-1 pb-3 text-center font-bold text-lg ${
                    authTab === 'register' 
                      ? (contrast === 'high' ? 'text-hc-accent border-b-4 border-hc-accent' : 'text-blue-500 border-b-2 border-blue-500') 
                      : 'text-slate-450 hover:text-slate-200'
                  }`}
                >
                  Register
                </button>
              </div>

              {authError && (
                <div 
                  className="p-3 mb-4 rounded-lg bg-red-950/60 border border-red-900/60 text-red-200 text-sm flex items-center gap-2"
                  role="alert"
                >
                  <AlertTriangle size={18} className="shrink-0 text-red-400" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold mb-2">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full px-4 py-3 rounded-xl transition-all outline-none ${
                      contrast === 'high' 
                        ? 'bg-black border-2 border-hc-border focus-visible:border-hc-accent text-white' 
                        : 'bg-slate-800/80 border border-slate-700/60 focus:border-blue-500 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="pass" className="block text-sm font-bold mb-2">Password (Min. 6 chars)</label>
                  <input
                    type="password"
                    id="pass"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 rounded-xl transition-all outline-none ${
                      contrast === 'high' 
                        ? 'bg-black border-2 border-hc-border focus-visible:border-hc-accent text-white' 
                        : 'bg-slate-800/80 border border-slate-700/60 focus:border-blue-500 text-white'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover-scale text-base ${
                    contrast === 'high' 
                      ? 'bg-hc-accent text-black' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20'
                  }`}
                >
                  {authTab === 'login' ? 'Confirm Login' : 'Create Account'}
                  <ArrowRight size={18} />
                </button>
              </form>

              <button
                onClick={() => setCurrentView('landing')}
                className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1 focus-visible:ring-2 rounded-lg"
              >
                <ArrowLeft size={16} />
                Back to Welcome Screen
              </button>

            </div>
          </section>
        )}

        {/* VIEW: SERVICE EXPLANATION */}
        {currentView === 'explanation' && workflow && (
          <section className="max-w-2xl mx-auto">
            <div className={`p-6 md:p-8 rounded-2xl border transition-all ${
              contrast === 'high' 
                ? 'bg-black border-hc-border border-4' 
                : 'bg-slate-900/80 border-slate-800 shadow-2xl'
            }`}>
              
              <div className="flex items-center gap-2 mb-2 text-blue-400 theme-high-contrast:text-hc-accent font-bold uppercase text-xs tracking-wider">
                <FileText size={16} />
                Active Workflow Step
              </div>
              
              <h2 className="text-2xl md:text-3xl font-extrabold mb-4">{workflow.service.name}</h2>
              <p className="text-base opacity-90 leading-relaxed mb-6">
                {workflow.service.description}
              </p>

              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/20 mb-6 theme-high-contrast:bg-black theme-high-contrast:border-hc-border">
                <h3 className="font-bold text-sm text-blue-300 theme-high-contrast:text-hc-accent mb-2">What you need to complete this:</h3>
                <ul className="list-disc list-inside text-sm space-y-1 opacity-90">
                  <li>Your full legal name and date of birth</li>
                  <li>Medical mobility confirmation details</li>
                  <li>Physician's full name and license registration key</li>
                  <li>Vehicle license plate number (or check "None" as passenger)</li>
                  <li>Proof of Identity & Medical Certification Form documents</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => {
                    setCurrentView('workflow');
                    // Reset to step loaded from database
                    setCurrentStepIdx(workflow.currentStep);
                  }}
                  className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover-scale text-base ${
                    contrast === 'high' 
                      ? 'bg-hc-accent text-black' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                  }`}
                >
                  Start Guided Questions
                  <ArrowRight size={18} />
                </button>

                <button
                  onClick={() => {
                    speak("Active workflow is Accessible Parking Permit. We will ask you 6 questions regarding name, birthdate, walking impairment state, physician details, and license plate, alongside a checklist of 2 required files.");
                  }}
                  className={`py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 border-2 hover-scale text-base ${
                    contrast === 'high' 
                      ? 'border-hc-border text-white hover:bg-white hover:text-black' 
                      : 'border-slate-800 hover:bg-slate-800 text-slate-200'
                  }`}
                  aria-label="Speak service guidelines"
                >
                  <Volume2 size={20} />
                  Speak Overview
                </button>
              </div>

            </div>
          </section>
        )}

        {/* VIEW: GUIDED WORKFLOW STEPS */}
        {currentView === 'workflow' && workflow && (
          <section className="max-w-2xl mx-auto">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-sm font-bold text-slate-400 theme-high-contrast:text-white">
                Question {currentStepIdx + 1} of {workflow.questions.length}
              </span>
              <span className="text-sm font-bold text-blue-400 theme-high-contrast:text-hc-accent">
                {Math.round(((currentStepIdx) / workflow.questions.length) * 100)}% Complete
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full mb-8 overflow-hidden theme-high-contrast:border-2 theme-high-contrast:border-hc-border">
              <div 
                className={`h-full transition-all duration-300 ${
                  contrast === 'high' ? 'bg-hc-accent' : 'bg-blue-500'
                }`}
                style={{ width: `${((currentStepIdx) / workflow.questions.length) * 100}%` }}
              />
            </div>

            {/* Active Question Card */}
            {workflow.questions[currentStepIdx] && (
              <div className={`p-6 md:p-8 rounded-2xl border transition-all ${
                contrast === 'high' 
                  ? 'bg-black border-hc-border border-4' 
                  : 'bg-slate-900/80 border-slate-800 shadow-2xl'
              }`}>
                {/* Speech assist active banner */}
                {voiceEnabled && (
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => speak(workflow.questions[currentStepIdx].label + ". " + workflow.questions[currentStepIdx].description)}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:underline theme-high-contrast:text-hc-accent font-bold"
                      aria-label="Replay voice question text"
                    >
                      <Volume2 size={14} />
                      Hear Again
                    </button>
                  </div>
                )}

                <h3 className="text-xl md:text-2xl font-extrabold mb-2">
                  {workflow.questions[currentStepIdx].label}
                </h3>
                <p className="text-sm text-slate-400 theme-high-contrast:text-white mb-6">
                  {workflow.questions[currentStepIdx].description}
                </p>

                {validationError && (
                  <div 
                    className="p-3 mb-4 rounded-lg bg-red-950/60 border border-red-900/60 text-red-200 text-sm flex items-center gap-2"
                    role="alert"
                  >
                    <AlertTriangle size={18} className="shrink-0 text-red-400" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Question Inputs */}
                <form onSubmit={handleManualSubmit} className="space-y-6">
                  {/* Type 1: Boolean Select (Yes/No) */}
                  {workflow.questions[currentStepIdx].type === 'boolean' && (
                    <div className="flex gap-4">
                      {['Yes', 'No'].map((choice) => {
                        const valStr = choice === 'Yes' ? 'true' : 'false';
                        const isSelected = answers[workflow.questions[currentStepIdx].key] === valStr;
                        return (
                          <button
                            type="button"
                            key={choice}
                            onClick={() => {
                              setAnswers(prev => ({
                                ...prev,
                                [workflow.questions[currentStepIdx].key]: valStr
                              }));
                              setValidationError(null);
                            }}
                            className={`flex-1 py-4 font-bold text-lg rounded-xl border-2 transition-all ${
                              isSelected 
                                ? (contrast === 'high' ? 'bg-hc-accent text-black border-hc-accent' : 'bg-blue-600 text-white border-blue-600 shadow-md') 
                                : (contrast === 'high' ? 'bg-black text-white border-hc-border hover:bg-hc-accent hover:text-black' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750')
                            }`}
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Type 2: Date Picker */}
                  {workflow.questions[currentStepIdx].type === 'date' && (
                    <input
                      type="date"
                      required
                      value={answers[workflow.questions[currentStepIdx].key] || ''}
                      onChange={(e) => {
                        setAnswers(prev => ({
                          ...prev,
                          [workflow.questions[currentStepIdx].key]: e.target.value
                        }));
                        setValidationError(null);
                      }}
                      className={`w-full px-4 py-3 rounded-xl text-lg outline-none border transition-all ${
                        contrast === 'high' 
                          ? 'bg-black border-2 border-hc-border focus-visible:border-hc-accent text-white' 
                          : 'bg-slate-800 border-slate-700 focus:border-blue-500 text-white'
                      }`}
                    />
                  )}

                  {/* Type 3: Standard Text */}
                  {workflow.questions[currentStepIdx].type === 'text' && (
                    <input
                      type="text"
                      required
                      value={answers[workflow.questions[currentStepIdx].key] || ''}
                      onChange={(e) => {
                        setAnswers(prev => ({
                          ...prev,
                          [workflow.questions[currentStepIdx].key]: e.target.value
                        }));
                        setValidationError(null);
                      }}
                      placeholder="Type your response here..."
                      className={`w-full px-4 py-3 rounded-xl text-lg outline-none border transition-all ${
                        contrast === 'high' 
                          ? 'bg-black border-2 border-hc-border focus-visible:border-hc-accent text-white' 
                          : 'bg-slate-800 border-slate-700 focus:border-blue-500 text-white'
                      }`}
                    />
                  )}

                  {/* Voice Button Row */}
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={isRecording ? stopSpeechCapture : startSpeechCapture}
                      className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover-scale transition-all border-2 ${
                        isRecording
                          ? 'bg-red-600 border-red-600 text-white animate-pulse'
                          : (contrast === 'high' 
                              ? 'bg-black border-hc-border hover:bg-hc-accent hover:text-black text-white' 
                              : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200')
                      }`}
                      aria-label={isRecording ? "Stop recording speech answers" : "Dictate response using voice"}
                    >
                      {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                      {isRecording ? 'Stop Recording' : 'Speak Answer'}
                    </button>
                  </div>

                  {/* Step Controls */}
                  <div className="flex gap-4 border-t border-slate-800 theme-high-contrast:border-hc-border pt-6 mt-6">
                    <button
                      type="button"
                      disabled={currentStepIdx === 0}
                      onClick={() => {
                        setValidationError(null);
                        setCurrentStepIdx(prev => prev - 1);
                      }}
                      className={`px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-1 border-2 transition-all ${
                        currentStepIdx === 0 
                          ? 'opacity-40 cursor-not-allowed text-slate-500 border-slate-800' 
                          : (contrast === 'high' 
                              ? 'border-hc-border text-white hover:bg-white hover:text-black' 
                              : 'border-slate-800 hover:bg-slate-800 text-slate-350')
                      }`}
                    >
                      <ArrowLeft size={18} />
                      Back
                    </button>

                    <button
                      type="submit"
                      disabled={isInterpreting}
                      className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover-scale text-lg ${
                        contrast === 'high' 
                          ? 'bg-hc-accent text-black' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                      }`}
                    >
                      Save & Next
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </form>

                {/* Small manual skip to checklist / summary button for easy demoing */}
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => setCurrentView('explanation')}
                    className="text-xs text-slate-450 hover:text-slate-200 hover:underline"
                  >
                    View Guidelines
                  </button>
                  <button
                    onClick={() => setCurrentView('checklist')}
                    className="text-xs text-slate-450 hover:text-slate-200 hover:underline"
                  >
                    Go to Checklist
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* VIEW: DOCUMENT CHECKLIST */}
        {currentView === 'checklist' && (
          <section className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight">Required Documents</h2>
            <p className="text-sm text-slate-400 theme-high-contrast:text-white mb-6">
              Confirm you have these materials ready to attach to your permit request.
            </p>

            <div className="space-y-4 mb-8">
              {checklist.map((doc) => {
                const isCompleted = doc.status === 'COMPLETED';
                return (
                  <div
                    key={doc.key}
                    onClick={() => handleDocumentToggle(doc.key, doc.status)}
                    className={`p-5 rounded-xl border flex items-start gap-4 transition-all cursor-pointer select-none ${
                      isCompleted 
                        ? (contrast === 'high' ? 'bg-black border-hc-accent border-4' : 'bg-slate-900/50 border-emerald-900/40 hover:bg-slate-900') 
                        : (contrast === 'high' ? 'bg-black border-hc-border border-2' : 'bg-slate-900/35 border-slate-800 hover:bg-slate-900/60')
                    }`}
                  >
                    {/* Tick box visual */}
                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border-2 transition-all ${
                      isCompleted 
                        ? (contrast === 'high' ? 'bg-hc-accent border-hc-accent text-black' : 'bg-emerald-600 border-emerald-600 text-white') 
                        : (contrast === 'high' ? 'border-hc-border text-transparent' : 'border-slate-700 text-transparent')
                    }`}>
                      <Check size={14} className="stroke-[3]" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-base md:text-lg">{doc.label}</span>
                        <span className={`px-2 py-0.5 rounded text-xxs font-extrabold text-[10px] tracking-wider uppercase ${
                          doc.type === 'REQUIRED' 
                            ? 'bg-red-950/40 text-red-300 border border-red-900/45 theme-high-contrast:bg-white theme-high-contrast:text-black' 
                            : 'bg-slate-800 text-slate-350 border border-slate-750'
                        }`}>
                          {doc.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 theme-high-contrast:text-white leading-relaxed">{doc.description}</p>
                    </div>

                    <div className="shrink-0 flex items-center pt-1">
                      {isCompleted ? (
                        <span className="text-emerald-500 font-bold text-sm flex items-center gap-1 theme-high-contrast:text-hc-accent">
                          <CheckCircle2 size={16} />
                          Ready
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold text-sm flex items-center gap-1 theme-high-contrast:text-white">
                          <AlertTriangle size={16} />
                          Missing
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checklist navigation buttons */}
            <div className="flex gap-4 border-t border-slate-800 theme-high-contrast:border-hc-border pt-6">
              <button
                onClick={() => {
                  setValidationError(null);
                  setCurrentView('workflow');
                }}
                className={`px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-1 border-2 transition-all ${
                  contrast === 'high' 
                    ? 'border-hc-border text-white hover:bg-white hover:text-black' 
                    : 'border-slate-850 border-slate-800 hover:bg-slate-800 text-slate-355 text-slate-300'
                }`}
              >
                <ArrowLeft size={18} />
                Back to Questions
              </button>

              <button
                onClick={async () => {
                  const rData = await api.getReadiness();
                  setReadiness(rData);
                  setCurrentView('summary');
                }}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover-scale text-lg ${
                  contrast === 'high' 
                    ? 'bg-hc-accent text-black' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                }`}
              >
                Go to Final Review
                <ArrowRight size={18} />
              </button>
            </div>
          </section>
        )}

        {/* VIEW: FINAL SUMMARY & READINESS */}
        {currentView === 'summary' && readiness && (
          <section className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight">Readiness Summary</h2>
            <p className="text-sm text-slate-400 theme-high-contrast:text-white mb-6">
              Review your compiled answers and attachments checklist before submission.
            </p>

            {/* Status card */}
            <div className={`p-6 rounded-2xl border mb-8 flex flex-col md:flex-row items-center gap-4 transition-all ${
              readiness.isReady
                ? (contrast === 'high' ? 'bg-black border-hc-accent border-4' : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-250')
                : (contrast === 'high' ? 'bg-black border-hc-border border-4' : 'bg-amber-950/20 border-amber-900/40 text-amber-250')
            }`}>
              <div className="shrink-0">
                {readiness.isReady ? (
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    contrast === 'high' ? 'bg-hc-accent text-black' : 'bg-emerald-600 text-white'
                  }`}>
                    <CheckCircle2 size={36} />
                  </div>
                ) : (
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    contrast === 'high' ? 'bg-white text-black' : 'bg-amber-600 text-white'
                  }`}>
                    <AlertTriangle size={36} />
                  </div>
                )}
              </div>

              <div className="text-center md:text-left flex-1">
                <h3 className="font-extrabold text-2xl mb-1">
                  {readiness.isReady ? 'Ready to Submit' : 'More Information Required'}
                </h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  {readiness.isReady 
                    ? 'Excellent! You have answered all step questions and ticked off all required document checklist items.'
                    : 'We found some missing details. Complete them using the guide highlights listed below.'
                  }
                </p>
              </div>
            </div>

            {/* Answer parameters summaries list */}
            <div className={`p-5 rounded-2xl border mb-6 transition-all ${
              contrast === 'high' 
                ? 'bg-black border-hc-border border-2' 
                : 'bg-slate-900/40 border-slate-800'
            }`}>
              <h4 className="font-bold text-lg mb-4 text-blue-400 theme-high-contrast:text-hc-accent border-b border-slate-800 theme-high-contrast:border-hc-border pb-2">
                Your Details Summary
              </h4>
              
              <div className="space-y-4 text-sm">
                {[
                  { key: 'name', label: 'Full Legal Name' },
                  { key: 'dob', label: 'Date of Birth' },
                  { key: 'has_impairment', label: 'Mobility Condition Impairment' },
                  { key: 'doctor_name', label: "Certifying Physician's Name" },
                  { key: 'doctor_license', label: "Physician's Medical License" },
                  { key: 'vehicle_plate', label: 'License Plate' },
                ].map((item) => {
                  const ansValue = answers[item.key];
                  const displayValue = ansValue === 'true' ? 'Yes' : ansValue === 'false' ? 'No' : ansValue || 'Missing';
                  
                  return (
                    <div 
                      key={item.key} 
                      className="flex justify-between py-2 border-b border-slate-850 last:border-b-0"
                    >
                      <span className="font-semibold text-slate-350 theme-high-contrast:text-white">
                        {item.label}
                      </span>
                      <span className={`font-bold ${
                        !ansValue 
                          ? 'text-red-400' 
                          : (contrast === 'high' ? 'text-hc-accent' : 'text-slate-100')
                      }`}>
                        {displayValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* List missing fields and documents for quick fixes */}
            {!readiness.isReady && (
              <div className="p-5 rounded-xl bg-red-950/20 border border-red-900/30 mb-8 theme-high-contrast:bg-black theme-high-contrast:border-hc-border">
                <h4 className="font-bold text-sm text-red-300 theme-high-contrast:text-white mb-2">Attention Required:</h4>
                <ul className="list-disc list-inside text-sm space-y-1.5 opacity-90 text-red-200">
                  {readiness.missingQuestions.map((q) => (
                    <li key={q.key}>
                      Question missing: <button onClick={() => {
                        const idx = workflow?.questions.findIndex((qd: any) => qd.key === q.key) ?? -1;
                        if (idx !== -1) {
                          setCurrentStepIdx(idx);
                          setCurrentView('workflow');
                        }
                      }} className="underline font-bold hover:text-white">"{q.label}"</button>
                    </li>
                  ))}
                  {readiness.missingDocuments.map((doc) => (
                    <li key={doc.key}>
                      Attachment missing: <button onClick={() => setCurrentView('checklist')} className="underline font-bold hover:text-white">"{doc.label}"</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex gap-4 border-t border-slate-800 theme-high-contrast:border-hc-border pt-6">
              <button
                onClick={() => setCurrentView('checklist')}
                className={`px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-1 border-2 transition-all ${
                  contrast === 'high' 
                    ? 'border-hc-border text-white hover:bg-white hover:text-black' 
                    : 'border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <ArrowLeft size={18} />
                Back to Checklist
              </button>

              <button
                onClick={() => {
                  if (readiness.isReady) {
                    alert("Congratulations! Sahaayak has compiled your application and prepared your permit documents. You are now ready to print or submit.");
                    setCurrentView('explanation');
                  } else {
                    alert("Please complete the highlighted missing details before submitting.");
                  }
                }}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover-scale text-lg ${
                  readiness.isReady
                    ? (contrast === 'high' ? 'bg-hc-accent text-black' : 'bg-gradient-to-r from-blue-500 to-indigo-650 text-white shadow-xl hover:from-blue-600')
                    : 'bg-slate-700/40 text-slate-400 cursor-not-allowed border border-slate-700'
                }`}
              >
                <ShieldCheck size={20} />
                Finish Application
              </button>
            </div>
          </section>
        )}

      </main>

      {/* AI VOICE DIALOG CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className={`max-w-md w-full p-6 rounded-2xl border-4 shadow-2xl transition-all ${
              contrast === 'high' 
                ? 'bg-black border-hc-border text-white' 
                : 'bg-slate-900 border-slate-700 text-slate-100'
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="flex items-center gap-2 text-blue-400 theme-high-contrast:text-hc-accent font-bold mb-4">
              <Sparkles size={20} className="animate-spin duration-300" />
              <span id="modal-title">AI Speech Interpretation Result</span>
            </div>

            {aiWarning && (
              <p className="text-xs text-amber-400 font-bold mb-2 bg-amber-950/20 p-2 rounded border border-amber-900/20">
                {aiWarning}
              </p>
            )}

            <p className="text-sm text-slate-400 theme-high-contrast:text-white mb-2">We understood you said:</p>
            
            <div className={`p-4 rounded-xl border mb-6 text-lg font-bold text-center ${
              contrast === 'high' ? 'border-hc-border bg-black' : 'border-slate-800 bg-slate-950'
            }`}>
              "{aiInterpretation}"
            </div>

            {isEditingInterpretation && (
              <div className="mb-6">
                <label htmlFor="edit-interpret" className="block text-xs font-bold mb-2">Modify Answer:</label>
                <input
                  type="text"
                  id="edit-interpret"
                  value={editedInterpretation}
                  onChange={(e) => setEditedInterpretation(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg outline-none border transition-all text-sm ${
                    contrast === 'high' 
                      ? 'bg-black border-2 border-hc-border text-white' 
                      : 'bg-slate-800 border-slate-700 text-white focus:border-blue-500'
                  }`}
                />
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleConfirmAnswer(isEditingInterpretation ? editedInterpretation : aiInterpretation)}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover-scale text-base ${
                  contrast === 'high' 
                    ? 'bg-hc-accent text-black' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Check size={18} className="stroke-[3]" />
                Confirm Answer
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (isEditingInterpretation) {
                      setIsEditingInterpretation(false);
                      setEditedInterpretation(aiInterpretation);
                    } else {
                      setIsEditingInterpretation(true);
                    }
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1 border-2 transition-all ${
                    contrast === 'high' 
                      ? 'border-hc-border text-white hover:bg-white hover:text-black' 
                      : 'border-slate-800 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <Edit2 size={14} />
                  {isEditingInterpretation ? 'Cancel Edit' : 'Edit Answer'}
                </button>

                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setIsEditingInterpretation(false);
                    startSpeechCapture();
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1 border-2 transition-all ${
                    contrast === 'high' 
                      ? 'border-hc-border text-white hover:bg-white hover:text-black' 
                      : 'border-slate-800 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <RotateCcw size={14} />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className={`py-6 text-center text-xs border-t transition-colors ${
        contrast === 'high' 
          ? 'bg-black text-white border-hc-border' 
          : 'bg-slate-950 text-slate-450 border-slate-900'
      }`}>
        <div className="max-w-6xl mx-auto px-4">
          <p>© 2026 Sahaayak Accessibility Project. Built for accessible digital enablement.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
