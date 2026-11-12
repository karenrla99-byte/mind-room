import { Link } from 'react-router-dom'
import ActivityIcon from '../../activities/ActivityIcon'
import type { Activity } from '../../activities/types'
import { speak } from '../../lib/tts'
import styles from './student.module.css'

interface Props {
  /** 활동 주소 앞부분: /solo 또는 /room/123456/do */
  base: string
  activities: Activity[]
  nametag: boolean
  gallery?: string
}

/** 들어갈 방(활동) 고르기 카드 */
export default function Rooms({ base, activities, nametag, gallery }: Props) {
  return (
    <div className={styles.rooms}>
      {activities.map((a) => (
        <Link key={a.key} to={`${base}/${a.key}`} className={styles.roomCard} style={{ background: a.color }} onClick={() => speak(`${a.name}. ${a.say}`)}>
          <ActivityIcon name={a.key} />
          <strong>{a.name}</strong>
          <span>{a.say}</span>
        </Link>
      ))}
      {nametag && (
        <Link to={`${base}/nametag`} className={styles.roomCard} style={{ background: '#D0BFEA' }} onClick={() => speak('이름표 붙이기')}>
          <ActivityIcon name="nametag" />
          <strong>이름표 붙이기</strong>
          <span>지금 마음에 이름을 붙여요</span>
        </Link>
      )}
      {gallery && (
        <Link to={gallery} className={styles.roomCard} style={{ background: '#FFFFFF' }} onClick={() => speak('전시방')}>
          <ActivityIcon name="gallery" />
          <strong>전시방</strong>
          <span>친구들 작품을 봐요</span>
        </Link>
      )}
    </div>
  )
}
