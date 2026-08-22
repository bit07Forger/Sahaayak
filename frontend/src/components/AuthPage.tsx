import React from 'react';
import { Eye, EyeOff, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { LiquidGlassButton } from './LiquidGlassButton';
import { LanguageDropdown } from './LanguageDropdown';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthPageProps {
  authTab: 'login' | 'register';
  setAuthTab: (tab: 'login' | 'register') => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (val: boolean) => void;
  authError: string | null;
  setAuthError: (val: string | null) => void;
  registrationSuccess: boolean;
  isSubmitting: boolean;
  handleAuthSubmit: (e: React.FormEvent) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  authTab,
  setAuthTab,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  authError,
  setAuthError,
  registrationSuccess,
  isSubmitting,
  handleAuthSubmit,
}) => {
  const { contrast } = useAccessibility();
  const { t } = useLanguage();
  const isHighContrast = contrast === 'high';

  return (
    <div
      className={`min-h-screen w-full relative flex flex-col items-center justify-center overflow-x-hidden transition-colors duration-200 ${
        isHighContrast ? 'bg-black text-white' : 'bg-[#F7F4EE] text-[#1E2638]'
      }`}
    >
      {/* Top Header Navigation Bar for Auth Page */}
      <header className="w-full max-w-[1280px] mx-auto px-6 sm:px-12 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <span className="font-fraunces font-bold text-2xl tracking-tight text-[#1E2638] theme-high-contrast:text-yellow-400">
            {t('nav.brand', 'Sahaayak')}
          </span>
        </div>

        {/* Top Right Accessible Language Selector */}
        <LanguageDropdown id="auth-header-language-select" />
      </header>
      {/* Ambient Radial Background Gradients */}
      {!isHighContrast && (
        <>
          <div
            className="absolute top-1/4 left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full pointer-events-none filter blur-[120px] opacity-30 bg-gradient-to-br from-[#D98310]/20 to-transparent"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-1/4 right-[-10%] w-[45vw] h-[45vw] max-w-[550px] max-h-[550px] rounded-full pointer-events-none filter blur-[120px] opacity-25 bg-gradient-to-tl from-[#2D3A56]/20 to-transparent"
            aria-hidden="true"
          />
        </>
      )}

      {/* Strict Horizontal Side-by-Side 2-Column Grid */}
      <main className="auth-page relative z-10 w-full min-h-screen max-w-[1280px] mx-auto px-6 sm:px-12 md:px-16 py-12 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(400px,460px)] items-center gap-12 md:gap-20">
        {/* LEFT BRANDING AREA — VERTICALLY CENTERED */}
        <div className="w-full max-w-[620px] self-center space-y-7 text-left">
          {/* Sahaayak Wordmark & Subtitle */}
          <div>
            <h1 className="font-fraunces font-bold text-3xl sm:text-[36px] tracking-tight text-[#1E2638] theme-high-contrast:text-yellow-400">
              Sahaayak
            </h1>
            <span className="font-hyperlegible text-[14px] uppercase tracking-[0.12em] font-bold text-[#D98310] theme-high-contrast:text-white mt-1.5 block">
              SCHOLARSHIP STUDIO
            </span>
          </div>

          {/* Hero Headline */}
          <div className="space-y-4 max-w-[600px]">
            <h2 className="font-fraunces font-semibold text-[42px] sm:text-[54px] lg:text-[64px] leading-[1.02] tracking-[-0.03em] text-[#1E2638] theme-high-contrast:text-white">
              Prepare your application,
              <span className="block font-normal italic text-[#2D3A56] theme-high-contrast:text-yellow-300">
                one clear step at a time.
              </span>
            </h2>

            {/* Hero Supporting Copy */}
            <p className="font-hyperlegible text-base sm:text-lg text-[#4A5366] theme-high-contrast:text-slate-200 leading-[1.6] max-w-[520px] pt-1">
              Sahaayak helps you organise your information, review your answers, and prepare your documents with clarity.
            </p>
          </div>

          {/* Compact Feature Cards (Horizontal Desktop Layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 max-w-[600px]">
            <div
              className={`p-[18px] min-h-[115px] rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isHighContrast
                  ? 'bg-black border-yellow-400 text-white'
                  : 'bg-white/60 backdrop-blur-sm border-[#1E2638]/10 hover:border-[#1E2638]/20 shadow-sm'
              }`}
            >
              <span className="font-hyperlegible font-bold text-xs uppercase tracking-wider text-[#D98310] theme-high-contrast:text-yellow-400">
                01 PREPARE
              </span>
              <span className="font-hyperlegible font-semibold text-xs sm:text-sm text-[#1E2638] theme-high-contrast:text-white leading-snug">
                Organise your information
              </span>
            </div>

            <div
              className={`p-[18px] min-h-[115px] rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isHighContrast
                  ? 'bg-black border-yellow-400 text-white'
                  : 'bg-white/60 backdrop-blur-sm border-[#1E2638]/10 hover:border-[#1E2638]/20 shadow-sm'
              }`}
            >
              <span className="font-hyperlegible font-bold text-xs uppercase tracking-wider text-[#D98310] theme-high-contrast:text-yellow-400">
                02 REVIEW
              </span>
              <span className="font-hyperlegible font-semibold text-xs sm:text-sm text-[#1E2638] theme-high-contrast:text-white leading-snug">
                Check your answers
              </span>
            </div>

            <div
              className={`p-[18px] min-h-[115px] rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isHighContrast
                  ? 'bg-black border-yellow-400 text-white'
                  : 'bg-white/60 backdrop-blur-sm border-[#1E2638]/10 hover:border-[#1E2638]/20 shadow-sm'
              }`}
            >
              <span className="font-hyperlegible font-bold text-xs uppercase tracking-wider text-[#52745C] theme-high-contrast:text-yellow-400">
                03 READY
              </span>
              <span className="font-hyperlegible font-semibold text-xs sm:text-sm text-[#1E2638] theme-high-contrast:text-white leading-snug">
                Know what to prepare next
              </span>
            </div>
          </div>

          {/* Subtle Guidance Footer Note */}
          <p className="text-xs font-hyperlegible text-[#697386] theme-high-contrast:text-white opacity-80 pt-2">
            © 2026 Sahaayak • Preparation guidance only.
          </p>

        </div>

        {/* RIGHT AUTHENTICATION AREA — VERTICALLY CENTERED, SAME HORIZONTAL ROW */}
        <div className="w-full max-w-[460px] justify-self-center md:justify-self-end self-center">
          <div
            className={`w-full p-8 sm:p-9 rounded-3xl border transition-all ${
              isHighContrast
                ? 'bg-black border-4 border-yellow-400 text-white'
                : 'bg-white/95 backdrop-blur-sm border-[#E4E0D8] text-[#1E2638] shadow-[0_20px_60px_rgba(30,38,56,0.08)]'
            }`}
          >
            {/* Segmented Control Switcher */}
            <div
              className={`h-12 p-1 rounded-xl mb-7 flex items-center ${
                isHighContrast ? 'bg-slate-900 border border-yellow-400' : 'bg-[#F1EFE9] border border-[#E2DED5]'
              }`}
              role="tablist"
              aria-label="Authentication Mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={authTab === 'login'}
                onClick={() => {
                  setAuthTab('login');
                  setAuthError(null);
                }}
                className={`flex-1 h-full rounded-[9px] font-hyperlegible text-[15px] transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  authTab === 'login'
                    ? isHighContrast
                      ? 'bg-yellow-400 text-black font-bold'
                      : 'bg-white text-[#1E2638] font-bold shadow-[0_2px_8px_rgba(30,38,56,0.08)]'
                    : isHighContrast
                    ? 'text-white hover:text-yellow-400 font-semibold'
                    : 'text-[#697386] hover:text-[#1E2638] font-semibold'
                }`}
              >
                {t('auth.signInTab', 'Sign in')}
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={authTab === 'register'}
                onClick={() => {
                  setAuthTab('register');
                  setAuthError(null);
                }}
                className={`flex-1 h-full rounded-[9px] font-hyperlegible text-[15px] transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  authTab === 'register'
                    ? isHighContrast
                      ? 'bg-yellow-400 text-black font-bold'
                      : 'bg-white text-[#1E2638] font-bold shadow-[0_2px_8px_rgba(30,38,56,0.08)]'
                    : isHighContrast
                    ? 'text-white hover:text-yellow-400 font-semibold'
                    : 'text-[#697386] hover:text-[#1E2638] font-semibold'
                }`}
              >
                {t('auth.registerTab', 'Create account')}
              </button>
            </div>

            {/* Auth Card Header Title */}
            <div className="mb-7 text-left space-y-1.5">
              <h3 className="font-fraunces font-semibold text-[34px] leading-[1.1] text-[#1E2638] theme-high-contrast:text-white">
                {authTab === 'login' ? t('auth.signInTab', 'Sign in') : t('auth.registerTab', 'Create account')}
              </h3>
              <p className="font-hyperlegible text-base text-[#596276] theme-high-contrast:text-slate-200 leading-[1.5]">
                {t('auth.boundary', 'Sahaayak helps you prepare applications. It does not decide eligibility or submit applications.')}
              </p>
            </div>

            {/* Error Notice Alert */}
            {authError && (
              <div
                className={`p-4 mb-6 rounded-2xl border text-sm font-hyperlegible flex items-start gap-3 text-left ${
                  isHighContrast
                    ? 'border-red-500 bg-black text-red-400 font-bold'
                    : 'bg-rose-50 border-rose-200 text-[#A83A3A]'
                }`}
                role="alert"
                id="auth-error-desc"
              >
                <AlertTriangle size={18} className="shrink-0 mt-0.5 text-[#A83A3A] theme-high-contrast:text-red-400" />
                <span className="leading-snug">{authError}</span>
              </div>
            )}

            {/* Registration Success Alert Banner */}
            {registrationSuccess && authTab === 'login' && (
              <div
                className={`p-4 mb-6 rounded-2xl border text-sm font-hyperlegible flex items-start gap-3 text-left ${
                  isHighContrast
                    ? 'border-green-500 bg-black text-green-400 font-bold'
                    : 'bg-emerald-50 border-emerald-200 text-[#52745C]'
                }`}
                role="alert"
              >
                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-[#52745C] theme-high-contrast:text-green-400" />
                <span className="leading-snug">Registration successful! You can now sign in with your credentials.</span>
              </div>
            )}

            {/* Form Inputs & Submit Action */}
            <form onSubmit={handleAuthSubmit} className="space-y-5 text-left">
              {/* Email Address Input */}
              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-[15px] font-semibold mb-2 font-hyperlegible text-[#1E2638] theme-high-contrast:text-white"
                >
                  {t('auth.emailLabel', 'Email address')}
                </label>
                <input
                  type="email"
                  id="auth-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  aria-invalid={authError ? 'true' : 'false'}
                  aria-describedby={authError ? 'auth-error-desc' : undefined}
                  className={`w-full h-[54px] px-4 rounded-xl text-base font-hyperlegible outline-none transition-all ${
                    isHighContrast
                      ? 'bg-black border-2 border-yellow-400 text-white placeholder-slate-400 focus:ring-2 focus:ring-yellow-400'
                      : 'bg-white border border-[#D7DCE5] text-[#1E2638] placeholder-slate-400 focus:border-[#2D3A56] focus:ring-[3px] focus:ring-[#2D3A56]/12'
                  }`}
                />
              </div>

              {/* Password Input with Dedicated 52px Eye Area System */}
              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-[15px] font-semibold mb-2 font-hyperlegible text-[#1E2638] theme-high-contrast:text-white"
                >
                  {t('auth.passwordLabel', 'Password')} {authTab === 'register' && <span className="font-normal text-xs text-[#596276] theme-high-contrast:text-yellow-300">(Min 8 chars)</span>}
                </label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="auth-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={authTab === 'login' ? 'current-password' : 'new-password'}
                    aria-invalid={authError ? 'true' : 'false'}
                    className="password-input font-hyperlegible"
                  />
                  <div className="password-toggle-area">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      aria-label={showPassword ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Confirm Password Field (Registration Mode) */}
              {authTab === 'register' && (
                <div>
                  <label
                    htmlFor="auth-confirm-pass"
                    className="block text-[15px] font-semibold mb-2 font-hyperlegible text-[#1E2638] theme-high-contrast:text-white"
                  >
                    {t('auth.passwordLabel', 'Password')}
                  </label>
                  <div className="password-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="auth-confirm-pass"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      aria-invalid={authError ? 'true' : 'false'}
                      className="password-input font-hyperlegible"
                    />
                    <div className="password-toggle-area">
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="password-toggle"
                        aria-label={showConfirmPassword ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
                        aria-pressed={showConfirmPassword}
                      >
                        {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Primary CTA LiquidGlassButton */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-start justify-start">
                <LiquidGlassButton
                  type="submit"
                  isSubmitting={isSubmitting}
                  icon={<ArrowRight size={18} />}
                  className="w-full sm:w-auto"
                >
                  {authTab === 'login' ? t('auth.signInSubmit', 'Sign in to workspace') : t('auth.registerSubmit', 'Register account')}
                </LiquidGlassButton>
              </div>

              {/* Secondary Account Switch Action */}
              <div className="pt-4 text-center font-hyperlegible text-sm text-[#596276] theme-high-contrast:text-white">
                {authTab === 'login' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('register');
                      setAuthError(null);
                    }}
                    className="font-semibold text-[#2D3A56] hover:underline theme-high-contrast:text-yellow-400 cursor-pointer ml-1"
                  >
                    {t('auth.toggleToRegister', 'Need an account? Register here')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('login');
                      setAuthError(null);
                    }}
                    className="font-semibold text-[#2D3A56] hover:underline theme-high-contrast:text-yellow-400 cursor-pointer ml-1"
                  >
                    {t('auth.toggleToSignIn', 'Already have an account? Sign in')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

      </main>
    </div>
  );
};
