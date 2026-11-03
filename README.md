# Intro-MCE-Freshman-Course

한동대학교 기계제어공학부 1학년 대상 전공소개 동영상 강의 자료입니다.
주제: 제조AX, 스마트팩토리, 산업인공지능.

각 강의는 PPT 슬라이드와 TTS(AI 음성)용 대본으로 구성되며, 슬라이드는 `pptxgenjs` 빌드 스크립트로 생성합니다.

## 구성

| 폴더 | 내용 |
|---|---|
| `lecture1/` | 1강 제조AX와 스마트팩토리 (PPT, 영상클립 버전, 대본, 사례영상) |
| `lecture2/` | 2강 제조AX·AI 팩토리 기술동향 |
| `lecture3/` | 3강 영상기반 품질검사 사례 |
| `lecture4/` | 4강 고장진단·예측과 공정최적화 |
| `quiz12/` | 1–2강 기초 복습퀴즈 |
| `quiz34/` | 3–4강 복습퀴즈 (기초/일반) |
| `lecture-series/` | 시리즈 공통 스타일(`style.md`), 강의별 사진(`images/`)·사례영상 썸네일(`thumbnails/`), 사례영상 목록 |
| `series-style/` | 폐기된 이전 스타일 제안 (참고용) |
| `tools/` | 빌드 공통 도우미 (저장소 경로, 테마 색 적용) |

각 강의 폴더의 `*_대본_TTS용.txt`가 음성 합성용 대본, `src/` 또는 `build/`가 PPT 생성 스크립트입니다.

## 다시 빌드하기

```bash
npm install          # 저장소 루트에서 한 번
npm run build:2      # build:1~4, build:quiz12, build:quiz34, build:quiz34-basic
```

## 다른 컴퓨터에서 Claude로 이어서 작업하기

저장소를 내려받은 폴더에서 Claude Code를 열면 `CLAUDE.md`(작업 규칙)와 `.claude/skills/`(강의 PPT 만들기, 복습퀴즈 만들기 스킬)가 자동으로 읽힙니다.
PPT를 다루는 기본 pptx 스킬은 Claude에 내장되어 있어서 따로 올리지 않았습니다.

## 사진 출처

사용한 사진은 Wikimedia Commons의 CC 라이선스 또는 퍼블릭 도메인 자료이며, 각 강의 폴더의 `image_credits.md`와 `lecture-series/images/*/credits*.json`에 원본·작성자·라이선스를 적어 두었습니다. 사례영상 썸네일(`lecture-series/thumbnails/`)은 각 YouTube 영상에서 가져온 것으로 저작권은 원 게시자에게 있습니다.
