# 전공소개 동영상 강의 제작 (제조 AX 혁신과 공학진로)

한동대학교 기계제어공학부 김영근 교수의 1학년 대상 전공소개 강의 시리즈 작업 저장소입니다.
주제는 제조 AX, 스마트팩토리, 산업인공지능입니다. 작업 흐름은 **PPT 제작 → 슬라이드별 대본 → 교수님 목소리 AI(TTS)로 강의 영상 생성**입니다.

## 시리즈 구성
- 1강 제조 AX와 스마트팩토리 (`lecture1/`, 빌드: `lecture-series/lecture1_build_reference.js`)
- 2강 제조 AX·AI 팩토리 기술동향 (`lecture2/src/`)
- 3강 영상기반 품질검사 사례 (`lecture3/src/`)
- 4강 고장진단·예측과 공정최적화 (`lecture4/build/`)
- 복습퀴즈: `quiz12/`(1–2강 기초), `quiz34/`(3–4강 일반·기초)

## 반드시 지킬 것
- 스타일은 `lecture-series/style.md`가 기준입니다 (`series-style/`는 폐기된 제안).
- 발표자 노트 = 대본 전문. 대본 원문은 각 빌드 폴더의 `notes.js`(퀴즈는 `quiz_data*.js`)에 있고, PPT와 `*_대본_TTS용.txt`는 여기서 만듭니다.
- TTS용 대본은 `[슬라이드 N]` 머리줄 + 한 단락. 영문 약어와 숫자는 읽는 소리로 씁니다 (AI→에이아이, AX→에이엑스, BMW→비엠더블유, 2024년→이천이십사년, 0.1%→영점일 퍼센트, ①→일번). 가운뎃점(·)은 쉼표로.
- 사진은 라이선스가 확인된 것만 (Wikimedia Commons CC BY / CC BY-SA / 퍼블릭 도메인). 출처를 슬라이드에 8pt 회색으로 표기하고 `lectureN/image_credits.md`와 `lecture-series/images/lectureN/credits*.json`에 기록합니다.
- 사례 영상은 가능하면 기업 공식 채널. 목록은 `lecture-series/thumbnails/lectureN/videos.json`(썸네일 경로는 저장소 루트 기준 상대경로).
- 이 저장소는 **공개(public)** 입니다. 비공개 자료, 출처 불명 이미지, 음성 샘플은 올리지 마세요.

## 빌드
```bash
npm install            # 저장소 루트에서 한 번
npm run build:2        # 1·2·3·4, quiz12, quiz34, quiz34-basic
```
- 스크립트의 경로는 `tools/repo.js`의 `ROOT`(저장소 루트) 기준입니다. 절대경로를 새로 넣지 마세요.
- `tools/repo.js`의 `applyTheme`가 pptx 테마 색을 시리즈 색으로 바꿔 씁니다.
- 1·2·3강은 `OUT=경로` 환경변수로 출력 위치를 바꿀 수 있습니다. 4강과 퀴즈는 저장소 안의 결과 파일을 덮어씁니다.
- 1강 영상클립 버전: `python3 lecture1/src/add_clips.py 원본.pptx 결과.pptx lecture1/src/clips.json` (썸네일 클릭 시 YouTube 10초 구간 재생).
- 빌드 후에는 슬라이드를 이미지로 렌더링해서 글자 넘침·겹침을 눈으로 확인합니다 (LibreOffice: `soffice --headless --convert-to pdf`).

## 관련 스킬
- `.claude/skills/lecture-deck` : 새 강의 PPT·대본 만들기, 기존 강의 고치기
- `.claude/skills/review-quiz` : 복습퀴즈 PPT·대본 만들기
