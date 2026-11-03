---
name: review-quiz
description: 제조 AX 강의 시리즈의 복습퀴즈(4지선다·OX) PPT, TTS 대본, 문항·정답 목록을 만들거나 고칠 때 사용
---

# 복습퀴즈 만들기

## 구조
- 생성기: `quizNN/build/build_quiz.js` (pptxgenjs). 인자로 문항 데이터 파일을 받습니다.
- 데이터: `quiz_data.js`(일반), `quiz_data_basic.js`(기초). 내보내는 값: `META {title, file}`, `PAUSE`, `INTRO`, `SECTIONS`, `OUTRO`, `Q`.
- 문항 `Q[i]`: `lec`(강 번호), `type`("mc" 4지선다 / "ox"), `q`, `opts`, `ans`(0부터), `expl`(해설 bullet 2~3개), `ref`("3강 3장 · 제목" 식 복습 위치), `nq`(문제 슬라이드 낭독), `na`(정답 슬라이드 낭독).

## 규칙
- 강의마다 10문항, 강의 순서대로. 기초판은 핵심 용어·개념 중심, 일반판은 사례·판단 문제 포함.
- 문제 슬라이드 다음에 정답·해설 슬라이드. 문제 낭독 끝에 `PAUSE`(" 답을 골라 보세요.")로 생각할 시간을 줍니다.
- `nq`에 보기를 "일번, … 이번, …"으로 읽어 줍니다. 숫자·약어는 소리 나는 대로 (0.1%→영점일 퍼센트).
- 문항은 반드시 해당 강의 `notes.js` 대본에 나온 내용으로만 만들고, `ref`가 실제 슬라이드와 맞는지 확인합니다.
- 정답 보기 위치가 한쪽으로 몰리지 않게 섞습니다.

## 빌드
```bash
npm run build:quiz34         # 또는 build:quiz34-basic, build:quiz12
```
PPT, `*_대본_TTS용.txt`, `*_문항과정답.md`가 퀴즈 폴더에 함께 생성됩니다. 새 퀴즈는 폴더를 복사하고 `build_quiz.js`의 `OUT_DIR`, `LECTURE`, 서수 문장(`lead`)을 맞춘 뒤 `package.json`에 스크립트를 추가합니다.
