import { Link } from 'react-router-dom'
import { setSettings, useSettings } from '../lib/settings'
import { speak, stopSpeaking, ttsSupported } from '../lib/tts'
import styles from './Page.module.css'

/** 열쇠방: 선생님 설정. 지금은 이 기기 설정만, 방 관리는 다음 단계에서 */
export default function KeyRoom() {
  const settings = useSettings()

  const toggleTts = () => {
    const next = !settings.tts
    setSettings({ tts: next })
    if (next) speak('이제 읽어 줘요', { force: true })
    else stopSpeaking()
  }

  return (
    <div className={styles.center}>
      <section className={styles.card}>
        <h1>열쇠방</h1>
        <p>선생님이 쓰는 방이에요.</p>

        <div className={styles.row}>
          <div>
            <strong>읽어 주기</strong>
            <span>{ttsSupported ? '낱말과 안내를 소리로 읽어 줘요.' : '이 기기에서는 읽어 주기를 쓸 수 없어요.'}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.tts}
            aria-label="읽어 주기"
            className={styles.switch}
            disabled={!ttsSupported}
            onClick={toggleTts}
          >
            <span />
          </button>
        </div>

        <button type="button" className="btn" disabled={!ttsSupported} onClick={() => speak('안녕하세요. 마음방이에요.', { force: true })}>
          소리 들어 보기
        </button>

        <Link to="/teacher" className="btn btn-yellow">
          내 방 목록 열기
        </Link>
      </section>
    </div>
  )
}
