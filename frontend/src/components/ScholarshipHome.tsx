import React, { useState } from 'react';
import { LiquidGlassButton } from './LiquidGlassButton';
import { useLanguage } from '../contexts/LanguageContext';
import {
  ArrowRight,
  Volume2,
  ShieldCheck,
  Sparkles,
  Compass,
  CheckCircle2,
  Circle,
  BookOpen
} from 'lucide-react';

export interface ScholarshipHomeProps {
  userEmail?: string;
  onStartScholarship: () => void;
  onStartOtherApplication: () => void;
  onOpenChat: () => void;
  onReadOverview?: () => void;
}

export const ScholarshipHome: React.FC<ScholarshipHomeProps> = ({
  userEmail,
  onStartScholarship,
  onStartOtherApplication,
  onOpenChat,
}) => {
  const { t } = useLanguage();
  const [typedPrompt, setTypedPrompt] = useState('');
  const [showOtherNotice, setShowOtherNotice] = useState(false);

  const handleHelpInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedPrompt.trim()) {
      onOpenChat();
    } else {
      onStartScholarship();
    }
  };

  const handleOtherClick = () => {
    setShowOtherNotice(true);
    onStartOtherApplication();
  };

  return (
    <div className="w-full max-w-[1240px] mx-auto space-y-10 animate-fadeIn text-left">

      {/* 1. HERO SECTION (EDITORIAL TWO-COLUMN LAYOUT) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-2 sm:py-4">
        {/* Left Hero Column */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-[var(--brand-saffron)]/15 text-[var(--brand-saffron)] font-hyperlegible">
              <Sparkles size={13} className="text-[var(--brand-saffron)]" />
              {t('selection.progressTitle', 'SCHOLARSHIP PREPARATION')}
            </span>
            {userEmail && (
              <span className="text-xs text-[var(--ink-secondary)] font-hyperlegible truncate max-w-xs">
                • {t('nav.signedInAs', 'Signed in as')} <strong className="text-[var(--ink-primary)]">{userEmail}</strong>
              </span>
            )}
          </div>

          <div className="space-y-3">
            <h1 className="font-fraunces font-bold text-4xl sm:text-5xl lg:text-[52px] leading-[1.08] tracking-tight text-[var(--ink-primary)]">
              {t('home.heroTitle', 'Prepare your scholarship application, step by step')}
            </h1>

            <p className="font-hyperlegible text-base sm:text-lg text-[var(--ink-secondary)] leading-relaxed max-w-xl">
              {t('home.heroSub', 'Sahaayak guides you through profile details, document checklists, and review statements before applying on official portals.')}
            </p>
          </div>
        </div>

        {/* Right Hero Column: Abstract Editorial Scholarship Visual */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-[380px] rounded-3xl p-6 bg-[var(--surface-panel)] border border-[var(--border-subtle)] shadow-[var(--shadow-soft)] space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2 font-fraunces font-bold text-sm text-[var(--ink-primary)]">
                <BookOpen size={16} className="text-[var(--brand-saffron)]" />
                <span>Scholarship Draft Workspace</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[var(--brand-sage)]/15 text-[var(--brand-sage)]">
                Ready
              </span>
            </div>

            {/* Checklist items */}
            <div className="space-y-3 font-hyperlegible">
              <span className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider block">
                Guided Questionnaire
              </span>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between text-[var(--ink-primary)]">
                  <span>Profile</span>
                  <CheckCircle2 size={16} className="text-[var(--brand-sage)]" />
                </div>
                <div className="flex items-center justify-between text-[var(--ink-primary)]">
                  <span>Details</span>
                  <CheckCircle2 size={16} className="text-[var(--brand-sage)]" />
                </div>
                <div className="flex items-center justify-between text-[var(--ink-secondary)]">
                  <span>Documents</span>
                  <Circle size={16} className="text-[var(--ink-muted)]" />
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 font-hyperlegible pt-1">
              <div className="flex items-center justify-between text-xs text-[var(--ink-secondary)]">
                <span>Preparation progress</span>
                <span className="font-bold text-[var(--brand-saffron)]">72%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--surface-soft)] border border-[var(--border-subtle)] overflow-hidden">
                <div className="w-[72%] h-full bg-gradient-to-r from-[var(--brand-indigo)] to-[var(--brand-saffron)] rounded-full" />
              </div>
            </div>

            {/* Card Action Link */}
            <button
              type="button"
              onClick={onStartScholarship}
              className="w-full pt-2 flex items-center justify-between text-xs font-bold font-hyperlegible text-[var(--brand-indigo)] hover:text-[var(--brand-saffron)] transition-colors cursor-pointer"
            >
              <span>Continue preparation</span>
              <ArrowRight size={14} />
            </button>

          </div>
        </div>

      </section>

      {/* 2. SAFETY BOUNDARY (POLISHED REASSURING CARD) */}
      <section>
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-sm font-hyperlegible flex items-start gap-3.5 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-[var(--brand-saffron)]/15 text-[var(--brand-saffron)] flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck size={18} />
          </div>
          <div className="space-y-0.5">
            <h2 className="font-bold text-[var(--ink-primary)] text-sm font-hyperlegible">
              Safety Boundary
            </h2>
            <p className="text-[var(--ink-secondary)] leading-relaxed">
              Sahaayak helps you prepare information and documents. It does not determine eligibility or submit an application.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CHOOSE YOUR PREPARATION PATH (TWO SIDE-BY-SIDE CARDS) */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="font-fraunces font-semibold text-2xl sm:text-3xl text-[var(--ink-primary)]">
            Choose your preparation path
          </h2>
          <p className="font-hyperlegible text-sm sm:text-base text-[var(--ink-secondary)]">
            Start with the workflow that matches what you're preparing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* CARD 1 — PRIMARY: Scholarship Application */}
          <div className="p-7 sm:p-8 rounded-3xl bg-[var(--surface-panel)] border border-[var(--border-subtle)] shadow-[var(--shadow-soft)] hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-md bg-[var(--brand-saffron)]/15 text-[var(--brand-saffron)] font-hyperlegible">
                  SCHOLARSHIP APPLICATION
                </span>
                <Sparkles size={20} className="text-[var(--brand-saffron)]" />
              </div>

              <h3 className="font-fraunces font-semibold text-2xl text-[var(--ink-primary)]">
                Prepare a scholarship application
              </h3>

              <p className="font-hyperlegible text-base text-[var(--ink-secondary)] leading-relaxed">
                Organise your information and review every answer before moving ahead.
              </p>
            </div>

            <div className="pt-2">
              <LiquidGlassButton
                type="button"
                variant="primary"
                onClick={onStartScholarship}
                icon={<ArrowRight size={18} />}
                className="w-full"
              >
                Start preparation
              </LiquidGlassButton>
            </div>
          </div>

          {/* CARD 2 — SECONDARY: Other Application */}
          <div className="p-7 sm:p-8 rounded-3xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-md bg-[var(--ink-secondary)]/10 text-[var(--ink-secondary)] font-hyperlegible">
                  OTHER APPLICATION
                </span>
                <Compass size={20} className="text-[var(--ink-secondary)]" />
              </div>

              <h3 className="font-fraunces font-semibold text-2xl text-[var(--ink-primary)]">
                Other application preparation
              </h3>

              <p className="font-hyperlegible text-base text-[var(--ink-secondary)] leading-relaxed">
                Use the same guided workflow for another preparation journey.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {showOtherNotice && (
                <p className="text-xs text-[var(--brand-saffron)] font-hyperlegible italic">
                  Notice: Opening generic preparation template...
                </p>
              )}
              <LiquidGlassButton
                type="button"
                variant="secondary"
                onClick={handleOtherClick}
                icon={<ArrowRight size={18} />}
                className="w-full"
              >
                Explore
              </LiquidGlassButton>
            </div>
          </div>

        </div>
      </section>

      {/* 4. TELL US WHAT YOU WANT TO PREPARE */}
      <section className="p-7 sm:p-8 rounded-3xl bg-[var(--surface-panel)] border border-[var(--border-subtle)] shadow-[var(--shadow-soft)] space-y-4">
        <div className="space-y-1">
          <h2 className="font-fraunces font-semibold text-2xl text-[var(--ink-primary)]">
            Tell us what you want to prepare
          </h2>
          <p className="font-hyperlegible text-sm text-[var(--ink-secondary)]">
            You can type your question or use voice assistance if needed.
          </p>
        </div>

        <form onSubmit={handleHelpInputSubmit} className="space-y-4">
          <textarea
            id="home-prompt-textarea"
            rows={3}
            value={typedPrompt}
            onChange={(e) => setTypedPrompt(e.target.value)}
            placeholder="Need help organising my college motivation statement..."
            className="w-full p-4 rounded-2xl text-base font-hyperlegible outline-none bg-[var(--surface-soft)] border border-[var(--border-subtle)] focus:border-[var(--brand-indigo)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] resize-none transition-all"
          />

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2 text-xs font-hyperlegible text-[var(--ink-secondary)]">
              <Volume2 size={16} className="text-[var(--brand-saffron)]" />
              <span>Voice transcription available in questionnaires</span>
            </div>

            <LiquidGlassButton type="submit" icon={<ArrowRight size={18} />} className="w-full sm:w-[180px]">
              Continue
            </LiquidGlassButton>
          </div>
        </form>
      </section>

      {/* 5. PREPARATION JOURNEY */}
      <section className="p-7 sm:p-8 rounded-3xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] space-y-6">
        <div className="space-y-1">
          <h2 className="font-fraunces font-semibold text-2xl text-[var(--ink-primary)]">
            Your preparation journey
          </h2>
          <p className="font-hyperlegible text-xs sm:text-sm font-semibold text-[var(--ink-secondary)]">
            01 ───── 02 ───── 03 ───── 04 ───── 05
          </p>
        </div>

        {/* Desktop Horizontal Progress Indicator */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative pt-2">
          {/* Step 01: Choose (Active) */}
          <div className="p-4 rounded-2xl bg-[var(--surface-panel)] border-2 border-[var(--brand-saffron)] shadow-sm space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-hyperlegible text-[var(--brand-saffron)]">
                01 Choose
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand-saffron)]" />
            </div>
            <p className="font-hyperlegible text-xs font-semibold text-[var(--ink-primary)]">
              Select scholarship draft
            </p>
          </div>

          {/* Step 02: Answer */}
          <div className="p-4 rounded-2xl bg-[var(--surface-panel)] border border-[var(--border-subtle)] space-y-1.5">
            <span className="text-xs font-bold font-hyperlegible text-[var(--ink-muted)] block">
              02 Answer
            </span>
            <p className="font-hyperlegible text-xs text-[var(--ink-secondary)]">
              Guided questionnaires
            </p>
          </div>

          {/* Step 03: Review */}
          <div className="p-4 rounded-2xl bg-[var(--surface-panel)] border border-[var(--border-subtle)] space-y-1.5">
            <span className="text-xs font-bold font-hyperlegible text-[var(--ink-muted)] block">
              03 Review
            </span>
            <p className="font-hyperlegible text-xs text-[var(--ink-secondary)]">
              Confirm draft details
            </p>
          </div>

          {/* Step 04: Documents */}
          <div className="p-4 rounded-2xl bg-[var(--surface-panel)] border border-[var(--border-subtle)] space-y-1.5">
            <span className="text-xs font-bold font-hyperlegible text-[var(--ink-muted)] block">
              04 Documents
            </span>
            <p className="font-hyperlegible text-xs text-[var(--ink-secondary)]">
              Checklist summary
            </p>
          </div>

          {/* Step 05: Ready (Completed) */}
          <div className="p-4 rounded-2xl bg-[var(--surface-panel)] border border-[var(--brand-sage)]/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-hyperlegible text-[var(--brand-sage)]">
                05 Ready
              </span>
              <CheckCircle2 size={15} className="text-[var(--brand-sage)]" />
            </div>
            <p className="font-hyperlegible text-xs font-semibold text-[var(--brand-sage)]">
              Preparation completed
            </p>
          </div>

        </div>
      </section>

      {/* 6. ASK SAHAAYAK ASSISTANT CARD */}
      <section className="p-7 sm:p-8 rounded-3xl bg-[var(--surface-panel)] border border-[var(--border-subtle)] shadow-[var(--shadow-soft)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <h3 className="font-fraunces font-semibold text-2xl text-[var(--ink-primary)]">✦ Ask Sahaayak</h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-[var(--brand-indigo)]/10 text-[var(--brand-indigo)] font-hyperlegible">
              Guidance Only
            </span>
          </div>
          <p className="font-hyperlegible text-base text-[var(--ink-secondary)] leading-relaxed">
            Have questions about organising your answers or preparing documents? Ask our assistant.
          </p>
        </div>

        <div className="w-full md:w-auto shrink-0">
          <LiquidGlassButton
            type="button"
            variant="secondary"
            onClick={onOpenChat}
            icon={<Sparkles size={18} />}
            className="w-full md:w-[220px]"
          >
            Ask Sahaayak
          </LiquidGlassButton>
        </div>
      </section>

      {/* 7. MINIMAL FOOTER */}
      <footer className="pt-6 border-t border-[var(--border-subtle)] text-center text-xs font-hyperlegible text-[var(--ink-muted)]">
        <p>© 2026 Sahaayak. All rights reserved.</p>
      </footer>

    </div>
  );
};
