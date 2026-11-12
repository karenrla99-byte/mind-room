import type { ComponentType } from 'react'

/** 활동이 이름표 붙이기에 넘기는 말 */
export interface ActivityHint {
  /** 큰 감정을 이 묶음들 가운데에서만 고르게 함 (표정방 1·2단계) */
  groups?: string[]
}

export interface ActivityProps {
  /** 다 만들면 작품 그림(PNG)을 넘김 → 이름표 붙이기로 이어짐 */
  onDone: (image: Blob, hint?: ActivityHint) => void
}

export interface Activity {
  /** works.activity 에 저장되는 값 */
  key: string
  name: string
  /** 한 줄 설명 (읽어 주기에도 씀) */
  say: string
  color: string
  /** 아직 안 만든 활동은 null */
  Component: ComponentType<ActivityProps> | null
}
