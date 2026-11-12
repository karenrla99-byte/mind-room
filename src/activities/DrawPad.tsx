import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { speak } from '../lib/tts'
import type { ActivityProps } from './types'
import styles from './draw.module.css'

const SIZE = 1000
const COLORS = [
  { hex: '#3A2E2A', name: '검정' },
  { hex: '#E5484D', name: '빨강' },
  { hex: '#F8961E', name: '주황' },
  { hex: '#F9C74F', name: '노랑' },
  { hex: '#6BBF59', name: '초록' },
  { hex: '#4D96FF', name: '파랑' },
  { hex: '#5B5FC7', name: '남색' },
  { hex: '#A27FD6', name: '보라' },
  { hex: '#F4A6C0', name: '분홍' },
  { hex: '#8B5E3C', name: '갈색' },
  { hex: '#9AA0A6', name: '회색' },
  { hex: '#FFFFFF', name: '하양' },
]
const WIDTHS = [
  { px: 10, name: '가는 펜' },
  { px: 24, name: '보통 펜' },
  { px: 48, name: '굵은 펜' },
]
type Backdrop = 'none' | 'face' | 'heart'
const BACKDROPS: { key: Backdrop; name: string }[] = [
  { key: 'none', name: '빈 종이' },
  { key: 'face', name: '빈 얼굴' },
  { key: 'heart', name: '빈 마음' },
]

interface Stroke {
  color: string
  width: number
  erase: boolean
  points: [number, number][]
}

function paint(ctx: CanvasRenderingContext2D, s: Stroke, from = 0) {
  ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over'
  ctx.strokeStyle = ctx.fillStyle = s.erase ? '#000' : s.color
  ctx.lineWidth = s.width
  ctx.lineCap = ctx.lineJoin = 'round'
  if (s.points.length === 1) {
    ctx.beginPath()
    ctx.arc(s.points[0][0], s.points[0][1], s.width / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.beginPath()
  const start = Math.max(0, from - 1)
  ctx.moveTo(s.points[start][0], s.points[start][1])
  for (let i = start + 1; i < s.points.length; i++) ctx.lineTo(s.points[i][0], s.points[i][1])
  ctx.stroke()
}

function heartPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.moveTo(500, 850)
  ctx.bezierCurveTo(140, 600, 60, 380, 170, 240)
  ctx.bezierCurveTo(280, 100, 450, 150, 500, 300)
  ctx.bezierCurveTo(550, 150, 720, 100, 830, 240)
  ctx.bezierCurveTo(940, 380, 860, 600, 500, 850)
  ctx.closePath()
}

/** 그림방: 펜·색·굵기 3단계·지우개·되돌리기, 바탕(빈 종이/빈 얼굴/빈 마음) */
export default function DrawPad({ onDone }: ActivityProps) {
  const drawRef = useRef<HTMLCanvasElement>(null)
  const backRef = useRef<HTMLCanvasElement>(null)
  const strokes = useRef<Stroke[]>([])
  const live = useRef<{ id: number; stroke: Stroke } | null>(null)
  const [count, setCount] = useState(0)
  const [color, setColor] = useState(COLORS[0].hex)
  const [width, setWidth] = useState(WIDTHS[1].px)
  const [erasing, setErasing] = useState(false)
  const [backdrop, setBackdrop] = useState<Backdrop>('none')
  const faceImg = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    speak('마음을 그림으로 그려요')
  }, [])

  // 바탕 그리기
  useEffect(() => {
    const ctx = backRef.current!.getContext('2d')!
    const draw = () => {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, SIZE, SIZE)
      if (backdrop === 'face' && faceImg.current) ctx.drawImage(faceImg.current, 0, 0, SIZE, SIZE)
      if (backdrop === 'heart') {
        heartPath(ctx)
        ctx.strokeStyle = '#3A2E2A'
        ctx.lineWidth = 18
        ctx.lineJoin = 'round'
        ctx.stroke()
      }
    }
    if (backdrop === 'face' && !faceImg.current) {
      const img = new Image()
      img.onload = () => {
        faceImg.current = img
        draw()
      }
      img.src = '/assets/face/base_01.png'
    }
    draw()
  }, [backdrop])

  const redraw = useCallback(() => {
    const ctx = drawRef.current!.getContext('2d')!
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, SIZE, SIZE)
    for (const s of strokes.current) paint(ctx, s)
    setCount(strokes.current.length)
  }, [])

  const point = (e: { clientX: number; clientY: number }): [number, number] => {
    const box = drawRef.current!.getBoundingClientRect()
    return [((e.clientX - box.left) / box.width) * SIZE, ((e.clientY - box.top) / box.height) * SIZE]
  }

  const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (live.current) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const stroke: Stroke = { color, width: erasing ? Math.max(width, 24) * 1.6 : width, erase: erasing, points: [point(e)] }
    live.current = { id: e.pointerId, stroke }
    paint(drawRef.current!.getContext('2d')!, stroke)
  }

  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const now = live.current
    if (!now || now.id !== e.pointerId) return
    const from = now.stroke.points.length
    const events = e.nativeEvent.getCoalescedEvents?.() ?? []
    for (const ev of events.length ? events : [e.nativeEvent]) now.stroke.points.push(point(ev))
    paint(drawRef.current!.getContext('2d')!, now.stroke, from)
  }

  const onUp = (e: PointerEvent<HTMLCanvasElement>) => {
    const now = live.current
    if (!now || now.id !== e.pointerId) return
    live.current = null
    strokes.current.push(now.stroke)
    setCount(strokes.current.length)
  }

  const undo = () => {
    strokes.current.pop()
    redraw()
  }

  const clear = () => {
    if (!strokes.current.length || !confirm('그림을 모두 지울까요?')) return
    strokes.current = []
    redraw()
  }

  const finish = () => {
    const out = document.createElement('canvas')
    out.width = out.height = SIZE
    const ctx = out.getContext('2d')!
    ctx.drawImage(backRef.current!, 0, 0)
    ctx.drawImage(drawRef.current!, 0, 0)
    out.toBlob((blob) => blob && onDone(blob), 'image/png')
  }

  const pickColor = (c: (typeof COLORS)[number]) => {
    setColor(c.hex)
    setErasing(false)
    speak(c.name)
  }

  return (
    <div className={styles.pad}>
      <div className={styles.colors} role="radiogroup" aria-label="색 고르기">
        {COLORS.map((c) => (
          <button
            key={c.hex}
            type="button"
            role="radio"
            aria-checked={!erasing && color === c.hex}
            aria-label={c.name}
            className={styles.color}
            style={{ background: c.hex }}
            onClick={() => pickColor(c)}
          />
        ))}
      </div>

      <div className={styles.paper}>
        <canvas ref={backRef} width={SIZE} height={SIZE} />
        <canvas
          ref={drawRef}
          width={SIZE}
          height={SIZE}
          className={styles.draw}
          aria-label="그림 그리는 곳"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </div>

      <div className={styles.tools}>
        <div className={styles.group} role="radiogroup" aria-label="펜 굵기">
          {WIDTHS.map((w) => (
            <button
              key={w.px}
              type="button"
              role="radio"
              aria-checked={width === w.px}
              aria-label={w.name}
              className={styles.tool}
              onClick={() => { setWidth(w.px); speak(w.name) }}
            >
              <i style={{ width: w.px * 0.7 + 4, height: w.px * 0.7 + 4, background: erasing ? '#9AA0A6' : color }} />
            </button>
          ))}
        </div>
        <div className={styles.group}>
          <button type="button" className={styles.tool} aria-pressed={erasing} onClick={() => { setErasing(!erasing); speak(erasing ? '펜' : '지우개') }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 19 3.6 14.1a1.5 1.5 0 0 1 0-2.1l8-8a1.5 1.5 0 0 1 2.1 0l6.7 6.7a1.5 1.5 0 0 1 0 2.1L14.2 19zM8 8.2l7.8 7.8M8.5 19H21" /></svg>
            <span>지우개</span>
          </button>
          <button type="button" className={styles.tool} disabled={!count} onClick={undo}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 3.5 9.5 8 14M4 9.5h10a6 6 0 0 1 0 12h-3" /></svg>
            <span>되돌리기</span>
          </button>
          <button type="button" className={styles.tool} disabled={!count} onClick={clear}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v5M14 11v5" /></svg>
            <span>모두 지우기</span>
          </button>
        </div>
        <div className={styles.group} role="radiogroup" aria-label="바탕 고르기">
          {BACKDROPS.map((b) => (
            <button
              key={b.key}
              type="button"
              role="radio"
              aria-checked={backdrop === b.key}
              className={`${styles.tool} ${styles.backBtn}`}
              onClick={() => { setBackdrop(b.key); speak(b.name) }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {b.key === 'none' && <rect x="4" y="4" width="16" height="16" rx="3" />}
                {b.key === 'face' && <circle cx="12" cy="12" r="8.5" />}
                {b.key === 'heart' && <path d="M12 20C4 14.5 3 9.5 5.5 6.8 8 4 11 5.2 12 8c1-2.8 4-4 6.500-1.200C21 9.500 20 14.500 12 20z" />}
              </svg>
              <span>{b.name}</span>
            </button>
          ))}
        </div>
        <button type="button" className={`btn btn-yellow ${styles.done}`} disabled={!count} onClick={finish}>다 그렸어요</button>
      </div>
    </div>
  )
}
