import boundsJson from '../../data/partBounds.json'
import { FACE_CANVAS, FACE_PARTS, FACE_ZONES, type FacePart, type PartKind } from '../../data/faceParts'
import type { GroupKey } from '../../data/emotions'

const BOUNDS = boundsJson as unknown as Record<string, [number, number, number, number]>

export const partById = (id: string) => FACE_PARTS.find((p) => p.id === id)!
export const partsOf = (kind: PartKind) => FACE_PARTS.filter((p) => p.kind === kind)
export const BASE = partById('base_01')

/** 얼굴 위에 놓인 부품 하나. 좌표는 얼굴 좌표계(2000×2000)의 가운데 점 */
export interface Placed {
  uid: string
  id: string
  cx: number
  cy: number
  /** 기본 크기에 곱하는 배율 */
  scale: number
  /** 도(°) */
  rotate: number
  flip: boolean
}

/** 투명 여백을 뺀 그림 상자 (1024 기준) */
export const bboxOf = (id: string) => BOUNDS[id]

/** 기본 자리: 여백을 잘라낸 그림을 그 부위 zone 상자 안 가운데에 비율 유지해 맞춤 */
export function homeRect(part: FacePart) {
  const [x0, y0, x1, y1] = bboxOf(part.id)
  const bw = x1 - x0
  const bh = y1 - y0
  if (part.kind === 'base') {
    // 빈 얼굴은 1600×1600 으로 (200,200)에
    return { cx: 1000, cy: 1000, w: 1600, h: (1600 * bh) / bw }
  }
  const [zx0, zy0, zx1, zy1] = FACE_ZONES[part.zone]
  const k = Math.min((zx1 - zx0) / bw, (zy1 - zy0) / bh)
  return { cx: (zx0 + zx1) / 2, cy: (zy0 + zy1) / 2, w: bw * k, h: bh * k }
}

let seq = 0
export function place(id: string): Placed {
  const home = homeRect(partById(id))
  return { uid: `p${++seq}`, id, cx: home.cx, cy: home.cy, scale: 1, rotate: 0, flip: false }
}

/** 화면에 그릴 때 쓰는 값 (얼굴 한 변을 100% 로 본 퍼센트) */
export function boxStyle(p: Placed) {
  const home = homeRect(partById(p.id))
  const pct = (n: number) => `${(n / FACE_CANVAS) * 100}%`
  return {
    left: pct(p.cx - home.w / 2),
    top: pct(p.cy - home.h / 2),
    width: pct(home.w),
    height: pct(home.h),
    transform: `rotate(${p.rotate}deg) scale(${p.flip ? -p.scale : p.scale}, ${p.scale})`,
  }
}

/** 상자 안에서 원본 그림(여백 포함 1024)을 어디에 둘지 */
export function imgStyle(id: string) {
  const [x0, y0, x1, y1] = bboxOf(id)
  const bw = x1 - x0
  const bh = y1 - y0
  return {
    width: `${(1024 / bw) * 100}%`,
    height: `${(1024 / bh) * 100}%`,
    left: `${(-x0 / bw) * 100}%`,
    top: `${(-y0 / bh) * 100}%`,
  }
}

const cache = new Map<string, Promise<HTMLImageElement>>()
function load(src: string) {
  if (!cache.has(src)) {
    cache.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      }),
    )
  }
  return cache.get(src)!
}

/** 얼굴을 PNG 로 (흰 바탕 1000×1000) */
export async function renderFace(parts: Placed[]): Promise<Blob> {
  const size = 1000
  const k = size / FACE_CANVAS
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, size, size)
  for (const p of [place(BASE.id), ...parts]) {
    const part = partById(p.id)
    const img = await load(part.image)
    const [x0, y0, x1, y1] = bboxOf(p.id)
    const home = homeRect(part)
    ctx.save()
    ctx.translate(p.cx * k, p.cy * k)
    ctx.rotate((p.rotate * Math.PI) / 180)
    ctx.scale((p.flip ? -1 : 1) * p.scale, p.scale)
    ctx.drawImage(img, x0, y0, x1 - x0, y1 - y0, (-home.w / 2) * k, (-home.h / 2) * k, home.w * k, home.h * k)
    ctx.restore()
  }
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'))
}

// ───────── 따라 만들기용 표정 ─────────
export type Slot = 'brow' | 'eye' | 'nose' | 'mouth'
export const SLOTS: Slot[] = ['brow', 'eye', 'nose', 'mouth']
export const SLOT_NAME: Record<Slot, string> = { brow: '눈썹', eye: '눈', nose: '코', mouth: '입' }

/** 큰 감정마다 어울리는 표정 (parts_list.csv 의 '어울리는 큰 감정'에 맞춰 고름) */
export const RECIPES: Record<GroupKey, Record<Slot, string>> = {
  joy: { brow: 'brow_02', eye: 'eye_02', nose: 'nose_01', mouth: 'mouth_02' },
  surprise: { brow: 'brow_02', eye: 'eye_03', nose: 'nose_02', mouth: 'mouth_05' },
  anger: { brow: 'brow_03', eye: 'eye_05', nose: 'nose_03', mouth: 'mouth_06' },
  discomfort: { brow: 'brow_05', eye: 'eye_01', nose: 'nose_01', mouth: 'mouth_07' },
  sadness: { brow: 'brow_04', eye: 'eye_06', nose: 'nose_02', mouth: 'mouth_03' },
  fear: { brow: 'brow_06', eye: 'eye_03', nose: 'nose_01', mouth: 'mouth_08' },
  lethargy: { brow: 'brow_01', eye: 'eye_07', nose: 'nose_03', mouth: 'mouth_04' },
}

export function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 얼굴에 놓인 부품 가운데 그 감정과 어울리는 것이 몇 개인지 (3단계 칭찬 말에 씀. 틀렸다고 하지 않음) */
export function matchCount(parts: Placed[], group: GroupKey) {
  return parts.filter((p) => partById(p.id).tags.includes(group)).length
}
