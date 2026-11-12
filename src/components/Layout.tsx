import { Link, Outlet, useLocation } from 'react-router-dom'
import { useFullscreen } from '../lib/useFullscreen'
import styles from './Layout.module.css'

const INSTAGRAM = 'https://www.instagram.com/special_eun_t/'

export default function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const fs = useFullscreen()

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <button
          type="button"
          className={styles.round}
          onClick={fs.toggle}
          aria-label={fs.on ? '전체화면 끄기' : '전체화면으로 보기'}
          title={fs.on ? '전체화면 끄기' : '전체화면'}
          hidden={!fs.supported}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {fs.on ? (
              <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
            ) : (
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            )}
          </svg>
        </button>

        {!isHome && (
          <Link to="/" className={styles.home} aria-label="처음으로">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 11.5 12 4l8 7.5M6.5 10v9.5h11V10" />
            </svg>
            <span>처음으로</span>
          </Link>
        )}

        <span className={styles.spacer} />

        <Link to="/keys" className={styles.round} aria-label="열쇠방 (선생님 설정)" title="열쇠방 (선생님)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="8" cy="12" r="4" />
            <path d="M12 12h9M18 12v3.5M15 12v2.5" />
          </svg>
        </Link>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.foot}>
        © 2026 특수교사 은티 ·{' '}
        {isHome ? (
          <a href={INSTAGRAM} target="_blank" rel="noreferrer">
            @special_eun_t
          </a>
        ) : (
          '@special_eun_t'
        )}
      </footer>
    </div>
  )
}
