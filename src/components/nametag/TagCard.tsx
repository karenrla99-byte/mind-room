import { textOn, type NameTagResult } from '../../lib/emotionConfig'
import WordPicture from './WordPicture'
import styles from './nametag.module.css'

/** 이름표 한 장: 그림 + 낱말 + 크기 (+ 이유). 전시방 카드에도 같은 모양으로 씀 */
export default function TagCard({ tag, name, picture }: { tag: NameTagResult; name?: string; picture?: string | null }) {
  return (
    <div className={styles.tag}>
      {picture ? (
        <img className={styles.tagWork} src={picture} alt="내가 만든 작품" />
      ) : (
        <WordPicture image={tag.image} emoji={tag.emoji} color={tag.color} className={styles.tagPic} />
      )}
      {name && <p className={styles.tagName}>{name}</p>}
      <p className={styles.tagWord} style={{ background: tag.color, color: textOn(tag.color) }}>
        {tag.word ?? tag.groupName}
      </p>
      {tag.intensity != null && (
        <p className={styles.meter} aria-label={`감정 크기 5 가운데 ${tag.intensity}`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} style={n <= tag.intensity! ? { background: tag.color } : undefined} />
          ))}
        </p>
      )}
      {tag.reason && <p className={styles.tagReason}>{tag.reason} {tag.word}</p>}
    </div>
  )
}
