import { useSyncExternalStore } from 'react'

/** 이 기기에만 저장되는 설정 (방 설정과는 다름) */
export interface LocalSettings {
  /** 낱말·안내 읽어 주기 */
  tts: boolean
}

const KEY = 'maeumbang.settings'
const DEFAULTS: LocalSettings = { tts: true }
const listeners = new Set<() => void>()

function load(): LocalSettings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return DEFAULTS
  }
}

let current = load()

export function getSettings() {
  return current
}

export function setSettings(patch: Partial<LocalSettings>) {
  current = { ...current, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // 저장이 막힌 브라우저에서는 이번에만 적용
  }
  listeners.forEach((fn) => fn())
}

export function useSettings() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    getSettings,
  )
}
