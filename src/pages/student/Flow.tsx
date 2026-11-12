import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { enabledActivities, findActivity, nametagOn } from '../../activities'
import NameTag from '../../components/nametag/NameTag'
import TagCard from '../../components/nametag/TagCard'
import { api, errorText } from '../../lib/api'
import { defaultConfig, readSettings, type EmotionConfig, type NameTagResult, type NamingLevel } from '../../lib/emotionConfig'
import { loadSession } from '../../lib/session'
import { speak } from '../../lib/tts'
import { canShare, downloadBlob, renderTagImage, shareBlob, uploadWork, workFilename } from '../../lib/works'
import styles from './student.module.css'

/**
 * 활동 한 번의 흐름: 만들기 → 이름표 붙이기 → 전시방에 올리기 / 저장.
 * /solo/:activity (나의방, 저장만) · /room/:code/do/:activity (방, 올리기)
 * activity 가 'nametag' 이면 만들기 없이 이름표만 붙여요.
 */
export default function Flow() {
  const { code, activity: activityKey = 'nametag' } = useParams()
  const session = loadSession()
  const inRoom = !!code
  const activity = findActivity(activityKey)
  const home = inRoom ? `/room/${code}` : '/solo'

  const [setup, setSetup] = useState<{ config: EmotionConfig; level: NamingLevel; allowed: boolean } | null>(
    inRoom ? null : { config: defaultConfig(), level: 3, allowed: true },
  )
  const [made, setMade] = useState<Blob | null>(null)
  const [only, setOnly] = useState<string[] | undefined>(undefined)
  const [result, setResult] = useState<NameTagResult | null>(null)
  const [round, setRound] = useState(0)
  const [upload, setUpload] = useState<'idle' | 'busy' | 'done'>('idle')
  const [error, setError] = useState('')

  const madeUrl = useMemo(() => (made ? URL.createObjectURL(made) : null), [made])
  useEffect(() => () => void (madeUrl && URL.revokeObjectURL(madeUrl)), [madeUrl])

  useEffect(() => {
    if (!code) return
    let alive = true
    api
      .getRoomByCode(code)
      .then((room) => {
        if (!alive) return
        // 선생님이 꺼 둔 활동은 주소를 직접 쳐도 못 들어감
        const allowed = activityKey === 'nametag' ? nametagOn(room?.settings) : enabledActivities(room?.settings).some((a) => a.key === activityKey)
        setSetup({ ...readSettings(room?.settings), allowed })
      })
      .catch(() => alive && setSetup({ ...readSettings(null), allowed: true }))
    return () => {
      alive = false
    }
  }, [code, activityKey])

  if (inRoom && session?.code !== code) return <Navigate to={`/join/${code}`} replace />
  if (activityKey !== 'nametag' && !activity) return <Navigate to={home} replace />
  if (setup && !setup.allowed) return <Navigate to={home} replace />
  if (!setup) return <div className={styles.page}><p className={styles.message}>준비하고 있어요…</p></div>

  /** 올리거나 저장할 그림: 만든 작품, 없으면 이름표 그림 */
  const picture = async () => made ?? (await renderTagImage(result!))

  const again = () => {
    setMade(null)
    setOnly(undefined)
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
      await uploadWork(session, activityKey, result, await picture())
      setUpload('done')
      speak('전시방에 올렸어요')
    } catch (e) {
      setUpload('idle')
      setError(errorText(e))
    }
  }

  const save = async (share: boolean) => {
    if (!result) return
    const blob = await picture()
    const name = workFilename([inRoom ? session?.studentName : null, result.word ?? result.groupName])
    if (share) await shareBlob(blob, name, '마음방')
    else downloadBlob(blob, name)
  }

  // 1. 만들기
  if (activity?.Component && !made) {
    const Make = activity.Component
    return (
      <Make
        key={round}
        onDone={(image, hint) => {
          setOnly(hint?.groups)
          setMade(image)
        }}
      />
    )
  }

  // 2. 이름표 붙이기
  if (!result) {
    return (
      <NameTag
        key={round}
        config={setup.config}
        level={setup.level}
        picture={madeUrl}
        only={only}
        onDone={(r) => {
          setResult(r)
          speak(r.reason && r.word ? `${r.reason} ${r.word}` : (r.word ?? r.groupName))
        }}
      />
    )
  }

  // 3. 다 됐어요
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{made ? '다 만들었어요!' : '이름표를 붙였어요!'}</h1>
      <TagCard tag={result} name={inRoom ? session?.studentName : undefined} picture={madeUrl} />
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
        <Link to={home} className="btn">{inRoom ? '방으로 가요' : '나의방으로 가요'}</Link>
      </div>
    </div>
  )
}
