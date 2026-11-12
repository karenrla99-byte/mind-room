import { useSyncExternalStore } from 'react'

/** 이 기기에서 만든(또는 PIN으로 되찾은) 방. 교사 열쇠를 함께 보관 */
export interface MyRoom {
  id: string
  code: string
  name: string
  key: string
}

const LS_KEY = 'maeumbang.rooms'
const COOKIE = 'maeumbang_rooms'
const listeners = new Set<() => void>()

function parse(text: string | null | undefined): MyRoom[] {
  try {
    const list = JSON.parse(text ?? '[]')
    return Array.isArray(list) ? list.filter((r) => r && r.id && r.key) : []
  } catch {
    return []
  }
}

function readCookie(): MyRoom[] {
  const hit = document.cookie.split('; ').find((c) => c.startsWith(COOKIE + '='))
  return hit ? parse(decodeURIComponent(hit.slice(COOKIE.length + 1))) : []
}

function load(): MyRoom[] {
  let fromLs: MyRoom[] = []
  try {
    fromLs = parse(localStorage.getItem(LS_KEY))
  } catch {
    // localStorage 가 막힌 브라우저
  }
  // 한쪽이 지워져도 남은 쪽에서 되살림
  const merged = [...fromLs]
  for (const r of readCookie()) if (!merged.some((m) => m.id === r.id)) merged.push(r)
  return merged
}

let current = load()

function save(next: MyRoom[]) {
  current = next
  const text = JSON.stringify(next)
  try {
    localStorage.setItem(LS_KEY, text)
  } catch {
    // 무시
  }
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE}=${encodeURIComponent(text)}; Max-Age=${60 * 60 * 24 * 400}; Path=/; SameSite=Lax${secure}`
  listeners.forEach((fn) => fn())
}

export const myRooms = {
  list: () => current,
  get: (id: string) => current.find((r) => r.id === id),
  upsert(room: MyRoom) {
    save([room, ...current.filter((r) => r.id !== room.id)])
  },
  rename(id: string, name: string) {
    save(current.map((r) => (r.id === id ? { ...r, name } : r)))
  },
  remove(id: string) {
    save(current.filter((r) => r.id !== id))
  },
}

export function useMyRooms() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    myRooms.list,
  )
}
