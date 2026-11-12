import { Link } from 'react-router-dom'
import { DEFAULT_GROUPS } from '../data/emotions'
import { speak } from '../lib/tts'
import styles from './Home.module.css'

const DOORS = [
  { to: '/teacher', who: '선생님', label: '방 만들기', say: '선생님. 방 만들기', image: '/assets/words/joy_4.png', tone: 'blue' },
  { to: '/join', who: '학생', label: '방 들어가기', say: '학생. 방 들어가기', image: '/assets/words/joy_x1.png', tone: 'yellow' },
  { to: '/solo', who: '나의방', label: '혼자 하기', say: '나의방. 혼자 하기', image: '/assets/words/joy_1.png', tone: 'green' },
] as const

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.house}>
        <div className={styles.roof}>
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M2 38 50 3 98 38Z" />
          </svg>
          <div className={styles.title}>
            <h1>마음방</h1>
            <p>내 마음을 보여 줘요</p>
          </div>
        </div>

        <div className={styles.wall}>
          <ul className={styles.friends} aria-hidden="true">
            {DEFAULT_GROUPS.map((g, i) => (
              <li key={g.key} style={{ animationDelay: `${i * 0.18}s` }}>
                <img src={g.image} alt="" />
              </li>
            ))}
          </ul>

          <nav className={styles.doors} aria-label="들어갈 문 고르기">
            {DOORS.map((d) => (
              <Link key={d.to} to={d.to} className={`${styles.door} ${styles[d.tone]}`} onClick={() => speak(d.say)}>
                <span className={styles.window}>
                  <img src={d.image} alt="" />
                </span>
                <span className={styles.who}>{d.who}</span>
                <span className={styles.label}>{d.label}</span>
                <span className={styles.knob} aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
