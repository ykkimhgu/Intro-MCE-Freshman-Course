---
name: lecture-deck
description: 제조AX 강의 시리즈의 새 강의 PPT와 TTS 대본을 만들거나, 기존 1~4강 슬라이드·대본·사진·사례영상을 고칠 때 사용
---

# 강의 PPT·대본 만들기

## 1. 기준 자료 읽기
- `lecture-series/style.md` (색, 글꼴, 레이아웃, 사진 출처 규칙)
- 가장 최근 강의의 빌드 스크립트(`lecture4/build/build.js`)와 `notes.js`를 출발점으로 복사합니다. 헬퍼(`card`, `iconCircle`, `header`, `src`, 사진 `fit`, 영상 `thumb`)가 들어 있습니다.

## 2. 구성과 대본
- 15장 안팎. 표지(DARK) → 도입 질문 → 구간(1부/2부…) → 국내·해외 산업 사례 → 정리 → 다음 강의 예고(DARK).
- 대상은 공대 1학년. 전문용어는 처음 나올 때 쉬운 말로 풀고, 실제 기업 사례와 숫자(출처 있는 것)를 씁니다.
- 1장 대본은 "안녕하세요, 여러분. 한동대학교 기계제어공학부 김영근 교수입니다. 제조에이엑스 혁신과 공학진로, N 번째 강의입니다."로 시작합니다.
- 대본은 `notes.js`에 슬라이드 순서대로 문자열 배열로 넣고, 빌드 스크립트가 발표자 노트로 넣습니다. 슬라이드당 약 40초~1분 분량.

## 3. TTS용 대본 파일
`lectureN/N강_대본_TTS용.txt` 형식:
```
[슬라이드 1]
한 단락의 낭독 문장...

[슬라이드 2]
...
```
- 영문 약어·숫자·기호는 소리 나는 대로 (AI→에이아이, AX→에이엑스, PLC→피엘씨, 2024년→이천이십사년, 11%→십일 퍼센트, 1.4조→일점사조).
- 괄호, 화살표, 가운뎃점은 쓰지 않고 문장으로 풉니다.

## 4. 사진과 사례 영상
- 사진: Wikimedia Commons에서 CC BY / CC BY-SA / 퍼블릭 도메인만. `lecture-series/images/lectureN/sNN_이름.jpg`로 저장하고 `credits.json`(키→"사진: 작성자, 라이선스, Wikimedia Commons"), `credits_detail.json`, `lectureN/image_credits.md`(파일, 원본 URL, 작성자, 라이선스 표)를 같이 갱신합니다.
- 영상: 기업 공식 채널 우선. YouTube 페이지에서 채널과 날짜를 직접 확인하고 `lecture-series/thumbnails/lectureN/videos.json`에 key, slide, case, thumbnail(저장소 상대경로), id, url, title, channel, length를 적습니다. 썸네일은 클릭하면 영상이 열리도록 hyperlink를 겁니다.

## 5. 빌드와 확인
```bash
npm install
npm run build:N   # package.json scripts에 새 강의를 추가
```
- 경로는 `require(path.join(__dirname, "../../tools/repo.js")).ROOT` 기준으로 씁니다.
- 저장 후 `applyTheme(out, THEME)`로 테마 색을 적용합니다.
- PDF/이미지로 렌더링해 글자 넘침, 겹침, 바닥글 침범, 사진 출처 누락을 확인하고 고칩니다.
- 대본(`notes.js`)과 TTS 파일의 슬라이드 수가 PPT와 같은지 확인합니다.
