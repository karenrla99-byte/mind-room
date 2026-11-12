import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, errorText, type Room, type Work } from '../../lib/api'
import { textOn } from '../../lib/emotionConfig'
import { myRooms } from '../../lib/myRooms'
import { speak } from '../../lib/tts'
import { activityLabel, canShare, downloadBlob, fetchBlob, notifyGallery, removeWorkFiles, shareBlob, watchGallery, workFilename, workUrl } from '../../lib/works'
import styles from './gallery.module.css'

type View = 'all' | 'emotion' | 'student' | 'activity'
const VIEWS: { key: View; label: string }[] = [
  { key: 'all', label: '모두' },
  { key: 'emotion', label: '감정별' },
  { key: 'student', label: '친구별' },
  { key: 'activity', label: '활동별' },
]
const SLIDE_MS = 6000

interface Section {
  key: string
  title: string
  color?: string
  works: Work[]
}

function Meter({ work }: { work: Work }) {
  if (work.intensity == null) return null
  return (
    <span className={styles.meter} aria-label={`감정 크기 5 가운데 ${work.intensity}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} style={n <= work.intensity! ? { background: work.color ?? '#3A2E2A' } : undefined} />
      ))}
    </span>
  )
}

const say = (w: Work) => [w.student_name, w.reason, w.word ?? w.group_name].filter(Boolean).join('. ')

/** 전시방: 방의 작품이 실시간으로 모이는 갤러리 */
export default function Gallery() {
  const { code = '' } = useParams()
  const [room, setRoom] = useState<Room | null | undefined>(undefined)
  const [works, setWorks] = useState<Work[]>([])
  const [view, setView] = useState<View>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [fresh, setFresh] = useState<Set<string>>(new Set())

  const teacherKey = room ? myRooms.get(room.id)?.key : undefined
  const roomId = room?.id

  useEffect(() => {
    let alive = true
    api.getRoomByCode(code).then((r) => alive && setRoom(r), () => alive && setRoom(null))
    return () => {
      alive = false
    }
  }, [code])

  const reload = useCallback(async () => {
    if (!roomId) return
    try {
      const next = await api.getWorks(roomId)
      setWorks((prev) => {
        if (prev.length) {
          const old = new Set(prev.map((w) => w.id))
          const added = next.filter((w) => !old.has(w.id)).map((w) => w.id)
          if (added.length) {
            setFresh(new Set(added))
            setTimeout(() => setFresh(new Set()), 2500)
          }
        }
        return next
      })
    } catch {
      // 잠시 뒤 다시 불러옴
    }
  }, [roomId])

  // 처음 한 번 + 실시간 알림 + 30초마다 (알림을 놓쳤을 때를 위해)
  useEffect(() => {
    if (!roomId) return
    void reload()
    const stop = watchGallery(roomId, () => void reload())
    const timer = setInterval(() => void reload(), 30000)
    return () => {
      stop()
      clearInterval(timer)
    }
  }, [roomId, reload])

  const sections = useMemo<Section[]>(() => {
    if (view === 'all') return [{ key: 'all', title: '', works }]
    const map = new Map<string, Section>()
    for (const w of works) {
      const key = (view === 'emotion' ? w.group_key : view === 'student' ? w.student_id : w.activity) ?? '-'
      const title = (view === 'emotion' ? w.group_name : view === 'student' ? w.student_name : activityLabel(w.activity)) ?? '이름 없음'
      if (!map.has(key)) map.set(key, { key, title, color: view === 'emotion' ? undefined : undefined, works: [] })
      map.get(key)!.works.push(w)
    }
    const list = [...map.values()]
    if (view === 'emotion') {
      // 색 띠는 그 묶음에서 가장 진한 색으로
      for (const s of list) s.color = [...s.works].sort((a, b) => (b.intensity ?? 5) - (a.intensity ?? 5))[0]?.color ?? undefined
    }
    if (view === 'student' && room) {
      const order = room.students.map((s) => s.id)
      list.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
    }
    return list
  }, [works, view, room])

  // 크게 보기·슬라이드쇼는 화면에 보이는 순서대로
  const ordered = useMemo(() => sections.flatMap((s) => s.works), [sections])
  const openIndex = openId ? ordered.findIndex((w) => w.id === openId) : -1
  const open = openIndex >= 0 ? ordered[openIndex] : null

  const go = useCallback(
    (dir: 1 | -1) => {
      if (!ordered.length) return
      const next = ordered[(openIndex + dir + ordered.length) % ordered.length]
      setOpenId(next.id)
    },
    [ordered, openIndex],
  )

  useEffect(() => {
    if (open) speak(say(open))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.id])

  useEffect(() => {
    if (!playing || !open) return
    const t = setTimeout(() => go(1), SLIDE_MS)
    return () => clearTimeout(t)
  }, [playing, open, go])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const close = () => {
    setOpenId(null)
    setPlaying(false)
  }

  const startShow = () => {
    if (!ordered.length) return
    setOpenId(ordered[0].id)
    setPlaying(true)
  }

  const remove = async (ids: string[]) => {
    if (!room || !teacherKey || ids.length === 0) return
    if (!confirm(ids.length === 1 ? '이 작품을 지울까요?\n지우면 되돌릴 수 없어요.' : `작품 ${ids.length}개를 지울까요?\n지우면 되돌릴 수 없어요.`)) return
    setError('')
    try {
      const paths = await api.deleteWorks(room.id, teacherKey, ids)
      setWorks((prev) => prev.filter((w) => !ids.includes(w.id)))
      setPicked(new Set())
      setPicking(false)
      close()
      void removeWorkFiles(paths)
      void notifyGallery(room.id)
    } catch (e) {
      setError(errorText(e))
    }
  }

  const togglePick = (id: string) => {
    const next = new Set(picked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPicked(next)
  }

  const save = async (w: Work, share: boolean) => {
    try {
      const blob = await fetchBlob(workUrl(w.image_path))
      const name = workFilename([w.student_name, w.word ?? w.group_name])
      if (share) await shareBlob(blob, name, '마음방')
      else downloadBlob(blob, name)
    } catch {
      setError('그림을 저장하지 못했어요. 다시 해 봐요.')
    }
  }

  if (room === undefined) return <div className={styles.page}><p className={styles.empty}>전시방을 열고 있어요…</p></div>
  if (room === null) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>전시방을 찾지 못했어요.</p>
        <Link to="/join" className="btn btn-yellow">번호 다시 누르기</Link>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1>{room.name} <span>전시방</span></h1>
        <p className={styles.count}>작품 {works.length}개</p>
      </header>

      <div className={styles.bar}>
        <div className={styles.views} role="tablist" aria-label="보기">
          {VIEWS.map((v) => (
            <button key={v.key} type="button" role="tab" aria-selected={view === v.key} onClick={() => setView(v.key)}>
              {v.label}
            </button>
          ))}
        </div>
        <span className={styles.grow} />
        <button type="button" className={styles.tool} onClick={startShow} disabled={!works.length}>▶ 차례로 보기</button>
        {teacherKey && !picking && (
          <button type="button" className={styles.tool} onClick={() => setPicking(true)} disabled={!works.length}>골라서 지우기</button>
        )}
        {picking && (
          <>
            <button type="button" className={`${styles.tool} ${styles.danger}`} disabled={!picked.size} onClick={() => remove([...picked])}>
              {picked.size}개 지우기
            </button>
            <button type="button" className={styles.tool} onClick={() => { setPicking(false); setPicked(new Set()) }}>그만하기</button>
          </>
        )}
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      {works.length === 0 ? (
        <div className={styles.emptyBox}>
          <img src="/assets/words/surprise_1.png" alt="" />
          <p className={styles.empty}>아직 작품이 없어요. 친구들이 올리면 여기에 나타나요.</p>
        </div>
      ) : (
        sections.map((s) => (
          <section key={s.key} className={styles.section}>
            {s.title && (
              <h2 className={styles.band} style={s.color ? { background: s.color, color: textOn(s.color) } : undefined}>
                {s.title} <span>{s.works.length}</span>
              </h2>
            )}
            <ul className={styles.grid}>
              {s.works.map((w) => {
                const on = picked.has(w.id)
                return (
                  <li key={w.id}>
                    <button
                      type="button"
                      className={`${styles.card} ${fresh.has(w.id) ? styles.fresh : ''} ${on ? styles.picked : ''}`}
                      aria-pressed={picking ? on : undefined}
                      onClick={() => (picking ? togglePick(w.id) : setOpenId(w.id))}
                    >
                      <img src={workUrl(w.image_path)} alt="" loading="lazy" />
                      <span className={styles.name}>{w.student_name ?? ''}</span>
                      <span className={styles.word} style={w.color ? { background: w.color, color: textOn(w.color) } : undefined}>
                        {w.word ?? w.group_name ?? activityLabel(w.activity)}
                      </span>
                      <Meter work={w} />
                      {w.reason && <span className={styles.reason}>{w.reason} {w.word}</span>}
                      {picking && <span className={styles.check} aria-hidden="true">{on ? '✓' : ''}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}

      {open && (
        <div className={styles.light} role="dialog" aria-modal="true" aria-label="크게 보기">
          <div className={styles.lightTop}>
            <button type="button" className="btn" onClick={() => setPlaying(!playing)}>{playing ? '❚❚ 멈추기' : '▶ 차례로 보기'}</button>
            <span className={styles.grow} />
            <span className={styles.pos}>{openIndex + 1} / {ordered.length}</span>
            <button type="button" className="btn" onClick={close}>닫기</button>
          </div>
          <div className={styles.lightBody}>
            <button type="button" className={styles.arrow} aria-label="앞 작품" onClick={() => { setPlaying(false); go(-1) }}>‹</button>
            <figure key={open.id} className={styles.figure}>
              <img src={workUrl(open.image_path)} alt="" />
              <figcaption>
                <span className={styles.bigName}>{open.student_name}</span>
                <span className={styles.bigWord} style={open.color ? { background: open.color, color: textOn(open.color) } : undefined}>
                  {open.word ?? open.group_name ?? activityLabel(open.activity)}
                </span>
                <Meter work={open} />
                {open.reason && <span className={styles.bigReason}>{open.reason} {open.word}</span>}
              </figcaption>
            </figure>
            <button type="button" className={styles.arrow} aria-label="다음 작품" onClick={() => { setPlaying(false); go(1) }}>›</button>
          </div>
          <div className={styles.lightBottom}>
            <button type="button" className="btn" onClick={() => speak(say(open), { force: true })}>읽어 줘요</button>
            <button type="button" className="btn" onClick={() => save(open, false)}>사진으로 저장</button>
            {canShare() && <button type="button" className="btn" onClick={() => save(open, true)}>보내기</button>}
            {teacherKey && <button type="button" className={`btn ${styles.dangerBtn}`} onClick={() => remove([open.id])}>지우기</button>}
          </div>
        </div>
      )}
    </div>
  )
}
