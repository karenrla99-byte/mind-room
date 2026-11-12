import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { DEFAULT_GROUPS, type GroupKey } from '../../data/emotions'
import type { PartKind } from '../../data/faceParts'
import { FACE_CANVAS } from '../../data/faceParts'
import { speak } from '../../lib/tts'
import { BASE, matchCount, partById, partsOf, place, renderFace, shuffle, type Placed } from './faceMath'
import PartView, { PartThumb } from './PartView'
import styles from './face.module.css'

interface Props {
  /** true: 3단계 (감정을 보고 그림자 없이 만들기) / false: 자유롭게 */
  withTarget: boolean
  onDone: (image: Blob) => void
  onBack: () => void
}

const TABS: { kind: PartKind; name: string }[] = [
  { kind: 'brow', name: '눈썹' },
  { kind: 'eye', name: '눈' },
  { kind: 'nose', name: '코' },
  { kind: 'mouth', name: '입' },
  { kind: 'extra', name: '꾸미기' },
]
const baseAt = place(BASE.id)
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** 얼굴 만들기: 부품을 눌러 얼굴에 놓고, 끌기·크기·돌리기·뒤집기 */
export default function FreeFace({ withTarget, onDone, onBack }: Props) {
  const target = useMemo(() => (withTarget ? shuffle(DEFAULT_GROUPS)[0] : null), [withTarget])
  const [tab, setTab] = useState<PartKind>('brow')
  const [parts, setParts] = useState<Placed[]>([])
  const [picked, setPicked] = useState<string | null>(null)
  const [praise, setPraise] = useState<{ text: string; image: Blob } | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const move = useRef<{ uid: string; dx: number; dy: number } | null>(null)

  useEffect(() => {
    speak(target ? `${target.name} 얼굴을 만들어요` : '얼굴을 자유롭게 만들어요')
  }, [target])

  const selected = parts.find((p) => p.uid === picked) ?? null
  const patch = (uid: string, change: Partial<Placed>) => setParts((list) => list.map((p) => (p.uid === uid ? { ...p, ...change } : p)))

  /** 부품 넣기: 눈썹·눈·코·입은 하나씩(바꿔 끼우기), 꾸미기는 누를 때마다 넣었다 빼기 */
  const add = (id: string) => {
    const kind = partById(id).kind
    const same = parts.find((p) => p.id === id)
    if (kind === 'extra' && same) {
      setParts(parts.filter((p) => p.uid !== same.uid))
      setPicked(null)
      return
    }
    const next = place(id)
    setParts([...parts.filter((p) => kind === 'extra' || partById(p.id).kind !== kind), next])
    setPicked(next.uid)
  }

  const toFace = (e: { clientX: number; clientY: number }) => {
    const box = stageRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - box.left) / box.width) * FACE_CANVAS, y: ((e.clientY - box.top) / box.height) * FACE_CANVAS }
  }

  const onDown = (e: PointerEvent, p: Placed) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const at = toFace(e)
    move.current = { uid: p.uid, dx: p.cx - at.x, dy: p.cy - at.y }
    setPicked(p.uid)
  }
  const onMove = (e: PointerEvent) => {
    const m = move.current
    if (!m) return
    const at = toFace(e)
    patch(m.uid, { cx: clamp(at.x + m.dx, 150, 1850), cy: clamp(at.y + m.dy, 150, 1850) })
  }
  const onUp = () => (move.current = null)

  const finish = async () => {
    setPicked(null)
    const image = await renderFace(parts)
    if (!target) return onDone(image)
    // 3단계: 정답은 하나가 아니에요. 어떤 얼굴이든 칭찬하고 넘어가요
    const text = matchCount(parts, target.key as GroupKey) >= 2 ? `${target.name} 마음이 잘 보여요!` : `나만의 ${target.name} 얼굴이에요!`
    setPraise({ text, image })
    speak(text)
  }

  if (praise) {
    return (
      <div className={styles.room}>
        <div className={styles.stage}>
          <PartView placed={baseAt} />
          {parts.map((p) => <PartView key={p.uid} placed={p} />)}
        </div>
        <div className={styles.side}>
          <h1 className={styles.title}>{praise.text}</h1>
          <p className={styles.hint}>이제 내 마음에 이름표를 붙여요</p>
          <button type="button" className="btn btn-yellow" onClick={() => onDone(praise.image)}>이름표 붙이러 가요</button>
          <button type="button" className="btn" onClick={() => setPraise(null)}>조금 더 고쳐요</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.room}>
      <div ref={stageRef} className={styles.stage} onPointerDown={() => setPicked(null)}>
        <PartView placed={baseAt} />
        {parts.map((p) => (
          <div key={p.uid} onPointerDown={(e) => onDown(e, p)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <PartView placed={p} className={`${styles.movable} ${p.uid === picked ? styles.picked : ''}`} style={p.uid === picked ? { zIndex: 5 } : undefined} />
          </div>
        ))}
      </div>

      <div className={styles.side}>
        {target ? (
          <h1 className={styles.title}>
            <img className={styles.targetPic} src={target.image} alt="" />
            <span className={styles.chip} style={{ background: target.color }}>{target.name}</span> 얼굴을 만들어요
          </h1>
        ) : (
          <h1 className={styles.title}>얼굴을 자유롭게 만들어요</h1>
        )}

        <div className={styles.tabs} role="tablist" aria-label="부품 종류">
          {TABS.map((t) => (
            <button key={t.kind} type="button" role="tab" aria-selected={tab === t.kind} onClick={() => { setTab(t.kind); speak(t.name) }}>
              {t.name}
            </button>
          ))}
        </div>
        <div className={styles.options}>
          {partsOf(tab).map((part) => (
            <button
              key={part.id}
              type="button"
              className={styles.option}
              aria-label={part.label}
              aria-pressed={parts.some((p) => p.id === part.id)}
              onClick={() => add(part.id)}
            >
              <PartThumb id={part.id} />
            </button>
          ))}
        </div>

        <div className={styles.controls} aria-label="고른 부품 바꾸기">
          <button type="button" disabled={!selected} onClick={() => selected && patch(selected.uid, { scale: clamp(selected.scale * 1.15, 0.4, 2.5) })}>크게</button>
          <button type="button" disabled={!selected} onClick={() => selected && patch(selected.uid, { scale: clamp(selected.scale / 1.15, 0.4, 2.5) })}>작게</button>
          <button type="button" disabled={!selected} aria-label="왼쪽으로 돌리기" onClick={() => selected && patch(selected.uid, { rotate: selected.rotate - 15 })}>↺</button>
          <button type="button" disabled={!selected} aria-label="오른쪽으로 돌리기" onClick={() => selected && patch(selected.uid, { rotate: selected.rotate + 15 })}>↻</button>
          <button type="button" disabled={!selected} onClick={() => selected && patch(selected.uid, { flip: !selected.flip })}>뒤집기</button>
          <button type="button" disabled={!selected} onClick={() => { setParts(parts.filter((p) => p.uid !== picked)); setPicked(null) }}>빼기</button>
        </div>
        <p className={`${styles.hint} ${styles.freeHint}`}>{selected ? '얼굴 위에서 끌어서 옮길 수 있어요' : '얼굴에 놓은 것을 누르면 바꿀 수 있어요'}</p>

        <button type="button" className="btn btn-yellow" disabled={parts.length === 0} onClick={finish}>다 만들었어요</button>
        <button type="button" className={styles.back} onClick={onBack}>다른 방법으로 해요</button>
      </div>
    </div>
  )
}
