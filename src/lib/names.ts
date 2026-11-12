import Papa from 'papaparse'

const HEADERS = ['이름', '성명', '학생', '학생이름', '학생 이름', 'name']

/** 붙여넣은 글에서 이름 뽑기: 한 줄에 한 명 (엑셀에서 복사하면 탭으로 나뉜 첫 칸) */
export function namesFromText(text: string): string[] {
  return clean(text.split(/\r?\n/).map((line) => line.split('\t')[0]))
}

/** CSV 파일에서 이름 뽑기. UTF-8로 먼저 읽고, 깨지면 EUC-KR(엑셀 한글 CSV)로 다시 읽음 */
export async function namesFromCsvFile(file: File): Promise<string[]> {
  const bytes = await file.arrayBuffer()
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    text = new TextDecoder('euc-kr').decode(bytes)
  }
  const rows = Papa.parse<string[]>(text.replace(/^﻿/, ''), { skipEmptyLines: true }).data
  return clean(rows.map((row) => row[0] ?? ''))
}

function clean(names: string[]): string[] {
  const list = names.map((n) => n.trim()).filter(Boolean)
  if (list.length && HEADERS.includes(list[0].toLowerCase())) list.shift()
  return list.map((n) => n.slice(0, 20))
}

/** 예시 CSV 내려받기 (엑셀에서 바로 열리게 BOM 포함) */
export function downloadSampleCsv() {
  const blob = new Blob(['﻿이름\r\n김하늘\r\n이바다\r\n박나무\r\n'], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = '마음방_명단_예시.csv'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
