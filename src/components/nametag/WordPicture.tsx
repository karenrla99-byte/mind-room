import type { CSSProperties } from 'react'
import styles from './nametag.module.css'

interface Props {
  image: string | null
  emoji?: string
  color: string
  className?: string
  style?: CSSProperties
}

/** 낱말 그림. 그림이 없으면 이모지, 그것도 없으면 색 동그라미 */
export default function WordPicture({ image, emoji, color, className = '', style }: Props) {
  if (image) return <img className={`${styles.pic} ${className}`} style={style} src={image} alt="" draggable={false} />
  return (
    <span className={`${styles.pic} ${styles.noPic} ${className}`} style={style} aria-hidden="true">
      <span style={{ background: color }}>{emoji ?? ''}</span>
    </span>
  )
}
