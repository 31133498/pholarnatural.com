'use client'

import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'

interface BaseProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
}

/**
 * Labelled input with inline validation messaging.
 *
 * Every field in this codebase goes through here so the rules from doc §1.1.5 hold everywhere:
 * a real visible `<label>` (never placeholder-only), the error wired to the input via
 * `aria-describedby`, and `aria-invalid` set so the failure is announced rather than only
 * shown in red.
 */
export function Field({
  label,
  error,
  hint,
  required,
  className = '',
  ...props
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-label-sm text-label-sm font-semibold text-on-surface">
        {label}
        {required && (
          <span className="ml-1 text-error" aria-hidden="true">
            *
          </span>
        )}
        {!required && <span className="ml-2 font-normal text-on-surface-variant">(optional)</span>}
      </label>
      {hint && (
        <p id={hintId} className="mb-1.5 font-body-md text-[12px] text-on-surface-variant">
          {hint}
        </p>
      )}
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined}
        className={`w-full rounded-xl border bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline ${
          error ? 'border-error' : 'border-outline-variant'
        }`}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 font-body-md text-[13px] text-error">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}

export function TextareaField({
  label,
  error,
  required,
  className = '',
  ...props
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-label-sm text-label-sm font-semibold text-on-surface">
        {label}
        {required && (
          <span className="ml-1 text-error" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <textarea
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-xl border bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline ${
          error ? 'border-error' : 'border-outline-variant'
        }`}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 font-body-md text-[13px] text-error">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}

/** Groups related fields with a visible legend, so the form has structure for screen readers. */
export function FieldSet({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-4 font-headline-md text-headline-md text-primary">{legend}</legend>
      {children}
    </fieldset>
  )
}
