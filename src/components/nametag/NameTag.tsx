import { useEffect, useState } from 'react'
import { shade, textOn, type ConfigGroup, type EmotionConfig, type NameTagResult, type NamingLevel } from '../../lib/emotionConfig'
import { speak } from '../../lib/tts'
import SizeLine from './SizeLine'
import WordPicture from './WordPicture'
import styles from './nametag.module.css'

interface Props {
  config: EmotionConfig
  level: NamingLevel
  /** 방금 만든 작품 그림 (있으면 옆에 작게 보여 줌) */
  picture?: string | null
  onDone: (result: NameTagResult) => void
}

type Step = 'group' | 'size' | 'reason'

/** 이름표 붙이기: 큰 감정 → 감정 크기(낱말) → 이유 문장. 모든 활동 끝에 같은 순서로 나옴 */
export default function NameTag({ config, level, picture, onDone }: Props) {
  const groups = config.groups.filter((g) => g.enabled)
  const [step, setStep] = useState<Step>('group')
  const [group, setGroup] = useState<ConfigGroup | null>(null)
  const [position, setPosition] = useState<number | null>(null)
  const [wordId, setWordId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const words = group ? config.words.filter((w) => w.group === group.key) : []
  const word = words.find((w) => w.id === wordId) ?? null

  useEffect(() => {
    if (step === 'group') speak('지금 내 마음은 어때요?')
    else if (step === 'size') speak('마음의 크기를 골라요')
    else speak('왜 그런 마음이 들었어요?')
  }, [step])

  const finish = (withReason: boolean) => {
    if (!group) return
    const color = word ? shade(group.color, word.intensity) : group.color
    onDone({
      groupKey: group.key,
      groupName: group.name,
      color,
      word: word?.word ?? null,
      intensity: word?.intensity ?? null,
      reason: withReason && reason.trim() ? reason.trim() : null,
      image: word ? word.image : group.image,
      emoji: word?.emoji,
    })
  }

  const pickGroup = (g: ConfigGroup) => {
    speak(g.name)
    setGroup(g)
    setPosition(null)
    setWordId(null)
    const has = config.words.some((w) => w.group === g.key)
    if (level === 1 || !has) {
      onDone({ groupKey: g.key, groupName: g.name, color: g.color, word: null, intensity: null, reason: null, image: g.image })
    } else {
      setStep('size')
    }
  }

  if (step === 'group') {
    return (
      <div className={styles.step}>
        {picture && <img className={styles.made} src={picture} alt="내가 만든 작품" />}
        <h1 className={styles.title}>{picture ? '이 작품의 마음은 어때요?' : '지금 내 마음은 어때요?'}</h1>
        <div className={styles.groups}>
          {groups.map((g) => (
            <button
              key={g.key}
              type="button"
              className={styles.groupCard}
              style={{ background: g.color, color: textOn(g.color) }}
              onClick={() => pickGroup(g)}
            >
              <WordPicture image={g.image} color={g.color} />
              <span>{g.name}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'size' && group) {
    const needPick = position != null && !word && words.some((w) => w.intensity === position)
    return (
      <div className={styles.step}>
        <h1 className={styles.title}>
          <span className={styles.chip} style={{ background: group.color, color: textOn(group.color) }}>{group.name}</span>
          마음의 크기를 골라요
        </h1>
        <p className={styles.hint}>{needPick ? '어울리는 낱말을 하나 골라요' : '동그라미를 끌거나, 그림을 눌러요'}</p>
        <SizeLine
          group={group}
          words={words}
          position={position}
          wordId={wordId}
          onChange={(p, id) => {
            setPosition(p)
            setWordId(id)
          }}
        />
        <div className={styles.actions}>
          <button type="button" className="btn" onClick={() => setStep('group')}>다시 골라요</button>
          <button
            type="button"
            className="btn btn-yellow"
            disabled={!word}
            onClick={() => (level === 3 ? setStep('reason') : finish(false))}
          >
            이걸로 할래요
          </button>
        </div>
      </div>
    )
  }

  if (step === 'reason' && group && word) {
    const bg = shade(group.color, word.intensity)
    return (
      <div className={styles.step}>
        <h1 className={styles.title}>왜 그런 마음이 들었어요?</h1>
        <div className={styles.sentence}>
          <WordPicture image={word.image} emoji={word.emoji} color={bg} className={styles.sentencePic} />
          <div className={styles.sentenceText}>
            <input
              value={reason}
              maxLength={40}
              placeholder="친구와 놀아서"
              aria-label="왜 그런지 적어요"
              onChange={(e) => setReason(e.target.value)}
            />
            <strong style={{ background: bg, color: textOn(bg) }}>{word.word}</strong>
          </div>
        </div>
        <p className={styles.hint}>적기 어려우면 넘어가도 돼요</p>
        <div className={styles.actions}>
          <button type="button" className="btn" onClick={() => setStep('size')}>다시 골라요</button>
          <button type="button" className="btn" onClick={() => finish(false)}>넘어가요</button>
          <button type="button" className="btn btn-yellow" disabled={!reason.trim()} onClick={() => finish(true)}>다 했어요</button>
        </div>
      </div>
    )
  }

  return null
}
