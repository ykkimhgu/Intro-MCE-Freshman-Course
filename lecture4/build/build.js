// 4강 PPT 생성 스크립트 (pptxgenjs). 1강 참고 구현(lecture-series/lecture1_build_reference.js)의 헬퍼를 그대로 사용.
// 실행: NODE_PATH=<pptxgenjs·sharp·react-icons 설치 위치>/node_modules node build.js
// 사진: ../images/<key>.jpg 가 있으면 넣고 credits.json 의 출처를 표기, 없으면 아이콘 카드로 대체.
const __ROOT = require(require("path").join(__dirname, "../../tools/repo.js")).ROOT; // 저장소 루트
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { applyTheme } = require(require("path").join(__dirname, "../../tools/repo.js"));
const NOTES = require("./notes.js");

const FONT = "맑은 고딕";
const C = { dk: "1E2A32", or: "F28C28", te: "2A9D8F", gr: "5B6770", lt: "F2F4F5", wh: "FFFFFF", lg: "D5DADD" };
const THEME = {
  name: "제조AX 혁신과 공학진로", headFontFace: FONT, bodyFontFace: FONT,
  colors: { dk1: C.dk, lt1: C.wh, dk2: "2E3B44", lt2: C.lt, accent1: C.or, accent2: C.te, accent3: C.gr,
    accent4: "E9C46A", accent5: "264653", accent6: "8AB17D", hlink: C.te, folHlink: C.gr },
};
const LECTURE = "제조AX 혁신과 공학진로 · 4강";
const IMG_DIR = __ROOT + "/lecture-series/images/lecture4";
// credits.json: {key: "사진: ..."} 또는 {key: {credit|credit_line: ...}} 또는 [{file|key, credit|credit_line}]
const CREDITS = (() => {
  const f = path.join(IMG_DIR, "credits.json");
  if (!fs.existsSync(f)) return {};
  const raw = JSON.parse(fs.readFileSync(f, "utf8"));
  const line = (v) => (typeof v === "string" ? v : v.credit || v.credit_line || v.creditLine || "");
  const out = {};
  if (Array.isArray(raw)) raw.forEach((v) => { out[(v.key || v.file || "").replace(/\.[a-z]+$/i, "")] = line(v); });
  else for (const [k, v] of Object.entries(raw)) out[k.replace(/\.[a-z]+$/i, "")] = line(v);
  return out;
})();
// 사례 영상: 사진 스레드가 확인한 videos.json (url, channel, length, thumbnail)
const THUMB_DIR = __ROOT + "/lecture-series/thumbnails/lecture4";
const VIDEO = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(THUMB_DIR, "videos.json"), "utf8")).map((v) => [v.key, v]));

async function icon(Comp, color = "#FFFFFF") {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}
async function svgPng(svg, w, h) {
  const buf = await sharp(Buffer.from(svg)).resize(w, h).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// 진동 신호 그림: 시간 영역(주기적 충격)과 주파수 영역(BPFO 봉우리)
function vibrationSvgs() {
  const W = 800, H = 260, N = 400;
  let pts = [];
  for (let i = 0; i < N; i++) {
    const t = i / N;
    let y = 0.25 * Math.sin(2 * Math.PI * 6 * t) + 0.08 * Math.sin(2 * Math.PI * 37 * t + 1);
    const ph = (t * 9) % 1;
    y += 1.0 * Math.exp(-ph * 28) * Math.sin(2 * Math.PI * ph * 60);
    pts.push(`${(i / (N - 1)) * (W - 40) + 20},${H / 2 - y * 90}`);
  }
  const time = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <line x1="20" y1="${H / 2}" x2="${W - 20}" y2="${H / 2}" stroke="#D5DADD" stroke-width="2"/>
    <polyline fill="none" stroke="#2A9D8F" stroke-width="3" points="${pts.join(" ")}"/></svg>`;
  const peaks = [[0.12, 0.35], [0.36, 0.95], [0.6, 0.55], [0.84, 0.32], [0.24, 0.18], [0.5, 0.12], [0.72, 0.1]];
  let spec = [];
  for (let i = 0; i < N; i++) {
    const f = i / N;
    let a = 0.04 + 0.02 * Math.sin(i * 1.7) ** 2;
    for (const [p, h] of peaks) a += h * Math.exp(-(((f - p) / 0.008) ** 2));
    spec.push(`${f * (W - 40) + 20},${H - 20 - a * (H - 50)}`);
  }
  const freq = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <line x1="20" y1="${H - 20}" x2="${W - 20}" y2="${H - 20}" stroke="#D5DADD" stroke-width="2"/>
    <polyline fill="none" stroke="#1E2A32" stroke-width="3" points="${spec.join(" ")}"/>
    <circle cx="${0.36 * (W - 40) + 20}" cy="${H - 20 - 0.99 * (H - 50)}" r="16" fill="none" stroke="#F28C28" stroke-width="5"/></svg>`;
  return { time, freq };
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.title = "제조AX: 고장 진단·예측과 공정 최적화";
  pres.author = "김영근";
  pres.theme = { headFontFace: FONT, bodyFontFace: FONT };

  pres.defineSlideMaster({
    title: "CONTENT",
    background: { color: C.wh },
    objects: [
      { text: { text: LECTURE, options: { x: 0.5, y: 5.22, w: 5, h: 0.25, fontFace: FONT, fontSize: 9, color: C.gr, margin: 0 } } },
      { placeholder: { options: { name: "label", type: "body", x: 0.5, y: 0.18, w: 9, h: 0.28, fontFace: FONT, fontSize: 11, bold: true, color: C.or, margin: 0 }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.45, w: 9, h: 0.6, fontFace: FONT, fontSize: 24, bold: true, color: C.dk, margin: 0, valign: "middle", align: "left" }, text: "" } },
    ],
    slideNumber: { x: 9.0, y: 5.22, w: 0.5, h: 0.25, fontFace: FONT, fontSize: 9, color: C.gr, align: "right" },
  });
  pres.defineSlideMaster({ title: "DARK", background: { color: C.dk }, objects: [] });

  const I = {};
  for (const [k, comp] of Object.entries({
    wrench: fa.FaWrench, calendar: fa.FaCalendarAlt, heart: fa.FaHeartbeat, brain: fa.FaBrain, wifi: fa.FaWifi,
    wave: fa.FaWaveSquare, search: fa.FaSearch, hourglass: fa.FaHourglassHalf, check: fa.FaClipboardCheck,
    bell: fa.FaBell, tags: fa.FaTags, plane: fa.FaPlane, comment: fa.FaCommentDots, book: fa.FaBook,
    fire: fa.FaFire, chip: fa.FaMicrochip, flask: fa.FaFlask, robot: fa.FaRobot, industry: fa.FaIndustry,
    cogs: fa.FaCogs, sliders: fa.FaSlidersH, chart: fa.FaChartLine, cube: fa.FaCube, gamepad: fa.FaGamepad,
    camera: fa.FaCamera, thermo: fa.FaThermometerHalf, user: fa.FaUserCog, car: fa.FaCarSide, cog: fa.FaCog,
  })) I[k] = await icon(comp);
  const ICON_GR = {};
  for (const [k, comp] of Object.entries({ car: fa.FaCarSide, cog: fa.FaCog, plane: fa.FaPlane, fire: fa.FaFire, chip: fa.FaMicrochip, flask: fa.FaFlask, wifi: fa.FaWifi, robot: fa.FaRobot }))
    ICON_GR[k] = await icon(comp, "#B8C0C5");

  const iconCircle = (s, img, x, y, d, color = C.or) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color }, line: { color } });
    const p = d * 0.25;
    s.addImage({ data: img, x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
  };
  const card = (s, x, y, w, h, fill = C.lt) =>
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill },
      shadow: { type: "outer", color: "000000", opacity: 0.12, blur: 4, offset: 1.5, angle: 90 } });
  const txt = (s, text, o) => s.addText(text, { fontFace: FONT, isTextBox: true, margin: 0, color: C.dk, valign: "top", ...o });
  const content = (label, title) => {
    const s = pres.addSlide({ masterName: "CONTENT" });
    s.addText(label, { placeholder: "label" });
    s.addText(title, { placeholder: "title" });
    return s;
  };
  const source = (s, t, w = 9) => txt(s, t, { x: 0.5, y: 4.95, w, h: 0.22, fontSize: 8, color: C.gr });
  const video = (s, key) => {
    const v = VIDEO[key];
    txt(s, [{ text: `▶ 관련 영상: ${v.channel} (${v.length})`, options: { hyperlink: { url: v.url, tooltip: v.title } } }],
      { x: 5.6, y: 4.93, w: 3.9, h: 0.24, fontSize: 9, bold: true, color: C.te, align: "right" });
  };
  // 영상 썸네일 (클릭하면 유튜브), 가운데 재생 표시
  const thumb = (s, key, x, y, w = 1.45) => {
    const v = VIDEO[key], h = w * 9 / 16;
    if (!v || !fs.existsSync(require("path").resolve(__ROOT, v.thumbnail))) return;
    s.addShape(pres.shapes.RECTANGLE, { x: x - 0.03, y: y - 0.03, w: w + 0.06, h: h + 0.06, fill: { color: C.wh }, line: { color: C.wh },
      shadow: { type: "outer", color: "000000", opacity: 0.25, blur: 4, offset: 1.5, angle: 90 } });
    s.addImage({ path: require("path").resolve(__ROOT, v.thumbnail), x, y, w, h, sizing: { type: "cover", w, h }, hyperlink: { url: v.url, tooltip: v.title } });
    const d = 0.32;
    s.addShape(pres.shapes.OVAL, { x: x + (w - d) / 2, y: y + (h - d) / 2, w: d, h: d, fill: { color: "000000", transparency: 35 }, line: { color: C.wh, width: 1 } });
    txt(s, "▶", { x: x + (w - d) / 2 + 0.02, y: y + (h - d) / 2, w: d, h: d, fontSize: 11, color: C.wh, align: "center", valign: "middle" });
  };
  // 사진 자리: images/<key>.jpg 가 있으면 cover로 잘라 넣고 사진 아래 출처, 없으면 아이콘 카드
  const photo = (s, key, x, y, w, h, fallbackIcon) => {
    const file = ["jpg", "jpeg", "png"].map((e) => path.join(IMG_DIR, `${key}.${e}`)).find((f) => fs.existsSync(f));
    if (file) {
      s.addImage({ path: file, x, y, w, h, sizing: { type: "cover", w, h } });
      // 출처는 사진 아래쪽 안에 반투명 띠로 (본문 레이아웃과 겹치지 않게)
      if (CREDITS[key]) txt(s, CREDITS[key], { x, y: y + h - 0.2, w, h: 0.2, fontSize: 7, color: C.wh, valign: "middle",
        margin: [0, 4, 0, 4], fill: { color: "000000", transparency: 45 }, fit: "shrink" });
    } else {
      s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: "E4E8EA" }, line: { color: "E4E8EA" } });
      const d = Math.min(w, h) * 0.38;
      s.addImage({ data: fallbackIcon, x: x + (w - d) / 2, y: y + (h - d) / 2, w: d, h: d });
    }
  };
  const bigStat = (s, x, y, w, num, cap, color = C.or) => {
    card(s, x, y, w, 1.05);
    txt(s, num, { x: x + 0.2, y: y + 0.08, w: w - 0.3, h: 0.58, fontSize: 32, bold: true, color, valign: "middle" });
    txt(s, cap, { x: x + 0.2, y: y + 0.66, w: w - 0.3, h: 0.32, fontSize: 12, color: C.gr });
  };

  // 1. 표지
  {
    const s = pres.addSlide({ masterName: "DARK" });
    txt(s, LECTURE, { x: 0.6, y: 0.9, w: 5.5, h: 0.3, fontSize: 12, bold: true, color: C.or });
    txt(s, "제조AX:\n고장 진단·예측과\n공정 최적화", { x: 0.6, y: 1.3, w: 5.6, h: 1.9, fontSize: 36, bold: true, color: C.wh, valign: "middle" });
    txt(s, "설비가 아프기 전에 알고, 공정이 스스로 최적을 찾는다", { x: 0.6, y: 3.3, w: 5.6, h: 0.4, fontSize: 15, color: "C9D1D6" });
    txt(s, "한동대학교 기계제어공학부 김영근 교수", { x: 0.6, y: 4.4, w: 5.5, h: 0.35, fontSize: 14, bold: true, color: C.wh });
    const items = ["멈춤의 비용과 정비 전략", "고장 진단·예측의 원리", "예지보전 산업 사례", "공정 최적화 원리와 사례"];
    items.forEach((t, i) => {
      const y = 1.35 + i * 0.75;
      s.addShape(pres.shapes.OVAL, { x: 6.5, y, w: 0.5, h: 0.5, fill: { color: C.or }, line: { color: C.or } });
      txt(s, String(i + 1), { x: 6.5, y, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: C.wh, align: "center", valign: "middle" });
      txt(s, t, { x: 7.15, y, w: 2.6, h: 0.5, fontSize: 14, color: C.wh, valign: "middle" });
    });
    s.addNotes(NOTES[0]);
  }

  // 2. 멈춤의 비용
  {
    const s = content("도입 · 왜 고장 예측인가", "공장에서 가장 비싼 사건: 계획에 없던 정지");
    photo(s, "s02_assembly_line", 0.5, 1.25, 4.2, 3.45, ICON_GR.car);
    bigStat(s, 5.0, 1.25, 4.5, "매출의 11%", "세계 500대 기업이 비계획 정지로 잃는 비율");
    bigStat(s, 5.0, 2.45, 4.5, "연 1.4조 달러", "500대 기업의 연간 정지 손실 합계");
    bigStat(s, 5.0, 3.65, 4.5, "시간당 230만 달러", "대형 자동차 공장 1시간 정지 손실, 2019년의 2배", C.te);
    source(s, "출처: Siemens, The True Cost of Downtime 2024");
    s.addNotes(NOTES[1]);
  }

  // 3. 정비 전략의 진화
  {
    const s = content("도입 · 왜 고장 예측인가", "정비 전략의 진화: 고장 후 수리에서 AI 처방까지");
    const st = [
      [I.wrench, "사후정비", "BM", "고장 난 뒤 수리", "갑작스러운 정지·안전 사고", C.gr],
      [I.calendar, "예방정비", "TBM", "정해진 주기마다 교체", "멀쩡한 부품도 버림", "7C8890"],
      [I.heart, "예지보전", "CBM · PdM", "센서로 상태를 재고\n징후가 보이면 정비", "오늘의 주제", C.te],
      [I.brain, "처방적 정비", "Prescriptive", "무엇을 어떻게 고칠지\nAI가 권고", "생성형 AI와 결합", C.or],
    ];
    st.forEach(([img, h, en, d, k, color], i) => {
      const x = 0.5 + i * 2.3;
      card(s, x, 1.25, 2.1, 2.45);
      iconCircle(s, img, x + 0.2, 1.42, 0.55, color);
      txt(s, h, { x: x + 0.2, y: 2.05, w: 1.8, h: 0.32, fontSize: 15, bold: true, color });
      txt(s, en, { x: x + 0.2, y: 2.37, w: 1.8, h: 0.22, fontSize: 10, color: C.gr });
      txt(s, d, { x: x + 0.2, y: 2.65, w: 1.8, h: 0.6, fontSize: 12 });
      txt(s, k, { x: x + 0.2, y: 3.3, w: 1.8, h: 0.3, fontSize: 10, bold: true, color });
      if (i < 3) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 2.12, y: 2.3, w: 0.16, h: 0.28, fill: { color: C.lg }, line: { color: C.lg } });
    });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.9, w: 9, h: 0.95, fill: { color: C.dk }, line: { color: C.dk } });
    txt(s, "누가 판단하는가?", { x: 0.7, y: 3.9, w: 2.0, h: 0.95, fontSize: 14, bold: true, color: C.or, valign: "middle" });
    const lv = [["자동화", "사람이 정한 규칙을 기계가 반복"], ["스마트화", "데이터로 사람이 판단"], ["지능화", "AI가 스스로 판단·실행"]];
    lv.forEach(([h, d], i) => {
      const x = 2.7 + i * 2.27;
      txt(s, [{ text: h, options: { bold: true, color: i === 2 ? C.or : C.wh, breakLine: true } }, { text: d, options: { fontSize: 11, color: "C9D1D6" } }],
        { x, y: 3.98, w: 2.15, h: 0.8, fontSize: 14, valign: "middle" });
    });
    s.addNotes(NOTES[2]);
  }

  // 4. PHM 5단계
  {
    const s = content("1부 · 고장 진단·예측의 원리", "PHM: 베테랑의 감각을 데이터와 AI로");
    const st = [
      [I.wifi, "데이터 획득", "진동·온도·전류·소리"],
      [I.wave, "신호처리", "고장을 드러내는 특징 추출"],
      [I.search, "진단", "지금 어디가 아픈가"],
      [I.hourglass, "예지 (RUL)", "고장까지 얼마나 남았나"],
      [I.check, "의사결정", "언제 세우고 무엇을 준비할까"],
    ];
    s.addShape(pres.shapes.LINE, { x: 1.0, y: 1.62, w: 7.8, h: 0, line: { color: C.lg, width: 2 } });
    st.forEach(([img, h, d], i) => {
      const x = 0.5 + i * 1.83, color = i === 2 ? C.te : i === 3 ? C.or : C.gr;
      iconCircle(s, img, x + 0.52, 1.3, 0.64, color);
      txt(s, `${i + 1}. ${h}`, { x, y: 2.05, w: 1.7, h: 0.32, fontSize: 13, bold: true, align: "center", color: i >= 2 && i <= 3 ? color : C.dk });
      txt(s, d, { x, y: 2.38, w: 1.7, h: 0.5, fontSize: 11, color: C.gr, align: "center" });
    });
    photo(s, "s04_motor_sensor", 0.5, 3.1, 3.0, 1.65, ICON_GR.cog);
    card(s, 3.8, 3.1, 2.75, 1.65);
    txt(s, "진단", { x: 4.0, y: 3.22, w: 2.4, h: 0.4, fontSize: 18, bold: true, color: C.te });
    txt(s, "현재를 묻는다\n정상인가? 무엇이 고장인가?", { x: 4.0, y: 3.65, w: 2.45, h: 0.9, fontSize: 12 });
    card(s, 6.75, 3.1, 2.75, 1.65, "FDEBDD");
    txt(s, "예지", { x: 6.95, y: 3.22, w: 2.4, h: 0.4, fontSize: 18, bold: true, color: C.or });
    txt(s, "미래를 묻는다\n잔여 유효 수명(RUL)은?", { x: 6.95, y: 3.65, w: 2.45, h: 0.9, fontSize: 12 });
    source(s, "PHM: Prognostics and Health Management. 단계 구성은 ISO 13374 상태감시 데이터 처리 구조를 따름");
    s.addNotes(NOTES[3]);
  }

  // 5. 진동과 FFT
  {
    const s = content("1부 · 고장 진단·예측의 원리", "기계의 상태를 읽고 해석하는 법: 계측 및 신호처리");
    const v = vibrationSvgs();
    const tImg = await svgPng(v.time, 800, 260), fImg = await svgPng(v.freq, 800, 260);
    card(s, 0.5, 1.2, 5.3, 1.75, C.wh);
    txt(s, "시간 영역: 일정한 간격으로 충격이 반복", { x: 0.65, y: 1.27, w: 5, h: 0.28, fontSize: 12, bold: true, color: C.te });
    s.addImage({ data: tImg, x: 0.65, y: 1.58, w: 5.0, h: 1.3 });
    s.addShape(pres.shapes.DOWN_ARROW, { x: 2.85, y: 3.0, w: 0.3, h: 0.25, fill: { color: C.or }, line: { color: C.or } });
    txt(s, "FFT", { x: 3.2, y: 2.98, w: 0.8, h: 0.28, fontSize: 12, bold: true, color: C.or });
    card(s, 0.5, 3.3, 5.3, 1.55, C.wh);
    txt(s, "주파수 영역: 결함 주파수(BPFO)에 봉우리", { x: 0.65, y: 3.36, w: 5, h: 0.28, fontSize: 12, bold: true, color: C.dk });
    s.addImage({ data: fImg, x: 0.65, y: 3.66, w: 5.0, h: 1.15 });
    photo(s, "s05_bearing", 6.1, 1.2, 3.4, 1.75, ICON_GR.cog);
    card(s, 6.1, 3.3, 3.4, 1.55);
    txt(s, "베어링 바깥 고리 결함 주파수", { x: 6.28, y: 3.4, w: 3.1, h: 0.28, fontSize: 12, bold: true, color: C.or });
    txt(s, "BPFO = (n/2) · fr · (1 − (d/D)·cos θ)", { x: 6.28, y: 3.72, w: 3.1, h: 0.3, fontSize: 12, bold: true });
    txt(s, "n 볼 개수, fr 회전 주파수, d 볼 지름, D 피치 지름, θ 접촉각", { x: 6.28, y: 4.05, w: 3.1, h: 0.45, fontSize: 10, color: C.gr });
    txt(s, "→ 동역학, 기계진동", { x: 6.28, y: 4.5, w: 3.1, h: 0.28, fontSize: 11, bold: true, color: C.te });
    source(s, "그림: 설명용 모의 신호. 진동 외에 모터 전류, 초음파, 열화상도 함께 쓰인다");
    s.addNotes(NOTES[4]);
  }

  // 6. AI의 세 가지 질문
  {
    const s = content("1부 · 고장 진단·예측의 원리", "AI가 답하는 세 가지 질문");
    const qs = [
      [I.bell, "이상 탐지", "정상과 다른가?", "오토인코더에 정상 데이터만 학습\n복원 오차가 크면 경보", C.te],
      [I.tags, "고장 분류", "무엇이 고장인가?", "진동 → 스펙트로그램 이미지\nCNN으로 베어링·기어·불균형 구별", C.gr],
      [I.hourglass, "수명 예측", "얼마나 남았나?", "열화 시계열 → LSTM·트랜스포머\n연습 문제: NASA 터보팬 데이터(C-MAPSS)", C.or],
    ];
    qs.forEach(([img, h, q, d, color], i) => {
      const x = 0.5 + i * 3.05;
      card(s, x, 1.25, 2.85, 2.5);
      iconCircle(s, img, x + 0.2, 1.42, 0.55, color);
      txt(s, h, { x: x + 0.9, y: 1.42, w: 1.85, h: 0.55, fontSize: 15, bold: true, color, valign: "middle" });
      txt(s, q, { x: x + 0.2, y: 2.12, w: 2.5, h: 0.4, fontSize: 16, bold: true });
      txt(s, d, { x: x + 0.2, y: 2.62, w: 2.55, h: 0.95, fontSize: 11, color: C.gr });
    });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.95, w: 9, h: 0.9, fill: { color: C.dk }, line: { color: C.dk } });
    txt(s, [{ text: "현장의 난제: 고장 데이터가 거의 없다", options: { bold: true, color: C.or, breakLine: true } },
      { text: "정상 데이터만으로 학습  ·  시뮬레이션으로 고장 데이터 생성  ·  물리 법칙을 넣은 신경망(PINN)", options: { fontSize: 12, color: C.wh } }],
      { x: 0.75, y: 3.95, w: 8.5, h: 0.9, fontSize: 15, valign: "middle" });
    s.addNotes(NOTES[5]);
  }

  // 7. CFM LEAP
  {
    const s = content("2부 · 예지보전 산업 사례", "항공기 엔진: CFM LEAP 엔진 건전성 모니터링");
    photo(s, "s07_leap_engine", 0.5, 1.25, 4.2, 3.0, ICON_GR.plane);
    txt(s, "이륙·상승·순항 중 센서 데이터를 모아 머신러닝으로 분석\n누적 비행시간 약 5,000만 시간", { x: 0.5, y: 4.3, w: 4.2, h: 0.55, fontSize: 11, color: C.gr });
    bigStat(s, 5.0, 1.25, 4.5, "60% 더 일찍", "정비 권고 시점");
    bigStat(s, 5.0, 2.45, 4.5, "+45%", "이상 검출률");
    bigStat(s, 5.0, 3.65, 4.5, "오경보 ½", "잘못된 경보 절반으로 감소, 현장의 신뢰", C.te);
    source(s, "출처: CFM International 보도자료 \"CFM advances LEAP engine health monitoring\" (2024.4.10)", 5.0);
    video(s, "v07_cfm");
    thumb(s, "v07_cfm", 3.15, 3.15);
    s.addNotes(NOTES[6]);
  }

  // 8. Siemens 생성형 AI 정비
  {
    const s = content("2부 · 예지보전 산업 사례", "지멘스: 생성형 AI가 정비를 돕는다");
    const fl = [[I.bell, "이상 경보", "예지보전 시스템이 징후 감지"], [I.comment, "대화로 질문", "\"어떻게 조치하나요?\""], [I.book, "정비 기록 검색", "여러 언어의 과거 사례·해법"], [I.user, "조치 제안", "신입도 숙련공처럼"]];
    fl.forEach(([img, h, d], i) => {
      const x = 0.5 + i * 2.3;
      card(s, x, 1.3, 2.1, 1.85);
      iconCircle(s, img, x + 0.75, 1.45, 0.6, i === 3 ? C.or : C.te);
      txt(s, h, { x: x + 0.1, y: 2.15, w: 1.9, h: 0.32, fontSize: 14, bold: true, align: "center" });
      txt(s, d, { x: x + 0.1, y: 2.5, w: 1.9, h: 0.5, fontSize: 11, color: C.gr, align: "center" });
      if (i < 3) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 2.12, y: 2.08, w: 0.16, h: 0.28, fill: { color: C.lg }, line: { color: C.lg } });
    });
    card(s, 0.5, 3.4, 3.6, 1.4);
    txt(s, "−25%", { x: 0.7, y: 3.45, w: 3.2, h: 0.75, fontSize: 40, bold: true, color: C.or, valign: "middle" });
    txt(s, "고장 대응(사후정비) 시간, 초기 적용 평균", { x: 0.7, y: 4.22, w: 3.3, h: 0.45, fontSize: 12, color: C.gr });
    card(s, 4.3, 3.4, 2.95, 1.4, "FDEBDD");
    txt(s, [{ text: "예측에서 조치까지: 처방적 정비", options: { bold: true, color: C.or, breakLine: true } },
      { text: "Senseye + Industrial Copilot (2025.3)\n숙련공의 노하우를 신입에게", options: { fontSize: 12, color: C.dk } }],
      { x: 4.45, y: 3.45, w: 2.75, h: 1.3, fontSize: 14, valign: "middle" });
    source(s, "출처: Siemens 보도자료, Industrial Copilot 정비 기능 발표 (2025.3)", 5.0);
    video(s, "v08_siemens");
    thumb(s, "v08_siemens", 7.45, 3.4, 2.05);
    s.addNotes(NOTES[7]);
  }

  // 9. 공정 최적화 네 가지 접근
  {
    const s = content("3부 · 공정 최적화", "공정 최적화: 가장 좋은 결과를 내는 입력 찾기");
    card(s, 0.5, 1.2, 2.6, 1.15);
    txt(s, [{ text: "입력", options: { bold: true, color: C.te, breakLine: true } }, { text: "온도 · 압력 · 속도 · 원료 투입량", options: { fontSize: 12 } }], { x: 0.65, y: 1.25, w: 2.35, h: 1.05, fontSize: 14, valign: "middle" });
    s.addShape(pres.shapes.RIGHT_ARROW, { x: 3.2, y: 1.6, w: 0.4, h: 0.35, fill: { color: C.lg }, line: { color: C.lg } });
    s.addShape(pres.shapes.RECTANGLE, { x: 3.7, y: 1.2, w: 2.6, h: 1.15, fill: { color: C.dk }, line: { color: C.dk } });
    txt(s, [{ text: "공정", options: { bold: true, breakLine: true } }, { text: "기존: PID 제어 + 숙련자 경험", options: { fontSize: 11, color: "C9D1D6" } }], { x: 3.85, y: 1.25, w: 2.35, h: 1.05, fontSize: 15, color: C.wh, valign: "middle", align: "center" });
    s.addShape(pres.shapes.RIGHT_ARROW, { x: 6.4, y: 1.6, w: 0.4, h: 0.35, fill: { color: C.lg }, line: { color: C.lg } });
    card(s, 6.9, 1.2, 2.6, 1.15);
    txt(s, [{ text: "결과", options: { bold: true, color: C.or, breakLine: true } }, { text: "품질 · 생산량 · 에너지", options: { fontSize: 12 } }], { x: 7.05, y: 1.25, w: 2.35, h: 1.05, fontSize: 14, valign: "middle" });
    const ap = [
      [I.chart, "가상계측", "센서로 품질을 예측해 다음 조건 보정", "SK하이닉스"],
      [I.cube, "대리모델", "입출력 관계를 학습, 컴퓨터 안에서 최적 탐색", "대양전기공업"],
      [I.sliders, "예측 기반 제어", "몇 시간 뒤를 예측해 미리 조작", "포스코"],
      [I.gamepad, "강화학습", "시행착오로 최적 제어를 스스로 터득", "요코가와"],
    ];
    ap.forEach(([img, h, d, ex], i) => {
      const x = 0.5 + i * 2.3;
      card(s, x, 2.6, 2.1, 2.2);
      iconCircle(s, img, x + 0.18, 2.75, 0.5);
      txt(s, h, { x: x + 0.75, y: 2.75, w: 1.3, h: 0.5, fontSize: 14, bold: true, valign: "middle" });
      txt(s, d, { x: x + 0.18, y: 3.4, w: 1.8, h: 0.8, fontSize: 11 });
      txt(s, "사례: " + ex, { x: x + 0.18, y: 4.35, w: 1.8, h: 0.28, fontSize: 11, bold: true, color: C.te });
    });
    s.addNotes(NOTES[8]);
  }

  // 10. 포스코 스마트 고로
  {
    const s = content("3부 · 공정 최적화 사례", "포스코 포항 2고로: 스마트 고로");
    photo(s, "s10_blast_furnace", 0.5, 1.25, 3.6, 3.5, ICON_GR.fire);
    txt(s, "포스코 포항제철소 (우주정거장 촬영)", { x: 0.5, y: 1.25, w: 3.6, h: 0.3, fontSize: 11, bold: true, color: C.wh, valign: "middle", margin: [0, 6, 0, 6], fill: { color: "000000", transparency: 40 } });
    const mech = [[I.thermo, "예측 기반 제어", "쇳물 온도 실시간 측정 → 1시간 뒤 노열 예측 → 자동 제어"], [I.camera, "영상 AI", "풍구 카메라 영상으로 노내 상태 판단 → 원료 장입 자동 조절"]];
    mech.forEach(([img, h, d], i) => {
      const y = 1.25 + i * 1.05;
      card(s, 4.4, y, 5.1, 0.9);
      iconCircle(s, img, 4.55, y + 0.18, 0.54, i === 0 ? C.te : C.gr);
      txt(s, h, { x: 5.25, y: y + 0.08, w: 4.1, h: 0.3, fontSize: 13, bold: true, color: i === 0 ? C.te : C.dk });
      txt(s, d, { x: 5.25, y: y + 0.4, w: 4.15, h: 0.45, fontSize: 11 });
    });
    card(s, 4.4, 3.4, 2.45, 1.35);
    txt(s, "+240톤", { x: 4.55, y: 3.45, w: 2.2, h: 0.7, fontSize: 32, bold: true, color: C.or, valign: "middle" });
    txt(s, "하루 쇳물 생산량 증가\n(연 약 8.5만 톤)", { x: 4.55, y: 4.15, w: 2.2, h: 0.5, fontSize: 11, color: C.gr });
    card(s, 7.05, 3.4, 2.45, 1.35);
    txt(s, "2019", { x: 7.2, y: 3.45, w: 2.2, h: 0.7, fontSize: 32, bold: true, color: C.te, valign: "middle" });
    txt(s, "국내 기업 최초\nWEF 등대공장 선정", { x: 7.2, y: 4.15, w: 2.2, h: 0.5, fontSize: 11, color: C.gr });
    source(s, "출처: 포스코 뉴스룸 \"이 고로(2고로)가 AI용광로라고?\", WEF Global Lighthouse Network", 5.0);
    video(s, "v10_posco");
    thumb(s, "v10_posco", 2.55, 3.65);
    s.addNotes(NOTES[9]);
  }

  // 11. SK하이닉스 가상계측
  {
    const s = content("3부 · 공정 최적화 사례", "SK하이닉스 × 가우스랩스: 가상계측");
    photo(s, "s11_wafer", 0.5, 1.25, 3.2, 3.5, ICON_GR.chip);
    const loop = [["장비 센서 데이터", "증착 장비의 수백 개 신호", C.gr], ["AI 가상계측", "막 두께·굴절률 예측\n(모든 웨이퍼)", C.te], ["공정 제어 (APC)", "다음 웨이퍼 조건 보정", C.or]];
    loop.forEach(([h, d, color], i) => {
      const x = 4.0 + i * 1.88;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 1.3, w: 1.68, h: 1.25, fill: { color }, line: { color } });
      txt(s, h, { x: x + 0.08, y: 1.36, w: 1.52, h: 0.4, fontSize: 12, bold: true, color: C.wh, align: "center", valign: "middle" });
      txt(s, d, { x: x + 0.08, y: 1.78, w: 1.52, h: 0.7, fontSize: 10, color: C.wh, align: "center" });
      if (i < 2) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 1.7, y: 1.8, w: 0.16, h: 0.25, fill: { color: C.lg }, line: { color: C.lg } });
    });
    s.addShape(pres.shapes.LEFT_ARROW, { x: 4.3, y: 2.65, w: 4.9, h: 0.22, fill: { color: C.lg }, line: { color: C.lg } });
    txt(s, "예측과 제어가 하나의 루프로", { x: 4.0, y: 2.9, w: 5.5, h: 0.28, fontSize: 11, bold: true, color: C.gr, align: "center" });
    card(s, 4.0, 3.35, 2.65, 1.4);
    txt(s, "−21.5%", { x: 4.15, y: 3.4, w: 2.4, h: 0.75, fontSize: 36, bold: true, color: C.or, valign: "middle" });
    txt(s, "공정 산포(웨이퍼 간 편차) 평균 감소", { x: 4.15, y: 4.15, w: 2.4, h: 0.5, fontSize: 11, color: C.gr });
    card(s, 6.85, 3.35, 2.65, 1.4);
    txt(s, "2022.12", { x: 7.0, y: 3.4, w: 2.4, h: 0.75, fontSize: 28, bold: true, color: C.te, valign: "middle" });
    txt(s, "Panoptes VM 양산 라인 적용, 수율 향상", { x: 7.0, y: 4.15, w: 2.4, h: 0.5, fontSize: 11, color: C.gr });
    source(s, "출처: SK하이닉스 뉴스룸 \"Panoptes VM\"", 5.0);
    video(s, "v11_gauss");
    thumb(s, "v11_gauss", 2.15, 3.65);
    s.addNotes(NOTES[10]);
  }

  // 12. 요코가와 강화학습
  {
    const s = content("3부 · 공정 최적화 사례", "요코가와 × 에네오스 머티리얼즈: 강화학습 자율제어");
    photo(s, "s12_distillation", 0.5, 1.25, 3.2, 3.5, ICON_GR.flask);
    card(s, 4.0, 1.25, 5.5, 1.0, "FDEBDD");
    txt(s, [{ text: "증류탑: PID로 다루기 어려워 숙련자가 밸브를 직접 조작하던 공정", options: { breakLine: true } },
      { text: "강화학습 AI(FKDPP)가 사람 개입 없이 운전, 외기 온도가 크게 변해도 품질 유지", options: { bold: true, color: C.or } }],
      { x: 4.2, y: 1.3, w: 5.15, h: 0.9, fontSize: 12, valign: "middle" });
    const st = [["35일", "840시간 연속 자율 운전\n(2022년 초)", C.or], ["−40%", "증기 사용량과\nCO₂ 배출", C.te], ["0", "불량 제품\n(규격 외 제품 없음)", C.dk]];
    st.forEach(([n, d, color], i) => {
      const x = 4.0 + i * 1.88;
      card(s, x, 2.45, 1.74, 1.5);
      txt(s, n, { x: x + 0.12, y: 2.52, w: 1.5, h: 0.7, fontSize: 32, bold: true, color, valign: "middle" });
      txt(s, d, { x: x + 0.12, y: 3.25, w: 1.55, h: 0.6, fontSize: 11, color: C.gr });
    });
    txt(s, "2023년 정식 제어 시스템으로 채택: AI가 설비를 직접 운전하는 지능화 단계", { x: 4.0, y: 4.15, w: 5.5, h: 0.55, fontSize: 13, bold: true, color: C.te });
    source(s, "출처: Yokogawa 보도자료 (2023.3.30)", 5.0);
    video(s, "v12_yokogawa");
    thumb(s, "v12_yokogawa", 2.15, 3.65);
    s.addNotes(NOTES[11]);
  }

  // 13. 대양전기공업
  {
    const s = content("3부 · 공정 최적화 사례", "중견기업 대양전기공업: 자율제조 라인");
    card(s, 0.5, 1.2, 4.3, 2.3);
    txt(s, "이전", { x: 0.7, y: 1.3, w: 3.9, h: 0.3, fontSize: 14, bold: true, color: C.gr });
    const before = ["용접 4명 모두 수작업", "전압·전류 등 공정 데이터 없음", "불량은 눈으로 판정", "프레스는 고장 나야 대응"];
    txt(s, before.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < before.length - 1 } })), { x: 0.7, y: 1.6, w: 3.95, h: 0.95, fontSize: 12, paraSpaceAfter: 2, valign: "top" });
    s.addShape(pres.shapes.RIGHT_ARROW, { x: 4.88, y: 2.18, w: 0.24, h: 0.34, fill: { color: C.or }, line: { color: C.or } });
    card(s, 5.2, 1.2, 4.3, 2.3, "FDEBDD");
    txt(s, "이후", { x: 5.4, y: 1.3, w: 3.9, h: 0.3, fontSize: 14, bold: true, color: C.or });
    const after = [["협동로봇 용접 + 제품별 전압·전류·통전시간 기록", ""], ["AI가 최적 용접 조건 자동 설정, 머신비전 판정", "공정 최적화"], ["프레스 소음 1초 단위 수집 → 고장 징후 감지", "예지보전"]];
    after.forEach(([t, tag], i) => {
      const y = 1.68 + i * 0.58;
      txt(s, t, { x: 5.4, y, w: tag ? 2.85 : 3.95, h: 0.52, fontSize: 12, valign: "middle" });
      if (tag) txt(s, tag, { x: 8.3, y: y + 0.11, w: 1.05, h: 0.3, fontSize: 10, bold: true, color: C.wh, align: "center", valign: "middle", fill: { color: C.te } });
    });
    const rs = [["+82%", "일 생산량 272 → 495개"], ["30% → 5%", "불량률"], ["−83%", "제품당 인건비"], ["약 1.9년", "투자 회수 (추정)"]];
    rs.forEach(([n, d], i) => {
      const x = 0.5 + i * 2.3;
      card(s, x, 3.7, 2.1, 1.15);
      txt(s, n, { x: x + 0.15, y: 3.75, w: 1.85, h: 0.6, fontSize: 24, bold: true, color: i === 3 ? C.te : C.or, valign: "middle" });
      txt(s, d, { x: x + 0.15, y: 4.37, w: 1.85, h: 0.4, fontSize: 11, color: C.gr });
    });
    source(s, "출처: 한국생산성본부(KPC) 자율제조 지원 사례 (프레스·용접 공정)", 5.0);
    video(s, "v13_daeyang");
    thumb(s, "v13_daeyang", 2.85, 2.5, 1.72);
    s.addNotes(NOTES[12]);
  }

  // 14. 마무리
  {
    const s = pres.addSlide({ masterName: "DARK" });
    txt(s, "정리 · 제조AI 2030 전략 (2026.6): 2030년까지 AI 팩토리 500개", { x: 0.6, y: 0.4, w: 8.8, h: 0.35, fontSize: 13, bold: true, color: C.or });
    txt(s, "AI 모델만으로 문제 해결이 어렵다", { x: 0.6, y: 0.85, w: 8.8, h: 0.55, fontSize: 24, bold: true, color: C.wh });
    const mp = [
      ["베어링은 왜 손상되나", "역학 · 기계요소설계"],
      ["진동 스펙트럼의 의미", "동역학 · 기계진동"],
      ["센서와 신호처리", "신호 및 시스템 · 마이크로프로세서 · 딥러닝영상처리"],
      ["고로·증류탑·로봇을 움직이기", "제어공학"],
      ["데이터에서 패턴 배우기", "통계 · 기계학습 · 산업인공지능"],
    ];
    mp.forEach(([q, a], i) => {
      const y = 1.6 + i * 0.5;
      s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 8.8, h: 0.42, fill: { color: "2E3B44" }, line: { color: "2E3B44" } });
      txt(s, q, { x: 0.8, y, w: 3.4, h: 0.42, fontSize: 13, color: "C9D1D6", valign: "middle" });
      txt(s, "→  " + a, { x: 4.2, y, w: 5.1, h: 0.42, fontSize: 13, bold: true, color: i === 4 ? C.or : C.wh, valign: "middle" });
    });
    txt(s, "기계를 이해하고 데이터로 판단할 줄 아는 엔지니어", { x: 0.6, y: 4.2, w: 8.8, h: 0.45, fontSize: 18, bold: true, color: C.or });
    txt(s, "제조AX 시리즈 4강을 마칩니다. 감사합니다.", { x: 0.6, y: 4.68, w: 8.8, h: 0.35, fontSize: 13, color: C.wh });
    txt(s, LECTURE, { x: 0.6, y: 5.15, w: 5, h: 0.25, fontSize: 9, color: "9AA5AD" });
    s.addNotes(NOTES[13]);
  }

  const out = __ROOT + "/lecture4/4강_고장진단예측_공정최적화.pptx";
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("written", out);
})();
