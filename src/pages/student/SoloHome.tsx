import { useEffect } from 'react'
import { READY } from '../../activities'
import { speak } from '../../lib/tts'
import Rooms from './Rooms'
import styles from './student.module.css'

/** 나의방: 방 없이 혼자 만들고 저장만 해요 */
export default function SoloHome() {
  useEffect(() => {
    speak('어느 방에 들어갈까요?')
  }, [])
  return (
    <div className={styles.page}>
      <p className={styles.roomName}>나의방</p>
      <h1 className={styles.title}>어느 방에 들어갈까요?</h1>
      <Rooms base="/solo" activities={READY} nametag />
    </div>
  )
}
