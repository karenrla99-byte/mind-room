import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { loadSession } from '../../lib/session'
import { speak } from '../../lib/tts'
import styles from './student.module.css'

/** 학생이 방에 들어온 뒤 화면. 활동 고르기는 다음 단계에서 여기에 생겨요 */
export default function RoomHome() {
  const { code = '' } = useParams()
  const session = loadSession()
  const ok = session?.code === code

  useEffect(() => {
    if (ok) speak(`${session.studentName}, 어서 와요`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok])

  if (!ok) return <Navigate to={`/join/${code}`} replace />

  return (
    <div className={styles.page}>
      <p className={styles.roomName}>{session.roomName}</p>
      <img className={styles.hero} src="/assets/words/joy_x1.png" alt="" />
      <h1 className={styles.title}>{session.studentName}, 어서 와요!</h1>
      <p className={styles.message}>표정방, 색깔방은 곧 열려요. 먼저 이름표를 붙여 봐요.</p>
      <div className={styles.row}>
        <Link to={`/room/${code}/tag`} className="btn btn-yellow">이름표 붙이기</Link>
        <Link to={`/join/${code}`} className="btn">내 이름이 아니에요</Link>
      </div>
    </div>
  )
}
