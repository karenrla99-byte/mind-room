import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { ACTIVITIES } from '../../activities'
import { api, errorText, type Room, type Student } from '../../lib/api'
import { myRooms } from '../../lib/myRooms'
import { downloadSampleCsv, namesFromCsvFile, namesFromText } from '../../lib/names'
import { assetUrl, removeRoomAssets, removeWorkFiles, uploadRoomAsset } from '../../lib/works'
import styles from './teacher.module.css'

export default function RoomManage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const mine = myRooms.get(id)
  const key = mine?.key ?? ''

  const [room, setRoom] = useState<Room | null>(null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [qr, setQr] = useState('')
  const [showBig, setShowBig] = useState(false)

  const [oneName, setOneName] = useState('')
  const [paste, setPaste] = useState('')
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const photoFor = useRef<string>('')

  const joinUrl = room ? `${location.origin}/join/${room.code}` : ''

  useEffect(() => {
    if (!key) return
    let alive = true
    api
      .teacherGetRoom(id, key)
      .then((r) => alive && setRoom(r))
      .catch((e) => alive && setLoadError(errorText(e)))
    return () => {
      alive = false
    }
  }, [id, key])

  useEffect(() => {
    if (!joinUrl) return
    QRCode.toDataURL(joinUrl, { width: 720, margin: 1, color: { dark: '#3A2E2A', light: '#FFFFFF' } }).then(setQr, () => setQr(''))
  }, [joinUrl])

  /** 서버에 보내고, 돌아온 명단으로 화면을 바꿈 */
  const run = useCallback(
    async (job: () => Promise<Student[] | Room>) => {
      setBusy(true)
      setError('')
      try {
        const res = await job()
        setRoom((prev) => (Array.isArray(res) ? (prev ? { ...prev, students: res } : prev) : res))
        return true
      } catch (e) {
        setError(errorText(e))
        return false
      } finally {
        setBusy(false)
      }
    },
    [],
  )

  if (!mine) {
    return (
      <div className={styles.page}>
        <section className={styles.panel}>
          <h2>이 기기에는 이 방의 열쇠가 없어요</h2>
          <p className={styles.muted}>선생님 방에서 "다른 기기에서 만든 방 찾기"로 방 번호와 PIN을 넣어요.</p>
          <Link to="/teacher" className="btn btn-yellow">선생님 방으로 가요</Link>
        </section>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <section className={styles.panel}>
          <h2>방을 열지 못했어요</h2>
          <p className={styles.error}>{loadError}</p>
          <Link to="/teacher" className="btn">선생님 방으로 가요</Link>
        </section>
      </div>
    )
  }

  if (!room) return <div className={styles.page}><p className={styles.muted}>방을 여는 중이에요…</p></div>

  const students = room.students
  const codeText = `${room.code.slice(0, 3)} ${room.code.slice(3)}`

  const addNames = async (names: string[]) => {
    if (names.length === 0) {
      setError('넣을 이름이 없어요.')
      return false
    }
    return run(() => api.addStudents(id, key, names))
  }

  const addOne = async (e: FormEvent) => {
    e.preventDefault()
    if (await addNames(namesFromText(oneName))) setOneName('')
  }

  const addPasted = async () => {
    if (await addNames(namesFromText(paste))) setPaste('')
  }

  const addCsv = async (file: File | undefined) => {
    if (!file) return
    try {
      await addNames(await namesFromCsvFile(file))
    } catch {
      setError('파일을 읽지 못했어요. CSV 파일인지 확인해요.')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const move = (index: number, dir: -1 | 1) => {
    const next = [...students]
    const to = index + dir
    if (to < 0 || to >= next.length) return
    ;[next[index], next[to]] = [next[to], next[index]]
    setRoom({ ...room, students: next })
    void run(() => api.reorderStudents(id, key, next.map((s) => s.id)))
  }

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    if (await run(() => api.renameStudent(id, key, editing.id, editing.name))) setEditing(null)
  }

  const removeStudent = (s: Student) => {
    if (!confirm(`${s.name} 학생을 명단에서 지울까요?\n이 학생이 올린 작품도 함께 지워져요.`)) return
    void run(() => api.deleteStudent(id, key, s.id))
  }

  const pickPhoto = (studentId: string) => {
    photoFor.current = studentId
    photoRef.current?.click()
  }

  const addPhoto = async (file: File | undefined) => {
    if (photoRef.current) photoRef.current.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const path = await uploadRoomAsset(id, file)
      setRoom({ ...room, students: await api.setStudentImage(id, key, photoFor.current, path) })
    } catch {
      setError('그림을 올리지 못했어요. 사진이나 그림 파일인지 확인해요.')
    } finally {
      setBusy(false)
    }
  }

  const off = Array.isArray(room.settings.activitiesOff) ? (room.settings.activitiesOff as string[]) : []
  const toggleActivity = (aKey: string) => {
    const next = off.includes(aKey) ? off.filter((k) => k !== aKey) : [...off, aKey]
    void run(() => api.updateSettings(id, key, { ...room.settings, activitiesOff: next }))
  }

  const rename = async () => {
    const name = prompt('방 이름을 바꿔요', room.name)?.trim()
    if (!name || name === room.name) return
    if (await run(() => api.updateRoom(id, key, { name }))) myRooms.rename(id, name)
  }

  const removeRoom = async () => {
    const pin = prompt(`"${room.name}" 방을 지워요.\n명단과 작품, 감정 기록이 모두 지워지고 되돌릴 수 없어요.\n\n지우려면 방 관리 PIN 4자리를 넣어요.`)
    if (pin == null) return
    setBusy(true)
    setError('')
    try {
      // 방을 지운 뒤 작품 그림 파일도 치우려고 경로를 먼저 모아 둠
      const paths = (await api.getWorks(id).catch(() => [])).map((w) => w.image_path)
      const res = await api.deleteRoom(id, key, pin.trim())
      if (res === 'ok') {
        void removeWorkFiles(paths)
        void removeRoomAssets(room)
        myRooms.remove(id)
        navigate('/teacher')
      } else {
        setError(res === 'locked' ? 'PIN을 여러 번 틀렸어요. 5분 뒤에 다시 해 봐요.' : 'PIN이 맞지 않아요. 방을 지우지 않았어요.')
      }
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <p className={styles.crumb}><Link to="/teacher">← 내 방 목록</Link></p>

      <section className={`${styles.panel} ${styles.roomHead}`}>
        <div className={styles.roomInfo}>
          <h1>
            {room.name}
            <button type="button" className={styles.small} onClick={rename} disabled={busy}>이름 바꾸기</button>
          </h1>
          <p className={styles.muted}>학생은 QR을 찍거나, 첫 화면 [학생] 문에서 이 번호를 눌러 들어와요.</p>
          <p className={styles.bigCode} aria-label={`방 번호 ${room.code.split('').join(' ')}`}>{codeText}</p>
          <div className={styles.openRow}>
            <button
              type="button"
              role="switch"
              aria-checked={room.is_open}
              className={styles.switch}
              disabled={busy}
              onClick={() => run(() => api.updateRoom(id, key, { is_open: !room.is_open }))}
            >
              <span />
            </button>
            <div>
              <strong>{room.is_open ? '방이 열려 있어요' : '방이 닫혀 있어요'}</strong>
              <span className={styles.muted}>{room.is_open ? '학생이 들어올 수 있어요.' : '학생은 들어올 수 없어요.'}</span>
            </div>
          </div>
        </div>
        <div className={styles.qrBox}>
          {qr && <img src={qr} alt="입장 QR 코드" />}
          <button type="button" className="btn btn-yellow" onClick={() => setShowBig(true)}>크게 보여 주기</button>
          <Link to={`/gallery/${room.code}`} className="btn">전시방 열기</Link>
        </div>
      </section>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <section className={styles.panel}>
        <h2>학생 명단 <span className={styles.count}>{students.length}명</span></h2>
        <p className={styles.muted}>학생은 여기 적힌 이름 버튼을 눌러 들어와요. ＋를 눌러 사진이나 그림을 넣으면 이름 버튼에 같이 보여요.</p>
        <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => addPhoto(e.target.files?.[0])} />

        {students.length > 0 && (
          <ol className={styles.students}>
            {students.map((s, i) => (
              <li key={s.id}>
                <span className={styles.num}>{i + 1}</span>
                {editing?.id === s.id ? (
                  <form className={styles.editForm} onSubmit={saveEdit}>
                    <input autoFocus value={editing.name} maxLength={20} onChange={(e) => setEditing({ id: s.id, name: e.target.value })} />
                    <button type="submit" className={styles.small} disabled={busy}>저장</button>
                    <button type="button" className={styles.small} onClick={() => setEditing(null)}>취소</button>
                  </form>
                ) : (
                  <>
                    <button type="button" className={styles.photo} aria-label={`${s.name} 사진 넣기`} disabled={busy} onClick={() => pickPhoto(s.id)}>
                      {s.image_path ? <img src={assetUrl(s.image_path)} alt="" /> : '＋'}
                    </button>
                    <span className={styles.studentName}>{s.name}</span>
                    {s.image_path && (
                      <button type="button" className={styles.small} disabled={busy} onClick={() => run(() => api.setStudentImage(id, key, s.id, null))}>사진 빼기</button>
                    )}
                    <button type="button" className={styles.icon} aria-label={`${s.name} 위로`} disabled={busy || i === 0} onClick={() => move(i, -1)}>↑</button>
                    <button type="button" className={styles.icon} aria-label={`${s.name} 아래로`} disabled={busy || i === students.length - 1} onClick={() => move(i, 1)}>↓</button>
                    <button type="button" className={styles.small} disabled={busy} onClick={() => setEditing({ id: s.id, name: s.name })}>고치기</button>
                    <button type="button" className={`${styles.small} ${styles.danger}`} disabled={busy} onClick={() => removeStudent(s)}>지우기</button>
                  </>
                )}
              </li>
            ))}
          </ol>
        )}

        <form className={styles.addOne} onSubmit={addOne}>
          <input value={oneName} maxLength={20} placeholder="이름 한 명 넣기" aria-label="학생 이름" onChange={(e) => setOneName(e.target.value)} />
          <button type="submit" className="btn" disabled={busy}>넣기</button>
        </form>

        <div className={styles.bulk}>
          <div>
            <h3>여러 명 붙여넣기</h3>
            <textarea
              value={paste}
              rows={5}
              placeholder={'엑셀이나 한글에서 이름 칸을 복사해 붙여 넣어요.\n한 줄에 한 명씩이에요.'}
              onChange={(e) => setPaste(e.target.value)}
            />
            <button type="button" className="btn" disabled={busy || !paste.trim()} onClick={addPasted}>
              {namesFromText(paste).length > 0 ? `${namesFromText(paste).length}명 넣기` : '붙여넣은 이름 넣기'}
            </button>
          </div>
          <div>
            <h3>CSV 파일로 넣기</h3>
            <p className={styles.muted}>첫 번째 칸에 이름을 한 줄에 한 명씩 적은 파일이에요.</p>
            <input ref={fileRef} type="file" accept=".csv,text/csv,.txt" hidden onChange={(e) => addCsv(e.target.files?.[0])} />
            <button type="button" className="btn" disabled={busy} onClick={() => fileRef.current?.click()}>CSV 파일 고르기</button>
            <button type="button" className={styles.link} onClick={downloadSampleCsv}>예시 파일 내려받기</button>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>활동</h2>
        <p className={styles.muted}>이 방에서 학생에게 보여 줄 활동을 골라요.</p>
        <ul className={styles.activityList}>
          {[...ACTIVITIES.map((a) => ({ key: a.key, name: a.name, ready: !!a.Component })), { key: 'nametag', name: '이름표 붙이기', ready: true }].map((a) => (
            <li key={a.key}>
              <button
                type="button"
                role="switch"
                aria-checked={a.ready && !off.includes(a.key)}
                aria-label={a.name}
                className={styles.switch}
                disabled={busy || !a.ready}
                onClick={() => toggleActivity(a.key)}
              >
                <span />
              </button>
              <strong>{a.name}</strong>
              {!a.ready && <span className={styles.muted}>준비 중이에요</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>감정 목록</h2>
        <p className={styles.muted}>이름표 붙이기에 나오는 큰 감정과 낱말, 수직선 위치, 단계를 이 방에 맞게 고쳐요.</p>
        <Link to={`/teacher/room/${id}/emotions`} className="btn">감정 목록 고치기</Link>
      </section>

      <section className={styles.panel}>
        <h2>방 지우기</h2>
        <p className={styles.muted}>방을 지우면 명단, 작품, 감정 기록이 모두 지워져요. 지우기 전에 PIN을 한 번 더 물어봐요.</p>
        <button type="button" className={`btn ${styles.dangerBtn}`} disabled={busy} onClick={removeRoom}>이 방 지우기</button>
      </section>

      {showBig && (
        <div className={styles.big} role="dialog" aria-modal="true" aria-label="입장 안내">
          <button type="button" className={`btn ${styles.bigClose}`} onClick={() => setShowBig(false)}>닫기</button>
          <h2>{room.name}</h2>
          <div className={styles.bigBody}>
            {qr && <img src={qr} alt="입장 QR 코드" />}
            <div>
              <p>QR을 찍거나, 방 번호를 눌러요</p>
              <p className={styles.hugeCode}>{codeText}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
