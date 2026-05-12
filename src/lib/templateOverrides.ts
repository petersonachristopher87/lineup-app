import { LEVEL_TEMPLATES, type LevelTemplate } from '@/lib/levelTemplates'

const STORAGE_KEY = 'lineup-app:template-overrides:v1'

type Overrides = Record<string, LevelTemplate>

function readOverrides(): Overrides {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed != null ? parsed : {}
  } catch {
    return {}
  }
}

function writeOverrides(next: Overrides) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

/**
 * Returns the template for a level, applying any user override on top of the
 * hardcoded default. Always returns a *copy* — callers can mutate it freely.
 */
export function getTemplate(level: string): LevelTemplate {
  const base = LEVEL_TEMPLATES[level]
  if (!base) {
    throw new Error(`Unknown level: ${level}`)
  }
  const overrides = readOverrides()
  if (overrides[level]) {
    return JSON.parse(JSON.stringify(overrides[level])) as LevelTemplate
  }
  return JSON.parse(JSON.stringify(base)) as LevelTemplate
}

export function getAllTemplates(): Record<string, LevelTemplate> {
  return Object.fromEntries(
    Object.keys(LEVEL_TEMPLATES).map((lvl) => [lvl, getTemplate(lvl)])
  )
}

export function setTemplateOverride(level: string, template: LevelTemplate) {
  if (!LEVEL_TEMPLATES[level]) throw new Error(`Unknown level: ${level}`)
  const overrides = readOverrides()
  overrides[level] = template
  writeOverrides(overrides)
}

export function clearTemplateOverride(level: string) {
  const overrides = readOverrides()
  delete overrides[level]
  writeOverrides(overrides)
}

export function hasTemplateOverride(level: string): boolean {
  return level in readOverrides()
}

export const LEVEL_KEYS = Object.keys(LEVEL_TEMPLATES)
