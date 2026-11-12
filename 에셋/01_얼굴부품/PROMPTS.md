# 얼굴 부품 그리기 프롬프트 (30개)

> 그리기 전에 `../STYLE_GUIDE.md`를 꼭 먼저 읽기. 모양 아이디어는 `참고그림/parts_sketch_sheet.png` 참고(그림체는 따라 하지 말고 STYLE_GUIDE대로).

## 이 폴더 공통 규칙
- 캔버스 **1024×1024 px, 투명 배경**, 부품 **하나만** 캔버스 **정가운데**
- 눈·눈썹·볼터치는 **양쪽 한 쌍을 한 그림에** (좌우 대칭, 사이 간격 포함)
- 아래 '목표 크기'는 부품 전체가 차지하는 가로×세로 크기. 모든 부품이 **같은 얼굴(지름 800px) 위에 있다고 생각한 크기**라서 선 굵기가 맞음 → 크기를 맘대로 키우지 않기
- 선 굵기 **20px**, 선 색 `#3A2E2A`
- 얼굴 윤곽·다른 부품·글자·그림자 없이 그 부품만
- 저장: `완성/파일이름.png`

## 매번 붙이는 공통 영어 프롬프트 (앞부분)
```
Simple cute children's sticker-style face part for a special-education emotion app. Clean vector-like illustration, thick smooth rounded dark brown lines (#3A2E2A, about 20px on a 1024px canvas), flat colors only, no gradients, no shading, no texture, no text. Transparent background (if not possible, pure white #FFFFFF). Only the single part described below, centered on a 1024x1024 canvas, nothing else (no face outline).
```

## 빈 얼굴
### `base_01.png` — 기본 동그란 얼굴
- 어울리는 감정: -  ·  목표 크기: 약 **800×800 px**
- 프롬프트: `A plain round face outline, thick dark line, filled pure white inside. No eyes, nose, mouth, ears or hair. Size about 800x800px, centered.`

## 눈썹
### `brow_01.png` — 평평한 눈썹
- 어울리는 감정: 편안함  ·  목표 크기: 약 **440×80 px**
- 프롬프트: `A pair of straight, flat, short eyebrows side by side. Size about 440x80px, centered.`

### `brow_02.png` — 위로 둥글게 올라간 눈썹
- 어울리는 감정: 놀람/기쁨  ·  목표 크기: 약 **440×80 px**
- 프롬프트: `A pair of raised, gently arched eyebrows (surprised or happy). Size about 440x80px, centered.`

### `brow_03.png` — 안쪽이 내려간 화난 눈썹 ＼ ／
- 어울리는 감정: 분노/불편함  ·  목표 크기: 약 **440×90 px**
- 프롬프트: `A pair of angry eyebrows: inner ends point down toward the center, outer ends up, like \ /. Size about 440x90px, centered.`

### `brow_04.png` — 안쪽이 올라간 처진 눈썹 ／ ＼
- 어울리는 감정: 슬픔/두려움  ·  목표 크기: 약 **440×90 px**
- 프롬프트: `A pair of worried/sad eyebrows: inner ends raised toward the center, outer ends droop down, like / \. Size about 440x90px, centered.`

### `brow_05.png` — 한쪽만 올라간 눈썹
- 어울리는 감정: 놀람/불편함  ·  목표 크기: 약 **440×100 px**
- 프롬프트: `A pair of eyebrows: the left one flat, the right one raised high in an arch (skeptical). Size about 440x100px, centered.`

### `brow_06.png` — 구불구불 떨리는 눈썹
- 어울리는 감정: 두려움  ·  목표 크기: 약 **440×80 px**
- 프롬프트: `A pair of short wavy, trembling (zigzag-wave) eyebrows. Size about 440x80px, centered.`

## 눈
### `eye_01.png` — 동그란 기본 눈
- 어울리는 감정: 편안함/무기력함  ·  목표 크기: 약 **440×120 px**
- 프롬프트: `A pair of simple solid round dot eyes. Size about 440x120px, centered.`

### `eye_02.png` — 웃는 눈 ∩ ∩
- 어울리는 감정: 기쁨  ·  목표 크기: 약 **440×120 px**
- 프롬프트: `A pair of happy closed smiling eyes shaped like upside-down U arcs (∩ ∩). Size about 440x120px, centered.`

### `eye_03.png` — 크게 뜬 눈
- 어울리는 감정: 놀람/두려움  ·  목표 크기: 약 **440×140 px**
- 프롬프트: `A pair of wide-open big round eyes: white eyeball with outline and small dark pupil in the center. Size about 440x140px, centered.`

### `eye_04.png` — 감은 눈 — —
- 어울리는 감정: 편안함/무기력함  ·  목표 크기: 약 **440×80 px**
- 프롬프트: `A pair of calmly closed eyes drawn as short straight horizontal lines. Size about 440x80px, centered.`

### `eye_05.png` — 찡그린 눈 > <
- 어울리는 감정: 분노/불편함/기쁨  ·  목표 크기: 약 **440×120 px**
- 프롬프트: `A pair of tightly squeezed eyes shaped like > and < (left eye >, right eye <). Size about 440x120px, centered.`

### `eye_06.png` — 눈물 고인 눈
- 어울리는 감정: 슬픔/두려움  ·  목표 크기: 약 **440×140 px**
- 프롬프트: `A pair of round eyes with dark pupils and light-blue tears pooling at the bottom of each eye. Size about 440x140px, centered.`

### `eye_07.png` — 반쯤 감긴 눈
- 어울리는 감정: 무기력함  ·  목표 크기: 약 **440×100 px**
- 프롬프트: `A pair of sleepy half-closed eyes: flat top eyelid line with a half-circle dark eye below. Size about 440x100px, centered.`

## 코
### `nose_01.png` — 작은 점 코
- 어울리는 감정: -  ·  목표 크기: 약 **120×100 px**
- 프롬프트: `A tiny simple dot nose. Size about 120x100px, centered.`

### `nose_02.png` — 동그란 코
- 어울리는 감정: -  ·  목표 크기: 약 **120×100 px**
- 프롬프트: `A small simple rounded nose drawn as a short curved line (like a small u). Size about 120x100px, centered.`

### `nose_03.png` — 세모 코
- 어울리는 감정: -  ·  목표 크기: 약 **120×110 px**
- 프롬프트: `A small simple nose drawn as an L-shaped / triangle line. Size about 120x110px, centered.`

## 입
### `mouth_01.png` — 웃는 입
- 어울리는 감정: 기쁨/편안함  ·  목표 크기: 약 **300×130 px**
- 프롬프트: `A gentle smiling mouth: one curved line like a U. Size about 300x130px, centered.`

### `mouth_02.png` — 활짝 웃는 입
- 어울리는 감정: 기쁨  ·  목표 크기: 약 **300×150 px**
- 프롬프트: `A big open laughing mouth: half-moon shape, dark inside with a row of white upper teeth. Size about 300x150px, centered.`

### `mouth_03.png` — 처진 입
- 어울리는 감정: 슬픔/불편함  ·  목표 크기: 약 **300×130 px**
- 프롬프트: `A sad frowning mouth: one curved line like an upside-down U. Size about 300x130px, centered.`

### `mouth_04.png` — 일자 입
- 어울리는 감정: 무기력함/불편함  ·  목표 크기: 약 **300×60 px**
- 프롬프트: `A flat, straight horizontal line mouth (bored, neutral). Size about 300x60px, centered.`

### `mouth_05.png` — 동그랗게 벌린 입 O
- 어울리는 감정: 놀람/두려움  ·  목표 크기: 약 **300×150 px**
- 프롬프트: `A small open round O-shaped mouth (surprised). Size about 300x150px, centered.`

### `mouth_06.png` — 이 악문 입
- 어울리는 감정: 분노/두려움  ·  목표 크기: 약 **300×140 px**
- 프롬프트: `A wide clenched-teeth mouth: rounded rectangle outline with visible teeth grid inside. Size about 300x140px, centered.`

### `mouth_07.png` — 삐죽 입
- 어울리는 감정: 불편함/분노  ·  목표 크기: 약 **300×110 px**
- 프롬프트: `A pouting, lopsided crooked mouth line (sulky). Size about 300x110px, centered.`

### `mouth_08.png` — 물결 입
- 어울리는 감정: 두려움/불편함  ·  목표 크기: 약 **300×90 px**
- 프롬프트: `A trembling wavy (squiggly) line mouth (nervous). Size about 300x90px, centered.`

## 꾸미기
### `extra_cheek.png` — 볼터치(양쪽)
- 어울리는 감정: 기쁨/불편함  ·  목표 크기: 약 **580×90 px**
- 프롬프트: `A pair of soft pink oval blush marks side by side, semi-transparent, no outline. Size about 580x90px, centered.`

### `extra_tear.png` — 눈물방울
- 어울리는 감정: 슬픔  ·  목표 크기: 약 **80×120 px**
- 프롬프트: `A single light-blue teardrop. Size about 80x120px, centered.`

### `extra_sweat.png` — 땀방울
- 어울리는 감정: 두려움/놀람  ·  목표 크기: 약 **80×120 px**
- 프롬프트: `A single light-blue sweat drop with dark outline. Size about 80x120px, centered.`

### `extra_angry.png` — 화남 표시
- 어울리는 감정: 분노  ·  목표 크기: 약 **120×120 px**
- 프롬프트: `A cartoon anger symbol (four short curved red marks forming a cross-vein mark). Size about 120x120px, centered.`

### `extra_heart.png` — 하트
- 어울리는 감정: 기쁨  ·  목표 크기: 약 **120×110 px**
- 프롬프트: `A small pink-red heart. Size about 120x110px, centered.`
