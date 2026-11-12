// 자동으로 만든 파일이에요. 고치지 말고 `npm run assets` 를 다시 돌려요.
import type { GroupKey } from './emotions'

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
export const FACE_CANVAS = 2000

/** 부위별 자리 [x0, y0, x1, y1] (2000×2000 기준) */
export const FACE_ZONES: Record<string, [number, number, number, number]> = {"base":[100,100,1900,1900],"brow":[560,600,1440,760],"eye":[560,760,1440,1000],"nose":[880,1000,1120,1200],"mouth":[700,1220,1300,1480],"extra_cheek":[420,1040,1580,1220],"extra_tear":[640,960,800,1200],"extra_sweat":[1380,560,1540,800],"extra_angry":[1320,420,1560,660],"extra_heart":[1340,440,1580,660]}

export const FACE_PARTS = [
  {
    "id": "base_01",
    "kind": "base",
    "label": "기본 동그란 얼굴",
    "tags": [],
    "zone": "base",
    "image": "/assets/face/base_01.png"
  },
  {
    "id": "brow_01",
    "kind": "brow",
    "label": "평평한 눈썹",
    "tags": [
      "calm"
    ],
    "zone": "brow",
    "image": "/assets/face/brow_01.png"
  },
  {
    "id": "brow_02",
    "kind": "brow",
    "label": "위로 둥글게 올라간 눈썹",
    "tags": [
      "surprise",
      "joy"
    ],
    "zone": "brow",
    "image": "/assets/face/brow_02.png"
  },
  {
    "id": "brow_03",
    "kind": "brow",
    "label": "안쪽이 내려간 화난 눈썹 ＼ ／",
    "tags": [
      "anger",
      "discomfort"
    ],
    "zone": "brow",
    "image": "/assets/face/brow_03.png"
  },
  {
    "id": "brow_04",
    "kind": "brow",
    "label": "안쪽이 올라간 처진 눈썹 ／ ＼",
    "tags": [
      "sadness",
      "fear"
    ],
    "zone": "brow",
    "image": "/assets/face/brow_04.png"
  },
  {
    "id": "brow_05",
    "kind": "brow",
    "label": "한쪽만 올라간 눈썹",
    "tags": [
      "surprise",
      "discomfort"
    ],
    "zone": "brow",
    "image": "/assets/face/brow_05.png"
  },
  {
    "id": "brow_06",
    "kind": "brow",
    "label": "구불구불 떨리는 눈썹",
    "tags": [
      "fear"
    ],
    "zone": "brow",
    "image": "/assets/face/brow_06.png"
  },
  {
    "id": "eye_01",
    "kind": "eye",
    "label": "동그란 기본 눈",
    "tags": [
      "calm",
      "lethargy"
    ],
    "zone": "eye",
    "image": "/assets/face/eye_01.png"
  },
  {
    "id": "eye_02",
    "kind": "eye",
    "label": "웃는 눈 ∩ ∩",
    "tags": [
      "joy"
    ],
    "zone": "eye",
    "image": "/assets/face/eye_02.png"
  },
  {
    "id": "eye_03",
    "kind": "eye",
    "label": "크게 뜬 눈",
    "tags": [
      "surprise",
      "fear"
    ],
    "zone": "eye",
    "image": "/assets/face/eye_03.png"
  },
  {
    "id": "eye_04",
    "kind": "eye",
    "label": "감은 눈 — —",
    "tags": [
      "calm",
      "lethargy"
    ],
    "zone": "eye",
    "image": "/assets/face/eye_04.png"
  },
  {
    "id": "eye_05",
    "kind": "eye",
    "label": "찡그린 눈 > <",
    "tags": [
      "anger",
      "discomfort",
      "joy"
    ],
    "zone": "eye",
    "image": "/assets/face/eye_05.png"
  },
  {
    "id": "eye_06",
    "kind": "eye",
    "label": "눈물 고인 눈",
    "tags": [
      "sadness",
      "fear"
    ],
    "zone": "eye",
    "image": "/assets/face/eye_06.png"
  },
  {
    "id": "eye_07",
    "kind": "eye",
    "label": "반쯤 감긴 눈",
    "tags": [
      "lethargy"
    ],
    "zone": "eye",
    "image": "/assets/face/eye_07.png"
  },
  {
    "id": "nose_01",
    "kind": "nose",
    "label": "작은 점 코",
    "tags": [],
    "zone": "nose",
    "image": "/assets/face/nose_01.png"
  },
  {
    "id": "nose_02",
    "kind": "nose",
    "label": "동그란 코",
    "tags": [],
    "zone": "nose",
    "image": "/assets/face/nose_02.png"
  },
  {
    "id": "nose_03",
    "kind": "nose",
    "label": "세모 코",
    "tags": [],
    "zone": "nose",
    "image": "/assets/face/nose_03.png"
  },
  {
    "id": "mouth_01",
    "kind": "mouth",
    "label": "웃는 입",
    "tags": [
      "joy",
      "calm"
    ],
    "zone": "mouth",
    "image": "/assets/face/mouth_01.png"
  },
  {
    "id": "mouth_02",
    "kind": "mouth",
    "label": "활짝 웃는 입",
    "tags": [
      "joy"
    ],
    "zone": "mouth",
    "image": "/assets/face/mouth_02.png"
  },
  {
    "id": "mouth_03",
    "kind": "mouth",
    "label": "처진 입",
    "tags": [
      "sadness",
      "discomfort"
    ],
    "zone": "mouth",
    "image": "/assets/face/mouth_03.png"
  },
  {
    "id": "mouth_04",
    "kind": "mouth",
    "label": "일자 입",
    "tags": [
      "lethargy",
      "discomfort"
    ],
    "zone": "mouth",
    "image": "/assets/face/mouth_04.png"
  },
  {
    "id": "mouth_05",
    "kind": "mouth",
    "label": "동그랗게 벌린 입 O",
    "tags": [
      "surprise",
      "fear"
    ],
    "zone": "mouth",
    "image": "/assets/face/mouth_05.png"
  },
  {
    "id": "mouth_06",
    "kind": "mouth",
    "label": "이 악문 입",
    "tags": [
      "anger",
      "fear"
    ],
    "zone": "mouth",
    "image": "/assets/face/mouth_06.png"
  },
  {
    "id": "mouth_07",
    "kind": "mouth",
    "label": "삐죽 입",
    "tags": [
      "discomfort",
      "anger"
    ],
    "zone": "mouth",
    "image": "/assets/face/mouth_07.png"
  },
  {
    "id": "mouth_08",
    "kind": "mouth",
    "label": "물결 입",
    "tags": [
      "fear",
      "discomfort"
    ],
    "zone": "mouth",
    "image": "/assets/face/mouth_08.png"
  },
  {
    "id": "extra_cheek",
    "kind": "extra",
    "label": "볼터치(양쪽)",
    "tags": [
      "joy",
      "discomfort"
    ],
    "zone": "extra_cheek",
    "image": "/assets/face/extra_cheek.png"
  },
  {
    "id": "extra_tear",
    "kind": "extra",
    "label": "눈물방울",
    "tags": [
      "sadness"
    ],
    "zone": "extra_tear",
    "image": "/assets/face/extra_tear.png"
  },
  {
    "id": "extra_sweat",
    "kind": "extra",
    "label": "땀방울",
    "tags": [
      "fear",
      "surprise"
    ],
    "zone": "extra_sweat",
    "image": "/assets/face/extra_sweat.png"
  },
  {
    "id": "extra_angry",
    "kind": "extra",
    "label": "화남 표시",
    "tags": [
      "anger"
    ],
    "zone": "extra_angry",
    "image": "/assets/face/extra_angry.png"
  },
  {
    "id": "extra_heart",
    "kind": "extra",
    "label": "하트",
    "tags": [
      "joy"
    ],
    "zone": "extra_heart",
    "image": "/assets/face/extra_heart.png"
  }
] as FacePart[]
