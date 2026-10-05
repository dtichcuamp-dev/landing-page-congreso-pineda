import type { ReactNode } from "react";

export const inputClass = (hasError: boolean) =>
  `glass-input w-full rounded-xl px-4 py-3 text-base text-ink placeholder:text-ink-mute/70 outline-none transition focus:border-brand-400 focus:bg-white/90 focus:ring-4 focus:ring-brand-200/60 ${
    hasError ? "!border-red-400 focus:!ring-red-200/70" : ""
  }`;

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({ id, label, error, hint, required = true, className = "", children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="ml-0.5 text-brand-500" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-mute">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
