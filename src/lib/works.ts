import { api, type Work } from './api'
import { textOn, type NameTagResult } from './emotionConfig'
import type { StudentSession } from './session'
import { supabase } from './supabase'

/** 활동 이름 (works.activity 값 → 화면에 보여 줄 이름) */
export const ACTIVITY_LABEL: Record<string, string> = {
  nametag: '이름표',
  draw: '그림방',
  color: '색깔방',
  face: '표정방',
  shape: '모양방',
}
export const activityLabel = (key: string) => ACTIVITY_LABEL[key] ?? key

export const workUrl = (path: string) => supabase.storage.from('works').getPublicUrl(path).data.publicUrl
export const assetUrl = (path: string) => supabase.storage.from('room-assets').getPublicUrl(path).data.publicUrl

const toBlob = (canvas: HTMLCanvasElement, type = 'image/png') =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), type))

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** 흰색을 섞어 연하게 */
function tint(color: string, weight: number) {
  const n = parseInt(color.slice(1), 16)
  const mix = (c: number) => Math.round(255 + (c - 255) * weight)
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`
}

/** 이름표만 붙였을 때의 작품 그림: 연한 감정 색 바탕 + 낱말 그림 */
export async function renderTagImage(tag: NameTagResult): Promise<Blob> {
  const size = 800
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = tint(tag.color, 0.35)
  ctx.fillRect(0, 0, size, size)
  if (tag.image) {
    try {
      ctx.drawImage(await loadImage(tag.image), 0, 0, size, size)
      return await toBlob(canvas)
    } catch {
      // 그림을 못 불러오면 아래 동그라미로
    }
  }
  ctx.fillStyle = tag.color
  ctx.strokeStyle = '#3A2E2A'
  ctx.lineWidth = 14
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, 250, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = textOn(tag.color)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '220px sans-serif'
  ctx.fillText(tag.emoji ?? '', size / 2, size / 2 + 12)
  return toBlob(canvas)
}

/** 작품 올리기: 그림 파일 → 기록 → 전시방에 알리기 */
export async function uploadWork(session: StudentSession, activity: string, tag: NameTagResult, image: Blob): Promise<Work> {
  const workId = crypto.randomUUID()
  const { error } = await supabase.storage
    .from('works')
    .upload(`${session.roomId}/${workId}.png`, image, { contentType: 'image/png', cacheControl: '31536000' })
  if (error) throw error
  const work = await api.submitWork({
    code: session.code,
    studentId: session.studentId,
    workId,
    activity,
    groupKey: tag.groupKey,
    groupName: tag.groupName,
    color: tag.color,
    word: tag.word,
    intensity: tag.intensity,
    reason: tag.reason,
  })
  void notifyGallery(session.roomId)
  return work
}

/** 지운 작품의 그림 파일 치우기 (실패해도 화면에는 영향 없음) */
export async function removeWorkFiles(paths: string[]) {
  if (paths.length) await supabase.storage.from('works').remove(paths).catch(() => {})
}

/** 지운 방의 학생·낱말 그림 치우기. 방 설정과 명단에서 이 방이 올린 그림 경로를 모음 */
export async function removeRoomAssets(room: { id: string; students: { image_path: string | null }[]; settings: Record<string, unknown> }) {
  const marker = '/room-assets/'
  const fromSettings = (JSON.stringify(room.settings).match(/[^"]*\/room-assets\/[^"]+/g) ?? []).map((u) => u.slice(u.indexOf(marker) + marker.length))
  const paths = [...room.students.map((s) => s.image_path), ...fromSettings].filter((p): p is string => !!p && p.startsWith(room.id + '/'))
  if (paths.length) await supabase.storage.from('room-assets').remove([...new Set(paths)]).catch(() => {})
}

// ───────── 전시방 실시간 ─────────
const topic = (roomId: string) => `gallery:${roomId}`

/** 작품이 올라오거나 지워졌다고 전시방 화면들에 알림 */
export async function notifyGallery(roomId: string) {
  const channel = supabase.channel(topic(roomId))
  try {
    await channel.send({ type: 'broadcast', event: 'changed', payload: {} })
  } catch {
    // 알림이 안 가도 전시방이 잠시 뒤 스스로 다시 불러옴
  } finally {
    void supabase.removeChannel(channel)
  }
}

/** 전시방: 알림이 오면 onChange 부르기. 돌려주는 함수로 그만두기 */
export function watchGallery(roomId: string, onChange: () => void) {
  const channel = supabase.channel(topic(roomId)).on('broadcast', { event: 'changed' }, onChange).subscribe()
  return () => void supabase.removeChannel(channel)
}

// ───────── 저장 · 보내기 ─────────
export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

/** 태블릿 공유창으로 보낼 수 있는지 */
export function canShare(): boolean {
  try {
    return !!navigator.canShare?.({ files: [new File([''], 'a.png', { type: 'image/png' })] })
  } catch {
    return false
  }
}

export async function shareBlob(blob: Blob, filename: string, title: string) {
  try {
    await navigator.share({ files: [new File([blob], filename, { type: 'image/png' })], title })
  } catch {
    // 사용자가 공유창을 닫음
  }
}

export const fetchBlob = (url: string) => fetch(url).then((r) => r.blob())

/** 파일 이름: 마음방_김하늘_신나요.png */
export function workFilename(parts: (string | null | undefined)[]) {
  return ['마음방', ...parts].filter(Boolean).join('_').replace(/[\\/:*?"<>|\s]+/g, '') + '.png'
}

// ───────── 선생님 그림 올리기 ─────────
/** 사진·그림을 한 변 512px 안으로 줄여 room-assets 에 올리고 경로를 돌려줌 */
export async function uploadRoomAsset(roomId: string, file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const path = `${roomId}/${crypto.randomUUID().replace(/-/g, '')}.png`
  const { error } = await supabase.storage
    .from('room-assets')
    .upload(path, await toBlob(canvas), { contentType: 'image/png', cacheControl: '31536000' })
  if (error) throw error
  return path
}
