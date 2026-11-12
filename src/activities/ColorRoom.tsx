import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { speak } from '../lib/tts'
import type { ActivityProps } from './types'
import styles from './draw.module.css'

const SIZE = 800
const COLORS = [
  { hex: '#E5484D', name: '빨강' },
  { hex: '#F8961E', name: '주황' },
  { hex: '#F9C74F', name: '노랑' },
  { hex: '#6BBF59', name: '초록' },
  { hex: '#5BC8E8', name: '하늘' },
  { hex: '#4D96FF', name: '파랑' },
  { hex: '#5B5FC7', name: '남색' },
  { hex: '#A27FD6', name: '보라' },
  { hex: '#F4A6C0', name: '분홍' },
  { hex: '#8B5E3C', name: '갈색' },
  { hex: '#9AA0A6', name: '회색' },
  { hex: '#3A2E2A', name: '검정' },
]
/** 물감 양: 붓 반지름과 번지는 크기 */
const AMOUNTS = [
  { key: 0, name: '조금', brush: 26, spread: 80 },
  { key: 1, name: '보통', brush: 44, spread: 140 },
  { key: 2, name: '많이', brush: 70, spread: 220 },
]
type Shape = 'heart' | 'circle' | 'cloud'
const SHAPES: { key: Shape; name: string }[] = [
  { key: 'heart', name: '하트' },
  { key: 'circle', name: '동그라미' },
  { key: 'cloud', name: '구름' },
]

/** 물감 한 방울: 어느 색 층에, 어디에, 얼마나 크게·진하게 */
interface Stamp {
  c: string
  x: number
  y: number
  r: number
  a: number
}

function shapePath(ctx: CanvasRenderingContext2D, shape: Shape) {
  const k = SIZE / 1000
  ctx.beginPath()
  if (shape === 'circle') {
    ctx.arc(500 * k, 500 * k, 400 * k, 0, Math.PI * 2)
  } else if (shape === 'heart') {
    ctx.moveTo(500 * k, 880 * k)
    ctx.bezierCurveTo(110 * k, 610 * k, 30 * k, 370 * k, 150 * k, 220 * k)
    ctx.bezierCurveTo(270 * k, 70 * k, 450 * k, 130 * k, 500 * k, 290 * k)
    ctx.bezierCurveTo(550 * k, 130 * k, 730 * k, 70 * k, 850 * k, 220 * k)
    ctx.bezierCurveTo(970 * k, 370 * k, 890 * k, 610 * k, 500 * k, 880 * k)
  } else {
    ctx.moveTo(250 * k, 760 * k)
    ctx.bezierCurveTo(60 * k, 760 * k, 40 * k, 520 * k, 210 * k, 480 * k)
    ctx.bezierCurveTo(180 * k, 290 * k, 400 * k, 200 * k, 500 * k, 330 * k)
    ctx.bezierCurveTo(600 * k, 170 * k, 860 * k, 270 * k, 800 * k, 470 * k)
    ctx.bezierCurveTo(980 * k, 500 * k, 960 * k, 760 * k, 760 * k, 760 * k)
  }
  ctx.closePath()
}

/** 색깔방: 큰 마음 모양에 물감을 번지게 해서 내 마음 색을 칠해요. 겹치면 색이 섞여요 */
export default function ColorRoom({ onDone }: ActivityProps) {
  const viewRef = useRef<HTMLCanvasElement>(null)
  const layers = useRef(new Map<string, HTMLCanvasElement>())
  const sprites = useRef(new Map<string, HTMLCanvasElement>())
  const actions = useRef<Stamp[][]>([])
  const live = useRef<{ id: number; stamps: Stamp[]; x: number; y: number; since: number; down: boolean } | null>(null)
  const raf = useRef(0)
  const shapeRef = useRef<Shape>('heart')

  const [count, setCount] = useState(0)
  const [color, setColor] = useState(COLORS[0].hex)
  const [amount, setAmount] = useState(1)
  const [shape, setShape] = useState<Shape>('heart')

  const sprite = (c: string) => {
    let s = sprites.current.get(c)
    if (!s) {
      s = document.createElement('canvas')
      s.width = s.height = 128
      const ctx = s.getContext('2d')!
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
      g.addColorStop(0, c)
      g.addColorStop(0.55, c + 'B0')
      g.addColorStop(1, c + '00')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 128, 128)
      sprites.current.set(c, s)
    }
    return s
  }

  const put = (s: Stamp) => {
    let layer = layers.current.get(s.c)
    if (!layer) {
      layer = document.createElement('canvas')
      layer.width = layer.height = SIZE
      layers.current.set(s.c, layer)
    }
    const ctx = layer.getContext('2d')!
    ctx.globalAlpha = s.a
    ctx.drawImage(sprite(s.c), s.x - s.r, s.y - s.r, s.r * 2, s.r * 2)
  }

  /** 색 층들을 곱해서(섞어서) 모양 안에만 보여 주고, 위에 테두리 */
  const compose = useCallback(() => {
    const ctx = viewRef.current!.getContext('2d')!
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.save()
    shapePath(ctx, shapeRef.current)
    ctx.clip()
    ctx.globalCompositeOperation = 'multiply'
    for (const layer of layers.current.values()) ctx.drawImage(layer, 0, 0)
    ctx.restore()
    shapePath(ctx, shapeRef.current)
    ctx.strokeStyle = '#3A2E2A'
    ctx.lineWidth = 16
    ctx.lineJoin = 'round'
    ctx.stroke()
  }, [])

  useEffect(() => {
    speak('내 마음은 무슨 색일까요? 모양 안을 꾹 눌러요')
    return () => cancelAnimationFrame(raf.current)
  }, [])

  useEffect(() => {
    shapeRef.current = shape
    compose()
  }, [shape, compose])

  const replay = () => {
    for (const layer of layers.current.values()) layer.getContext('2d')!.clearRect(0, 0, SIZE, SIZE)
    for (const action of actions.current) for (const s of action) put(s)
    compose()
    setCount(actions.current.length)
  }

  /** 누르고 있는 동안, 그리고 뗀 뒤 잠깐 물감이 번짐 */
  const tick = () => {
    const now = live.current
    if (!now) return
    const { spread } = AMOUNTS[amountRef.current]
    const elapsed = performance.now() - now.since
    const reach = Math.min(spread, 18 + elapsed * 0.22)
    if (now.down || elapsed < 500) {
      for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2
        const dist = Math.pow(Math.random(), 0.7) * reach
        const s: Stamp = {
          c: colorRef.current,
          x: now.x + Math.cos(angle) * dist,
          y: now.y + Math.sin(angle) * dist,
          r: reach * (0.35 + Math.random() * 0.3),
          a: reach >= spread ? 0.03 : 0.08,
        }
        now.stamps.push(s)
        put(s)
      }
      compose()
      raf.current = requestAnimationFrame(tick)
    } else {
      actions.current.push(now.stamps)
      live.current = null
      setCount(actions.current.length)
    }
  }

  // tick 은 오래 도는 함수라 최신 색·양을 ref 로 읽음
  const colorRef = useRef(color)
  const amountRef = useRef(amount)
  colorRef.current = color
  amountRef.current = amount

  const point = (e: { clientX: number; clientY: number }) => {
    const box = viewRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - box.left) / box.width) * SIZE, y: ((e.clientY - box.top) / box.height) * SIZE }
  }

  const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (live.current?.down) return
    if (live.current) {
      // 앞 물감이 아직 번지는 중이면 거기서 마무리
      cancelAnimationFrame(raf.current)
      actions.current.push(live.current.stamps)
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    live.current = { id: e.pointerId, stamps: [], ...point(e), since: performance.now(), down: true }
    raf.current = requestAnimationFrame(tick)
  }

  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const now = live.current
    if (!now || !now.down || now.id !== e.pointerId) return
    const to = point(e)
    const { brush } = AMOUNTS[amountRef.current]
    const dist = Math.hypot(to.x - now.x, to.y - now.y)
    if (dist < brush * 0.25) return
    // 끌면 붓으로 칠하기: 지나간 길을 따라 물감 방울을 놓음
    const steps = Math.ceil(dist / (brush * 0.3))
    for (let i = 1; i <= steps; i++) {
      const s: Stamp = { c: colorRef.current, x: now.x + ((to.x - now.x) * i) / steps, y: now.y + ((to.y - now.y) * i) / steps, r: brush, a: 0.22 }
      now.stamps.push(s)
      put(s)
    }
    now.x = to.x
    now.y = to.y
    now.since = performance.now()
  }

  const onUp = (e: PointerEvent<HTMLCanvasElement>) => {
    const now = live.current
    if (!now || now.id !== e.pointerId) return
    now.down = false
    now.since = Math.min(now.since, performance.now() - 250)
  }

  const settle = () => {
    if (live.current) {
      cancelAnimationFrame(raf.current)
      actions.current.push(live.current.stamps)
      live.current = null
    }
  }

  const undo = () => {
    settle()
    actions.current.pop()
    replay()
  }

  const clear = () => {
    settle()
    if (!actions.current.length || !confirm('색을 모두 지울까요?')) return
    actions.current = []
    replay()
  }

  const finish = () => {
    settle()
    compose()
    viewRef.current!.toBlob((blob) => blob && onDone(blob), 'image/png')
  }

  return (
    <div className={styles.pad}>
      <div className={styles.colors} role="radiogroup" aria-label="색 고르기">
        {COLORS.map((c) => (
          <button
            key={c.hex}
            type="button"
            role="radio"
            aria-checked={color === c.hex}
            aria-label={c.name}
            className={styles.color}
            style={{ background: c.hex }}
            onClick={() => { setColor(c.hex); speak(c.name) }}
          />
        ))}
      </div>

      <div className={styles.paper}>
        <canvas
          ref={viewRef}
          width={SIZE}
          height={SIZE}
          className={styles.draw}
          aria-label="색칠하는 곳"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
        {count === 0 && <p className={styles.tip}>모양 안을 꾹 누르면 물감이 번져요</p>}
      </div>

      <div className={styles.tools}>
        <div className={styles.group} role="radiogroup" aria-label="물감 양">
          {AMOUNTS.map((a) => (
            <button
              key={a.key}
              type="button"
              role="radio"
              aria-checked={amount === a.key}
              aria-label={`물감 ${a.name}`}
              className={styles.tool}
              onClick={() => { setAmount(a.key); speak(`물감 ${a.name}`) }}
            >
              <i className={styles.drop} style={{ width: 16 + a.key * 12, height: 16 + a.key * 12, background: color }} />
              <span>{a.name}</span>
            </button>
          ))}
        </div>
        <div className={styles.group}>
          <button type="button" className={styles.tool} disabled={!count} onClick={undo}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 3.5 9.5 8 14M4 9.5h10a6 6 0 0 1 0 12h-3" /></svg>
            <span>되돌리기</span>
          </button>
          <button type="button" className={styles.tool} disabled={!count} onClick={clear}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v5M14 11v5" /></svg>
            <span>모두 지우기</span>
          </button>
        </div>
        <div className={styles.group} role="radiogroup" aria-label="모양 고르기">
          {SHAPES.map((s) => (
            <button
              key={s.key}
              type="button"
              role="radio"
              aria-checked={shape === s.key}
              className={styles.tool}
              onClick={() => { setShape(s.key); speak(s.name) }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {s.key === 'heart' && <path d="M12 20C4 14.5 3 9.5 5.5 6.8 8 4 11 5.2 12 8c1-2.8 4-4 6.5-1.200C21 9.5 20 14.5 12 20z" />}
                {s.key === 'circle' && <circle cx="12" cy="12" r="8.5" />}
                {s.key === 'cloud' && <path d="M7 18a4 4 0 0 1-.5-8A5.500 5.500 0 0 1 17 9.500 4.300 4.300 0 0 1 17.500 18z" />}
              </svg>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
        <button type="button" className={`btn btn-yellow ${styles.done}`} disabled={!count} onClick={finish}>다 칠했어요</button>
      </div>
    </div>
  )
}
