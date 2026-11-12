# CLAUDE.md — 마음방

특수교육대상 초등 학생용 **감정 표현 갤러리 웹앱**. 교사가 방을 만들고, 학생이 QR/숫자 코드로 들어와 얼굴·색·모양·그림으로 감정을 표현해 갤러리에 올린다.

- 기능 전체: **`docs/PLAN.md`** (기획서 v4.1) — 작업 전에 해당 장을 꼭 읽기
- 그림 에셋: **`에셋/`** — `00_먼저읽기_README.md`, `STYLE_GUIDE.md` 참고
- 만든 사람: 특수교사 은티 (정은). 반말·짧은 한국어로 소통, 화면 단위로 만들고 눈으로 확인하며 진행

## 작업 방식 (꼭 지키기)
1. **단계(Phase)별로 만들고, 단계가 끝나면 멈춰서** 무엇을 했는지 + 확인 방법(`npm run dev` 주소, 눌러볼 순서)을 알려 주고 다음으로 넘어가도 되는지 묻기
2. 길게 선택지를 묻지 말고 합리적으로 정해서 바로 만들기. 정한 것은 한 줄로 알려 주기
3. 되돌리기 어려운 일(DB 스키마 변경 적용, 배포, 파일 삭제)은 먼저 물어보기
4. 화면 문구는 아이 눈높이 한국어, 끝말은 "~해요"

## 기술 스택
- **Vite + React + TypeScript**, 라우팅 React Router, 스타일 CSS Modules 또는 Tailwind (하나 골라 통일)
- **Supabase**: Postgres + Storage + Realtime (supabase-js). 프로젝트 정보는 `.env.local`의 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — 처음에 어떤 Supabase 프로젝트를 쓸지 물어보기
- 배포: **Vercel** (배포는 정은이 직접. 배포 전 꼭 물어보기)
- 라이브러리 예: `qrcode`(QR), `jszip`(ZIP 내려받기), `papaparse`(CSV). CSV는 `TextDecoder`로 UTF-8 먼저, 깨지면 `euc-kr`로 다시 읽기

## 모든 화면 공통 규칙
- **좌측 상단: 전체화면 버튼 / 우측 상단: 교사 모드(설정) 버튼**
- **하단 저작권**: `© 2026 특수교사 은티 · @special_eun_t`
  - 인스타 주소는 **첫 화면에서만 링크**(https://www.instagram.com/special_eun_t/), 다른 화면에서는 글자만
  - "무단 복제·배포 금지" 같은 문구 넣지 않기
- 터치 기준: 버튼·카드 최소 64px, 드래그와 탭 둘 다 지원 (끌기가 어려운 학생은 탭으로)
- 낱말·안내는 **읽어 주기(TTS)**: Web Speech API `ko-KR`, 설정에서 켜고 끄기
- 전자칠판(가로 큰 화면)과 태블릿(가로·세로) 모두 깨지지 않게

## 디자인 방향
- 따뜻하고 말랑한 느낌, 아이 스티커 같은 그림과 어울리게. 둥근 모서리(16~24px), 부드러운 그림자 약하게
- 바탕 `#FFF8EE`(크림), 글자·선 `#3A2E2A`, 흰 카드 `#FFFFFF`
- 큰 감정 7묶음 색 (크기 1→5 진하기는 `에셋/STYLE_GUIDE.md` 표 그대로)

  | 기쁨 | 놀람 | 분노 | 불편함 | 슬픔 | 두려움 | 무기력함 |
  |---|---|---|---|---|---|---|
  | `#F9C74F` | `#F8961E` | `#E5484D` | `#6BBF59` | `#4D96FF` | `#5B5FC7` | `#A27FD6` |
- 글꼴: 본문 Pretendard, 제목은 둥근 손글씨 느낌 한글 웹폰트 하나 (예: Jua)
- 그림은 모두 `에셋/`의 PNG 사용. 이모지는 그림이 없을 때만

## 에셋 사용법
- 앱에 넣을 때 `에셋/*/완성/*.png`를 `public/assets/`로 복사 (원본 폴더는 건드리지 않기)
  - `01_얼굴부품/완성` → `public/assets/face/` (30개)
  - `02_감정낱말그림/완성` → `public/assets/words/` (대표 7 + 낱말 43)
  - `03_모양조각/완성` → `public/assets/shapes/` (8개)
- 모든 그림: **1024×1024 투명 PNG, 그림은 가운데**, 주변은 투명 여백
- **감정 기본 데이터**: `에셋/02_감정낱말그림/words_list.csv` → `src/data/emotions.ts` 기본값으로 변환
  - 파일 이름 규칙: `group_<key>` 대표, `<key>_1~5` 수직선 낱말(포스터1), `<key>_x1…` 추가 낱말(포스터2, 기본 위치는 CSV의 크기 값)
  - key: joy 기쁨 · surprise 놀람 · anger 분노 · discomfort 불편함 · sadness 슬픔 · fear 두려움 · lethargy 무기력함
- **얼굴 부품 태그**: `에셋/01_얼굴부품/parts_list.csv`의 '어울리는 큰 감정' (`/`로 여러 개) → 3단계 판정·교사 편집 기본값
- **얼굴 조립 (`에셋/01_얼굴부품/zones.json`)**
  - 2000×2000 얼굴 좌표계. 부품마다 **투명 여백을 잘라낸(bbox) 뒤, 그 부위 zone 상자 안 가운데에 비율 유지해 맞춤**
  - 빈 얼굴(base_01)은 잘라낸 뒤 1600×1600으로 (200,200)에 배치
  - bbox는 빌드 시 스크립트로 미리 계산해 `src/data/partBounds.json`으로 저장 권장 (런타임 계산도 가능)
  - 이 방식으로 실제 에셋을 조립해 확인함 → 기쁨·슬픔·분노·놀람 얼굴이 자연스럽게 맞음
  - 단계별 활동의 **반투명 그림자 = 같은 PNG를 회색·투명도 30%로** 그리기 (그림자 그림 따로 없음)
  - 자유 모드에서는 zone 위치에서 시작해 끌기·크기·회전·뒤집기 가능
- 모양 조각은 흰 채움+선 → 앱에서 색 입히기 (예: CSS `mask` 또는 캔버스에서 흰 영역만 칠하기)

## Supabase 설계 원칙 (로그인 없음)
- 테이블: `rooms`(id uuid, code 6자리 숫자 unique, name, pin_hash, teacher_key_hash, is_open, settings jsonb, created_at), `students`(id, room_id, name, order, image_path), `works`(id, room_id, student_id, activity, group_key, word, intensity 1~5, reason, image_path, created_at)
- 교사 권한 = 방 만들 때 발급한 **teacher_key**(무작위 긴 문자열)를 브라우저(쿠키+localStorage)에 저장, DB에는 해시만
- **쓰기·삭제는 RLS로 막고 `security definer` RPC 함수로만**: 교사용 함수는 teacher_key(또는 code+PIN)를 검사, 학생용 `submit_work`는 방 code·열림 여부·student 소속을 검사
- 읽기: 학생은 `get_room_by_code`로 room_id·명단·설정을 받음. 갤러리 Realtime을 위해 works는 room_id로 읽기 허용 (room_id는 uuid라 추측 어려움)
- 대시보드 데이터(감정 기록 전체 조회)는 교사 RPC로만
- Storage: `works` 버킷(작품 PNG, 경로 `room_id/work_id.png`), `room-assets` 버킷(교사가 올린 학생·낱말 그림)
- 방 삭제 시 works·students·Storage 파일까지 함께 삭제
- 스키마는 `supabase/migrations/`에 SQL로 남기기

## 만드는 순서 (Phase)
1. **뼈대**: 프로젝트 생성, 공통 레이아웃(전체화면·교사 버튼·저작권), 첫 화면(선생님 / 학생 / 혼자 하기), 에셋 복사 + emotions.ts·partBounds.json 생성
2. **방**: Supabase 스키마·RPC, 방 만들기(코드·QR·PIN), 내 방 목록(쿠키), PIN으로 권한 되찾기, 학생 명단(CSV·붙여넣기·직접 입력), 학생 입장(코드 키패드·QR·이름 버튼)
3. **감정 이름 붙이기**: 큰 감정 7 카드 → 드래그 수직선(크기·낱말) → 이유 문장(선택), TTS. 교사 감정 목록 편집
4. **갤러리**: 올리기, Realtime 카드, 보기 필터, 크게 보기·슬라이드쇼, 교사 삭제, PNG 저장·공유
5. **활동**: 그림으로 → 색으로 → 얼굴로(단계별 1·2·3 + 자유) → 모양으로
6. **ZIP 내려받기 + 감정 기록 대시보드** (학생별·날짜별·흐름, 인쇄, CSV)
7. **활동지 인쇄** (`docs/PLAN.md` 9장, A4 `@page`, 미리보기)
8. 디자인 다듬기, 전자칠판·태블릿 확인

## 하지 말 것
- 에셋 원본(`에셋/`) 수정·삭제
- 기존 감정 포스터 캐릭터를 흉내 낸 그림 추가
- 학생에게 직접 이름 입력 받기 (명단에서 고르기만)
- 교사 확인 없이 갤러리 올리기를 막는 승인 단계 추가 (바로 올라가는 게 기획)
