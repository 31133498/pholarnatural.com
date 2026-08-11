'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { SearchX, ArrowRight } from 'lucide-react'
import Accordion from '@/components/Accordion'
import SearchBar from '@/components/SearchBar'
import { FAQS, FAQ_CATEGORIES, type FaqCategory } from '@/lib/faq'

/** Searchable, category-grouped FAQ (doc §1.11). */
export default function FaqBrowser() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<FaqCategory | 'All'>('All')

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return FAQS.filter((f) => {
      const inCategory = category === 'All' || f.category === category
      const inQuery =
        !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
      return inCategory && inQuery
    })
  }, [query, category])

  const grouped = useMemo(
    () =>
      FAQ_CATEGORIES.map((c) => ({ category: c, entries: matches.filter((f) => f.category === c) })).filter(
        (g) => g.entries.length > 0,
      ),
    [matches],
  )

  return (
    <>
      <div className="mb-8 space-y-4">
        <SearchBar
          value={query}
          onChange={setQuery}
          label="Search frequently asked questions"
          placeholder="Search questions…"
        />

        <div role="radiogroup" aria-label="Filter by category" className="flex flex-wrap gap-2">
          {(['All', ...FAQ_CATEGORIES] as const).map((c) => {
            const active = c === category
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-2 font-label-sm text-label-sm transition-colors ${
                  active
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>

      <p aria-live="polite" className="mb-6 font-body-md text-body-md text-on-surface-variant">
        {matches.length} {matches.length === 1 ? 'question' : 'questions'}
      </p>

      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant py-16 text-center">
          <SearchX className="mx-auto mb-4 h-10 w-10 text-outline" aria-hidden="true" />
          <h2 className="mb-2 font-headline-md text-headline-md text-primary">No matching questions</h2>
          <p className="mb-6 font-body-md text-body-md text-on-surface-variant">
            We may not have covered this one yet — ask us directly.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-label-sm text-label-sm text-white"
          >
            Contact us
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map((group) => (
            <section key={group.category}>
              <h2 className="mb-4 font-headline-md text-headline-md text-primary">{group.category}</h2>
              <Accordion
                allowMultiple
                items={group.entries.map((f) => ({
                  id: f.id,
                  title: f.question,
                  content: <p>{f.answer}</p>,
                }))}
              />
            </section>
          ))}
        </div>
      )}
    </>
  )
}
