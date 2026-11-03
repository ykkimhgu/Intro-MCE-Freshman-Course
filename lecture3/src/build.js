const __ROOT = require(require("path").join(__dirname, "../../tools/repo.js")).ROOT; // 저장소 루트
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const fs = require("fs");
const { execFileSync } = require("child_process");
const CROP = __dirname + "/crops/";
fs.mkdirSync(CROP, { recursive: true });
const { applyTheme } = require(require("path").join(__dirname, "../../tools/repo.js"));
const NOTES = require("./notes.js");

// 시리즈 공통 스타일: <저장소>/lecture-series/style.md
const FONT = "맑은 고딕";
const C = { dk: "1E2A32", or: "F28C28", te: "2A9D8F", gr: "5B6770", lt: "F2F4F5", wh: "FFFFFF", lg: "D5DADD", red: "D1495B" };
const THEME = {
  name: "제조 AX 혁신과 공학진로", headFontFace: FONT, bodyFontFace: FONT,
  colors: { dk1: C.dk, lt1: C.wh, dk2: "2E3B44", lt2: C.lt, accent1: C.or, accent2: C.te, accent3: C.gr,
    accent4: "E9C46A", accent5: "264653", accent6: "8AB17D", hlink: C.te, folHlink: C.gr },
};
const LECTURE = "제조 AX 혁신과 공학진로 · 3강";
const P1 = "1부 · 품질검사의 기초", P2 = "2부 · AI 영상검사의 원리와 최신 기술", P3 = "3부 · 국내외 산업 사례", P4 = "4부 · 남은 과제와 전공";

const IMG = __ROOT + "/lecture-series/images/lecture3/";
const CREDITS = fs.existsSync(IMG + "credits.json") ? JSON.parse(fs.readFileSync(IMG + "credits.json", "utf8")) : {};
const has = (k) => fs.existsSync(IMG + k + ".jpg");
const credit = (k) => (CREDITS[k] || "").replace(/^사진: /, "").replace(/, Wikimedia Commons$/, "");
const VIDEOS = JSON.parse(fs.readFileSync(__ROOT + "/lecture-series/thumbnails/lecture3/videos.json", "utf8"));
const V = (k) => VIDEOS.find((v) => v.key === k);

async function icon(Comp, color = "#FFFFFF") {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.title = "제조 AX: 영상 기반 품질검사 사례";
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
    eye: fa.FaEye, ruler: fa.FaRulerCombined, brain: fa.FaBrain, magic: fa.FaMagic, camera: fa.FaCamera, bulb: fa.FaLightbulb,
    chip: fa.FaMicrochip, cogs: fa.FaCogs, robot: fa.FaRobot, sync: fa.FaSyncAlt, tag: fa.FaTag, box: fa.FaVectorSquare,
    paint: fa.FaPaintBrush, fire: fa.FaFire, database: fa.FaDatabase, cube: fa.FaCube, comment: fa.FaCommentDots,
    images: fa.FaImages, bolt: fa.FaBolt, sensor: fa.FaBroadcastTower, search: fa.FaSearch, box2: fa.FaBoxOpen,
    wrench: fa.FaWrench, check: fa.FaCheck, tachometer: fa.FaTachometerAlt, question: fa.FaQuestionCircle,
    sliders: fa.FaSlidersH, code: fa.FaCode, clock: fa.FaClock, user: fa.FaUserCheck, car: fa.FaCarSide, industry: fa.FaIndustry,
  })) I[k] = await icon(comp);
  const arrowR = await icon(fa.FaArrowRight, "#" + C.or);
  const arrowG = await icon(fa.FaArrowRight, "#" + C.lg);

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
  const source = (s, t) => txt(s, t, { x: 0.5, y: 4.95, w: 9, h: 0.22, fontSize: 8, color: C.gr });
  // 상자 비율에 맞춰 미리 잘라 넣는다 (PowerPoint에서 늘어나 보이지 않게)
  const fit = (src, w, h) => {
    const out = CROP + require("path").basename(src).replace(/\.\w+$/, "") + "_" + Math.round(w * 100) + "x" + Math.round(h * 100) + ".jpg";
    if (!fs.existsSync(out)) execFileSync("python3", [__dirname + "/crop.py", src, String(w), String(h), out]);
    return out;
  };
  const photo = (s, k, x, y, w, h) => { if (has(k)) s.addImage({ path: fit(IMG + k + ".jpg", w, h), x, y, w, h }); return has(k); };
  const photoOr = (s, k, x, y, w, h, ic) => {
    if (photo(s, k, x, y, w, h)) return true;
    card(s, x, y, w, h); iconCircle(s, ic, x + w / 2 - 0.35, y + h / 2 - 0.35, 0.7, C.gr); return false;
  };
  const credits = (keys) => keys.filter(has).map(credit).join(" · ");
  // 썸네일을 누르면 공식 유튜브 영상으로 이동
  const video = (s, k, x, y, w, capW = Math.max(w, 3), capFs = 9) => {
    const v = V(k), h = w * 9 / 16;
    s.addImage({ path: fit(require("path").resolve(__ROOT, v.thumbnail), w, h), x, y, w, h, hyperlink: { url: v.url, tooltip: v.title } });
    const d = Math.min(0.5, w * 0.16);
    s.addShape(pres.shapes.OVAL, { x: x + w / 2 - d / 2, y: y + h / 2 - d / 2, w: d, h: d, fill: { color: C.or }, line: { color: C.wh, width: 1.5 }, hyperlink: { url: v.url } });
    txt(s, "▶", { x: x + w / 2 - d / 2, y: y + h / 2 - d / 2, w: d, h: d, fontSize: d > 0.4 ? 15 : 12, color: C.wh, align: "center", valign: "middle" });
    txt(s, [{ text: "▶ 영상: " + v.channel.trim(), options: { bold: true, color: C.te, hyperlink: { url: v.url } } },
      { text: [v.length && !/미확인/.test(v.length) ? v.length : "", (v.published || "").replace(/-/g, ".").replace(/\s*무렵/, "")].filter(Boolean).map((t) => " · " + t).join(""), options: { color: C.gr } }],
      { x, y: y + h + 0.06, w: capW, h: 0.22, fontSize: capFs });
    return h;
  };
  const bigStat = (s, x, y, w, num, lab, color = C.or) => {
    txt(s, num, { x, y, w, h: 0.55, fontSize: 32, bold: true, color, valign: "middle" });
    txt(s, lab, { x, y: y + 0.56, w, h: 0.45, fontSize: 11, color: C.dk });
  };

  // 1. 표지
  {
    const s = pres.addSlide({ masterName: "DARK" });
    const ph = photo(s, "s01_mvtec_defects", 6.1, 0, 3.9, 5.625);
    if (ph) txt(s, "AI가 찾아낸 부품 불량 (주황 윤곽). 이미지: MVTec AD(Bergmann 외, CVPR 2019), CC BY-NC-SA 4.0, PatchCore(Roth 외, CVPR 2022)", { x: 0.6, y: 5.15, w: 5.3, h: 0.3, fontSize: 8, color: "9AA5AD" });
    txt(s, LECTURE, { x: 0.6, y: 0.9, w: 5.2, h: 0.3, fontSize: 12, bold: true, color: C.or });
    txt(s, "제조 AX:\n영상 기반 품질검사 사례", { x: 0.6, y: 1.3, w: 5.3, h: 1.6, fontSize: 34, bold: true, color: C.wh, valign: "middle" });
    txt(s, "공장에 눈을 달아 주는 기술", { x: 0.6, y: 3.0, w: 5.2, h: 0.4, fontSize: 16, color: "C9D1D6" });
    const flow = [[I.camera, "카메라가 찍고"], [I.brain, "AI가 찾고"], [I.robot, "기계가 골라낸다"]];
    flow.forEach(([img, t], i) => {
      const x = 0.6 + i * 1.75;
      iconCircle(s, img, x, 3.6, 0.48);
      txt(s, t, { x: x + 0.55, y: 3.6, w: 1.2, h: 0.48, fontSize: 11, color: C.wh, valign: "middle" });
    });
    txt(s, "한동대학교 기계제어공학부 김영근 교수", { x: 0.6, y: 4.6, w: 5.3, h: 0.35, fontSize: 14, bold: true, color: C.wh });
    s.addNotes(NOTES[0]);
  }

  // 2. 왜 품질검사인가
  {
    const s = content(P1, "불량은 늦게 찾을수록 비싸다");
    txt(s, "1-10-100 법칙", { x: 0.5, y: 1.2, w: 5, h: 0.3, fontSize: 14, bold: true, color: C.or });
    const bars = [["공정 중 발견", 1, 0.35], ["출하 직전 발견", 10, 1.1], ["고객 손에서 발견", 100, 2.9]];
    bars.forEach(([lab, n, h], i) => {
      const x = 0.7 + i * 1.65, base = 4.55;
      s.addShape(pres.shapes.RECTANGLE, { x, y: base - h, w: 1.1, h, fill: { color: i === 2 ? C.or : i === 1 ? "F6B26B" : C.lg }, line: { type: "none" } });
      txt(s, String(n), { x, y: base - h - 0.45, w: 1.1, h: 0.4, fontSize: 22, bold: true, color: i === 2 ? C.or : C.dk, align: "center" });
      txt(s, lab, { x: x - 0.25, y: base + 0.06, w: 1.6, h: 0.25, fontSize: 10, color: C.gr, align: "center" });
    });
    card(s, 5.8, 1.25, 3.7, 1.55);
    iconCircle(s, I.car, 6.0, 1.45, 0.55);
    txt(s, "자동차 한 대 = 부품 수만 개", { x: 6.7, y: 1.45, w: 2.7, h: 0.55, fontSize: 13, bold: true, valign: "middle" });
    txt(s, "부품 하나의 작은 결함도 리콜과 신뢰 하락으로 이어진다", { x: 6.0, y: 2.1, w: 3.35, h: 0.6, fontSize: 11 });
    card(s, 5.8, 3.0, 3.7, 1.55);
    iconCircle(s, I.clock, 6.0, 3.2, 0.55, C.te);
    txt(s, "1초에도 여러 개가 지나간다", { x: 6.7, y: 3.2, w: 2.7, h: 0.55, fontSize: 13, bold: true, valign: "middle" });
    txt(s, "하루 종일, 전수(全數)를, 빠짐없이 보는 일은 사람에게 매우 어렵다", { x: 6.0, y: 3.85, w: 3.35, h: 0.6, fontSize: 11 });
    source(s, "1-10-100 법칙은 제조 현장에서 흔히 쓰는 경험칙으로, 배수 자체보다 '늦을수록 급격히 커진다'는 뜻");
    s.addNotes(NOTES[1]);
  }

  // 3. 핵심 개념
  {
    const s = content(P1, "두 가지 오류: 놓침과 오경보");
    const x0 = 1.55, y0 = 1.65, cw = 1.75, ch = 1.15;
    txt(s, "AI 판정", { x: x0, y: 1.15, w: 2 * cw, h: 0.25, fontSize: 11, bold: true, color: C.gr, align: "center" });
    txt(s, "불량", { x: x0, y: 1.4, w: cw, h: 0.25, fontSize: 11, bold: true, align: "center" });
    txt(s, "정상", { x: x0 + cw, y: 1.4, w: cw, h: 0.25, fontSize: 11, bold: true, align: "center" });
    txt(s, "실제", { x: 0.5, y: y0, w: 0.4, h: 2 * ch, fontSize: 11, bold: true, color: C.gr, valign: "middle" });
    txt(s, "불량", { x: 0.9, y: y0, w: 0.6, h: ch, fontSize: 11, bold: true, valign: "middle", align: "center" });
    txt(s, "정상", { x: 0.9, y: y0 + ch, w: 0.6, h: ch, fontSize: 11, bold: true, valign: "middle", align: "center" });
    const cells = [
      [0, 0, "제대로 잡음", C.te, C.wh, ""], [1, 0, "미검출", C.red, C.wh, "놓침 → 리콜"],
      [0, 1, "과검출", C.or, C.wh, "오경보 → 폐기·재검사"], [1, 1, "제대로 통과", C.lt, C.dk, ""],
    ];
    cells.forEach(([c, r, t, fill, col, sub]) => {
      const x = x0 + c * cw, y = y0 + r * ch;
      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.04, y: y + 0.04, w: cw - 0.08, h: ch - 0.08, fill: { color: fill }, line: { type: "none" } });
      txt(s, [{ text: t, options: { bold: true, fontSize: 14, breakLine: !!sub } }, ...(sub ? [{ text: sub, options: { fontSize: 10 } }] : [])],
        { x: x + 0.1, y: y + 0.04, w: cw - 0.2, h: ch - 0.08, color: col, align: "center", valign: "middle" });
    });
    const defs = [["재현율", "실제 불량 중 몇 %를 찾았나", C.te], ["정밀도", "불량 판정 중 진짜 불량은 몇 %인가", C.or]];
    defs.forEach(([h, d, color], i) => {
      const y = 1.2 + i * 0.95;
      card(s, 5.5, y, 4.0, 0.8);
      txt(s, h, { x: 5.7, y, w: 1.0, h: 0.8, fontSize: 15, bold: true, color, valign: "middle" });
      txt(s, d, { x: 6.75, y, w: 2.65, h: 0.8, fontSize: 12, valign: "middle" });
    });
    txt(s, "기준을 엄격하게 ↔ 느슨하게: 두 값은 시소처럼 움직인다", { x: 5.5, y: 3.15, w: 4.0, h: 0.5, fontSize: 12, bold: true, color: C.dk });
    txt(s, "99.9%", { x: 5.5, y: 3.7, w: 1.6, h: 0.6, fontSize: 30, bold: true, color: C.or, valign: "middle" });
    txt(s, "불량률 0.1% 공장에서 \"전부 정상\"이라고만 해도 나오는 정확도", { x: 7.15, y: 3.7, w: 2.35, h: 0.75, fontSize: 11, valign: "middle" });
    s.addNotes(NOTES[2]);
  }

  // 4. 기술 발전
  {
    const s = content(P1, "육안에서 딥러닝, 그리고 그 너머로");
    const st = [
      [I.eye, "육안 검사", "사람이 직접 본다", "유연하지만 피로·편차", C.gr],
      [I.ruler, "규칙 기반 머신비전", "치수·밝기 규칙과 임계값", "정답이 분명한 측정에 강함\n스크래치·얼룩엔 약함", "44535D"],
      [I.brain, "딥러닝 비전", "불량 사진으로 학습", "복잡한 외관 불량 판별\n불량 데이터·라벨링 부담", C.te],
      [I.magic, "이상탐지 · 파운데이션 모델", "정상만 학습, 범용 AI 활용", "불량 데이터가 적어도 시작\n2021년 이후 빠르게 확산", C.or],
    ];
    st.forEach(([img, h, how, pro, color], i) => {
      const x = 0.5 + i * 2.32, w = 2.05;
      card(s, x, 1.3, w, 3.3);
      s.addShape(pres.shapes.RECTANGLE, { x, y: 1.3, w, h: 0.95, fill: { color }, line: { type: "none" } });
      iconCircle(s, img, x + w / 2 - 0.3, 1.47, 0.6, C.dk);
      txt(s, String(i + 1) + "단계", { x: x + 0.1, y: 1.36, w: 0.7, h: 0.22, fontSize: 9, bold: true, color: C.wh });
      txt(s, h, { x: x + 0.12, y: 2.35, w: w - 0.24, h: 0.6, fontSize: 13, bold: true, color: i === 3 ? C.or : C.dk, valign: "middle" });
      txt(s, how, { x: x + 0.12, y: 2.98, w: w - 0.24, h: 0.45, fontSize: 11, color: C.gr });
      txt(s, pro, { x: x + 0.12, y: 3.5, w: w - 0.24, h: 1.0, fontSize: 11 });
      if (i < 3) s.addImage({ data: arrowR, x: x + w + 0.06, y: 2.75, w: 0.18, h: 0.18 });
    });
    s.addNotes(NOTES[3]);
  }

  // 5. 시스템 구성
  {
    const s = content(P2, "AI 영상검사 시스템은 이렇게 돌아간다");
    const steps = [[I.sensor, "트리거", "센서가 위치 감지"], [I.camera, "촬영", "카메라 + 조명"], [I.chip, "AI 추론", "엣지 컴퓨터, 수십 ms"], [I.cogs, "제어", "PLC로 결과 전달"], [I.robot, "배출", "분사기·로봇이 제거"]];
    steps.forEach(([img, h, d], i) => {
      const x = 0.55 + i * 1.85;
      iconCircle(s, img, x + 0.42, 1.2, 0.62, i === 2 ? C.or : C.dk);
      txt(s, h, { x, y: 1.88, w: 1.46, h: 0.28, fontSize: 13, bold: true, align: "center" });
      txt(s, d, { x, y: 2.15, w: 1.46, h: 0.3, fontSize: 10, color: C.gr, align: "center" });
      if (i < 4) s.addImage({ data: arrowR, x: x + 1.52, y: 1.42, w: 0.2, h: 0.2 });
    });
    s.addShape(pres.shapes.LINE, { x: 1.3, y: 2.55, w: 7.4, h: 0, line: { color: C.te, width: 1.5, dashType: "dash", beginArrowType: "triangle" } });
    txt(s, "피드백: 판정 결과와 이미지를 모아 모델을 다시 학습", { x: 2.5, y: 2.6, w: 5, h: 0.25, fontSize: 10, bold: true, color: C.te, align: "center" });
    const ai = [["s05_mvtec_in", "① 카메라 영상"], ["s05_mvtec_heat", "② AI 이상 점수 (히트맵)"], ["s05_mvtec_seg", "③ 불량 위치 표시"]];
    ai.forEach(([k, t], i) => {
      const x = 0.5 + i * 1.85;
      photo(s, k, x, 2.95, 1.45, 1.45);
      txt(s, t, { x: x - 0.15, y: 4.45, w: 1.75, h: 0.28, fontSize: 10, bold: true, align: "center" });
      if (i < 2) s.addImage({ data: arrowR, x: x + 1.53, y: 3.56, w: 0.22, h: 0.22 });
    });
    card(s, 6.05, 3.0, 3.45, 1.75);
    iconCircle(s, I.bulb, 6.25, 3.18, 0.5);
    txt(s, "좋은 영상 = 성능의 절반", { x: 6.85, y: 3.18, w: 2.6, h: 0.5, fontSize: 13, bold: true, valign: "middle" });
    txt(s, "같은 스크래치도 빛을 비스듬히 비추면 또렷하고, 정면에서 비추면 사라진다", { x: 6.25, y: 3.8, w: 3.1, h: 0.85, fontSize: 11 });
    source(s, "이미지: MVTec AD(Bergmann 외, CVPR 2019), CC BY-NC-SA 4.0의 병(bottle) 불량, PatchCore 결과 예시(anomalib, Apache-2.0)");
    s.addNotes(NOTES[4]);
  }

  // 6. AI가 하는 네 가지 일
  {
    const s = content(P2, "검사에서 AI가 하는 네 가지 일");
    const tasks = [
      ["s06_ai_cls", I.tag, "분류", "정상인가, 어떤 불량인가", "트랜지스터 정상 / 케이스 파손"],
      ["s06_ai_det", I.box, "객체 검출", "불량 위치를 상자로", "휜 다리의 위치"],
      ["s06_ai_seg", I.paint, "분할", "불량 모양을 픽셀 단위로", "갈라진 영역의 면적"],
      ["s06_ai_anom", I.fire, "이상탐지", "정상과 얼마나 다른가", "학습한 적 없는 흠집"],
    ];
    const tag = (s, t, x, y, color) => {
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.08 + t.length * 0.13, h: 0.22, fill: { color }, line: { color } });
      txt(s, t, { x, y, w: 0.08 + t.length * 0.13, h: 0.22, fontSize: 9, bold: true, color: C.wh, align: "center", valign: "middle" });
    };
    tasks.forEach(([k, img, h, d, ex], i) => {
      const x = 0.5 + i * 2.3, w = 2.1;
      card(s, x, 1.2, w, 3.55);
      photoOr(s, k, x, 1.2, w, 1.35, img);
      if (i === 0) { tag(s, "정상", x + 0.06, 2.27, C.te); tag(s, "불량", x + 1.11, 2.27, C.red); }
      if (i === 1) tag(s, "휜 다리", x + 0.4, 1.47, C.or);
      if (i === 2) tag(s, "균열 영역", x + 0.06, 1.26, C.red);
      if (i === 3) tag(s, "이상 점수 ↑", x + 1.0, 1.26, C.or);
      iconCircle(s, img, x + 0.15, 2.7, 0.48);
      txt(s, h, { x: x + 0.72, y: 2.7, w: w - 0.8, h: 0.48, fontSize: 15, bold: true, valign: "middle" });
      txt(s, d, { x: x + 0.15, y: 3.3, w: w - 0.3, h: 0.5, fontSize: 12 });
      txt(s, "예: " + ex, { x: x + 0.15, y: 3.9, w: w - 0.3, h: 0.6, fontSize: 10, color: C.te, bold: true });
    });
    txt(s, "간단 ← 분류 · 검출 · 분할 → 자세함 (라벨링 부담도 커짐)", { x: 0.5, y: 4.8, w: 9, h: 0.2, fontSize: 9, color: C.gr });
    txt(s, "이미지: MVTec AD(Bergmann 외, CVPR 2019), CC BY-NC-SA 4.0 · 분류·검출·분할 표시는 정답 마스크로 그림 · 이상탐지는 PatchCore 결과", { x: 0.5, y: 5.0, w: 9, h: 0.2, fontSize: 8, color: C.gr });
    s.addNotes(NOTES[5]);
  }

  // 7. 이상탐지
  {
    const s = content(P2, "최신 기술 1: 정상만 보고 배우는 이상탐지");
    txt(s, "고민: 잘 관리되는 공장일수록 불량 사진이 거의 없다", { x: 0.5, y: 1.15, w: 9, h: 0.3, fontSize: 13, bold: true, color: C.te });
    const y = 1.6, h = 2.4;
    // ① 정상 이미지
    card(s, 0.5, y, 2.6, h);
    photoOr(s, "s07_mvtec_good", 0.5, y, 2.6, 1.45, I.images);
    txt(s, "① 정상 이미지만 학습", { x: 0.65, y: y + 1.55, w: 2.3, h: 0.3, fontSize: 12, bold: true });
    txt(s, "불량 사진은 0장", { x: 0.65, y: y + 1.88, w: 2.3, h: 0.3, fontSize: 11, color: C.gr });
    s.addImage({ data: arrowR, x: 3.18, y: y + 1.05, w: 0.22, h: 0.22 });
    // ② 기억 저장소
    card(s, 3.5, y, 2.6, h);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++)
      s.addShape(pres.shapes.RECTANGLE, { x: 3.68 + c * 0.32, y: y + 0.15 + r * 0.3, w: 0.27, h: 0.25, fill: { color: (r + c) % 3 ? C.te : "6FBFB4" }, line: { type: "none" } });
    txt(s, "② 조각(패치) 특징을 기억 저장소에", { x: 3.65, y: y + 1.55, w: 2.35, h: 0.5, fontSize: 12, bold: true });
    s.addImage({ data: arrowR, x: 6.18, y: y + 1.05, w: 0.22, h: 0.22 });
    // ③ 비교
    card(s, 6.5, y, 3.0, h);
    photo(s, "s07_mvtec_damaged_case_raw", 6.5, y, 1.45, 1.45);
    photo(s, "s07_mvtec_damaged_case", 8.05, y, 1.45, 1.45);
    txt(s, "검사 영상", { x: 6.5, y: y + 1.2, w: 1.45, h: 0.22, fontSize: 9, color: C.wh, bold: true, align: "center" });
    txt(s, "튀는 조각", { x: 8.05, y: y + 1.2, w: 1.45, h: 0.22, fontSize: 9, color: C.wh, bold: true, align: "center" });
    txt(s, "③ 가장 가까운 정상 조각과 멀면 → 불량 후보", { x: 6.65, y: y + 1.55, w: 2.75, h: 0.5, fontSize: 12, bold: true });
    // 결과
    txt(s, "99.6%", { x: 0.5, y: 4.15, w: 1.7, h: 0.6, fontSize: 32, bold: true, color: C.or, valign: "middle" });
    txt(s, "PatchCore(2021): 산업용 벤치마크 MVTec AD에서 불량 학습 없이 얻은 이미지 단위 판별 성능(AUROC)", { x: 2.25, y: 4.15, w: 7.25, h: 0.6, fontSize: 11, valign: "middle" });
    source(s, "출처: Roth 외, PatchCore (CVPR 2022) · 이미지: MVTec AD 트랜지스터(Bergmann 외, CVPR 2019), CC BY-NC-SA 4.0");
    s.addNotes(NOTES[6]);
  }

  // 8. 파운데이션 모델과 합성데이터
  {
    const s = content(P2, "최신 기술 2: 파운데이션 모델과 합성데이터");
    const col = (x, img, color, head, sub, body, num, numLab) => {
      card(s, x, 1.2, 4.35, 3.6);
      iconCircle(s, img, x + 0.2, 1.4, 0.6, color);
      txt(s, head, { x: x + 0.95, y: 1.4, w: 3.3, h: 0.32, fontSize: 15, bold: true, color });
      txt(s, sub, { x: x + 0.95, y: 1.72, w: 3.3, h: 0.28, fontSize: 10, color: C.gr });
      txt(s, body, { x: x + 0.2, y: 2.85, w: 3.95, h: 0.95, fontSize: 12 });
      txt(s, num, { x: x + 0.2, y: 3.85, w: 1.6, h: 0.55, fontSize: 28, bold: true, color, valign: "middle" });
      txt(s, numLab, { x: x + 1.8, y: 3.85, w: 2.4, h: 0.8, fontSize: 10, color: C.dk, valign: "middle" });
    };
    col(0.5, I.comment, C.or, "비전-언어 파운데이션 모델", "WinCLIP · CVPR 2023", "", "91.8%", "MVTec AD, 해당 제품 학습 없이(제로샷) 얻은 분류 성능(AUROC)");
    [["\"깨끗한 부품\"", C.te], ["\"긁힌 부품\"", C.red]].forEach(([t, color], i) =>
      { s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.75 + i * 2.0, y: 2.15, w: 1.8, h: 0.42, fill: { color: C.wh }, line: { color, width: 1.5 }, rectRadius: 0.2 });
        txt(s, t, { x: 0.75 + i * 2.0, y: 2.15, w: 1.8, h: 0.42, fontSize: 12, bold: true, color, align: "center", valign: "middle" }); });
    txt(s, "부품 사진이 어느 문장에 더 가까운지 묻는다 → 새 제품 라인을 빠르게 검사", { x: 0.7, y: 2.85, w: 3.95, h: 0.8, fontSize: 12 });
    col(5.15, I.cube, C.te, "디지털 트윈 · 합성데이터", "델타일렉트로닉스 × NVIDIA · 2024", "", "", "");
    const fl = [[I.cube, "가상 생산라인"], [I.images, "사실적인 합성 이미지"], [I.brain, "검사 AI 학습"]];
    fl.forEach(([img, t], i) => {
      const x = 5.4 + i * 1.38;
      iconCircle(s, img, x + 0.3, 2.12, 0.46, C.dk);
      txt(s, t, { x: x - 0.05, y: 2.6, w: 1.2, h: 0.25, fontSize: 9, align: "center", color: C.gr });
      if (i < 2) s.addImage({ data: arrowR, x: x + 0.95, y: 2.27, w: 0.16, h: 0.16 });
    });
    txt(s, "불량 사진이 부족하면 만들어 쓴다. 디지털 트윈이 검사 AI의 훈련장이 된다", { x: 5.35, y: 2.95, w: 3.95, h: 0.7, fontSize: 12 });
    txt(s, "단, 현장 수준까지는 실제 현장 데이터로 확인하고 다듬는 과정이 여전히 필요", { x: 5.35, y: 3.85, w: 3.95, h: 0.75, fontSize: 11, bold: true, color: C.te, valign: "middle" });
    source(s, "출처: Jeong 외, WinCLIP (CVPR 2023); NVIDIA 보도자료 (2024.6.2, COMPUTEX)");
    s.addNotes(NOTES[7]);
  }

  // 9. BMW
  {
    const s = content(P3, "해외 사례 1: BMW AIQX, 조립라인의 AI 눈");
    video(s, "slide09_bmw", 0.5, 1.25, 4.9);
    txt(s, "무엇을 보나", { x: 5.75, y: 1.25, w: 3.75, h: 0.3, fontSize: 13, bold: true, color: C.or });
    const items = ["부품 누락", "차량 명판 위치", "보닛 로고 · 도어 핸들", "주문 사양대로 조립됐는지"];
    txt(s, items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })), { x: 5.75, y: 1.6, w: 3.75, h: 1.2, fontSize: 12, paraSpaceAfter: 3 });
    card(s, 5.75, 2.95, 3.75, 1.7);
    iconCircle(s, I.camera, 5.95, 3.12, 0.48);
    txt(s, "라인 카메라가 차량 위치와 동기화해 촬영", { x: 6.55, y: 3.12, w: 2.85, h: 0.48, fontSize: 11, valign: "middle" });
    iconCircle(s, I.user, 5.95, 3.75, 0.48, C.te);
    txt(s, "결과를 작업자 스마트 기기로 즉시 전달 → 다음 공정 전에 수정", { x: 6.55, y: 3.75, w: 2.85, h: 0.75, fontSize: 11, valign: "middle" });
    txt(s, "전 세계 BMW 공장에 적용 · 수백만 건의 이미지·영상 데이터", { x: 0.5, y: 4.4, w: 4.9, h: 0.3, fontSize: 11, bold: true, color: C.te });
    source(s, "출처: Axis Communications 고객 사례, BMW Group AIQX (2024)");
    s.addNotes(NOTES[8]);
  }

  // 10. 지멘스 인스펙토
  {
    const s = content(P3, "해외 사례 2: 지멘스 인스펙토, 상자 하나로 AI 검사");
    video(s, "slide10_siemens_inspekto", 0.5, 1.25, 4.9);
    txt(s, "20개", { x: 5.75, y: 1.2, w: 1.8, h: 0.6, fontSize: 36, bold: true, color: C.or, valign: "middle" });
    txt(s, "정상 제품 샘플만으로 학습\n불량 샘플은 필요 없음", { x: 7.5, y: 1.2, w: 2.0, h: 0.65, fontSize: 11, valign: "middle" });
    const st = [[I.box2, "상자 열기", "카메라·렌즈·조명·AI 일체형"], [I.wrench, "라인에 설치", "광학 설정을 스스로 맞춤"], [I.check, "정상품으로 학습", "결과는 PLC·MES로 전달"]];
    st.forEach(([img, h, d], i) => {
      const y = 2.05 + i * 0.78;
      card(s, 5.75, y, 3.75, 0.66);
      iconCircle(s, img, 5.88, y + 0.1, 0.46, i === 2 ? C.or : C.dk);
      txt(s, h, { x: 6.45, y: y + 0.06, w: 2.95, h: 0.28, fontSize: 12, bold: true });
      txt(s, d, { x: 6.45, y: y + 0.34, w: 2.95, h: 0.25, fontSize: 10, color: C.gr });
    });
    txt(s, "7장의 이상탐지 원리를 그대로 제품화 · 2024년 2월 지멘스가 인수", { x: 0.5, y: 4.4, w: 4.9, h: 0.3, fontSize: 11, bold: true, color: C.te });
    source(s, "출처: Siemens Inspekto 소개 페이지; Vision Systems Design (2024.2.20). '정상 샘플 20개'는 제조사 설명");
    s.addNotes(NOTES[9]);
  }

  // 11. HMGICS
  {
    const s = content(P3, "국내 사례 1: 현대차 HMGICS, 걸어 다니는 검사관");
    video(s, "slide11_hmgics", 0.5, 1.25, 4.0);
    const pp = photoOr(s, "s11_spot", 0.5, 3.75, 4.0, 1.05, I.robot);
    bigStat(s, 4.9, 1.2, 2.2, "38개", "스팟이 맡은 검사 영역");
    bigStat(s, 7.3, 1.2, 2.2, "99%+", "비전 AI 검사 정확도");
    card(s, 4.9, 2.4, 4.6, 2.35);
    const pts = [[I.robot, "보스턴 다이내믹스 스팟이 조립 부위로 이동해 카메라로 촬영"], [I.brain, "비전 AI가 조립 상태를 판정"], [I.cogs, "카메라가 고정되지 않음: 로봇 이동·자세 제어 + 비전 AI의 결합"]];
    pts.forEach(([img, t], i) => {
      const y = 2.55 + i * 0.7;
      iconCircle(s, img, 5.05, y, 0.45, i === 2 ? C.or : C.dk);
      txt(s, t, { x: 5.62, y: y - 0.05, w: 3.75, h: 0.6, fontSize: 11, valign: "middle", bold: i === 2 });
    });
    source(s, "출처: 현대자동차그룹 (2023.11.29) · 셀 방식 생산, 모바일 로봇 200여 대" + (pp ? " · 사진: Spot, " + credit("s11_spot") + ", Wikimedia Commons" : ""));
    s.addNotes(NOTES[10]);
  }

  // 12. LG + AI 팩토리
  {
    const s = content(P3, "국내 사례 2: LG전자 창원과 AI 팩토리 확산");
    // 왼쪽: LG
    txt(s, "LG전자 창원 LG스마트파크", { x: 0.5, y: 1.15, w: 4.3, h: 0.3, fontSize: 13, bold: true, color: C.or });
    txt(s, "90%+", { x: 0.5, y: 1.5, w: 1.5, h: 0.6, fontSize: 32, bold: true, color: C.or, valign: "middle" });
    txt(s, "A7 라인 품질검사 공정 중 AI가 처리하는 비율 (2025 가동)", { x: 2.05, y: 1.5, w: 2.75, h: 0.6, fontSize: 11, valign: "middle" });
    txt(s, "혼류 생산 모터도 딥러닝이 외관을 보고 즉시 판정", { x: 0.5, y: 2.2, w: 4.3, h: 0.3, fontSize: 11 });
    video(s, "slide12_lg_smartpark", 0.5, 2.7, 2.1, 2.15, 8);
    // 오른쪽: 정부 AI 팩토리
    card(s, 5.1, 1.15, 4.4, 3.65);
    txt(s, "정부 AI 팩토리 42개 사업장 점검 (2026.8)", { x: 5.3, y: 1.25, w: 4.1, h: 0.3, fontSize: 12, bold: true, color: C.te });
    bigStat(s, 5.3, 1.6, 2.0, "15.5%↓", "평균 불량률", C.or);
    bigStat(s, 7.4, 1.6, 2.0, "30.1%↑", "평균 생산성", C.te);
    const pc = photo(s, "s12_cylinder", 5.3, 2.75, 1.25, 1.25);
    const ex = [["이엔케이", "고압 실린더 AI 비전검사", "검사시간 22%↓"], ["신한다이아몬드", "CMP 디스크 AI 자동검사", "검사시간 33%↓"]];
    ex.forEach(([n, d, r], i) => {
      const x = pc ? 6.7 : 5.3, y = 2.75 + i * 0.65;
      txt(s, [{ text: n + "  ", options: { bold: true } }, { text: r, options: { bold: true, color: C.or } }], { x, y, w: 2.75, h: 0.28, fontSize: 11 });
      txt(s, d, { x, y: y + 0.28, w: 2.75, h: 0.25, fontSize: 10, color: C.gr });
    });
    txt(s, "정부 전략 목표: \"불량·검사·안전 문제 해결\"", { x: 5.3, y: 4.1, w: 4.1, h: 0.55, fontSize: 11, bold: true, valign: "middle" });
    video(s, "slide12_max", 2.7, 2.7, 2.1, 2.15, 8);
    source(s, "출처: 문화일보 현장 취재(2026.6.11); 산업통상부 업무보고·뉴시스(2026.8.4); 관계부처 합동 AI 기반 스마트제조혁신 3.0(2025.10)" + (pc ? " · 사진: 가스 실린더, " + credit("s12_cylinder") + ", Wikimedia Commons" : ""));
    s.addNotes(NOTES[11]);
  }

  // 13. 남은 과제와 엔지니어
  {
    const s = content(P4, "남은 숙제를 푸는 사람, 엔지니어");
    txt(s, "아직 남은 숙제", { x: 0.5, y: 1.15, w: 4.2, h: 0.3, fontSize: 13, bold: true, color: C.or });
    const ch = [[I.database, "불량 데이터 부족", "이상탐지·합성데이터로 보완"], [I.sync, "환경 변화", "조명·소재·카메라가 바뀌면 성능 하락 → 재학습"], [I.tachometer, "속도와 비용", "라인 속도 안에 판정: 경량 모델·엣지 HW"], [I.question, "설명 가능성", "왜 불량인지 히트맵으로 보여줘야 믿는다"]];
    ch.forEach(([img, h, d], i) => {
      const y = 1.55 + i * 0.8;
      iconCircle(s, img, 0.5, y, 0.5, C.dk);
      txt(s, h, { x: 1.1, y, w: 3.4, h: 0.28, fontSize: 12, bold: true });
      txt(s, d, { x: 1.1, y: y + 0.28, w: 3.4, h: 0.4, fontSize: 10, color: C.gr });
    });
    const pr = false;
    const x0 = pr ? 6.8 : 4.85, w0 = pr ? 2.7 : 4.65;
    txt(s, "여러분이 배울 과목", { x: x0, y: 1.15, w: w0, h: 0.3, fontSize: 12, bold: true, color: C.te });
    const subj = [["영상처리", "카메라 영상에서 불량 정보 추출"], ["제어 · 메카트로닉스", "정확한 정지, 불량품 배출"], ["로보틱스", "검사 위치를 찾아가는 로봇"], ["프로그래밍 · 머신러닝", "모델을 만들고 개선"]];
    subj.forEach(([h, d], i) => {
      const y = 1.55 + i * 0.8;
      card(s, x0, y, w0, 0.68);
      txt(s, h, { x: x0 + 0.15, y: y + 0.06, w: w0 - 0.3, h: 0.28, fontSize: 12, bold: true, color: C.or });
      txt(s, d, { x: x0 + 0.15, y: y + 0.35, w: w0 - 0.3, h: 0.28, fontSize: 10 });
    });
    if (pr) source(s, "사진: 산업용 라인스캔 카메라(" + credit("s05_industrial_camera") + "), 컨베이어(" + credit("s05_conveyor") + "), Wikimedia Commons");
    s.addNotes(NOTES[12]);
  }

  // 14. 정리
  {
    const s = pres.addSlide({ masterName: "DARK" });
    const ph = photo(s, "s14_factory", 6.6, 0, 3.4, 3.2);
    if (ph) txt(s, "사진: " + credit("s14_factory") + ", Wikimedia Commons", { x: 6.65, y: 3.22, w: 3.3, h: 0.2, fontSize: 7, color: "9AA5AD" });
    txt(s, "정리", { x: 0.6, y: 0.5, w: 4, h: 0.35, fontSize: 13, bold: true, color: C.or });
    const sum = ["품질검사 = 놓침과 오경보 사이의 균형 (재현율 · 정밀도)", "규칙 기반 → 딥러닝 → 이상탐지 · 파운데이션 모델 · 합성데이터", "BMW · 지멘스 · 현대차 · LG전자 · 중소기업까지, 중심에는 카메라 · 제어 · 로봇 · AI를 엮는 엔지니어"];
    sum.forEach((t, i) => {
      const y = 0.95 + i * 0.72;
      txt(s, String(i + 1), { x: 0.6, y, w: 0.45, h: 0.62, fontSize: 26, bold: true, color: C.or, valign: "middle" });
      txt(s, t, { x: 1.1, y, w: ph ? 5.1 : 8.3, h: 0.62, fontSize: 13, bold: i === 2, color: C.wh, valign: "middle" });
    });
    txt(s, "다음 강의", { x: 0.6, y: 3.55, w: 4, h: 0.3, fontSize: 12, bold: true, color: C.or });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 3.92, w: 5.6, h: 0.9, fill: { color: "2E3B44" }, line: { color: "2E3B44" } });
    txt(s, "4강", { x: 0.78, y: 4.0, w: 1, h: 0.3, fontSize: 13, bold: true, color: C.or });
    txt(s, "제조 AX: 고장 진단 · 예측과 공정 최적화 사례", { x: 0.78, y: 4.32, w: 5.3, h: 0.4, fontSize: 13, color: C.wh });
    txt(s, LECTURE, { x: 0.6, y: 5.15, w: 5, h: 0.25, fontSize: 9, color: "9AA5AD" });
    s.addNotes(NOTES[13]);
  }

  const out = process.env.OUT || __ROOT + "/lecture3/3강_영상기반_품질검사_사례.pptx";
  fs.mkdirSync(__ROOT + "/lecture3", { recursive: true });
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("written", out);
})();
