// 완성된 퀴즈 영상에서 슬라이드가 바뀌는 시점을 찾아, 문항별 멈춤 시점을 자동으로 정합니다.
// 실행: npm run player:pauses -- quiz12 영상.mp4
// 멈춤 시점 = 문제 슬라이드 다음(정답 슬라이드)이 시작되기 0.4초 전.
// 결과를 tools/quiz_player_config.json 의 pauses 에 쓰고 docs/quiz/data/<이름>.json 을 다시 만듭니다.
// 필요: ffmpeg. 슬라이드 전환 효과가 길면 잘못 셀 수 있으니, 출력된 슬라이드 수를 꼭 확인하세요.
const fs = require("fs");
const { spawnSync } = require("child_process");
const { build, CONFIG } = require("./build_quiz_player.js");
const { ROOT } = require("./repo.js");
const path = require("path");

const [name, video] = process.argv.slice(2);
if (!name || !video) {
  console.error("사용법: npm run player:pauses -- <quiz12|quiz34|quiz34-basic> <영상.mp4>");
  process.exit(1);
}
const all = JSON.parse(fs.readFileSync(CONFIG, "utf8"));
if (!all[name]) { console.error("설정에 없는 이름: " + name); process.exit(1); }

const BEFORE = 0.4;   // 정답 슬라이드 시작보다 이만큼 앞에서 멈춤
const MERGE = 1.0;    // 이 간격 안의 장면 전환은 하나로 침 (전환 효과)

function sceneChanges(file, threshold) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-an",
    "-vf", `select='gt(scene,${threshold})',showinfo`, "-f", "null", "-"],
    { encoding: "utf8", maxBuffer: 64 << 20 });
  if (r.error) { console.error("ffmpeg을 실행하지 못했습니다: " + r.error.message); process.exit(1); }
  const log = r.stderr || "";
  const times = [];
  for (const m of log.matchAll(/pts_time:([\d.]+)/g)) {
    const t = Number(m[1]);
    if (!times.length || t - times[times.length - 1] > MERGE) times.push(t);
  }
  return times;
}

build(name, all[name]); // 슬라이드 수와 문항별 슬라이드 번호를 최신으로
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/quiz/data", name + ".json"), "utf8"));
const want = data.slides - 1;

// 슬라이드 수와 맞을 때까지 민감도를 바꿔 봅니다.
let starts = null;
for (const th of [0.1, 0.06, 0.15, 0.04, 0.25, 0.03]) {
  const ch = sceneChanges(video, th);
  console.log(`민감도 ${th}: 슬라이드 전환 ${ch.length}개 (필요 ${want}개)`);
  if (ch.length === want) { starts = [0, ...ch]; break; }
}
if (!starts) {
  console.error("슬라이드 전환 수가 맞지 않습니다. 플레이어의 설정 화면(?setup=1)에서 직접 시점을 표시해 주세요.");
  process.exit(2);
}
const pauses = data.questions.map((q) => Math.round((starts[q.slide] - BEFORE) * 10) / 10); // starts[슬라이드번호] = 다음 슬라이드 시작
all[name].pauses = pauses;
fs.writeFileSync(CONFIG, JSON.stringify(all, null, 2) + "\n");
build(name, all[name]);
data.questions.forEach((q, i) => console.log(`문제 ${q.n} (슬라이드 ${q.slide}) 멈춤 ${pauses[i]}초`));
