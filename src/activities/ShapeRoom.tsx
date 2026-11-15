import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { FACE_CANVAS, type PartKind } from '../data/faceParts'
import { speak } from '../lib/tts'
import { bboxOf, canvasBlob, drawPlaced, loadImage, partById, partsOf, place, type Placed } from './face/faceMath'
import PartView, { PartThumb } from './face/PartView'
import type { ActivityProps } from './types'
import face from './face/face.module.css'
import styles from './shape.module.css'

const SHAPES = [
  { id: 'shape_round', name: '동그란 모양' },
  { id: 'shape_tall', name: '길쭉한 모양' },
  { id: 'shape_flat', name: '납작한 모양' },
  { id: 'shape_bumpy', name: '울퉁불퉁한 모양' },
  { id: 'shape_wavy', name: '구불구불한 모양' },
  { id: 'shape_spiky', name: '뾰족뾰족한 모양' },
  { id: 'shape_star', name: '별 모양' },
  { id: 'shape_puddle', name: '웅덩이 모양' },
]
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
  { hex: '#B98A5E', name: '갈색' },
  { hex: '#B7BCC2', name: '회색' },
  { hex: '#FFFFFF', name: '하양' },
]
type Tab = 'shape' | 'color' | PartKind
const TABS: { key: Tab; name: string }[] = [
  { key: 'shape', name: '모양' },
  { key: 'color', name: '색' },
  { key: 'eye', name: '눈' },
  { key: 'mouth', name: '입' },
  { key: 'brow', name: '눈썹' },
  { key: 'extra', name: '꾸미기' },
]
/** 모양이 들어가는 기본 상자 한 변 (2000 좌표계) */
const BODY = 1250
/** 표정은 모양 안에 작게 */
const FACE_SCALE = 0.55
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const shapeSrc = (id: string) => `/assets/shapes/${id}.png`

/** 표정 부품을 모양 가운데에 작게 놓기 */
function placeSmall(id: string): Placed {
  const p = place(id)
  return { ...p, cx: 1000 + (p.cx - 1000) * FACE_SCALE, cy: 1000 + (p.cy - 1000) * FACE_SCALE, scale: FACE_SCALE }
}

/** 모양 상자: 여백을 잘라낸 그림을 BODY 상자에 맞춘 뒤 가로·세로로 늘림 */
function bodyRect(id: string, sx: number, sy: number) {
  const [x0, y0, x1, y1] = bboxOf(id)
  const bw = x1 - x0
  const bh = y1 - y0
  const k = BODY / Math.max(bw, bh)
  return { w: bw * k * sx, h: bh * k * sy, crop: [x0, y0, bw, bh] as const }
}

/** 모양방: 모양을 고르고, 늘리고, 색을 입히고, 작은 표정을 붙여 나만의 감정 캐릭터 */
export default function ShapeRoom({ onDone }: ActivityProps) {
  const [tab, setTab] = useState<Tab>('shape')
  const [shape, setShape] = useState(SHAPES[0].id)
  const [color, setColor] = useState('#FFFFFF')
  const [sx, setSx] = useState(1)
  const [sy, setSy] = useState(1)
  const [parts, setParts] = useState<Placed[]>([])
  const [picked, setPicked] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const move = useRef<{ uid: string; dx: number; dy: number } | null>(null)

  useEffect(() => {
    speak('모양을 골라 내 마음 친구를 만들어요')
  }, [])

  const selected = parts.find((p) => p.uid === picked) ?? null
  const patch = (uid: string, change: Partial<Placed>) => setParts((list) => list.map((p) => (p.uid === uid ? { ...p, ...change } : p)))
  const body = bodyRect(shape, sx, sy)
  const pct = (n: number) => `${(n / FACE_CANVAS) * 100}%`

  const add = (id: string) => {
    const kind = partById(id).kind
    const same = parts.find((p) => p.id === id)
    if (kind === 'extra' && same) {
      setParts(parts.filter((p) => p.uid !== same.uid))
      setPicked(null)
      return
    }
    const next = placeSmall(id)
    setParts([...parts.filter((p) => kind === 'extra' || partById(p.id).kind !== kind), next])
    setPicked(next.uid)
  }

  const toStage = (e: { clientX: number; clientY: number }) => {
    const box = stageRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - box.left) / box.width) * FACE_CANVAS, y: ((e.clientY - box.top) / box.height) * FACE_CANVAS }
  }
  const onDown = (e: PointerEvent, p: Placed) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const at = toStage(e)
    move.current = { uid: p.uid, dx: p.cx - at.x, dy: p.cy - at.y }
    setPicked(p.uid)
  }
  const onMove = (e: PointerEvent) => {
    const m = move.current
    if (!m) return
    const at = toStage(e)
    patch(m.uid, { cx: clamp(at.x + m.dx, 150, 1850), cy: clamp(at.y + m.dy, 150, 1850) })
  }
  const onUp = () => (move.current = null)

  /** 모양 늘리기: 크게·작게는 둘 다, 넓게·좁게는 가로, 길게·납작하게는 세로 */
  const stretch = (dx: number, dy: number) => {
    setSx(clamp(sx * dx, 0.55, 1.4))
    setSy(clamp(sy * dy, 0.55, 1.4))
  }

  const finish = async () => {
    setBusy(true)
    setPicked(null)
    const size = 1000
    const k = size / FACE_CANVAS
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, size, size)
    // 모양에 색 입히기: 흰 곳은 고른 색으로, 선은 그대로 (곱하기) → 모양 밖은 잘라냄
    const img = await loadImage(shapeSrc(shape))
    const w = Math.round(body.w * k)
    const h = Math.round(body.h * k)
    const tinted = document.createElement('canvas')
    tinted.width = w
    tinted.height = h
    const t = tinted.getContext('2d')!
    t.drawImage(img, ...body.crop, 0, 0, w, h)
    t.globalCompositeOperation = 'multiply'
    t.fillStyle = color
    t.fillRect(0, 0, w, h)
    t.globalCompositeOperation = 'destination-in'
    t.drawImage(img, ...body.crop, 0, 0, w, h)
    ctx.drawImage(tinted, (size - w) / 2, (size - h) / 2)
    await drawPlaced(ctx, parts, k)
    onDone(await canvasBlob(canvas))
  }

  // 화면에 보이는 모양: 색 판을 모양대로 오려 내고(mask), 그 위에 그림을 곱해서 선만 남김
  const [x0, y0, bw, bh] = body.crop
  const cropStyle: CSSProperties = {
    width: `${(1024 / bw) * 100}%`,
    height: `${(1024 / bh) * 100}%`,
    left: `${(-x0 / bw) * 100}%`,
    top: `${(-y0 / bh) * 100}%`,
  }
  const maskStyle: CSSProperties = {
    background: color,
    WebkitMaskImage: `url(${shapeSrc(shape)})`,
    maskImage: `url(${shapeSrc(shape)})`,
    WebkitMaskSize: `${cropStyle.width} ${cropStyle.height}`,
    maskSize: `${cropStyle.width} ${cropStyle.height}`,
    WebkitMaskPosition: `${(x0 / (1024 - bw)) * 100}% ${(y0 / (1024 - bh)) * 100}%`,
    maskPosition: `${(x0 / (1024 - bw)) * 100}% ${(y0 / (1024 - bh)) * 100}%`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  }

  return (
    <div className={face.room}>
      <div ref={stageRef} className={face.stage} onPointerDown={() => setPicked(null)}>
        <div className={styles.body} style={{ left: pct(1000 - body.w / 2), top: pct(1000 - body.h / 2), width: pct(body.w), height: pct(body.h) }}>
          <div className={styles.fill} style={maskStyle} />
          <img src={shapeSrc(shape)} alt="" style={cropStyle} draggable={false} />
        </div>
        {parts.map((p) => (
          <div key={p.uid} onPointerDown={(e) => onDown(e, p)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <PartView placed={p} className={`${face.movable} ${p.uid === picked ? face.picked : ''}`} style={p.uid === picked ? { zIndex: 5 } : undefined} />
          </div>
        ))}
      </div>

      <div className={face.side}>
        <h1 className={face.title}>내 마음 친구를 만들어요</h1>
        <div className={face.tabs} role="tablist" aria-label="고를 것">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => { setTab(t.key); speak(t.name) }}>
              {t.name}
            </button>
          ))}
        </div>

        {tab === 'shape' && (
          <>
            <div className={`${face.options} ${styles.shapes}`}>
              {SHAPES.map((s) => (
                <button key={s.id} type="button" className={face.option} aria-label={s.name} aria-pressed={shape === s.id} onClick={() => { setShape(s.id); speak(s.name) }}>
                  <ShapeThumb id={s.id} />
                </button>
              ))}
            </div>
            <div className={face.controls} aria-label="모양 바꾸기">
              <button type="button" onClick={() => stretch(1.12, 1.12)}>크게</button>
              <button type="button" onClick={() => stretch(1 / 1.12, 1 / 1.12)}>작게</button>
              <button type="button" onClick={() => stretch(1.12, 1)}>넓게</button>
              <button type="button" onClick={() => stretch(1 / 1.12, 1)}>좁게</button>
              <button type="button" onClick={() => stretch(1, 1.12)}>길게</button>
              <button type="button" onClick={() => stretch(1, 1 / 1.12)}>납작하게</button>
            </div>
          </>
        )}

        {tab === 'color' && (
          <div className={styles.colors} role="radiogroup" aria-label="색 고르기">
            {COLORS.map((c) => (
              <button key={c.hex} type="button" role="radio" aria-checked={color === c.hex} aria-label={c.name} style={{ background: c.hex }} onClick={() => { setColor(c.hex); speak(c.name) }} />
            ))}
          </div>
        )}

        {tab !== 'shape' && tab !== 'color' && (
          <>
            <div className={face.options}>
              {partsOf(tab).map((part) => (
                <button key={part.id} type="button" className={face.option} aria-label={part.label} aria-pressed={parts.some((p) => p.id === part.id)} onClick={() => add(part.id)}>
                  <PartThumb id={part.id} />
                </button>
              ))}
            </div>
            <div className={face.controls} aria-label="고른 표정 바꾸기">
              <button type="button" disabled={!selected} onClick={() => selected && patch(selected.uid, { scale: clamp(selected.scale * 1.15, 0.25, 1.6) })}>크게</button>
              <button type="button" disabled={!selected} onClick={() => selected && patch(selected.uid, { scale: clamp(selected.scale / 1.15, 0.25, 1.6) })}>작게</button>
              <button type="button" disabled={!selected} aria-label="왼쪽으로 돌리기" onClick={() => selected && patch(selected.uid, { rotate: selected.rotate - 15 })}>↺</button>
              <button type="button" disabled={!selected} aria-label="오른쪽으로 돌리기" onClick={() => selected && patch(selected.uid, { rotate: selected.rotate + 15 })}>↻</button>
              <button type="button" disabled={!selected} onClick={() => selected && patch(selected.uid, { flip: !selected.flip })}>뒤집기</button>
              <button type="button" disabled={!selected} onClick={() => { setParts(parts.filter((p) => p.uid !== picked)); setPicked(null) }}>빼기</button>
            </div>
          </>
        )}

        <button type="button" className="btn btn-yellow" disabled={busy} onClick={finish}>다 만들었어요</button>
      </div>
    </div>
  )
}

function ShapeThumb({ id }: { id: string }) {
  const [x0, y0, x1, y1] = bboxOf(id)
  const bw = x1 - x0
  const bh = y1 - y0
  const ratio = bw / bh
  return (
    <span className={face.thumb}>
      <span style={{ aspectRatio: String(ratio), width: `min(100cqw, ${ratio * 100}cqh)` }}>
        <img
          src={shapeSrc(id)}
          alt=""
          draggable={false}
          style={{ width: `${(1024 / bw) * 100}%`, height: `${(1024 / bh) * 100}%`, left: `${(-x0 / bw) * 100}%`, top: `${(-y0 / bh) * 100}%` }}
        />
      </span>
    </span>
  )
}
