import type { CSSProperties } from 'react'
import { bboxOf, boxStyle, imgStyle, partById, type Placed } from './faceMath'
import styles from './face.module.css'

interface Props {
  placed: Placed
  /** 반투명 그림자 (따라 만들기 가이드) */
  ghost?: boolean
  className?: string
  style?: CSSProperties
}

/** 얼굴 위 부품 하나: 여백을 잘라낸 그림을 제자리에 */
export default function PartView({ placed, ghost, className = '', style }: Props) {
  return (
    <div className={`${styles.part} ${ghost ? styles.ghost : ''} ${className}`} style={{ ...boxStyle(placed), ...style }}>
      <img src={partById(placed.id).image} alt="" style={imgStyle(placed.id)} draggable={false} />
    </div>
  )
}

/** 고르는 칸에 보여 주는 부품 그림 (여백을 잘라내고 칸에 맞춰 크게) */
export function PartThumb({ id }: { id: string }) {
  const [x0, y0, x1, y1] = bboxOf(id)
  const ratio = (x1 - x0) / (y1 - y0)
  return (
    <span className={styles.thumb}>
      <span style={{ aspectRatio: String(ratio), width: `min(100cqw, ${ratio * 100}cqh)` }}>
        <img src={partById(id).image} alt="" style={imgStyle(id)} draggable={false} />
      </span>
    </span>
  )
}
