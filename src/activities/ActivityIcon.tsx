/** 활동 그림 (전용 그림이 없어서 선으로 그린 아이콘) */
export default function ActivityIcon({ name }: { name: string }) {
  const common = { fill: 'none', stroke: '#3A2E2A', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...common}>
      {name === 'draw' && (
        <>
          <path d="M8 40c6-10 2-14 8-14s3 9 9 9 5-12 14-13" stroke="#4D96FF" strokeWidth="3.4" />
          <path d="M30 8 40 18 22 36l-11 2 1-12z" fill="#F9C74F" />
          <path d="M26 12 36 22" />
        </>
      )}
      {name === 'face' && (
        <>
          <circle cx="24" cy="24" r="17" fill="#fff" />
          <path d="M16 21q2.500-3 5 0M27 21q2.500-3 5 0M16 29q8 7 16 0" />
        </>
      )}
      {name === 'color' && (
        <>
          <path d="M24 6c8 10 12 16 12 22a12 12 0 0 1-24 0c0-6 4-12 12-22z" fill="#E5484D" />
          <path d="M18 29a6 6 0 0 0 5 5" stroke="#fff" />
        </>
      )}
      {name === 'shape' && (
        <>
          <path d="M24 5l5 12 13 1-10 9 3 13-11-7-11 7 3-13L6 18l13-1z" fill="#6BBF59" />
        </>
      )}
      {name === 'nametag' && (
        <>
          <path d="M7 14h24l10 10-10 10H7z" fill="#fff" />
          <circle cx="31" cy="24" r="2.400" />
          <path d="M12 21h11M12 27h8" />
        </>
      )}
      {name === 'gallery' && (
        <>
          <rect x="6" y="9" width="36" height="28" rx="4" fill="#fff" />
          <circle cx="16" cy="19" r="3.500" fill="#F9C74F" />
          <path d="M8 33l9-8 7 6 6-5 10 8" />
        </>
      )}
    </svg>
  )
}
