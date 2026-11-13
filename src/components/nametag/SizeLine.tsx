import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { shade, textOn, type ConfigGroup, type ConfigWord } from '../../lib/emotionConfig'
import { speak } from '../../lib/tts'
import WordPicture from './WordPicture'
import styles from './nametag.module.css'

interface Props {
  group: ConfigGroup
  words: ConfigWord[]
  /** 손잡이 위치 1~5 (아직 안 골랐으면 null) */
  position: number | null
  wordId: string | null
  onChange: (position: number, wordId: string | null) => void
}

const POSITIONS = [1, 2, 3, 4, 5]

/** 감정 크기 수직선: 손잡이를 끌거나 낱말을 눌러서 고름 */
export default function SizeLine({ group, words, position, wordId, onChange }: Props) {
  const track = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const at = (p: number) => words.filter((w) => w.intensity === p)

  /** 손잡이가 한 칸에 오면: 낱말이 하나면 바로 고르고, 여럿이면 그 칸에서 한 번 더 고름 */
  const moveTo = (p: number) => {
    if (p === position) return
    const here = at(p)
    const only = here.length === 1 ? here[0] : null
    onChange(p, only?.id ?? null)
    if (only) speak(only.word)
    else if (here.length > 1) speak('하나를 골라요')
  }

  const fromPointer = (e: PointerEvent) => {
    const box = track.current!.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width))
    moveTo(Math.round(ratio * 4) + 1)
  }

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    fromPointer(e)
  }
  const onMove = (e: PointerEvent) => dragging.current && fromPointer(e)
  const onUp = () => (dragging.current = false)

  const onKey = (e: KeyboardEvent) => {
    const now = position ?? 0
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') moveTo(Math.min(5, now + 1))
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') moveTo(Math.max(1, now - 1))
    else return
    e.preventDefault()
  }

  const pickWord = (w: ConfigWord) => {
    onChange(w.intensity, w.id)
    speak(w.word)
  }

  const picked = words.find((w) => w.id === wordId)

  return (
    <div className={styles.line}>
      <div className={styles.columns}>
        {POSITIONS.map((p) => (
          <div key={p} className={`${styles.column} ${p === position ? styles.here : ''}`}>
            {at(p).map((w) => {
              const bg = shade(group.color, p)
              const on = w.id === wordId
              return (
                <button
                  key={w.id}
                  type="button"
                  className={`${styles.wordCard} ${on ? styles.on : ''}`}
                  style={{ '--tone': bg, color: textOn(bg) } as CSSProperties}
                  aria-pressed={on}
                  onClick={() => pickWord(w)}
                >
                  <WordPicture image={w.image} emoji={w.emoji} color={bg} />
                  <span>{w.word}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className={styles.trackWrap}>
        <div
          ref={track}
          className={styles.track}
          style={{ background: `linear-gradient(90deg, ${shade(group.color, 1)}, ${group.color})` }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {POSITIONS.map((p) => (
            <span key={p} className={styles.tick} style={{ left: `${(p - 1) * 25}%` }} />
          ))}
          <div
            className={`${styles.handle} ${position == null ? styles.waiting : ''}`}
            style={{ left: `${((position ?? 1) - 1) * 25}%`, background: position ? shade(group.color, position) : '#FFFFFF' }}
            role="slider"
            tabIndex={0}
            aria-label="감정 크기"
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={position ?? undefined}
            aria-valuetext={picked ? picked.word : position ? `크기 ${position}` : '아직 안 골랐어요'}
            onKeyDown={onKey}
          />
        </div>
        <div className={styles.ends} aria-hidden="true">
          <span>작은 마음</span>
          <span>큰 마음</span>
        </div>
      </div>
    </div>
  )
}
