// 에셋 준비 스크립트: `npm run assets`
// 1) 에셋/*/완성/*.png → public/assets/ 로 복사 (원본은 건드리지 않음)
// 2) words_list.csv → src/data/emotions.ts
// 3) parts_list.csv + zones.json → src/data/faceParts.ts
// 4) 얼굴 부품·모양의 투명 여백을 뺀 상자(bbox) → src/data/partBounds.json
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(root, '에셋')
const OUT = path.join(root, 'public', 'assets')
const DATA = path.join(root, 'src', 'data')

const COPY = [
  ['01_얼굴부품', 'face'],
  ['02_감정낱말그림', 'words'],
  ['03_모양조각', 'shapes'],
  ['04_집과문', 'home', ''],
]

const GROUP_KEYS = {
  기쁨: 'joy',
  놀람: 'surprise',
  분노: 'anger',
  불편함: 'discomfort',
  슬픔: 'sadness',
  두려움: 'fear',
  무기력함: 'lethargy',
}
const PART_KINDS = { '빈 얼굴': 'base', 눈썹: 'brow', 눈: 'eye', 코: 'nose', 입: 'mouth', 꾸미기: 'extra' }

function readCsv(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '')
  const rows = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const cells = []
    let cur = ''
    let quoted = false
    for (const ch of line) {
      if (ch === '"') quoted = !quoted
      else if (ch === ',' && !quoted) {
        cells.push(cur)
        cur = ''
      } else cur += ch
    }
    cells.push(cur)
    rows.push(cells.map((c) => c.trim()))
  }
  return rows.slice(1)
}

function bbox(file) {
  const png = PNG.sync.read(fs.readFileSync(file))
  let x0 = png.width, y0 = png.height, x1 = -1, y1 = -1
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      if (png.data[(y * png.width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  return [x0, y0, x1 + 1, y1 + 1]
}

const header = '// 자동으로 만든 파일이에요. 고치지 말고 `npm run assets` 를 다시 돌려요.\n'
fs.mkdirSync(DATA, { recursive: true })

// 1) 복사 + 4) bbox
const bounds = {}
let copied = 0
for (const [from, to, sub = '완성'] of COPY) {
  const srcDir = path.join(SRC, from, sub)
  const outDir = path.join(OUT, to)
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(outDir, { recursive: true })
  for (const name of fs.readdirSync(srcDir).sort()) {
    if (!name.endsWith('.png')) continue
    fs.copyFileSync(path.join(srcDir, name), path.join(outDir, name))
    copied++
    if (to === 'face' || to === 'shapes') bounds[name.replace('.png', '')] = bbox(path.join(srcDir, name))
  }
}
fs.writeFileSync(path.join(DATA, 'partBounds.json'), JSON.stringify(bounds, null, 2) + '\n')

// 2) 감정 목록
const groups = []
const words = []
for (const [file, groupName, size, word, source, color] of readCsv(path.join(SRC, '02_감정낱말그림', 'words_list.csv'))) {
  const key = GROUP_KEYS[groupName]
  if (!key) throw new Error(`모르는 큰 감정: ${groupName}`)
  const id = file.replace('.png', '')
  if (size === '대표') {
    groups.push({ key, name: groupName, color, image: `/assets/words/${file}` })
  } else {
    words.push({
      id,
      group: key,
      word,
      intensity: Number(size),
      onLine: source === '포스터1',
      color,
      image: `/assets/words/${file}`,
    })
  }
}
fs.writeFileSync(
  path.join(DATA, 'emotions.ts'),
  `${header}
export type GroupKey = ${groups.map((g) => `'${g.key}'`).join(' | ')}

export interface EmotionGroup {
  key: GroupKey
  /** 큰 감정 이름 */
  name: string
  /** 대표 색 (크기 5와 같은 색) */
  color: string
  image: string
}

export interface EmotionWord {
  id: string
  group: GroupKey
  /** 감정 낱말 ("~해요") */
  word: string
  /** 감정 크기 1(작음)~5(큼) = 수직선 위치 */
  intensity: 1 | 2 | 3 | 4 | 5
  /** true: 수직선 기본 낱말(포스터 1) / false: 추가 낱말(포스터 2) */
  onLine: boolean
  /** 크기에 맞는 진하기 색 */
  color: string
  image: string
}

export const DEFAULT_GROUPS: EmotionGroup[] = ${JSON.stringify(groups, null, 2)}

export const DEFAULT_WORDS = ${JSON.stringify(words, null, 2)} as EmotionWord[]

export const groupByKey = (key: GroupKey) => DEFAULT_GROUPS.find((g) => g.key === key)!
export const wordsOf = (key: GroupKey) => DEFAULT_WORDS.filter((w) => w.group === key)
`,
)

// 3) 얼굴 부품
const zones = JSON.parse(fs.readFileSync(path.join(SRC, '01_얼굴부품', 'zones.json'), 'utf8'))
const parts = readCsv(path.join(SRC, '01_얼굴부품', 'parts_list.csv')).map(([file, kindName, label, tags]) => {
  const id = file.replace('.png', '')
  const kind = PART_KINDS[kindName]
  if (!kind) throw new Error(`모르는 부위: ${kindName}`)
  return {
    id,
    kind,
    label,
    // 어울리는 큰 감정. '편안함'은 큰 감정 묶음이 아니라서 calm 으로 따로 둠
    tags: tags === '-' ? [] : tags.split('/').map((t) => GROUP_KEYS[t] ?? (t === '편안함' ? 'calm' : t)),
    zone: kind === 'extra' ? id : kind,
    image: `/assets/face/${file}`,
  }
})
fs.writeFileSync(
  path.join(DATA, 'faceParts.ts'),
  `${header}import type { GroupKey } from './emotions'

export type PartKind = 'base' | 'brow' | 'eye' | 'nose' | 'mouth' | 'extra'

export interface FacePart {
  id: string
  kind: PartKind
  label: string
  /** 어울리는 큰 감정 (calm = 편안함) */
  tags: (GroupKey | 'calm')[]
  /** FACE_ZONES 의 열쇠 */
  zone: string
  image: string
}

/** 얼굴 좌표계 한 변 길이 */
export const FACE_CANVAS = ${zones.canvas}

/** 부위별 자리 [x0, y0, x1, y1] (${zones.canvas}×${zones.canvas} 기준) */
export const FACE_ZONES: Record<string, [number, number, number, number]> = ${JSON.stringify(zones.zones)}

export const FACE_PARTS = ${JSON.stringify(parts, null, 2)} as FacePart[]
`,
)

console.log(`그림 ${copied}개 복사, 큰 감정 ${groups.length}묶음, 낱말 ${words.length}개, 얼굴 부품 ${parts.length}개`)
