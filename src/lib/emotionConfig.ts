import { DEFAULT_GROUPS, DEFAULT_WORDS } from '../data/emotions'

/** 방마다 선생님이 고칠 수 있는 감정 목록 (rooms.settings.emotions) */
export interface ConfigGroup {
  key: string
  name: string
  color: string
  image: string | null
  enabled: boolean
}

export interface ConfigWord {
  id: string
  group: string
  word: string
  /** 수직선 위치 = 감정 크기 1~5 */
  intensity: number
  image: string | null
  /** 그림이 없을 때 보여 줄 이모지 */
  emoji?: string
}

export interface EmotionConfig {
  groups: ConfigGroup[]
  words: ConfigWord[]
}

/** 이름표 붙이기 단계: 1 = 큰 감정만, 2 = 큰 감정 + 크기, 3 = 이유 문장까지 */
export type NamingLevel = 1 | 2 | 3

export interface NameTagResult {
  groupKey: string
  groupName: string
  color: string
  word: string | null
  intensity: number | null
  reason: string | null
  image: string | null
  emoji?: string
}

export function defaultConfig(): EmotionConfig {
  return {
    groups: DEFAULT_GROUPS.map((g) => ({ key: g.key, name: g.name, color: g.color, image: g.image, enabled: true })),
    words: DEFAULT_WORDS.map((w) => ({ id: w.id, group: w.group, word: w.word, intensity: w.intensity, image: w.image })),
  }
}

const clampLevel = (n: unknown): NamingLevel => (n === 1 || n === 2 || n === 3 ? n : 3)

/** 방 설정에서 감정 목록 꺼내기. 없거나 이상하면 기본값 */
export function readSettings(settings: Record<string, unknown> | null | undefined): {
  config: EmotionConfig
  level: NamingLevel
} {
  const level = clampLevel(settings?.namingLevel)
  const raw = settings?.emotions as Partial<EmotionConfig> | undefined
  if (!raw || !Array.isArray(raw.groups) || !Array.isArray(raw.words) || raw.groups.length === 0) {
    return { config: defaultConfig(), level }
  }
  const groups = raw.groups
    .filter((g) => g && typeof g.key === 'string' && typeof g.name === 'string')
    .map((g) => ({
      key: g.key,
      name: g.name,
      color: /^#[0-9a-f]{6}$/i.test(g.color) ? g.color : '#F9C74F',
      image: g.image ?? null,
      enabled: g.enabled !== false,
    }))
  const keys = new Set(groups.map((g) => g.key))
  const words = raw.words
    .filter((w) => w && typeof w.word === 'string' && keys.has(w.group))
    .map((w) => ({
      id: String(w.id),
      group: w.group,
      word: w.word,
      intensity: Math.min(5, Math.max(1, Math.round(Number(w.intensity)) || 1)),
      image: w.image ?? null,
      emoji: w.emoji || undefined,
    }))
  return groups.length ? { config: { groups, words }, level } : { config: defaultConfig(), level }
}

// 크기 1→5 진하기: 대표 색에 흰색을 섞는 비율 (에셋 words_list.csv 의 색과 같은 값이 나옴)
const WEIGHTS = [0.3, 0.5, 0.7, 0.88, 1]

/** 큰 감정 색을 감정 크기(1~5)에 맞는 진하기로 */
export function shade(color: string, intensity: number): string {
  const w = WEIGHTS[Math.min(5, Math.max(1, intensity)) - 1]
  const n = parseInt(color.slice(1), 16)
  const mix = (c: number) => Math.round(255 + (c - 255) * w)
  const hex = (c: number) => mix(c).toString(16).padStart(2, '0')
  return `#${hex((n >> 16) & 255)}${hex((n >> 8) & 255)}${hex(n & 255)}`.toUpperCase()
}

/** 어두운 색 위에서는 흰 글자 */
export function textOn(color: string): string {
  const n = parseInt(color.slice(1), 16)
  const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)
  return lum < 140 ? '#FFFFFF' : '#3A2E2A'
}

export const newId = () => `w_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
