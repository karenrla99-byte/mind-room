import { supabase } from './supabase'

export interface Student {
  id: string
  name: string
  image_path: string | null
}

export interface Room {
  id: string
  code: string
  name: string
  is_open: boolean
  settings: Record<string, unknown>
  students: Student[]
}

export interface Work {
  id: string
  student_id: string | null
  student_name: string | null
  activity: string
  group_key: string | null
  group_name: string | null
  color: string | null
  word: string | null
  intensity: number | null
  reason: string | null
  image_path: string
  created_at: string
}

export interface NewWork {
  code: string
  studentId: string
  workId: string
  activity: string
  groupKey: string
  groupName: string
  color: string
  word: string | null
  intensity: number | null
  reason: string | null
}

export type PinResult = 'ok' | 'wrong' | 'locked'

/** 서버가 알려 준 오류 이름 (NOT_TEACHER, ROOM_NOT_FOUND …) 을 담은 오류 */
export class ApiError extends Error {
  code: string
  constructor(code: string) {
    super(code)
    this.code = code
  }
}

const KNOWN = ['NOT_TEACHER', 'ROOM_NOT_FOUND', 'BAD_PIN', 'BAD_NAME', 'TOO_MANY_STUDENTS', 'SETTINGS_TOO_BIG', 'ROOM_CLOSED', 'BAD_STUDENT', 'BAD_WORK']

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) {
    throw new ApiError(KNOWN.find((k) => error.message.includes(k)) ?? 'NETWORK')
  }
  return data as T
}

/** 오류를 화면에 보여 줄 말로 바꾸기 */
export function errorText(e: unknown): string {
  const code = e instanceof ApiError ? e.code : 'NETWORK'
  switch (code) {
    case 'NOT_TEACHER':
      return '이 기기에는 이 방의 열쇠가 없어요. 방 번호와 PIN으로 다시 찾아요.'
    case 'ROOM_NOT_FOUND':
      return '방을 찾지 못했어요. 지워진 방일 수 있어요.'
    case 'BAD_PIN':
      return 'PIN은 숫자 4자리로 정해요.'
    case 'BAD_NAME':
      return '이름은 1~20자로 적어요. (방 이름은 40자까지)'
    case 'TOO_MANY_STUDENTS':
      return '한 방에 학생은 60명까지 넣을 수 있어요.'
    case 'ROOM_CLOSED':
      return '지금은 방이 닫혀 있어요.'
    case 'BAD_STUDENT':
      return '이름을 다시 골라요.'
    case 'SETTINGS_TOO_BIG':
      return '감정 목록이 너무 길어요. 낱말을 조금 줄여요.'
    default:
      return '연결이 잘 안 돼요. 잠시 뒤에 다시 해 봐요.'
  }
}

type WithKey = Room & { teacher_key: string }

export const api = {
  createRoom: (name: string, pin: string) => rpc<WithKey>('create_room', { p_name: name, p_pin: pin }),
  claimRoom: (code: string, pin: string) =>
    rpc<WithKey | { error: Exclude<PinResult, 'ok'> }>('claim_room', { p_code: code, p_pin: pin }),
  teacherGetRoom: (id: string, key: string) => rpc<Room>('teacher_get_room', { p_room_id: id, p_teacher_key: key }),
  updateRoom: (id: string, key: string, patch: { name?: string; is_open?: boolean }) =>
    rpc<Room>('update_room', { p_room_id: id, p_teacher_key: key, p_name: patch.name ?? null, p_is_open: patch.is_open ?? null }),
  updateSettings: (id: string, key: string, settings: Record<string, unknown>) =>
    rpc<Room>('update_room_settings', { p_room_id: id, p_teacher_key: key, p_settings: settings }),
  deleteRoom: (id: string, key: string, pin: string) =>
    rpc<PinResult>('delete_room', { p_room_id: id, p_teacher_key: key, p_pin: pin }),
  addStudents: (id: string, key: string, names: string[]) =>
    rpc<Student[]>('add_students', { p_room_id: id, p_teacher_key: key, p_names: names }),
  renameStudent: (id: string, key: string, studentId: string, name: string) =>
    rpc<Student[]>('rename_student', { p_room_id: id, p_teacher_key: key, p_student_id: studentId, p_name: name }),
  deleteStudent: (id: string, key: string, studentId: string) =>
    rpc<Student[]>('delete_student', { p_room_id: id, p_teacher_key: key, p_student_id: studentId }),
  reorderStudents: (id: string, key: string, ids: string[]) =>
    rpc<Student[]>('reorder_students', { p_room_id: id, p_teacher_key: key, p_ids: ids }),
  setStudentImage: (id: string, key: string, studentId: string, path: string | null) =>
    rpc<Student[]>('set_student_image', { p_room_id: id, p_teacher_key: key, p_student_id: studentId, p_image_path: path }),
  submitWork: (w: NewWork) =>
    rpc<Work>('submit_work', {
      p_code: w.code, p_student_id: w.studentId, p_work_id: w.workId, p_activity: w.activity,
      p_group_key: w.groupKey, p_group_name: w.groupName, p_color: w.color,
      p_word: w.word, p_intensity: w.intensity, p_reason: w.reason,
    }),
  getWorks: (roomId: string) => rpc<Work[]>('get_works', { p_room_id: roomId }),
  deleteWorks: (id: string, key: string, ids: string[]) =>
    rpc<string[]>('delete_works', { p_room_id: id, p_teacher_key: key, p_ids: ids }),
  getRoomByCode: (code: string) => rpc<Room | null>('get_room_by_code', { p_code: code }),
}
