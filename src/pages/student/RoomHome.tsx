import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { enabledActivities, nametagOn, READY } from '../../activities'
import { api } from '../../lib/api'
import { loadSession } from '../../lib/session'
import { speak } from '../../lib/tts'
import Rooms from './Rooms'
import styles from './student.module.css'

/** 학생이 방에 들어온 뒤: 들어갈 방(활동) 고르기 */
export default function RoomHome() {
  const { code = '' } = useParams()
  const session = loadSession()
  const ok = session?.code === code
  const [settings, setSettings] = useState<Record<string, unknown> | null | undefined>(undefined)

  useEffect(() => {
    if (!ok) return
    let alive = true
    api.getRoomByCode(code).then((r) => alive && setSettings(r?.settings ?? null), () => alive && setSettings(null))
    speak(`${session.studentName}, 어서 와요. 어느 방에 들어갈까요?`)
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, code])

  if (!ok) return <Navigate to={`/join/${code}`} replace />

  return (
    <div className={styles.page}>
      <p className={styles.roomName}>{session.roomName}</p>
      <h1 className={styles.title}>{session.studentName}, 어느 방에 들어갈까요?</h1>
      {settings === undefined ? (
        <p className={styles.message}>준비하고 있어요…</p>
      ) : (
        <Rooms
          base={`/room/${code}/do`}
          activities={settings ? enabledActivities(settings) : READY}
          nametag={nametagOn(settings)}
          gallery={`/gallery/${code}`}
        />
      )}
      <Link to={`/join/${code}`} className={styles.notMe}>내 이름이 아니에요</Link>
    </div>
  )
}
