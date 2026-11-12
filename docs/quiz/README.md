# 인터랙티브 복습 퀴즈 플레이어

퀴즈 영상을 보다가 문항마다 영상이 멈추고, 학생이 답을 고르면 정답과 해설이 나온 뒤 영상이 이어지는 웹페이지입니다.
GitHub Pages로 배포하고, LearningX에서는 **MyCMS → 웹링크**로 주소를 등록합니다.

## 주소
GitHub Pages(설정 → Pages → `main` 브랜치 `/docs` 폴더)를 켜면 아래 주소로 열립니다.

| 퀴즈 | 주소 |
|---|---|
| 1·2강 기초 복습 퀴즈 | `https://ykkimhgu.github.io/intro-mce-freshman-course/quiz/?set=quiz12` |
| 3·4강 복습 퀴즈 | `https://ykkimhgu.github.io/intro-mce-freshman-course/quiz/?set=quiz34` |
| 3·4강 기초 복습 퀴즈 | `https://ykkimhgu.github.io/intro-mce-freshman-course/quiz/?set=quiz34-basic` |

영상이나 멈춤 시점이 아직 없으면 영상 없이 문제만 순서대로 풉니다.

## 영상 연결 순서
1. 퀴즈 PPT와 TTS 대본으로 영상을 만듭니다.
2. 영상을 YouTube에 **일부 공개**로 올립니다. (MP4 주소를 직접 써도 됩니다.)
3. `tools/quiz_player_config.json`에서 해당 퀴즈의 `video.youtube`에 영상 ID(주소의 `v=` 뒤 11자리)를 넣습니다.
4. 문항별 멈춤 시점을 정합니다. 둘 중 하나를 쓰세요.
   - 자동: `npm run player:pauses -- quiz12 영상.mp4`
     ffmpeg로 슬라이드가 바뀌는 순간을 찾아, 정답 슬라이드가 시작되기 0.4초 전을 멈춤 시점으로 씁니다.
   - 직접: 플레이어 주소 끝에 `&setup=1`을 붙여 열고, 문제 슬라이드 낭독이 끝날 때마다 버튼을 누른 뒤 결과를 `pauses`에 붙여 넣습니다.
5. `npm run build:player`로 `docs/quiz/data/*.json`을 다시 만들고 커밋합니다.

## 동작
- 아직 풀지 않은 문항의 멈춤 시점을 지나면 영상이 멈추고 영상 아래에 선택지가 뜹니다. 앞으로 건너뛰어도 풀지 않은 첫 문항으로 돌아옵니다.
- 답을 고르면 정답과 해설, 복습할 강의 장면이 나오고, "해설 듣기"를 누르면 정답 슬라이드부터 영상이 이어집니다.
- 영상 아래 번호 점으로 진행 상황을 보고, 푼 문제는 눌러서 해설 부분으로 돌아갈 수 있습니다.
- 끝나면 점수, 틀린 문제와 복습 위치가 나옵니다. 학번과 이름을 넣고 "결과 복사"를 누르면 LearningX 게시판이나 과제에 붙여 넣을 수 있습니다.
- 푼 기록은 학생 브라우저에만 남습니다. 서버에 성적이 쌓이지 않으므로, 성적이 필요하면 LearningX 퀴즈를 함께 쓰세요.

## 파일
- `index.html`, `player.js`, `player.css` : 플레이어
- `data/<이름>.json` : `tools/build_quiz_player.js`가 `quizNN/build/quiz_data*.js`에서 만든 문항 데이터 (직접 고치지 마세요)
- `tools/quiz_player_config.json` : 영상 주소와 멈춤 시점
