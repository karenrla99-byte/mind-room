import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import NameTag from '../../components/nametag/NameTag'
import TagCard from '../../components/nametag/TagCard'
import { api } from '../../lib/api'
import { defaultConfig, readSettings, type EmotionConfig, type NameTagResult, type NamingLevel } from '../../lib/emotionConfig'
import { loadSession } from '../../lib/session'
import { speak } from '../../lib/tts'
import styles from './student.module.css'

/**
 * 이름표 붙이기 해 보기.
 * /solo → 기본 감정 목록, /room/:code/tag → 그 방의 감정 목록.
 * 전시방에 올리기는 다음 단계에서 붙어요.
 */
export default function TagTry() {
  const { code } = useParams()
  const session = loadSession()
  const inRoom = !!code
  const [setup, setSetup] = useState<{ config: EmotionConfig; level: NamingLevel } | null>(
    inRoom ? null : { config: defaultConfig(), level: 3 },
  )
  const [result, setResult] = useState<NameTagResult | null>(null)
  const [round, setRound] = useState(0)

  useEffect(() => {
    if (!code) return
    let alive = true
    api
      .getRoomByCode(code)
      .then((room) => alive && setSetup(readSettings(room?.settings)))
      .catch(() => alive && setSetup(readSettings(null)))
    return () => {
      alive = false
    }
  }, [code])

  if (inRoom && session?.code !== code) return <Navigate to={`/join/${code}`} replace />
  if (!setup) return <div className={styles.page}><p className={styles.message}>준비하고 있어요…</p></div>

  if (result) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>이름표를 붙였어요!</h1>
        <TagCard tag={result} name={inRoom ? session?.studentName : undefined} />
        <div className={styles.row}>
          <button type="button" className="btn btn-yellow" onClick={() => { setResult(null); setRound(round + 1) }}>
            한 번 더 해요
          </button>
          <Link to={inRoom ? `/room/${code}` : '/'} className="btn">{inRoom ? '방으로 가요' : '처음으로 가요'}</Link>
        </div>
      </div>
    )
  }

  return (
    <NameTag
      key={round}
      config={setup.config}
      level={setup.level}
      onDone={(r) => {
        setResult(r)
        speak(r.reason && r.word ? `${r.reason} ${r.word}` : (r.word ?? r.groupName))
      }}
    />
  )
}
