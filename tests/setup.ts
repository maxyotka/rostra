import { afterEach } from 'vitest'

// The SSR suite runs in the node environment, where none of this exists — and
// the point of that suite is to catch code that assumes otherwise.
if (typeof window !== 'undefined') {
  await import('@testing-library/jest-dom/vitest')
  const { cleanup } = await import('@testing-library/react')
  afterEach(cleanup)
}
