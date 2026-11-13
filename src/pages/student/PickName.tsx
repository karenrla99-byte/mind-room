import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, type Room, type Student } from '../../lib/api'
import { saveSession } from '../../lib/session'
import { speak } from '../../lib/tts'
import { assetUrl } from '../../lib/works'
import styles from './student.module.css'

const TINTS = ['#FCE3A7', '#FBCA8E', '#F7C8C9', '#B5DFAC', '#A6CAFF', '#CDCFEE', '#D0BFEA']

/** 학생 입장 2: 명단에서 내 이름 고르기 (QR을 찍으면 바로 여기로 옴) */
export default function PickName() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState<Room | null | undefined>(undefined)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    api
      .getRoomByCode(code)
      .then((r) => {
        if (!alive) return
        setRoom(r)
        if (r?.is_open && r.students.length > 0) speak('내 이름을 눌러요')
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [code])

  const pick = (s: Student) => {
    if (!room) return
    saveSession({ roomId: room.id, code: room.code, roomName: room.name, studentId: s.id, studentName: s.name })
    navigate(`/room/${room.code}`)
  }

  if (failed) return <Notice image="surprise_4" title="연결이 잘 안 돼요" text="잠시 뒤에 다시 해 봐요." />
  if (room === undefined) return <div className={styles.page}><p className={styles.message}>방을 찾고 있어요…</p></div>
  if (room === null) return <Notice image="surprise_4" title="방을 찾지 못했어요" text="번호를 다시 눌러요." />
  if (!room.is_open) return <Notice image="lethargy_3" title="지금은 방이 닫혀 있어요" text="전시방은 볼 수 있어요." gallery={room.code} />
  if (room.students.length === 0) return <Notice image="surprise_1" title="아직 이름이 없어요" text="선생님이 이름을 넣으면 들어올 수 있어요." />

  return (
    <div className={styles.page}>
      <p className={styles.roomName}>{room.name}</p>
      <h1 className={styles.title}>내 이름을 눌러요</h1>
      <div className={styles.names}>
        {room.students.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={styles.nameBtn}
            style={{ '--tone': TINTS[i % TINTS.length] } as CSSProperties}
            onClick={() => pick(s)}
          >
            {s.image_path && <img src={assetUrl(s.image_path)} alt="" />}
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function Notice({ image, title, text, gallery }: { image: string; title: string; text: string; gallery?: string }) {
  return (
    <div className={styles.page}>
      <img className={styles.hero} src={`/assets/words/${image}.png`} alt="" />
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>{text}</p>
      {gallery && <Link to={`/gallery/${gallery}`} className="btn btn-yellow">전시방 보기</Link>}
      <Link to="/join" className={gallery ? 'btn' : 'btn btn-yellow'}>번호 다시 누르기</Link>
    </div>
  )
}
