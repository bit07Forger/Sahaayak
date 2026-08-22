import React from 'react';

interface LiquidGlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  isSubmitting?: boolean;
  variant?: 'primary' | 'secondary' | 'tertiary';
  className?: string;
}

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  children,
  icon,
  isSubmitting = false,
  variant = 'primary',
  className = '',
  disabled,
  type = 'submit',
  ...props
}) => {
  if (variant === 'secondary') {
    return (
      <button
        type={type}
        disabled={disabled || isSubmitting}
        className={`group inline-flex items-center justify-between gap-3 h-[52px] px-6 rounded-2xl font-hyperlegible text-sm font-semibold transition-all duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#34456B]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-[#FFFFFF] dark:bg-[#1E2B42] text-[#172033] dark:text-[#F4F1EA] border border-[#E6E2D9] dark:border-[#2D3D58] hover:bg-[#FBFAF7] dark:hover:bg-[#253550] shadow-sm ${className}`}
        {...props}
      >
        <span className="font-semibold text-left text-[#172033] dark:text-[#F4F1EA]">{children}</span>
        {icon && <span className="shrink-0 transition-transform duration-200 group-hover:translate-x-1 text-[#172033] dark:text-[#F4F1EA]">{icon}</span>}
      </button>
    );
  }

  if (variant === 'tertiary') {
    return (
      <button
        type={type}
        disabled={disabled || isSubmitting}
        className={`group inline-flex items-center gap-2 h-[44px] px-4 rounded-xl font-hyperlegible text-sm font-semibold text-[#172033] dark:text-[#91A4D6] hover:bg-[#34456B]/08 dark:hover:bg-[#91A4D6]/10 transition-all duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34456B] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
        {...props}
      >
        {icon && <span className="shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5 text-[#172033] dark:text-[#91A4D6]">{icon}</span>}
        <span className="font-semibold text-left text-[#172033] dark:text-[#91A4D6]">{children}</span>
      </button>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || isSubmitting}
      className={`liquid-glass-btn relative group inline-flex items-center justify-between gap-3 h-[52px] px-6 rounded-2xl font-hyperlegible text-sm font-bold text-white transition-all duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#34456B]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
      {...props}
    >
      {/* Translucent Glass Surface & Rim Layers */}
      <span className="liquid-glass-surface absolute inset-0 rounded-2xl transition-all duration-200 group-hover:brightness-110" aria-hidden="true" />
      <span className="liquid-glass-rim absolute inset-0 rounded-2xl border border-white/25 pointer-events-none" aria-hidden="true" />
      <span className="liquid-glass-shine absolute inset-x-3 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" aria-hidden="true" />

      {/* Explicit White Text & Icon */}
      <span className="relative z-10 font-bold text-left text-white">{children}</span>
      {icon && <span className="relative z-10 shrink-0 transition-transform duration-200 group-hover:translate-x-1 text-white">{icon}</span>}
    </button>
  );
};
