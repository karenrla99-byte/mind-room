/** 학생이 들어온 방과 고른 이름 (탭을 닫으면 사라짐) */
export interface StudentSession {
  roomId: string
  code: string
  roomName: string
  studentId: string
  studentName: string
}

const KEY = 'maeumbang.student'

export function saveSession(s: StudentSession) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // 무시
  }
}

export function loadSession(): StudentSession | null {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // 무시
  }
}
