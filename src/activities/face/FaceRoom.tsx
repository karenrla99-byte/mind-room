import { useEffect, useState, type CSSProperties } from 'react'
import { speak } from '../../lib/tts'
import type { ActivityProps } from '../types'
import FreeFace from './FreeFace'
import GuidedFace from './GuidedFace'
import styles from './face.module.css'

type Mode = 'level1' | 'level2' | 'level3' | 'free'
const MODES: { key: Mode; name: string; text: string; color: string }[] = [
  { key: 'level1', name: '따라 만들기 1', text: '그림자와 같은 것을 둘 중에 찾아요', color: '#FCE3A7' },
  { key: 'level2', name: '따라 만들기 2', text: '그림자와 같은 것을 넷 중에 찾아요', color: '#FBCA8E' },
  { key: 'level3', name: '마음 보고 만들기', text: '마음을 보고 얼굴을 만들어요', color: '#B5DFAC' },
  { key: 'free', name: '자유롭게 만들기', text: '내 마음대로 얼굴을 만들어요', color: '#A6CAFF' },
]

/** 표정방: 눈썹·눈·코·입으로 표정 만들기 (단계별 1·2·3 + 자유) */
export default function FaceRoom({ onDone }: ActivityProps) {
  const [mode, setMode] = useState<Mode | null>(null)
  const [round, setRound] = useState(0)

  useEffect(() => {
    if (!mode) speak('어떻게 만들까요?')
  }, [mode])

  const back = () => {
    setMode(null)
    setRound(round + 1)
  }

  if (mode === 'level1' || mode === 'level2') {
    return <GuidedFace key={round} level={mode === 'level1' ? 1 : 2} onBack={back} onDone={(image, groups) => onDone(image, { groups })} />
  }
  if (mode === 'level3' || mode === 'free') {
    return <FreeFace key={round} withTarget={mode === 'level3'} onBack={back} onDone={(image) => onDone(image)} />
  }

  return (
    <div className={styles.menu}>
      <h1 className={styles.title}>어떻게 만들까요?</h1>
      <div className={styles.modes}>
        {MODES.map((m, i) => (
          <button key={m.key} type="button" className={styles.mode} style={{ '--tone': m.color } as CSSProperties} onClick={() => { setMode(m.key); speak(m.name) }}>
            <span className={styles.modeNum}>{i < 3 ? i + 1 : '★'}</span>
            <strong>{m.name}</strong>
            <span>{m.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
