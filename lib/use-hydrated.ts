'use client'

import { useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

/**
 * `false` while rendering on the server and during the hydration render, `true` afterwards.
 *
 * Anything that depends on browser-only state — localStorage carts, sessionStorage
 * confirmations, `window.scrollY` — must render its server-side shape until this flips, or the
 * hydration render will not match the server HTML.
 *
 * This is the `useSyncExternalStore` form rather than a `useState` + `useEffect` pair. The effect
 * version works, but it calls `setState` synchronously from an effect body, which triggers a
 * second render pass for every consumer and is flagged by the React lint rules.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, getClientSnapshot, getServerSnapshot)
}
