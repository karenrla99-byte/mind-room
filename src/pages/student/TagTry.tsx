import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import NameTag from '../../components/nametag/NameTag'
import TagCard from '../../components/nametag/TagCard'
import { api, errorText } from '../../lib/api'
import { defaultConfig, readSettings, type EmotionConfig, type NameTagResult, type NamingLevel } from '../../lib/emotionConfig'
import { loadSession } from '../../lib/session'
import { speak } from '../../lib/tts'
import { canShare, downloadBlob, renderTagImage, shareBlob, uploadWork, workFilename } from '../../lib/works'
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
  const [upload, setUpload] = useState<'idle' | 'busy' | 'done'>('idle')
  const [error, setError] = useState('')

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

  const again = () => {
    setResult(null)
    setUpload('idle')
    setError('')
    setRound(round + 1)
  }

  /** 전시방에 올리기 = 선생님께 전달 */
  const post = async () => {
    if (!result || !session) return
    setUpload('busy')
    setError('')
    try {
      await uploadWork(session, 'nametag', result, await renderTagImage(result))
      setUpload('done')
      speak('전시방에 올렸어요')
    } catch (e) {
      setUpload('idle')
      setError(errorText(e))
    }
  }

  const save = async (share: boolean) => {
    if (!result) return
    const blob = await renderTagImage(result)
    const name = workFilename([inRoom ? session?.studentName : null, result.word ?? result.groupName])
    if (share) await shareBlob(blob, name, '마음방')
    else downloadBlob(blob, name)
  }

  if (result) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>이름표를 붙였어요!</h1>
        <TagCard tag={result} name={inRoom ? session?.studentName : undefined} />
        {error && <p className={styles.error} role="alert">{error}</p>}
        {upload === 'done' && <p className={styles.message}>전시방에 올렸어요!</p>}
        <div className={styles.row}>
          {inRoom && upload !== 'done' && (
            <button type="button" className="btn btn-yellow" disabled={upload === 'busy'} onClick={post}>
              {upload === 'busy' ? '올리고 있어요…' : '전시방에 올려요'}
            </button>
          )}
          {inRoom && upload === 'done' && <Link to={`/gallery/${code}`} className="btn btn-yellow">전시방 보러 가요</Link>}
          <button type="button" className="btn" onClick={() => save(false)}>사진으로 저장</button>
          {canShare() && <button type="button" className="btn" onClick={() => save(true)}>보내기</button>}
        </div>
        <div className={styles.row}>
          <button type="button" className="btn" onClick={again}>한 번 더 해요</button>
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
