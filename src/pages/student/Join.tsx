import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { speak } from '../../lib/tts'
import styles from './student.module.css'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/** 학생 입장 1: 방 번호 6자리 누르기 */
export default function Join() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const press = (d: string) => {
    if (busy || code.length >= 6) return
    setMessage('')
    setCode(code + d)
    speak(d)
  }
  const back = () => {
    if (busy) return
    setMessage('')
    setCode(code.slice(0, -1))
  }

  // 6자리를 다 누르면 바로 방 찾기
  useEffect(() => {
    if (code.length !== 6) return
    let alive = true
    setBusy(true)
    api
      .getRoomByCode(code)
      .then((room) => {
        if (!alive) return
        if (room) return navigate(`/join/${code}`)
        setMessage('방을 찾지 못했어요. 번호를 다시 눌러요.')
        speak('방을 찾지 못했어요. 번호를 다시 눌러요.')
        setCode('')
      })
      .catch(() => {
        if (!alive) return
        setMessage('연결이 잘 안 돼요. 다시 눌러요.')
        setCode('')
      })
      .finally(() => alive && setBusy(false))
    return () => {
      alive = false
    }
  }, [code, navigate])

  // 키보드로도 누를 수 있게
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>방 번호를 눌러요</h1>

      <div className={styles.slots} aria-label={`누른 번호 ${code.length}개`}>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={`${styles.slot} ${code[i] ? styles.filled : ''} ${i === 3 ? styles.gap : ''}`}>
            {code[i] ?? ''}
          </span>
        ))}
      </div>

      <p className={styles.message} role="status">{busy ? '방을 찾고 있어요…' : message}</p>

      <div className={styles.keypad}>
        {KEYS.map((k) => (
          <button key={k} type="button" className={styles.key} onClick={() => press(k)}>{k}</button>
        ))}
        <span />
        <button type="button" className={styles.key} onClick={() => press('0')}>0</button>
        <button type="button" className={`${styles.key} ${styles.backKey}`} onClick={back} aria-label="하나 지우기">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h11v14H9l-6-7zM12 9.5l5 5M17 9.5l-5 5" /></svg>
        </button>
      </div>
    </div>
  )
}
