import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import WordPicture from '../../components/nametag/WordPicture'
import { api, errorText, type Room } from '../../lib/api'
import {
  defaultConfig,
  newId,
  readSettings,
  shade,
  type ConfigGroup,
  type ConfigWord,
  type EmotionConfig,
  type NamingLevel,
} from '../../lib/emotionConfig'
import { myRooms } from '../../lib/myRooms'
import { assetUrl, uploadRoomAsset } from '../../lib/works'
import styles from './teacher.module.css'

const LEVELS: { value: NamingLevel; label: string; text: string }[] = [
  { value: 1, label: '큰 감정만', text: '7가지 큰 감정 가운데 하나만 골라요.' },
  { value: 2, label: '큰 감정 + 크기', text: '큰 감정을 고른 뒤 수직선에서 낱말과 크기를 골라요.' },
  { value: 3, label: '전체', text: '낱말을 고른 뒤 "왜 그럴까?" 문장까지 만들어요. (넘어갈 수 있어요)' },
]

/** 선생님: 방의 감정 목록 고치기 */
export default function EmotionEdit() {
  const { id = '' } = useParams()
  const key = myRooms.get(id)?.key ?? ''
  const [room, setRoom] = useState<Room | null>(null)
  const [config, setConfig] = useState<EmotionConfig | null>(null)
  const [level, setLevel] = useState<NamingLevel>(3)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const picRef = useRef<HTMLInputElement>(null)
  const picFor = useRef('')

  useEffect(() => {
    if (!key) return
    let alive = true
    api
      .teacherGetRoom(id, key)
      .then((r) => {
        if (!alive) return
        const s = readSettings(r.settings)
        setRoom(r)
        setConfig(s.config)
        setLevel(s.level)
      })
      .catch((e) => alive && setError(errorText(e)))
    return () => {
      alive = false
    }
  }, [id, key])

  if (!key) {
    return (
      <div className={styles.page}>
        <section className={styles.panel}>
          <h2>이 기기에는 이 방의 열쇠가 없어요</h2>
          <Link to="/teacher" className="btn btn-yellow">선생님 방으로 가요</Link>
        </section>
      </div>
    )
  }
  if (!room || !config) {
    return <div className={styles.page}><p className={error ? styles.error : styles.muted}>{error || '감정 목록을 여는 중이에요…'}</p></div>
  }

  const change = (next: EmotionConfig) => {
    setConfig(next)
    setDirty(true)
    setMessage('')
  }
  const patchGroup = (gKey: string, patch: Partial<ConfigGroup>) =>
    change({ ...config, groups: config.groups.map((g) => (g.key === gKey ? { ...g, ...patch } : g)) })
  const patchWord = (wId: string, patch: Partial<ConfigWord>) =>
    change({ ...config, words: config.words.map((w) => (w.id === wId ? { ...w, ...patch } : w)) })
  const removeWord = (wId: string) => change({ ...config, words: config.words.filter((w) => w.id !== wId) })
  const addWord = (gKey: string) =>
    change({ ...config, words: [...config.words, { id: newId(), group: gKey, word: '', intensity: 3, image: null }] })
  /** 같은 묶음 안에서 순서 바꾸기 (같은 수직선 칸에 여럿일 때 보이는 순서) */
  const moveWord = (wId: string, dir: -1 | 1) => {
    const w = config.words.find((x) => x.id === wId)!
    const same = config.words.filter((x) => x.group === w.group)
    const other = same[same.indexOf(w) + dir]
    if (!other) return
    const words = [...config.words]
    const a = words.indexOf(w)
    const b = words.indexOf(other)
    ;[words[a], words[b]] = [words[b], words[a]]
    change({ ...config, words })
  }

  const pickPicture = (wId: string) => {
    picFor.current = wId
    picRef.current?.click()
  }
  const addPicture = async (file: File | undefined) => {
    if (picRef.current) picRef.current.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    try {
      patchWord(picFor.current, { image: assetUrl(await uploadRoomAsset(id, file)), emoji: undefined })
    } catch {
      setError('그림을 올리지 못했어요. 사진이나 그림 파일인지 확인해요.')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    if (!confirm('감정 목록을 처음 기본값으로 되돌릴까요?\n[저장]을 눌러야 방에 적용돼요.')) return
    change(defaultConfig())
  }

  const save = async () => {
    const cleaned: EmotionConfig = {
      groups: config.groups.map((g) => ({ ...g, name: g.name.trim() })),
      words: config.words.map((w) => ({ ...w, word: w.word.trim() })).filter((w) => w.word),
    }
    if (cleaned.groups.some((g) => !g.name)) return setError('큰 감정 이름이 빈 곳이 있어요.')
    if (!cleaned.groups.some((g) => g.enabled)) return setError('큰 감정을 하나는 켜 두어요.')
    setBusy(true)
    setError('')
    try {
      const r = await api.updateSettings(id, key, { ...room.settings, emotions: cleaned, namingLevel: level })
      setRoom(r)
      setConfig(cleaned)
      setDirty(false)
      setMessage('저장했어요. 학생 화면에 바로 적용돼요.')
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <p className={styles.crumb}><Link to={`/teacher/room/${id}`}>← {room.name}</Link></p>
      <h1 className={styles.pageTitle}>감정 목록 고치기</h1>

      <section className={styles.panel}>
        <h2>이름표 붙이기 단계</h2>
        <div className={styles.levels} role="radiogroup" aria-label="이름표 붙이기 단계">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              type="button"
              role="radio"
              aria-checked={level === l.value}
              className={styles.levelBtn}
              onClick={() => { setLevel(l.value); setDirty(true); setMessage('') }}
            >
              <strong>{l.label}</strong>
              <span>{l.text}</span>
            </button>
          ))}
        </div>
      </section>

      <p className={styles.muted}>낱말 왼쪽 그림을 누르면 직접 그린 그림으로 바꿀 수 있어요. 다 고치면 아래 [저장]을 눌러요.</p>

      {config.groups.map((g) => {
        const words = config.words.filter((w) => w.group === g.key)
        return (
          <section key={g.key} className={`${styles.panel} ${g.enabled ? '' : styles.off}`} style={{ borderTopColor: g.color, borderTopWidth: 12 }}>
            <div className={styles.groupHead}>
              <WordPicture image={g.image} color={g.color} className={styles.groupPic} />
              <input value={g.name} maxLength={10} aria-label="큰 감정 이름" onChange={(e) => patchGroup(g.key, { name: e.target.value })} />
              <label className={styles.colorPick}>
                색
                <input type="color" value={g.color} onChange={(e) => patchGroup(g.key, { color: e.target.value.toUpperCase() })} />
              </label>
              <label className={styles.check}>
                <input type="checkbox" checked={g.enabled} onChange={(e) => patchGroup(g.key, { enabled: e.target.checked })} />
                사용해요
              </label>
            </div>

            <ul className={styles.wordRows}>
              {words.map((w, i) => (
                <li key={w.id}>
                  <button type="button" className={styles.picBtn} aria-label={`${w.word || '낱말'} 그림 바꾸기`} title="그림 바꾸기" disabled={busy} onClick={() => pickPicture(w.id)}>
                    <WordPicture image={w.image} emoji={w.emoji} color={shade(g.color, w.intensity)} className={styles.wordPic} />
                  </button>
                  <input className={styles.wordName} value={w.word} maxLength={12} placeholder="낱말 (~해요)" aria-label="감정 낱말" onChange={(e) => patchWord(w.id, { word: e.target.value })} />
                  {!w.image && (
                    <input className={styles.emoji} value={w.emoji ?? ''} maxLength={4} placeholder="🙂" aria-label="이모지" onChange={(e) => patchWord(w.id, { emoji: e.target.value || undefined })} />
                  )}
                  <div className={styles.sizePick} role="radiogroup" aria-label={`${w.word || '낱말'} 수직선 위치`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={w.intensity === n}
                        style={{ background: w.intensity === n ? shade(g.color, n) : undefined }}
                        onClick={() => patchWord(w.id, { intensity: n })}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <select value={w.group} aria-label="묶음 옮기기" onChange={(e) => patchWord(w.id, { group: e.target.value })}>
                    {config.groups.map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}
                  </select>
                  <button type="button" className={styles.icon} aria-label="위로" disabled={i === 0} onClick={() => moveWord(w.id, -1)}>↑</button>
                  <button type="button" className={styles.icon} aria-label="아래로" disabled={i === words.length - 1} onClick={() => moveWord(w.id, 1)}>↓</button>
                  <button type="button" className={`${styles.small} ${styles.danger}`} onClick={() => removeWord(w.id)}>지우기</button>
                </li>
              ))}
            </ul>
            <button type="button" className={styles.small} onClick={() => addWord(g.key)}>＋ 낱말 넣기</button>
          </section>
        )
      })}

      <input ref={picRef} type="file" accept="image/*" hidden onChange={(e) => addPicture(e.target.files?.[0])} />
      <div className={styles.saveBar}>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {message && <p className={styles.ok} role="status">{message}</p>}
        <button type="button" className="btn" disabled={busy} onClick={reset}>기본값으로 되돌리기</button>
        <button type="button" className="btn btn-yellow" disabled={busy || !dirty} onClick={save}>저장</button>
      </div>
    </div>
  )
}
