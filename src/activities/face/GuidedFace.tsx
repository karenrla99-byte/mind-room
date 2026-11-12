import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { DEFAULT_GROUPS, type GroupKey } from '../../data/emotions'
import { speak } from '../../lib/tts'
import { BASE, partsOf, place, RECIPES, renderFace, shuffle, SLOT_NAME, SLOTS, type Placed, type Slot } from './faceMath'
import PartView, { PartThumb } from './PartView'
import styles from './face.module.css'

interface Props {
  /** 1단계: 둘 중에 고르기 / 2단계: 넷 중에 고르기 */
  level: 1 | 2
  onDone: (image: Blob, groups: string[]) => void
  onBack: () => void
}

const baseAt = place(BASE.id)

/** 따라 만들기: 반투명 그림자와 같은 눈썹·눈·코·입을 찾아 얼굴에 놓아요 */
export default function GuidedFace({ level, onDone, onBack }: Props) {
  const choices = level === 1 ? 2 : 4
  // 이번에 만들 표정과, 나중에 감정을 고를 때 보여 줄 큰 감정들
  const { target, groups } = useMemo(() => {
    const keys = shuffle(DEFAULT_GROUPS.map((g) => g.key))
    return { target: keys[0] as GroupKey, groups: shuffle(keys.slice(0, choices)) }
  }, [choices])
  const recipe = RECIPES[target]

  const [step, setStep] = useState(0)
  const [wrong, setWrong] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null)
  const [ghostAt, setGhostAt] = useState<{ id: string; x: number; y: number } | null>(null)

  const slot: Slot | undefined = SLOTS[step]
  const finished = step >= SLOTS.length
  const placed: Placed[] = SLOTS.slice(0, step).map((s) => place(recipe[s]))

  // 이번 부위에서 고를 것들: 맞는 것 하나 + 다른 것들
  const options = useMemo(() => {
    if (!slot) return []
    const others = shuffle(partsOf(slot).map((p) => p.id).filter((id) => id !== recipe[slot])).slice(0, choices - 1)
    return shuffle([recipe[slot], ...others])
  }, [slot, recipe, choices])

  useEffect(() => {
    if (slot) speak(`같은 ${SLOT_NAME[slot]}${slot === 'brow' ? '을' : slot === 'eye' ? '을' : slot === 'mouth' ? '을' : '를'} 찾아요`)
    else speak('얼굴을 다 만들었어요')
  }, [slot])

  const choose = (id: string) => {
    if (!slot) return
    if (id === recipe[slot]) {
      setWrong(null)
      setStep(step + 1)
    } else {
      // 틀려도 실패가 아니에요. 살짝 흔들리고 다시 고르기
      setWrong(id)
      speak('다시 찾아봐요')
      setTimeout(() => setWrong((w) => (w === id ? null : w)), 600)
    }
  }

  // 끌어서 얼굴에 놓기 (누르기만 해도 됨)
  const onDown = (e: PointerEvent, id: string) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id, x: e.clientX, y: e.clientY, moved: false }
  }
  const onMove = (e: PointerEvent) => {
    const d = drag.current
    if (!d) return
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 12) return
    d.moved = true
    setGhostAt({ id: d.id, x: e.clientX, y: e.clientY })
  }
  const onUp = (e: PointerEvent) => {
    const d = drag.current
    drag.current = null
    setGhostAt(null)
    if (!d) return
    if (!d.moved) return choose(d.id)
    const box = stageRef.current!.getBoundingClientRect()
    const inside = e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom
    if (inside) choose(d.id)
  }

  const finish = async () => {
    setBusy(true)
    onDone(await renderFace(placed), groups)
  }

  return (
    <div className={styles.room}>
      <div ref={stageRef} className={styles.stage}>
        <PartView placed={baseAt} />
        {SLOTS.slice(step).map((s) => (
          <PartView key={s} placed={place(recipe[s])} ghost className={s === slot ? styles.now : ''} />
        ))}
        {placed.map((p) => (
          <PartView key={p.id} placed={p} className={styles.pop} />
        ))}
      </div>

      <div className={styles.side}>
        {finished ? (
          <>
            <h1 className={styles.title}>얼굴을 다 만들었어요!</h1>
            <p className={styles.hint}>이 얼굴은 어떤 마음일까요?</p>
            <button type="button" className="btn btn-yellow" disabled={busy} onClick={finish}>마음을 골라요</button>
          </>
        ) : (
          <>
            <h1 className={styles.title}>같은 {SLOT_NAME[slot!]} 찾기</h1>
            <p className={styles.hint}>그림자와 같은 것을 누르거나 얼굴로 끌어요</p>
            <div className={`${styles.options} ${choices === 2 ? styles.two : ''}`}>
              {options.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.option} ${wrong === id ? styles.shake : ''}`}
                  aria-label={SLOT_NAME[slot!]}
                  onPointerDown={(e) => onDown(e, id)}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  onPointerCancel={onUp}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && choose(id)}
                >
                  <PartThumb id={id} />
                </button>
              ))}
            </div>
            <ol className={styles.steps} aria-label="순서">
              {SLOTS.map((s, i) => (
                <li key={s} className={i < step ? styles.stepDone : i === step ? styles.stepNow : ''}>{SLOT_NAME[s]}</li>
              ))}
            </ol>
          </>
        )}
        <button type="button" className={styles.back} onClick={onBack}>다른 방법으로 해요</button>
      </div>

      {ghostAt && (
        <div className={styles.dragging} style={{ left: ghostAt.x, top: ghostAt.y }}>
          <PartThumb id={ghostAt.id} />
        </div>
      )}
    </div>
  )
}
