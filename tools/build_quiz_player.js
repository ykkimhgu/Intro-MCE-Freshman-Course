// 복습퀴즈 문항 데이터(quiz_data*.js)를 인터랙티브 퀴즈 플레이어용 JSON으로 바꿉니다.
// 실행: npm run build:player            (모든 퀴즈)
//       npm run build:player -- quiz12  (하나만)
// 입력: tools/quiz_player_config.json  (영상 주소와 문항별 멈춤 시점)
// 출력: docs/quiz/data/<이름>.json      (GitHub Pages로 배포되는 플레이어가 읽는 파일)
const fs = require("fs");
const path = require("path");
const { ROOT } = require("./repo.js");

const CONFIG = path.join(ROOT, "tools/quiz_player_config.json");
const OUT_DIR = path.join(ROOT, "docs/quiz/data");

// 문항 i의 문제 슬라이드 번호 (1부터). build_quiz.js의 슬라이드 순서와 같습니다:
// 1 시작, 2 1부 표지, 문제·정답 쌍, (둘째 강의 첫 문항 앞) 2부 표지, 마지막에 정리
function questionSlide(i, firstOfSecond) {
  return 3 + 2 * i + (i >= firstOfSecond ? 1 : 0);
}

function build(name, cfg) {
  const d = require(path.join(ROOT, cfg.data));
  const lecs = [...new Set(d.Q.map((q) => q.lec))];
  const firstOfSecond = d.Q.findIndex((q) => q.lec === lecs[1]);
  const pauses = cfg.pauses || [];
  if (pauses.length && pauses.length !== d.Q.length)
    console.warn(`  ! ${name}: 멈춤 시점 ${pauses.length}개, 문항 ${d.Q.length}개. 개수가 다릅니다.`);
  const out = {
    name,
    title: cfg.title,
    video: cfg.video || {},
    sections: d.SECTIONS.map((s, k) => ({ title: s.title, lec: lecs[k] })),
    summary: d.SUMMARY || [],
    slides: questionSlide(d.Q.length - 1, firstOfSecond) + 2, // 마지막 정답 슬라이드 + 정리
    questions: d.Q.map((q, i) => ({
      n: i + 1,
      lec: q.lec,
      type: q.type,
      q: q.q,
      opts: q.opts,
      ans: q.ans,
      expl: q.expl,
      ref: q.ref,
      slide: questionSlide(i, firstOfSecond),
      pause: typeof pauses[i] === "number" ? pauses[i] : null,
    })),
  };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, name + ".json");
  fs.writeFileSync(file, JSON.stringify(out, null, 1) + "\n");
  const set = out.questions.filter((q) => q.pause !== null).length;
  console.log(`written ${path.relative(ROOT, file)}  문항 ${out.questions.length}, 멈춤 시점 ${set}개 설정`);
}

if (require.main === module) {
  const all = JSON.parse(fs.readFileSync(CONFIG, "utf8"));
  const only = process.argv[2];
  for (const [name, cfg] of Object.entries(all)) if (!only || only === name) build(name, cfg);
}
module.exports = { build, questionSlide, CONFIG };
