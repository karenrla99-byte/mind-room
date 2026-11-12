import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, errorText } from '../../lib/api'
import { myRooms, useMyRooms } from '../../lib/myRooms'
import styles from './teacher.module.css'

const digits = (v: string, n: number) => v.replace(/\D/g, '').slice(0, n)

export default function TeacherHome() {
  const rooms = useMyRooms()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [findCode, setFindCode] = useState('')
  const [findPin, setFindPin] = useState('')
  const [findError, setFindError] = useState('')

  const create = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('방 이름을 적어요.')
    if (pin.length !== 4) return setError('PIN은 숫자 4자리로 정해요.')
    setBusy(true)
    setError('')
    try {
      const room = await api.createRoom(name.trim(), pin)
      myRooms.upsert({ id: room.id, code: room.code, name: room.name, key: room.teacher_key })
      navigate(`/teacher/room/${room.id}`)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  const find = async (e: FormEvent) => {
    e.preventDefault()
    if (findCode.length !== 6 || findPin.length !== 4) return setFindError('방 번호 6자리와 PIN 4자리를 적어요.')
    setBusy(true)
    setFindError('')
    try {
      const res = await api.claimRoom(findCode, findPin)
      if ('error' in res) {
        setFindError(
          res.error === 'locked'
            ? 'PIN을 여러 번 틀렸어요. 5분 뒤에 다시 해 봐요.'
            : '방 번호나 PIN이 맞지 않아요.',
        )
        return
      }
      myRooms.upsert({ id: res.id, code: res.code, name: res.name, key: res.teacher_key })
      navigate(`/teacher/room/${res.id}`)
    } catch (err) {
      setFindError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>선생님 방</h1>

      <section className={styles.panel}>
        <h2>내 방 목록</h2>
        {rooms.length === 0 ? (
          <p className={styles.muted}>아직 만든 방이 없어요. 아래에서 새 방을 만들어요.</p>
        ) : (
          <ul className={styles.roomList}>
            {rooms.map((r) => (
              <li key={r.id}>
                <Link to={`/teacher/room/${r.id}`} className={styles.roomCard}>
                  <strong>{r.name}</strong>
                  <span className={styles.code}>{r.code.slice(0, 3)} {r.code.slice(3)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.panel}>
        <h2>새 방 만들기</h2>
        <form className={styles.form} onSubmit={create}>
          <label>
            <span>방 이름</span>
            <input value={name} maxLength={40} placeholder="예: 3학년 2반 마음방" onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            <span>방 관리 PIN (숫자 4자리)</span>
            <input
              value={pin}
              inputMode="numeric"
              autoComplete="off"
              placeholder="0000"
              className={styles.pinInput}
              onChange={(e) => setPin(digits(e.target.value, 4))}
            />
          </label>
          <p className={styles.muted}>
            PIN은 다른 기기에서 방을 열거나 방을 지울 때 써요. 잊으면 되찾을 수 없으니 꼭 적어 두어요.
          </p>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" className="btn btn-yellow" disabled={busy}>
            방 만들기
          </button>
        </form>
      </section>

      <details className={styles.panel}>
        <summary>다른 기기에서 만든 방 찾기</summary>
        <form className={styles.form} onSubmit={find}>
          <label>
            <span>방 번호 (6자리)</span>
            <input value={findCode} inputMode="numeric" placeholder="000000" className={styles.pinInput} onChange={(e) => setFindCode(digits(e.target.value, 6))} />
          </label>
          <label>
            <span>PIN (4자리)</span>
            <input value={findPin} inputMode="numeric" autoComplete="off" placeholder="0000" className={styles.pinInput} onChange={(e) => setFindPin(digits(e.target.value, 4))} />
          </label>
          {findError && <p className={styles.error} role="alert">{findError}</p>}
          <button type="submit" className="btn" disabled={busy}>
            방 찾기
          </button>
        </form>
      </details>
    </div>
  )
}
