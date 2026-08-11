'use client'

import { useEffect, useId, useState } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  /** Milliseconds to wait after the last keystroke before reporting the value up. */
  debounceMs?: number
  className?: string
}

/**
 * Debounced search input (doc §1.3.1).
 *
 * Keeps its own immediate state so typing stays responsive, and only pushes the value to the
 * parent after the debounce — the parent re-filters, not every keystroke.
 *
 * The label is a real `<label>`, visually hidden rather than replaced by the placeholder
 * (doc §1.1.5 forbids placeholder-only labelling).
 */
export default function SearchBar({
  value,
  onChange,
  label = 'Search products',
  placeholder = 'Search by name or ingredient…',
  debounceMs = 250,
  className = '',
}: SearchBarProps) {
  const id = useId()
  const [local, setLocal] = useState(value)

  /*
   * Keep in step when the parent resets the value (e.g. "clear all filters").
   *
   * This is React's "adjusting state when a prop changes" pattern — comparing against the
   * previous prop during render — rather than a `useEffect` that calls `setState`. The effect
   * version renders once with the stale value before correcting itself, which shows up as a
   * flicker in the input.
   */
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setLocal(value)
  }

  useEffect(() => {
    if (local === value) return
    const t = setTimeout(() => onChange(local), debounceMs)
    return () => clearTimeout(t)
  }, [local, value, onChange, debounceMs])

  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only-live">
        {label}
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
          aria-hidden="true"
        />
        <input
          id={id}
          type="search"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-full border border-outline-variant bg-surface-container-lowest py-2.5 pl-11 pr-10 font-body-md text-body-md text-on-surface placeholder:text-outline"
        />
        {local && (
          <button
            type="button"
            onClick={() => {
              setLocal('')
              onChange('')
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
