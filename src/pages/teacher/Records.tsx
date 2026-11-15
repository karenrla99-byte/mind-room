import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, errorText, type Room, type Work } from '../../lib/api'
import { textOn } from '../../lib/emotionConfig'
import { myRooms } from '../../lib/myRooms'
import { byDay, byEmotion, dayKey, dayLabel, downloadCsv, downloadZip, PERIODS, periodStart, shortDay, timeLabel, type Period } from '../../lib/records'
import { activityLabel, workUrl } from '../../lib/works'
import base from './teacher.module.css'
import styles from './records.module.css'

type Tab = 'student' | 'day' | 'flow'
type PrintMode = null | 'students' | 'summary' | 'collage'
const TABS: { key: Tab; label: string }[] = [
  { key: 'student', label: '학생별' },
  { key: 'day', label: '날짜별' },
  { key: 'flow', label: '흐름 보기' },
]

function Meter({ work }: { work: Work }) {
  if (work.intensity == null) return null
  return (
    <span className={styles.meter} aria-label={`크기 ${work.intensity}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} style={n <= work.intensity! ? { background: work.color ?? '#3A2E2A' } : undefined} />
      ))}
    </span>
  )
}

const Chip = ({ work }: { work: Work }) => (
  <span className={styles.chip} style={work.color ? { background: work.color, color: textOn(work.color) } : undefined}>
    {work.word ?? work.group_name ?? activityLabel(work.activity)}
  </span>
)

/** 한 학생의 기록 줄들 (화면과 인쇄에 같이 씀) */
function RecordRows({ works, thumbs }: { works: Work[]; thumbs: boolean }) {
  return (
    <ul className={styles.rows}>
      {works.map((w) => (
        <li key={w.id}>
          <span className={styles.when}>{dayLabel(dayKey(w.created_at))} {timeLabel(w.created_at)}</span>
          {thumbs && <img src={workUrl(w.image_path)} alt="" loading="lazy" />}
          <span className={styles.group} style={{ borderColor: w.color ?? '#B7BCC2' }}>{w.group_name ?? '-'}</span>
          <Chip work={w} />
          <Meter work={w} />
          <span className={styles.act}>{activityLabel(w.activity)}</span>
          {w.reason && <span className={styles.reason}>{w.reason} {w.word}</span>}
        </li>
      ))}
    </ul>
  )
}

/** 감정 크기 흐름: 기록마다 막대 하나(높이 = 크기, 색 = 감정), 위로 꺾은선 */
function FlowChart({ works }: { works: Work[] }) {
  const list = works.filter((w) => w.intensity != null)
  if (list.length === 0) return <p className={base.muted}>감정 크기를 고른 기록이 아직 없어요.</p>
  const W = Math.max(520, list.length * 56 + 70)
  const H = 300
  const left = 44
  const bottom = 56
  const top = 16
  const step = (W - left - 16) / list.length
  const y = (n: number) => top + ((5 - n) / 4.6) * (H - top - bottom)
  const x = (i: number) => left + step * i + step / 2
  let lastDay = ''
  return (
    <div className={styles.chartWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, maxWidth: 'none' }} role="img" aria-label="감정 크기 흐름 그래프">
        {[1, 2, 3, 4, 5].map((n) => (
          <g key={n}>
            <line x1={left} x2={W - 8} y1={y(n)} y2={y(n)} className={styles.grid} />
            <text x={left - 10} y={y(n) + 5} textAnchor="end" className={styles.axis}>{n}</text>
          </g>
        ))}
        {list.map((w, i) => {
          const day = dayKey(w.created_at)
          const showDay = day !== lastDay
          lastDay = day
          const h = H - bottom - y(w.intensity!)
          return (
            <g key={w.id}>
              <rect x={x(i) - step * 0.32} y={y(w.intensity!)} width={step * 0.64} height={h} rx={8} fill={w.color ?? '#B7BCC2'} className={styles.flowBar}>
                <title>{`${dayLabel(day)} ${timeLabel(w.created_at)} · ${w.group_name ?? ''} · ${w.word ?? ''} (${w.intensity})`}</title>
              </rect>
              <text x={x(i)} y={H - bottom + 18} textAnchor="middle" className={styles.wordLabel}>{(w.word ?? '').replace(/요$/, '').slice(0, 5)}</text>
              {showDay && <text x={x(i) - step * 0.32} y={H - 10} className={styles.axis}>{shortDay(day)}</text>}
            </g>
          )
        })}
        <polyline className={styles.line} points={list.map((w, i) => `${x(i)},${y(w.intensity!)}`).join(' ')} />
        {list.map((w, i) => <circle key={w.id} cx={x(i)} cy={y(w.intensity!)} r={5} className={styles.dot} />)}
      </svg>
    </div>
  )
}

/** 큰 감정별 개수 띠 */
function EmotionBar({ works }: { works: Work[] }) {
  const buckets = byEmotion(works)
  return (
    <div className={styles.stack} role="img" aria-label={buckets.map((b) => `${b.title} ${b.items.length}`).join(', ')}>
      {buckets.map((b) => (
        <span key={b.key} style={{ flexGrow: b.items.length, background: b.color, color: textOn(b.color ?? '#B7BCC2') }}>
          {b.title} {b.items.length}
        </span>
      ))}
    </div>
  )
}

/** 기록방: 학생들이 올린 감정 이름·크기를 모아 보는 선생님 화면 */
export default function Records() {
  const { id = '' } = useParams()
  const key = myRooms.get(id)?.key ?? ''
  const [room, setRoom] = useState<Room | null>(null)
  const [works, setWorks] = useState<Work[] | null>(null)
  const [period, setPeriod] = useState<Period>('all')
  const [tab, setTab] = useState<Tab>('student')
  const [flowStudent, setFlowStudent] = useState('')
  const [error, setError] = useState('')
  const [zip, setZip] = useState('')
  const [printMode, setPrintMode] = useState<PrintMode>(null)
  const [perPage, setPerPage] = useState(6)

  useEffect(() => {
    if (!key) return
    let alive = true
    api.teacherGetRoom(id, key).then((r) => alive && setRoom(r), (e) => alive && setError(errorText(e)))
    return () => {
      alive = false
    }
  }, [id, key])

  useEffect(() => {
    if (!key) return
    let alive = true
    setWorks(null)
    api
      .teacherGetRecords(id, key, periodStart(period)?.toISOString() ?? null, null)
      .then((w) => alive && setWorks(w), (e) => alive && setError(errorText(e)))
    return () => {
      alive = false
    }
  }, [id, key, period])

  /** 명단 순서대로 학생별 묶음 (명단에서 지워진 학생의 기록은 함께 지워져서 없음) */
  const students = useMemo(() => {
    if (!room || !works) return []
    return room.students.map((s) => ({ ...s, works: works.filter((w) => w.student_id === s.id) }))
  }, [room, works])
  const days = useMemo(() => byDay(works ?? []), [works])
  const flowId = flowStudent || students.find((s) => s.works.length)?.id || ''
  const flow = students.find((s) => s.id === flowId)

  // 인쇄: 인쇄용 화면을 그린 뒤 그림이 다 뜨면 인쇄창 열기
  useEffect(() => {
    if (!printMode) return
    let alive = true
    const done = () => alive && setPrintMode(null)
    window.addEventListener('afterprint', done)
    const started = Date.now()
    const wait = () => {
      if (!alive) return
      const imgs = [...document.querySelectorAll<HTMLImageElement>('[data-print] img')]
      if (imgs.every((i) => i.complete) || Date.now() - started > 8000) window.print()
      else setTimeout(wait, 150)
    }
    setTimeout(wait, 100)
    return () => {
      alive = false
      window.removeEventListener('afterprint', done)
    }
  }, [printMode])

  if (!key) {
    return (
      <div className={base.page}>
        <section className={base.panel}>
          <h2>이 기기에는 이 방의 열쇠가 없어요</h2>
          <Link to="/teacher" className="btn btn-yellow">선생님 방으로 가요</Link>
        </section>
      </div>
    )
  }
  if (!room || !works) return <div className={base.page}><p className={error ? base.error : base.muted}>{error || '기록을 모으는 중이에요…'}</p></div>

  const periodLabel = PERIODS.find((p) => p.key === period)!.label
  const runZip = async (list: Work[], name: string) => {
    if (!list.length || zip) return
    setZip('준비하고 있어요…')
    try {
      const n = await downloadZip(list, name, (done, total) => setZip(`그림을 모으고 있어요… ${done} / ${total}`))
      setZip(`그림 ${n}개를 내려받았어요.`)
    } catch {
      setZip('ZIP 파일을 만들지 못했어요.')
    }
    setTimeout(() => setZip(''), 4000)
  }

  return (
    <>
      <div className={`${base.page} ${styles.wide} no-print`}>
        <p className={base.crumb}><Link to={`/teacher/room/${id}`}>← {room.name}</Link></p>
        <h1 className={base.pageTitle}>기록방</h1>

        <section className={base.panel}>
          <div className={styles.bar}>
            <div className={styles.seg} role="radiogroup" aria-label="기간">
              {PERIODS.map((p) => (
                <button key={p.key} type="button" role="radio" aria-checked={period === p.key} onClick={() => setPeriod(p.key)}>{p.label}</button>
              ))}
            </div>
            <span className={styles.total}>기록 {works.length}개</span>
          </div>
          {works.length > 0 && <EmotionBar works={works} />}
          <div className={styles.tools}>
            <button type="button" className={base.small} disabled={!works.length} onClick={() => setPrintMode('students')}>학생별 기록지 인쇄</button>
            <button type="button" className={base.small} disabled={!works.length} onClick={() => setPrintMode('summary')}>반 전체 요약 인쇄</button>
            <button type="button" className={base.small} disabled={!works.length} onClick={() => downloadCsv(works, room.name)}>CSV 내려받기</button>
            <button type="button" className={base.small} disabled={!works.length || !!zip} onClick={() => runZip(works, `${room.name}_${periodLabel}`)}>작품 모두 ZIP</button>
            <span className={styles.collage}>
              <button type="button" className={base.small} disabled={!works.length} onClick={() => setPrintMode('collage')}>감정별 작품 모음 인쇄</button>
              <select value={perPage} aria-label="한 장에 몇 개" onChange={(e) => setPerPage(Number(e.target.value))}>
                <option value={4}>한 장에 4개</option>
                <option value={6}>한 장에 6개</option>
                <option value={9}>한 장에 9개</option>
              </select>
            </span>
          </div>
          {zip && <p className={base.ok} role="status">{zip}</p>}
          {error && <p className={base.error} role="alert">{error}</p>}
        </section>

        <div className={styles.seg} role="tablist" aria-label="보기">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>

        {works.length === 0 && <p className={base.muted}>이 기간에는 기록이 없어요.</p>}

        {tab === 'student' && students.filter((s) => s.works.length).map((s) => (
          <section key={s.id} className={base.panel}>
            <div className={styles.head}>
              <h2>{s.name} <span className={base.count}>{s.works.length}개</span></h2>
              <button type="button" className={base.small} disabled={!!zip} onClick={() => runZip(s.works, `${room.name}_${s.name}`)}>이 학생 작품 ZIP</button>
            </div>
            <EmotionBar works={s.works} />
            <RecordRows works={[...s.works].reverse()} thumbs />
          </section>
        ))}

        {tab === 'day' && days.map((d) => (
          <section key={d.key} className={base.panel}>
            <h2>{d.title} <span className={base.count}>{d.items.length}개</span></h2>
            <EmotionBar works={d.items} />
            <div className={styles.dayGroups}>
              {byEmotion(d.items).map((g) => (
                <div key={g.key} className={styles.dayGroup} style={{ borderColor: g.color }}>
                  <strong>{g.title}</strong>
                  {g.items.map((w) => (
                    <span key={w.id} className={styles.person}>{w.student_name} <Chip work={w} /> <Meter work={w} /></span>
                  ))}
                </div>
              ))}
            </div>
          </section>
        ))}

        {tab === 'flow' && works.length > 0 && (
          <section className={base.panel}>
            <div className={styles.head}>
              <h2>감정 크기 흐름</h2>
              <select value={flowId} aria-label="학생 고르기" onChange={(e) => setFlowStudent(e.target.value)}>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.works.length})</option>)}
              </select>
            </div>
            <p className={base.muted}>막대 하나가 기록 하나예요. 높이는 감정 크기(1~5), 색은 큰 감정이에요.</p>
            {flow && <FlowChart works={flow.works} />}
            {flow && flow.works.length > 0 && <EmotionBar works={flow.works} />}
          </section>
        )}
      </div>

      {/* ───────── 인쇄용 (화면에는 안 보임) ───────── */}
      {printMode === 'students' && (
        <div data-print className={styles.print}>
          {students.filter((s) => s.works.length).map((s) => (
            <article key={s.id} className={styles.sheet}>
              <header>
                <h1>{s.name} · 감정 기록지</h1>
                <p>{room.name} · {periodLabel} · 기록 {s.works.length}개</p>
              </header>
              <EmotionBar works={s.works} />
              <FlowChart works={s.works} />
              <RecordRows works={s.works} thumbs />
              <footer>© 2026 특수교사 은티 · @special_eun_t</footer>
            </article>
          ))}
        </div>
      )}

      {printMode === 'summary' && (
        <div data-print className={styles.print}>
          <article className={styles.sheet}>
            <header>
              <h1>{room.name} · 반 전체 감정 요약</h1>
              <p>{periodLabel} · 기록 {works.length}개 · 학생 {students.filter((s) => s.works.length).length}명</p>
            </header>
            <EmotionBar works={works} />
            <table className={styles.table}>
              <thead>
                <tr><th>학생</th><th>기록</th><th>큰 감정</th><th>가장 많이 고른 낱말</th><th>평균 크기</th></tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const sized = s.works.filter((w) => w.intensity != null)
                  const words = new Map<string, number>()
                  for (const w of s.works) if (w.word) words.set(w.word, (words.get(w.word) ?? 0) + 1)
                  const top = [...words.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([w, n]) => `${w}(${n})`).join(', ')
                  return (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.works.length}</td>
                      <td>{s.works.length ? <EmotionBar works={s.works} /> : '-'}</td>
                      <td>{top || '-'}</td>
                      <td>{sized.length ? (sized.reduce((a, w) => a + w.intensity!, 0) / sized.length).toFixed(1) : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <footer>© 2026 특수교사 은티 · @special_eun_t</footer>
          </article>
        </div>
      )}

      {printMode === 'collage' && (
        <div data-print className={styles.print}>
          {byEmotion(works).flatMap((g) =>
            Array.from({ length: Math.ceil(g.items.length / perPage) }, (_, page) => (
              <article key={`${g.key}-${page}`} className={styles.sheet}>
                <header>
                  <h1><span className={styles.chip} style={{ background: g.color, color: textOn(g.color ?? '#B7BCC2') }}>{g.title}</span> 작품 모음</h1>
                  <p>{room.name} · {periodLabel}</p>
                </header>
                <div className={`${styles.collageGrid} ${styles[`per${perPage}`]}`}>
                  {g.items.slice(page * perPage, (page + 1) * perPage).map((w) => (
                    <figure key={w.id}>
                      <img src={workUrl(w.image_path)} alt="" />
                      <figcaption>{w.student_name} · {w.word ?? w.group_name} <Meter work={w} /></figcaption>
                    </figure>
                  ))}
                </div>
                <footer>© 2026 특수교사 은티 · @special_eun_t</footer>
              </article>
            )),
          )}
        </div>
      )}
    </>
  )
}
