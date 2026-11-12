import { Link } from 'react-router-dom'
import { speak } from '../lib/tts'
import styles from './Home.module.css'

// 집·문 그림: 에셋/04_집과문 (정은이 그림)
const DOORS = [
  { to: '/teacher', who: '선생님', say: '선생님. 방 만들기', door: 'door_left', friend: 'joy_4', pos: 'left' },
  { to: '/join', who: '학생', say: '학생. 방 들어가기', door: 'door_center', friend: 'joy_x1', pos: 'center' },
  { to: '/solo', who: '나의방', say: '나의방. 혼자 하기', door: 'door_right', friend: 'joy_1', pos: 'right' },
] as const

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.title}>
        <h1>마음방</h1>
        <p>내 마음을 보여 줘요</p>
      </div>

      <div className={styles.house}>
        <img className={styles.houseImg} src="/assets/home/house.png" alt="" />
        <nav aria-label="들어갈 문 고르기">
          {DOORS.map((d) => (
            <Link
              key={d.to}
              to={d.to}
              className={`${styles.door} ${styles[d.pos]}`}
              aria-label={d.say}
              onClick={() => speak(d.say)}
            >
              <img className={styles.doorImg} src={`/assets/home/${d.door}.png`} alt="" />
              <img className={styles.friend} src={`/assets/words/${d.friend}.png`} alt="" />
              <span className={styles.who}>{d.who}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
