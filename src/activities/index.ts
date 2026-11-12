import ColorRoom from './ColorRoom'
import DrawPad from './DrawPad'
import type { Activity } from './types'

/**
 * 활동 목록. 새 활동은 여기에 한 줄 더하면 방 화면·선생님 설정·전시방에 함께 나타나요.
 * (이름표만 붙이기는 활동이 아니라 따로 있는 버튼이에요: key 'nametag')
 */
export const ACTIVITIES: Activity[] = [
  { key: 'face', name: '표정방', say: '얼굴로 마음을 나타내요', color: '#FCE3A7', Component: null },
  { key: 'color', name: '색깔방', say: '색으로 마음을 나타내요', color: '#F7C8C9', Component: ColorRoom },
  { key: 'shape', name: '모양방', say: '모양으로 마음을 나타내요', color: '#B5DFAC', Component: null },
  { key: 'draw', name: '그림방', say: '그림으로 마음을 나타내요', color: '#A6CAFF', Component: DrawPad },
]

export const READY = ACTIVITIES.filter((a) => a.Component)
export const findActivity = (key: string | undefined) => READY.find((a) => a.key === key)

/** 방 설정에서 켜 둔 활동만 (설정이 없으면 모두 켬) */
export function enabledActivities(settings: Record<string, unknown> | null | undefined): Activity[] {
  const off = Array.isArray(settings?.activitiesOff) ? (settings.activitiesOff as string[]) : []
  return READY.filter((a) => !off.includes(a.key))
}

export const nametagOn = (settings: Record<string, unknown> | null | undefined) =>
  !(Array.isArray(settings?.activitiesOff) && (settings.activitiesOff as string[]).includes('nametag'))
