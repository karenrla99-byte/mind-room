import JSZip from 'jszip'
import type { Work } from './api'
import { activityLabel, downloadBlob, fetchBlob, workUrl } from './works'

export type Period = 'today' | 'week' | 'month' | 'all'
export const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: '오늘' },
  { key: 'week', label: '이번 주' },
  { key: 'month', label: '이번 달' },
  { key: 'all', label: '전체' },
]

/** 기간의 시작 시각 (이 기기의 시간 기준). 전체면 null */
export function periodStart(period: Period, now = new Date()): Date | null {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (period === 'today') return d
  if (period === 'week') {
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // 월요일부터
    return d
  }
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  return null
}

const pad = (n: number) => String(n).padStart(2, '0')
/** 날짜 묶음 열쇠: 2026-11-15 */
export function dayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const WEEK = ['일', '월', '화', '수', '목', '금', '토']
/** 11월 15일 (일) */
export function dayLabel(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return `${m}월 ${d}일 (${WEEK[new Date(y, m - 1, d).getDay()]})`
}
export const shortDay = (key: string) => `${Number(key.slice(5, 7))}/${Number(key.slice(8, 10))}`
export function timeLabel(iso: string) {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export interface Bucket<T = Work> {
  key: string
  title: string
  color?: string
  items: T[]
}

export function groupBy(works: Work[], keyOf: (w: Work) => string, titleOf: (w: Work) => string): Bucket[] {
  const map = new Map<string, Bucket>()
  for (const w of works) {
    const key = keyOf(w)
    if (!map.has(key)) map.set(key, { key, title: titleOf(w), items: [] })
    map.get(key)!.items.push(w)
  }
  return [...map.values()]
}

/** 큰 감정별 묶음. 색은 그 묶음에서 가장 진한 색 */
export function byEmotion(works: Work[]): Bucket[] {
  const list = groupBy(works, (w) => w.group_key ?? '-', (w) => w.group_name ?? '이름 없음')
  for (const b of list) b.color = [...b.items].sort((a, c) => (c.intensity ?? 5) - (a.intensity ?? 5))[0]?.color ?? '#B7BCC2'
  return list.sort((a, b) => b.items.length - a.items.length)
}

export const byDay = (works: Work[]) =>
  groupBy(works, (w) => dayKey(w.created_at), (w) => dayLabel(dayKey(w.created_at))).sort((a, b) => (a.key < b.key ? 1 : -1))

// ───────── CSV ─────────
const cell = (v: string | number | null | undefined) => {
  const s = v == null ? '' : String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** 감정 기록 CSV (엑셀에서 한글이 안 깨지게 BOM 포함) */
export function downloadCsv(works: Work[], roomName: string) {
  const rows = [['날짜', '시간', '학생', '활동', '큰 감정', '낱말', '크기', '이유 문장']]
  for (const w of works) {
    rows.push([
      dayKey(w.created_at),
      timeLabel(w.created_at),
      w.student_name ?? '',
      activityLabel(w.activity),
      w.group_name ?? '',
      w.word ?? '',
      w.intensity == null ? '' : String(w.intensity),
      w.reason ? `${w.reason} ${w.word ?? ''}`.trim() : '',
    ])
  }
  const text = '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n'
  downloadBlob(new Blob([text], { type: 'text/csv;charset=utf-8' }), `마음방_${safe(roomName)}_감정기록.csv`)
}

const safe = (s: string) => s.replace(/[\\/:*?"<>|\s]+/g, '_')

// ───────── ZIP ─────────
/** 작품 그림을 학생 폴더별로 묶어 ZIP 으로 내려받기 */
export async function downloadZip(works: Work[], zipName: string, onProgress: (done: number, total: number) => void) {
  const zip = new JSZip()
  const used = new Set<string>()
  let done = 0
  const queue = [...works]
  const worker = async () => {
    for (let w = queue.shift(); w; w = queue.shift()) {
      try {
        const blob = await fetchBlob(workUrl(w.image_path))
        const base = `${safe(w.student_name ?? '이름없음')}/${dayKey(w.created_at)}_${activityLabel(w.activity)}_${safe(w.word ?? w.group_name ?? '작품')}`
        let name = `${base}.png`
        for (let n = 2; used.has(name); n++) name = `${base}_${n}.png`
        used.add(name)
        zip.file(name, blob)
      } catch {
        // 못 받은 그림은 건너뜀
      }
      onProgress(++done, works.length)
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  downloadBlob(await zip.generateAsync({ type: 'blob' }), `마음방_${safe(zipName)}.zip`)
  return used.size
}
