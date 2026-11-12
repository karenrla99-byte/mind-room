import { getSettings } from './settings'

export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

/** 낱말·안내 읽어 주기 (설정에서 꺼져 있으면 아무것도 안 함) */
export function speak(text: string, opts: { force?: boolean } = {}) {
  if (!ttsSupported) return
  if (!opts.force && !getSettings().tts) return
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'
  u.rate = 0.9
  const voice = synth.getVoices().find((v) => v.lang.replace('_', '-').startsWith('ko'))
  if (voice) u.voice = voice
  synth.speak(u)
}

export function stopSpeaking() {
  if (ttsSupported) window.speechSynthesis.cancel()
}
