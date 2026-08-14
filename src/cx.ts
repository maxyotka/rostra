/** Joins class names: plain strings and object keys with a truthy value. */
export function cx(...parts: Array<string | false | null | undefined | Record<string, boolean | undefined>>): string {
  const out: string[] = []
  for (const part of parts) {
    if (!part) continue
    if (typeof part === 'string') out.push(part)
    else for (const [key, on] of Object.entries(part)) if (on) out.push(key)
  }
  return out.join(' ')
}
