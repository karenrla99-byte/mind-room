import type { ComponentType } from 'react'

export interface ActivityProps {
  /** 다 만들면 작품 그림(PNG)을 넘김 → 이름표 붙이기로 이어짐 */
  onDone: (image: Blob) => void
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
