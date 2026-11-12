// 자동으로 만든 파일이에요. 고치지 말고 `npm run assets` 를 다시 돌려요.

export type GroupKey = 'joy' | 'surprise' | 'anger' | 'discomfort' | 'sadness' | 'fear' | 'lethargy'

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

export const DEFAULT_GROUPS: EmotionGroup[] = [
  {
    "key": "joy",
    "name": "기쁨",
    "color": "#F9C74F",
    "image": "/assets/words/group_joy.png"
  },
  {
    "key": "surprise",
    "name": "놀람",
    "color": "#F8961E",
    "image": "/assets/words/group_surprise.png"
  },
  {
    "key": "anger",
    "name": "분노",
    "color": "#E5484D",
    "image": "/assets/words/group_anger.png"
  },
  {
    "key": "discomfort",
    "name": "불편함",
    "color": "#6BBF59",
    "image": "/assets/words/group_discomfort.png"
  },
  {
    "key": "sadness",
    "name": "슬픔",
    "color": "#4D96FF",
    "image": "/assets/words/group_sadness.png"
  },
  {
    "key": "fear",
    "name": "두려움",
    "color": "#5B5FC7",
    "image": "/assets/words/group_fear.png"
  },
  {
    "key": "lethargy",
    "name": "무기력함",
    "color": "#A27FD6",
    "image": "/assets/words/group_lethargy.png"
  }
]

export const DEFAULT_WORDS = [
  {
    "id": "joy_1",
    "group": "joy",
    "word": "편안해요",
    "intensity": 1,
    "onLine": true,
    "color": "#FDEECA",
    "image": "/assets/words/joy_1.png"
  },
  {
    "id": "joy_2",
    "group": "joy",
    "word": "기대돼요",
    "intensity": 2,
    "onLine": true,
    "color": "#FCE3A7",
    "image": "/assets/words/joy_2.png"
  },
  {
    "id": "joy_3",
    "group": "joy",
    "word": "즐거워요",
    "intensity": 3,
    "onLine": true,
    "color": "#FAD783",
    "image": "/assets/words/joy_3.png"
  },
  {
    "id": "joy_4",
    "group": "joy",
    "word": "뿌듯해요",
    "intensity": 4,
    "onLine": true,
    "color": "#F9CD64",
    "image": "/assets/words/joy_4.png"
  },
  {
    "id": "joy_5",
    "group": "joy",
    "word": "행복해요",
    "intensity": 5,
    "onLine": true,
    "color": "#F9C74F",
    "image": "/assets/words/joy_5.png"
  },
  {
    "id": "joy_x1",
    "group": "joy",
    "word": "신나요",
    "intensity": 4,
    "onLine": false,
    "color": "#F9CD64",
    "image": "/assets/words/joy_x1.png"
  },
  {
    "id": "joy_x2",
    "group": "joy",
    "word": "감사해요",
    "intensity": 3,
    "onLine": false,
    "color": "#FAD783",
    "image": "/assets/words/joy_x2.png"
  },
  {
    "id": "surprise_1",
    "group": "surprise",
    "word": "호기심이 생겨요",
    "intensity": 1,
    "onLine": true,
    "color": "#FCDFBB",
    "image": "/assets/words/surprise_1.png"
  },
  {
    "id": "surprise_2",
    "group": "surprise",
    "word": "신기해요",
    "intensity": 2,
    "onLine": true,
    "color": "#FBCA8E",
    "image": "/assets/words/surprise_2.png"
  },
  {
    "id": "surprise_3",
    "group": "surprise",
    "word": "감탄해요",
    "intensity": 3,
    "onLine": true,
    "color": "#FAB561",
    "image": "/assets/words/surprise_3.png"
  },
  {
    "id": "surprise_4",
    "group": "surprise",
    "word": "당황해요",
    "intensity": 4,
    "onLine": true,
    "color": "#F8A239",
    "image": "/assets/words/surprise_4.png"
  },
  {
    "id": "surprise_5",
    "group": "surprise",
    "word": "충격받았어요",
    "intensity": 5,
    "onLine": true,
    "color": "#F8961E",
    "image": "/assets/words/surprise_5.png"
  },
  {
    "id": "surprise_x1",
    "group": "surprise",
    "word": "궁금해요",
    "intensity": 1,
    "onLine": false,
    "color": "#FCDFBB",
    "image": "/assets/words/surprise_x1.png"
  },
  {
    "id": "surprise_x2",
    "group": "surprise",
    "word": "놀라워요",
    "intensity": 3,
    "onLine": false,
    "color": "#FAB561",
    "image": "/assets/words/surprise_x2.png"
  },
  {
    "id": "anger_1",
    "group": "anger",
    "word": "답답해요",
    "intensity": 1,
    "onLine": true,
    "color": "#F7C8C9",
    "image": "/assets/words/anger_1.png"
  },
  {
    "id": "anger_2",
    "group": "anger",
    "word": "불만스러워요",
    "intensity": 2,
    "onLine": true,
    "color": "#F2A3A6",
    "image": "/assets/words/anger_2.png"
  },
  {
    "id": "anger_3",
    "group": "anger",
    "word": "짜증나요",
    "intensity": 3,
    "onLine": true,
    "color": "#EC7E82",
    "image": "/assets/words/anger_3.png"
  },
  {
    "id": "anger_4",
    "group": "anger",
    "word": "신경질 나요",
    "intensity": 4,
    "onLine": true,
    "color": "#E85D62",
    "image": "/assets/words/anger_4.png"
  },
  {
    "id": "anger_5",
    "group": "anger",
    "word": "화나요",
    "intensity": 5,
    "onLine": true,
    "color": "#E5484D",
    "image": "/assets/words/anger_5.png"
  },
  {
    "id": "anger_x1",
    "group": "anger",
    "word": "예민해요",
    "intensity": 2,
    "onLine": false,
    "color": "#F2A3A6",
    "image": "/assets/words/anger_x1.png"
  },
  {
    "id": "discomfort_1",
    "group": "discomfort",
    "word": "어색해요",
    "intensity": 1,
    "onLine": true,
    "color": "#D2EBCD",
    "image": "/assets/words/discomfort_1.png"
  },
  {
    "id": "discomfort_2",
    "group": "discomfort",
    "word": "찝찝해요",
    "intensity": 2,
    "onLine": true,
    "color": "#B5DFAC",
    "image": "/assets/words/discomfort_2.png"
  },
  {
    "id": "discomfort_3",
    "group": "discomfort",
    "word": "억울해요",
    "intensity": 3,
    "onLine": true,
    "color": "#97D28A",
    "image": "/assets/words/discomfort_3.png"
  },
  {
    "id": "discomfort_4",
    "group": "discomfort",
    "word": "미워요",
    "intensity": 4,
    "onLine": true,
    "color": "#7CC66C",
    "image": "/assets/words/discomfort_4.png"
  },
  {
    "id": "discomfort_5",
    "group": "discomfort",
    "word": "불쾌해요",
    "intensity": 5,
    "onLine": true,
    "color": "#6BBF59",
    "image": "/assets/words/discomfort_5.png"
  },
  {
    "id": "discomfort_x1",
    "group": "discomfort",
    "word": "부끄러워요",
    "intensity": 1,
    "onLine": false,
    "color": "#D2EBCD",
    "image": "/assets/words/discomfort_x1.png"
  },
  {
    "id": "sadness_1",
    "group": "sadness",
    "word": "서운해요",
    "intensity": 1,
    "onLine": true,
    "color": "#C9DFFF",
    "image": "/assets/words/sadness_1.png"
  },
  {
    "id": "sadness_2",
    "group": "sadness",
    "word": "속상해요",
    "intensity": 2,
    "onLine": true,
    "color": "#A6CAFF",
    "image": "/assets/words/sadness_2.png"
  },
  {
    "id": "sadness_3",
    "group": "sadness",
    "word": "실망했어요",
    "intensity": 3,
    "onLine": true,
    "color": "#82B5FF",
    "image": "/assets/words/sadness_3.png"
  },
  {
    "id": "sadness_4",
    "group": "sadness",
    "word": "외로워요",
    "intensity": 4,
    "onLine": true,
    "color": "#62A2FF",
    "image": "/assets/words/sadness_4.png"
  },
  {
    "id": "sadness_5",
    "group": "sadness",
    "word": "우울해요",
    "intensity": 5,
    "onLine": true,
    "color": "#4D96FF",
    "image": "/assets/words/sadness_5.png"
  },
  {
    "id": "sadness_x1",
    "group": "sadness",
    "word": "쓸쓸해요",
    "intensity": 4,
    "onLine": false,
    "color": "#62A2FF",
    "image": "/assets/words/sadness_x1.png"
  },
  {
    "id": "sadness_x2",
    "group": "sadness",
    "word": "슬퍼요",
    "intensity": 3,
    "onLine": false,
    "color": "#82B5FF",
    "image": "/assets/words/sadness_x2.png"
  },
  {
    "id": "fear_1",
    "group": "fear",
    "word": "걱정돼요",
    "intensity": 1,
    "onLine": true,
    "color": "#CDCFEE",
    "image": "/assets/words/fear_1.png"
  },
  {
    "id": "fear_2",
    "group": "fear",
    "word": "불안해요",
    "intensity": 2,
    "onLine": true,
    "color": "#ADAFE3",
    "image": "/assets/words/fear_2.png"
  },
  {
    "id": "fear_3",
    "group": "fear",
    "word": "초조해요",
    "intensity": 3,
    "onLine": true,
    "color": "#8C8FD7",
    "image": "/assets/words/fear_3.png"
  },
  {
    "id": "fear_4",
    "group": "fear",
    "word": "긴장돼요",
    "intensity": 4,
    "onLine": true,
    "color": "#6E72CD",
    "image": "/assets/words/fear_4.png"
  },
  {
    "id": "fear_5",
    "group": "fear",
    "word": "무서워요",
    "intensity": 5,
    "onLine": true,
    "color": "#5B5FC7",
    "image": "/assets/words/fear_5.png"
  },
  {
    "id": "lethargy_1",
    "group": "lethargy",
    "word": "심심해요",
    "intensity": 1,
    "onLine": true,
    "color": "#E3D8F2",
    "image": "/assets/words/lethargy_1.png"
  },
  {
    "id": "lethargy_2",
    "group": "lethargy",
    "word": "지루해요",
    "intensity": 2,
    "onLine": true,
    "color": "#D0BFEA",
    "image": "/assets/words/lethargy_2.png"
  },
  {
    "id": "lethargy_3",
    "group": "lethargy",
    "word": "피곤해요",
    "intensity": 3,
    "onLine": true,
    "color": "#BDA5E2",
    "image": "/assets/words/lethargy_3.png"
  },
  {
    "id": "lethargy_4",
    "group": "lethargy",
    "word": "귀찮아요",
    "intensity": 4,
    "onLine": true,
    "color": "#AD8EDA",
    "image": "/assets/words/lethargy_4.png"
  },
  {
    "id": "lethargy_5",
    "group": "lethargy",
    "word": "의욕이 없어요",
    "intensity": 5,
    "onLine": true,
    "color": "#A27FD6",
    "image": "/assets/words/lethargy_5.png"
  }
] as EmotionWord[]

export const groupByKey = (key: GroupKey) => DEFAULT_GROUPS.find((g) => g.key === key)!
export const wordsOf = (key: GroupKey) => DEFAULT_WORDS.filter((w) => w.group === key)
