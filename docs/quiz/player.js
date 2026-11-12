// 인터랙티브 복습 퀴즈 플레이어
// 주소: index.html?set=quiz12  (quiz12 | quiz34 | quiz34-basic)
//   &setup=1      교수자용 멈춤 시점 설정 화면
//   &yt=영상ID    YouTube 영상을 임시로 지정 (설정 파일보다 우선)
//   &mp4=주소     MP4 영상을 임시로 지정
// 문항 데이터: data/<set>.json (tools/build_quiz_player.js 가 만듭니다)
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const SET = (params.get("set") || "quiz12").replace(/[^a-z0-9-]/gi, "");
  const SETUP = params.get("setup") === "1";
  const NUM = ["①", "②", "③", "④"];
  const KEY = "mce-quiz:" + SET;

  let D = null;          // 문항 데이터
  let player = null;     // 영상 어댑터 {time, play, pause, seek}
  let answers = {};      // 문항 번호 → 고른 보기 번호 | "skip"
  let current = null;    // 지금 패널에 띄운 문항
  let marks = [];        // 설정 모드에서 표시한 시점

  // ---------- 저장 ----------
  function load() {
    try { answers = JSON.parse(localStorage.getItem(KEY) || "{}").answers || {}; } catch (e) { answers = {}; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ answers })); } catch (e) { /* 저장 안 돼도 진행 */ }
  }

  // ---------- 영상 ----------
  function mp4Player(src) {
    const v = document.createElement("video");
    v.src = src; v.controls = true; v.playsInline = true; v.preload = "metadata";
    $("video-box").appendChild(v);
    const p = {
      time: () => v.currentTime, play: () => v.play(), pause: () => v.pause(),
      seek: (t) => { v.currentTime = t; }, playing: () => !v.paused && !v.ended,
    };
    v.addEventListener("ended", finishIfDone);
    const loop = () => { tick(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    return p;
  }

  function ytPlayer(id) {
    const holder = document.createElement("div");
    holder.id = "yt";
    $("video-box").appendChild(holder);
    const p = { time: () => 0, play() {}, pause() {}, seek() {}, playing: () => false };
    window.onYouTubeIframeAPIReady = function () {
      const y = new YT.Player("yt", {
        videoId: id,
        playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
        events: {
          onReady() {
            p.time = () => y.getCurrentTime();
            p.play = () => y.playVideo();
            p.pause = () => y.pauseVideo();
            p.seek = (t) => y.seekTo(t, true);
            p.playing = () => y.getPlayerState() === YT.PlayerState.PLAYING;
            setInterval(tick, 100);
          },
          onStateChange(e) { if (e.data === YT.PlayerState.ENDED) finishIfDone(); },
        },
      });
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
    return p;
  }

  function noVideo() {
    const box = document.createElement("div");
    box.className = "empty";
    $("video-box").classList.add("none");
    box.textContent = "영상이 아직 연결되지 않았습니다. 아래에서 문제를 바로 풀 수 있습니다.";
    $("video-box").appendChild(box);
    return null;
  }

  // 영상 재생 중에 계속 불림: 아직 안 푼 문항의 멈춤 시점을 지나면 멈추고 문제를 띄웁니다.
  // 앞으로 건너뛰어도 안 푼 첫 문항으로 되돌아옵니다.
  function tick() {
    if (SETUP || current || !player) return;
    const t = player.time();
    const q = D.questions.find((x) => x.pause !== null && answers[x.n] === undefined && t >= x.pause);
    if (!q) return;
    player.pause();
    if (t > q.pause + 0.6) player.seek(q.pause);
    show(q);
  }

  // ---------- 문항 패널 ----------
  function lecName(lec) {
    const s = D.sections.find((x) => x.lec === lec);
    return s ? s.title : lec + "강";
  }

  function show(q) {
    current = q;
    const panel = $("panel");
    panel.hidden = false;
    panel.classList.add("active");
    $("q-tag").textContent = "문제 " + q.n + (q.type === "ox" ? " · O / X" : "");
    $("q-lec").textContent = lecName(q.lec);
    $("q-text").textContent = q.q;
    const opts = $("opts");
    opts.innerHTML = "";
    opts.className = "opts" + (q.type === "ox" ? " ox" : q.opts.some((o) => o.length > 18) ? " long" : "");
    q.opts.forEach((o, k) => {
      const b = document.createElement("button");
      b.className = "opt";
      b.type = "button";
      if (q.type === "ox") b.textContent = o;
      else b.innerHTML = '<span class="num">' + (k + 1) + "</span><span></span>";
      if (q.type !== "ox") b.lastChild.textContent = o;
      b.setAttribute("aria-label", q.type === "ox" ? o : (k + 1) + "번 " + o);
      b.addEventListener("click", () => pick(q, k));
      opts.appendChild(b);
    });
    $("feedback").hidden = true;
    $("skip-row").hidden = false;
    renderDots();
    if (answers[q.n] !== undefined) reveal(q, answers[q.n]);
    else if (window.innerWidth < 900) panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function pick(q, k) {
    if (answers[q.n] !== undefined) return;
    answers[q.n] = k;
    save();
    reveal(q, k);
    renderStatus();
  }

  function reveal(q, k) {
    const btns = [...$("opts").children];
    btns.forEach((b, i) => {
      b.disabled = true;
      if (i === q.ans) b.classList.add("correct");
      else if (i === k) b.classList.add("picked", "wrong");
      else b.classList.add("dim");
    });
    const ansText = q.type === "ox" ? q.opts[q.ans] : NUM[q.ans] + " " + q.opts[q.ans];
    const v = $("verdict");
    if (k === "skip") { v.className = "verdict no"; v.textContent = "건너뛴 문제입니다. 정답은 " + ansText; }
    else if (k === q.ans) { v.className = "verdict ok"; v.textContent = "정답입니다!"; }
    else { v.className = "verdict no"; v.textContent = "아쉬워요. 정답은 " + ansText; }
    const ul = $("expl");
    ul.innerHTML = "";
    q.expl.forEach((e) => { const li = document.createElement("li"); li.textContent = e; ul.appendChild(li); });
    $("ref").textContent = "복습: " + q.ref;
    $("feedback").hidden = false;
    $("skip-row").hidden = true;
    const last = D.questions[D.questions.length - 1] === q;
    $("next").textContent = player ? "해설 듣기 ▶" : last ? "결과 보기" : "다음 문제 ▶";
    $("next").focus({ preventScroll: true });
    renderDots();
  }

  function next() {
    const q = current;
    current = null;
    $("panel").classList.remove("active");
    if (player) {
      $("panel").hidden = true;
      player.play();
      return;
    }
    const nx = D.questions.find((x) => x.n > q.n && answers[x.n] === undefined) || D.questions.find((x) => answers[x.n] === undefined);
    if (nx) show(nx); else { $("panel").hidden = true; finish(); }
  }

  function skip() {
    if (!current || answers[current.n] !== undefined) return;
    answers[current.n] = "skip";
    save();
    reveal(current, "skip");
    renderStatus();
  }

  // ---------- 진행 표시 ----------
  function stats() {
    const qs = D.questions;
    const done = qs.filter((q) => answers[q.n] !== undefined).length;
    const ok = qs.filter((q) => answers[q.n] === q.ans).length;
    return { total: qs.length, done, ok };
  }

  function renderStatus() {
    const s = stats();
    $("done").textContent = s.done;
    $("total").textContent = s.total;
    $("score").textContent = s.ok;
    $("bar-fill").style.width = (100 * s.done / s.total) + "%";
    renderDots();
  }

  function renderDots() {
    const box = $("dots");
    box.innerHTML = "";
    D.questions.forEach((q) => {
      const a = answers[q.n];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dot" + (a === undefined ? "" : a === "skip" ? " skip" : a === q.ans ? " ok" : " no") + (current === q ? " now" : "");
      b.textContent = q.n;
      b.title = "문제 " + q.n + (a === undefined ? "" : a === q.ans ? " · 정답" : a === "skip" ? " · 건너뜀" : " · 오답");
      b.addEventListener("click", () => jump(q));
      box.appendChild(b);
    });
  }

  // 점 클릭: 푼 문제는 그 정답 해설 부분으로 이동, 영상이 없으면 그 문제를 띄웁니다.
  function jump(q) {
    if (!player) { show(q); return; }
    if (answers[q.n] === undefined || q.pause === null) return;
    current = null;
    $("panel").hidden = true;
    $("result").hidden = true;
    player.seek(q.pause);
    player.play();
  }

  // ---------- 결과 ----------
  function finishIfDone() {
    if (SETUP) return;
    finish();
  }

  function finish() {
    const s = stats();
    const r = $("result");
    r.hidden = false;
    $("result-title").textContent = s.total + "문제 중 " + s.ok + "문제를 맞혔습니다";
    $("result-sub").textContent = s.done < s.total
      ? "아직 풀지 않은 문제가 " + (s.total - s.done) + "개 있습니다."
      : s.ok === s.total ? "모두 맞혔습니다. 훌륭합니다!" : "틀린 문제는 아래 강의 장면으로 돌아가 다시 살펴보세요.";
    const sum = $("summary");
    sum.innerHTML = "";
    D.summary.forEach((t) => { const li = document.createElement("li"); li.textContent = t; sum.appendChild(li); });
    const wrong = D.questions.filter((q) => answers[q.n] !== q.ans);
    $("wrong-title").hidden = wrong.length === 0;
    const ul = $("wrong");
    ul.innerHTML = "";
    wrong.forEach((q) => {
      const li = document.createElement("li");
      li.innerHTML = "<b></b> <span></span><br><span class=r></span>";
      li.children[0].textContent = "문제 " + q.n + ".";
      li.children[1].textContent = q.q;
      li.children[3].textContent = "복습: " + q.ref;
      ul.appendChild(li);
    });
    try { $("who").value = localStorage.getItem("mce-quiz:who") || ""; } catch (e) { /* 무시 */ }
    r.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resultText() {
    const s = stats();
    const who = $("who").value.trim();
    try { localStorage.setItem("mce-quiz:who", who); } catch (e) { /* 무시 */ }
    const marks = D.questions.map((q) => {
      const a = answers[q.n];
      return q.n + (a === undefined ? "-" : a === q.ans ? "○" : "×");
    }).join(" ");
    return "[" + D.title + "] " + (who || "(이름 없음)") + "\n점수: " + s.ok + " / " + s.total +
      (s.done < s.total ? " (미응답 " + (s.total - s.done) + ")" : "") + "\n문항별: " + marks;
  }

  function copy(text, hintEl, okMsg) {
    const done = () => { if (hintEl) hintEl.textContent = okMsg; };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, () => fallback());
    } else fallback();
    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { prompt("아래 내용을 복사하세요", text); }
      ta.remove();
    }
  }

  function again() {
    answers = {};
    save();
    $("result").hidden = true;
    $("panel").hidden = true;
    current = null;
    renderStatus();
    if (player) { player.seek(0); player.play(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else show(D.questions[0]);
  }

  // ---------- 설정 모드 ----------
  function fmt(t) {
    const m = Math.floor(t / 60), s = t - m * 60;
    return m + ":" + (s < 10 ? "0" : "") + s.toFixed(1);
  }
  function renderSetup() {
    const n = marks.length;
    $("mark").textContent = n < D.questions.length ? "문제 " + (n + 1) + " 멈춤 시점 = 지금" : "모든 문항 완료";
    $("mark").disabled = n >= D.questions.length;
    $("pauses-out").textContent = n
      ? '"pauses": [' + marks.map((t) => t.toFixed(1)).join(", ") + "]\n\n" +
        marks.map((t, i) => "문제 " + (i + 1) + "  " + fmt(t)).join("\n")
      : "아직 표시한 시점이 없습니다.";
  }
  function setupMode() {
    $("setup").hidden = false;
    $("mark").addEventListener("click", () => {
      if (!player) return;
      marks.push(Math.round(player.time() * 10) / 10);
      renderSetup();
    });
    $("unmark").addEventListener("click", () => { marks.pop(); renderSetup(); });
    $("copy-pauses").addEventListener("click", () => copy(JSON.stringify(marks), null, ""));
    renderSetup();
  }

  // ---------- 키보드 ----------
  document.addEventListener("keydown", (e) => {
    if (!current || e.target.tagName === "INPUT") return;
    const q = current;
    if (answers[q.n] === undefined) {
      let k = -1;
      if (/^[1-4]$/.test(e.key)) k = Number(e.key) - 1;
      if (q.type === "ox" && /^[oO]$/.test(e.key)) k = 0;
      if (q.type === "ox" && /^[xX]$/.test(e.key)) k = 1;
      if (k >= 0 && k < q.opts.length) { e.preventDefault(); pick(q, k); }
    }
  });

  // ---------- 시작 ----------
  async function init() {
    D = window.QUIZ_DATA || await fetch("data/" + SET + ".json").then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
    document.title = D.title + " · 인터랙티브 퀴즈";
    $("title").textContent = D.title;
    load();
    const yt = params.get("yt") || (D.video && D.video.youtube);
    const mp4 = params.get("mp4") || (D.video && D.video.mp4);
    const hasPauses = D.questions.some((q) => q.pause !== null);
    if (yt && /^[\w-]{6,20}$/.test(yt)) player = ytPlayer(yt);
    else if (mp4) player = mp4Player(mp4);
    else player = noVideo();
    $("next").addEventListener("click", next);
    $("skip").addEventListener("click", skip);
    $("again").addEventListener("click", again);
    $("copy").addEventListener("click", () => copy(resultText(), $("copy-hint"), "복사했습니다. LearningX에 붙여 넣으세요."));
    renderStatus();
    if (SETUP) { setupMode(); return; }
    if (!player || !hasPauses) {
      // 영상이 없거나 멈춤 시점이 아직 없으면, 영상과 따로 문제를 순서대로 풉니다.
      player = null;
      const first = D.questions.find((q) => answers[q.n] === undefined);
      if (first) show(first); else finish();
    }
  }

  init().catch((err) => {
    $("video-box").innerHTML = '<div class="empty">퀴즈를 불러오지 못했습니다 (' + String(err.message || err) + ").</div>";
  });
})();
