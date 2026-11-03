const __ROOT = require(require("path").join(__dirname, "../tools/repo.js")).ROOT; // 저장소 루트
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { applyTheme } = require(require("path").join(__dirname, "../tools/repo.js"));
const NOTES = require("./lecture1_notes.js");

const FONT = "맑은 고딕";
const C = { dk: "1E2A32", or: "F28C28", te: "2A9D8F", gr: "5B6770", lt: "F2F4F5", wh: "FFFFFF", lg: "D5DADD" };
const THEME = {
  name: "전공소개 시리즈", headFontFace: FONT, bodyFontFace: FONT,
  colors: { dk1: C.dk, lt1: C.wh, dk2: "2E3B44", lt2: C.lt, accent1: C.or, accent2: C.te, accent3: C.gr,
    accent4: "E9C46A", accent5: "264653", accent6: "8AB17D", hlink: C.te, folHlink: C.gr },
};
const LECTURE = "제조 AX 혁신과 공학진로 · 1강";

async function icon(Comp, color = "#FFFFFF") {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.title = "스마트팩토리에서 제조 AX로";
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
    industry: fa.FaIndustry, robot: fa.FaRobot, chip: fa.FaMicrochip, cogs: fa.FaCogs, brain: fa.FaBrain,
    cloud: fa.FaCloud, cube: fa.FaCube, eye: fa.FaEye, chart: fa.FaChartLine, sliders: fa.FaSlidersH,
    wifi: fa.FaWifi, globe: fa.FaGlobeAsia, leaf: fa.FaLeaf, user: fa.FaUserClock, truck: fa.FaTruck,
    bulb: fa.FaLightbulb, grad: fa.FaGraduationCap, search: fa.FaSearch, tools: fa.FaTools, flag: fa.FaBalanceScale,
    hand: fa.FaHandPaper, network: fa.FaProjectDiagram, comment: fa.FaCommentDots, bolt: fa.FaBolt,
  })) I[k] = await icon(comp);

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
  // 사진: lecture-series/images/lecture1/<key>.jpg + credits.json (없으면 건너뜀)
  const IMG = __ROOT + "/lecture-series/images/lecture1/";
  const fs = require("fs");
  const CREDITS = fs.existsSync(IMG + "credits.json") ? JSON.parse(fs.readFileSync(IMG + "credits.json", "utf8")) : {};
  const has = (k) => fs.existsSync(IMG + k + ".jpg");
  const photo = (s, k, x, y, w, h) => { if (has(k)) s.addImage({ path: IMG + k + ".jpg", x, y, w, h, sizing: { type: "cover", w, h } }); return has(k); };
  const credit = (k) => (CREDITS[k] || "").replace(/^사진: /, "").replace(/, Wikimedia Commons$/, "");
  // 사례 영상 슬라이드: 썸네일을 누르면 공식 유튜브 영상으로 이동
  const VIDEOS = JSON.parse(require("fs").readFileSync(__ROOT + "/lecture-series/thumbnails/lecture1/videos.json", "utf8"));
  const videoSlide = (label, title, keys) => {
    const s = content(label, title);
    const vs = keys.map((k) => VIDEOS.find((v) => v.key === k));
    const w = 2.4, h = w * 9 / 16, gx = 0.45, rowH = h + 0.55;
    vs.forEach((v, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const n = Math.min(3, vs.length - row * 3);
      const x0 = 0.5 + (9 - (n * w + (n - 1) * gx)) / 2;
      const x = x0 + col * (w + gx), y = 1.2 + row * rowH;
      s.addImage({ path: require("path").resolve(__ROOT, v.thumbnail), x, y, w, h, hyperlink: { url: v.url, tooltip: v.title } });
      s.addShape(pres.shapes.OVAL, { x: x + w / 2 - 0.22, y: y + h / 2 - 0.22, w: 0.44, h: 0.44, fill: { color: C.or }, line: { color: C.wh, width: 1.5 }, hyperlink: { url: v.url } });
      txt(s, "▶", { x: x + w / 2 - 0.2, y: y + h / 2 - 0.22, w: 0.44, h: 0.44, fontSize: 14, color: C.wh, align: "center", valign: "middle" });
      txt(s, [{ text: v.case, options: { bold: true, breakLine: true, hyperlink: { url: v.url } } },
        { text: `${v.channel.trim()} · ${v.length} · ${v.published}`, options: { fontSize: 8, color: C.gr } }],
        { x, y: y + h + 0.05, w, h: 0.45, fontSize: 11 });
    });
    txt(s, "썸네일을 누르면 각 기업·기관의 공식 유튜브 영상이 열립니다.", { x: 0.5, y: 4.98, w: 9, h: 0.22, fontSize: 8, color: C.gr });
    s.addNotes("");
    return s;
  };

  // 1. Title
  {
    const s = pres.addSlide({ masterName: "DARK" });
    if (photo(s, "s01_robot_line", 0, 0, 10, 5.625)) {
      s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.dk, transparency: 18 }, line: { color: C.dk, transparency: 100 } });
      txt(s, "사진: " + credit("s01_robot_line") + ", Wikimedia Commons", { x: 0.6, y: 5.25, w: 8.8, h: 0.22, fontSize: 8, color: "9AA5AD" });
    }
    txt(s, LECTURE, { x: 0.6, y: 0.9, w: 5.5, h: 0.3, fontSize: 12, bold: true, color: C.or });
    txt(s, "스마트팩토리에서\n제조 AX로", { x: 0.6, y: 1.3, w: 5.4, h: 1.6, fontSize: 40, bold: true, color: C.wh, valign: "middle" });
    txt(s, "자동화에서 지능화로, 공장이 스스로 판단하는 시대", { x: 0.6, y: 3.0, w: 5.4, h: 0.4, fontSize: 15, color: "C9D1D6" });
    txt(s, "한동대학교 기계제어공학부 김영근 교수", { x: 0.6, y: 4.4, w: 5.6, h: 0.35, fontSize: 14, bold: true, color: C.wh });
    const items = ["공장은 왜 바뀌고 있나", "스마트팩토리의 구조", "제조 AX와 국내외 사례", "전공과 진로"];
    items.forEach((t, i) => {
      const y = 1.35 + i * 0.75;
      s.addShape(pres.shapes.OVAL, { x: 6.5, y, w: 0.5, h: 0.5, fill: { color: C.or }, line: { color: C.or } });
      txt(s, String(i + 1), { x: 6.5, y, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: C.wh, align: "center", valign: "middle" });
      txt(s, t, { x: 7.15, y, w: 2.5, h: 0.5, fontSize: 14, color: C.wh, valign: "middle" });
    });
    s.addNotes(NOTES[0]);
  }

  // 2. Bright and dark sides
  {
    const s = content("1부 · 공장은 왜 바뀌고 있나", "한국 제조업의 밝은 면과 어두운 면");
    const col = (x, head, color, rows) => {
      txt(s, head, { x, y: 1.2, w: 4.3, h: 0.3, fontSize: 13, bold: true, color });
      rows.forEach(([num, lab], i) => {
        const y = 1.55 + i * 0.82;
        card(s, x, y, 4.3, 0.7);
        txt(s, num, { x: x + 0.15, y, w: 1.75, h: 0.7, fontSize: 22, bold: true, color, valign: "middle" });
        txt(s, lab, { x: x + 1.95, y, w: 2.25, h: 0.7, fontSize: 11, color: C.dk, valign: "middle" });
      });
    };
    col(0.5, "밝은 면: 규모와 설비", C.or, [["27.4%", "GDP 대비 제조업 비중\nOECD 2위 (2025)"], ["7,097억$", "2025년 수출액\n역대 최대"], ["1,220대", "근로자 1만 명당 로봇\n로봇 밀도 세계 1위"]]);
    col(5.2, "어두운 면: 생산성과 사람", C.dk, [["24위", "시간당 노동생산성\nOECD 37개국 중"], ["29.5%", "대기업 대비\n중소기업 생산성"], ["17.5%", "제조업 60세 이상 비중\n2010년의 3.24배"]]);
    const ext = [[I.globe, "중국 급부상"], [I.flag, "미국 관세"], [I.truck, "공급망 재편"], [I.leaf, "탄소 규제"]];
    ext.forEach(([img, t], i) => {
      const x = 0.5 + i * 2.3;
      iconCircle(s, img, x, 4.08, 0.42, C.te);
      txt(s, t, { x: x + 0.52, y: 4.08, w: 1.7, h: 0.42, fontSize: 12, valign: "middle" });
    });
    source(s, "출처: OECD, IFR World Robotics 2025, 산업통상부, 한국생산성본부. 2026.1 WEF 신규 등대공장 23곳 중 16곳이 중국");
    s.addNotes(NOTES[1]);
  }

  // 3. Automation -> Smart -> Intelligence
  {
    const s = content("1부 · 공장은 왜 바뀌고 있나", "자동화, 스마트화, 그리고 지능화");
    const eras = ["1차 증기·기계화", "2차 전기·대량생산", "3차 컴퓨터·PLC 자동화", "4차 연결·데이터·AI"];
    const eraImg = ["s03_watt", "s03_ford", "s03_kuka", "s09_cobot"];
    const pics = eraImg.every(has);
    const ly = pics ? 1.98 : 1.38, top = pics ? 0.6 : 0;
    if (pics) eras.forEach((t, i) => photo(s, eraImg[i], 1.4 + i * 2.4 - 0.6, 1.12, 1.2, 0.76));
    s.addShape(pres.shapes.LINE, { x: 1.4, y: ly, w: 7.2, h: 0, line: { color: C.lg, width: 2 } });
    eras.forEach((t, i) => {
      const x = 1.4 + i * 2.4;
      s.addShape(pres.shapes.OVAL, { x: x - 0.09, y: ly - 0.09, w: 0.18, h: 0.18, fill: { color: i === 3 ? C.or : C.gr }, line: { color: i === 3 ? C.or : C.gr } });
      txt(s, t, { x: x - 0.9, y: ly + 0.12, w: 1.8, h: 0.3, fontSize: 10, color: i === 3 ? C.or : C.gr, bold: i === 3, align: "center" });
    });
    txt(s, "누가 판단하는가?", { x: 0.5, y: pics ? 2.42 : 1.9, w: 9, h: 0.35, fontSize: 15, bold: true, color: C.te, align: "center" });
    const cols = [
      [I.cogs, "자동화", "Automation", "사람이 정한 규칙을\n기계가 그대로 반복", "한국: 세계 최고 수준", C.gr],
      [I.chart, "스마트화 = DX", "Smart", "연결과 가시화\n데이터로 사람이 더 잘 판단", "한국: 절반쯤 도달", C.te],
      [I.brain, "지능화 = AX", "Intelligence", "AI가 스스로 판단·실행\n사람은 목표와 기준 설정", "한국: 지금 넘어가야 할 단계", C.or],
    ];
    const cy = pics ? 2.82 : 2.35, ch = pics ? 2.1 : 2.45, sq = pics ? 0.15 : 0;
    cols.forEach(([img, h, en, d, k, color], i) => {
      const x = 0.5 + i * 3.05;
      card(s, x, cy, 2.85, ch);
      iconCircle(s, img, x + 0.2, cy + 0.15, 0.55, color);
      txt(s, h, { x: x + 0.9, y: cy + 0.15, w: 1.85, h: 0.32, fontSize: 15, bold: true, color });
      txt(s, en, { x: x + 0.9, y: cy + 0.47, w: 1.85, h: 0.25, fontSize: 10, color: C.gr });
      txt(s, d, { x: x + 0.2, y: cy + 0.9 - sq, w: 2.5, h: 0.8, fontSize: 12 });
      txt(s, k, { x: x + 0.2, y: cy + ch - 0.4, w: 2.5, h: 0.3, fontSize: 11, bold: true, color });
    });
    if (pics) txt(s, "사진: " + eraImg.map((k) => credit(k)).join(" · ") + ", Wikimedia Commons", { x: 0.5, y: 4.98, w: 9, h: 0.2, fontSize: 8, color: C.gr });
    s.addNotes(NOTES[2]);
  }

  // 4. Feedback loop
  {
    const s = content("1부 · 공장은 왜 바뀌고 있나", "스마트팩토리: 공장 전체의 피드백 루프");
    const cx = 2.75, cy = 3.05, r = 1.35;
    s.addShape(pres.shapes.OVAL, { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, fill: { color: C.wh }, line: { color: C.lg, width: 2, dashType: "dash" } });
    s.addShape(pres.shapes.OVAL, { x: cx - 0.6, y: cy - 0.6, w: 1.2, h: 1.2, fill: { color: C.dk }, line: { color: C.dk } });
    txt(s, "데이터", { x: cx - 0.6, y: cy - 0.6, w: 1.2, h: 1.2, fontSize: 14, bold: true, color: C.wh, align: "center", valign: "middle" });
    const nodes = [[I.eye, "본다", "센싱", 0, -1], [I.search, "안다", "분석", 1, 0], [I.brain, "판단한다", "예측·최적화", 0, 1], [I.cogs, "움직인다", "제어", -1, 0]];
    nodes.forEach(([img, t, sub, dx, dy]) => {
      const x = cx + dx * r - 0.32, y = cy + dy * r - 0.32;
      iconCircle(s, img, x, y, 0.64, C.or);
      const lx = dx === 1 ? x + 0.72 : dx === -1 ? x - 1.25 : x + 0.75;
      const ly = dy === 0 ? y + 0.02 : dy === -1 ? y + 0.02 : y + 0.02;
      txt(s, t, { x: lx, y: ly, w: 1.2, h: 0.3, fontSize: 13, bold: true, align: dx === -1 ? "right" : "left" });
      txt(s, sub, { x: lx, y: ly + 0.3, w: 1.2, h: 0.25, fontSize: 10, color: C.gr, align: dx === -1 ? "right" : "left" });
    });
    card(s, 5.3, 1.35, 4.2, 3.4);
    txt(s, "정의", { x: 5.55, y: 1.55, w: 3.8, h: 0.3, fontSize: 13, bold: true, color: C.or });
    txt(s, "설계·생산·물류·유통 전 과정을 데이터로 연결하고, 그 데이터로 스스로 상태를 파악하고 개선하는 공장", { x: 5.55, y: 1.88, w: 3.75, h: 0.95, fontSize: 13 });
    txt(s, "핵심은 로봇의 수가 아니다", { x: 5.55, y: 2.95, w: 3.8, h: 0.3, fontSize: 13, bold: true, color: C.or });
    txt(s, "자동제어에서 배우는 피드백 제어를 모터 하나에서 공장 전체로 키운 것", { x: 5.55, y: 3.28, w: 3.75, h: 0.75, fontSize: 13 });
    s.addNotes(NOTES[3]);
  }

  // 5. Layers
  {
    const s = content("2부 · 스마트팩토리의 구조와 제조 AX", "스마트팩토리의 계층 구조");
    const layers = [
      ["경영", "ERP · SCM · PLM", "자재, 공급망, 주문 관리", "2E3B44"],
      ["운영", "MES · SCADA", "작업 지시, 실적·품질 이력", "44535D"],
      ["설비 제어", "PLC · 모션 · 로봇 제어기", "장치를 정밀하게 구동", C.gr],
      ["현장 장치", "센서 · 모터 · 로봇 · 카메라", "실제로 재고 움직인다", "7C8890"],
    ];
    layers.forEach(([n, sys, d, color], i) => {
      const y = 1.25 + i * 0.88, inset = (3 - i) * 0.25;
      s.addShape(pres.shapes.RECTANGLE, { x: 0.5 + inset, y, w: 6.2 - 2 * inset, h: 0.76, fill: { color }, line: { color } });
      txt(s, n, { x: 0.7 + inset, y, w: 1.4, h: 0.76, fontSize: 14, bold: true, color: C.wh, valign: "middle" });
      txt(s, [{ text: sys, options: { bold: true, breakLine: true } }, { text: d, options: { fontSize: 10 } }],
        { x: 2.15 + inset, y, w: 4.3 - 2 * inset, h: 0.76, fontSize: 12, color: C.wh, valign: "middle" });
    });
    s.addShape(pres.shapes.RECTANGLE, { x: 7.0, y: 1.25, w: 2.5, h: 3.4, fill: { color: C.or }, line: { color: C.or } });
    iconCircle(s, I.network, 7.9, 1.45, 0.7, C.dk);
    txt(s, "데이터 · AI\n플랫폼", { x: 7.1, y: 2.3, w: 2.3, h: 0.8, fontSize: 16, bold: true, color: C.wh, align: "center", valign: "middle" });
    txt(s, "모든 층을 관통해 데이터를 모으고 AI와 디지털 트윈을 돌린다", { x: 7.2, y: 3.2, w: 2.1, h: 1.2, fontSize: 11, color: C.wh, align: "center" });
    txt(s, "예: 현장 센서의 진동 이상 → 생산 계획 변경 → 부품 주문까지 곧바로 연결", { x: 0.5, y: 4.85, w: 9, h: 0.3, fontSize: 11, color: C.te, bold: true });
    s.addNotes(NOTES[4]);
  }

  // 6. Six technologies
  {
    const s = content("2부 · 스마트팩토리의 구조와 제조 AX", "스마트팩토리를 만드는 여섯 가지 기술");
    const techs = [
      [I.wifi, "산업 IoT · 센서", "진동·온도·전류·영상으로 상태 측정", "계측, 신호처리"],
      [I.sliders, "제어 · 자동화", "PLC·모션 제어로 정밀 구동", "자동제어, 메카트로닉스"],
      [I.robot, "산업용 · 협동 로봇", "조립·용접·이송, 사람과 협업", "로보틱스, 동역학"],
      [I.cloud, "데이터 · 클라우드 · 엣지", "데이터 수집과 실시간 처리", "프로그래밍, 데이터베이스"],
      [I.cube, "디지털 트윈", "센서와 동기화된 가상 공장", "CAD, 모델링·시뮬레이션"],
      [I.brain, "산업 인공지능", "품질 검사, 고장 예측, 최적화", "머신러닝, 컴퓨터비전"],
    ];
    techs.forEach(([img, h, d, c], i) => {
      const x = 0.5 + (i % 3) * 3.05, y = 1.25 + Math.floor(i / 3) * 1.8;
      card(s, x, y, 2.85, 1.6);
      iconCircle(s, img, x + 0.18, y + 0.18, 0.55);
      txt(s, h, { x: x + 0.85, y: y + 0.18, w: 1.9, h: 0.55, fontSize: 13, bold: true, valign: "middle" });
      txt(s, d, { x: x + 0.18, y: y + 0.85, w: 2.55, h: 0.4, fontSize: 11 });
      txt(s, "→ " + c, { x: x + 0.18, y: y + 1.22, w: 2.55, h: 0.28, fontSize: 10, bold: true, color: C.te });
    });
    s.addNotes(NOTES[5]);
  }

  // 7. Levels
  {
    const s = content("2부 · 스마트팩토리의 구조와 제조 AX", "스마트공장 3만 개, 그러나 75%는 기초 단계");
    const steps = [["기초", "생산정보 디지털화"], ["중간 1", "실시간 수집·분석"], ["중간 2", "공정 실시간 제어"], ["고도화", "맞춤형 유연생산"]];
    steps.forEach(([h, d], i) => {
      const x = 0.5 + i * 1.42, hgt = 0.9 + i * 0.55, y = 4.45 - hgt;
      const color = i < 2 ? C.te : C.or;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 1.32, h: hgt, fill: { color }, line: { color } });
      txt(s, h, { x, y: y + 0.1, w: 1.32, h: 0.3, fontSize: 13, bold: true, color: C.wh, align: "center" });
      txt(s, d, { x: x + 0.05, y: y + 0.42, w: 1.22, h: 0.45, fontSize: 10, color: C.wh, align: "center" });
    });
    txt(s, "DX 영역", { x: 0.5, y: 4.55, w: 2.74, h: 0.28, fontSize: 11, bold: true, color: C.te, align: "center" });
    txt(s, "AX 영역", { x: 3.34, y: 4.55, w: 2.74, h: 0.28, fontSize: 11, bold: true, color: C.or, align: "center" });
    card(s, 6.5, 1.25, 3.0, 1.0);
    txt(s, "31,782개", { x: 6.7, y: 1.3, w: 2.7, h: 0.5, fontSize: 24, bold: true, color: C.dk });
    txt(s, "스마트공장 보급 기업 (2014~2024)", { x: 6.7, y: 1.82, w: 2.7, h: 0.3, fontSize: 10, color: C.gr });
    card(s, 6.5, 2.4, 3.0, 1.0);
    txt(s, "생산성 +30% · 품질 +44%\n원가 −16%", { x: 6.7, y: 2.48, w: 2.7, h: 0.6, fontSize: 13, bold: true, color: C.te });
    txt(s, "도입 기업 평균 효과", { x: 6.7, y: 3.08, w: 2.7, h: 0.25, fontSize: 10, color: C.gr });
    card(s, 6.5, 3.55, 3.0, 1.1);
    txt(s, "75.5%", { x: 6.7, y: 3.6, w: 2.7, h: 0.6, fontSize: 32, bold: true, color: C.or });
    txt(s, "아직 기초 단계에 머문 비율 (2024)", { x: 6.7, y: 4.22, w: 2.7, h: 0.3, fontSize: 10, color: C.gr });
    source(s, "출처: 중소벤처기업부·스마트제조혁신추진단 스마트공장 성과보고서 및 실태조사(2024~2025)");
    s.addNotes(NOTES[6]);
  }

  // 8. DX vs AX
  {
    const s = content("2부 · 스마트팩토리의 구조와 제조 AX", "제조 AX: 보이게 하는 것에서 스스로 판단하게 하는 것으로");
    const rows = [["목표", "데이터 수집 · 연결 · 가시화", "예측 · 최적화 · 자율 실행"], ["판단 주체", "사람이 대시보드를 보고 판단", "AI가 제안하거나 직접 제어"], ["대표 기술", "MES, IoT, 클라우드", "머신러닝, 비전 AI, 생성형 AI, 피지컬 AI"]];
    card(s, 0.5, 1.25, 4.3, 2.45);
    card(s, 5.2, 1.25, 4.3, 2.45, "FDEBDD");
    txt(s, "DX  디지털 전환", { x: 0.7, y: 1.35, w: 4, h: 0.35, fontSize: 15, bold: true, color: C.te });
    txt(s, "AX  AI 전환", { x: 5.4, y: 1.35, w: 4, h: 0.35, fontSize: 15, bold: true, color: C.or });
    rows.forEach(([k, a, b], i) => {
      const y = 1.85 + i * 0.6;
      txt(s, k, { x: 0.7, y, w: 1.1, h: 0.5, fontSize: 10, bold: true, color: C.gr, valign: "middle" });
      txt(s, a, { x: 1.8, y, w: 2.85, h: 0.5, fontSize: 12, valign: "middle" });
      txt(s, k, { x: 5.4, y, w: 1.1, h: 0.5, fontSize: 10, bold: true, color: C.gr, valign: "middle" });
      txt(s, b, { x: 6.5, y, w: 2.85, h: 0.5, fontSize: 12, valign: "middle" });
    });
    s.addShape(pres.shapes.RIGHT_ARROW, { x: 4.82, y: 2.3, w: 0.36, h: 0.36, fill: { color: C.or }, line: { color: C.or } });
    txt(s, "대표 활용 분야", { x: 0.5, y: 3.88, w: 4, h: 0.3, fontSize: 12, bold: true, color: C.dk });
    const apps = [[I.eye, "영상 기반 품질 검사", "3강"], [I.tools, "고장 진단 · 예측", "4강"], [I.sliders, "공정 최적화", "4강"]];
    apps.forEach(([img, t, l], i) => {
      const x = 0.5 + i * 3.05;
      iconCircle(s, img, x, 4.25, 0.5);
      txt(s, t, { x: x + 0.6, y: 4.25, w: 1.75, h: 0.5, fontSize: 12, bold: true, valign: "middle" });
      txt(s, l, { x: x + 2.3, y: 4.33, w: 0.55, h: 0.34, fontSize: 10, bold: true, color: C.wh, align: "center", valign: "middle", fill: { color: C.te } });
    });
    s.addNotes(NOTES[7]);
  }

  // 9. Trends
  {
    const s = content("3부 · 최신 동향과 국내외 사례", "지금 일어나고 있는 세 가지 변화");
    const tr = [
      [I.comment, "생성형 AI", "최대 50%", "2025.9 신규 등대공장 핵심 사례 중 AI·생성형 AI 기반 비율", "작업 지침 검색, 설비 프로그램·정비 보고서 작성을 돕는 제조 코파일럿"],
      [I.cube, "디지털 트윈", "2년 먼저", "BMW 데브레첸: 양산 2년 전부터 가상 공장에서 생산", "짓기 전에 가상으로 짓고, 돌려 보고, 고친다"],
      [I.robot, "피지컬 AI", "26만 장", "엔비디아 GPU 한국 공급 (2025.10 APEC)", "삼성·SK·현대차가 각 5만 장으로 AI 팩토리 구축"],
    ];
    tr.forEach(([img, h, big, cap, d], i) => {
      const x = 0.5 + i * 3.05;
      card(s, x, 1.25, 2.85, 3.45);
      iconCircle(s, img, x + 0.2, 1.42, 0.55);
      txt(s, h, { x: x + 0.88, y: 1.42, w: 1.9, h: 0.55, fontSize: 15, bold: true, valign: "middle" });
      txt(s, big, { x: x + 0.2, y: 2.15, w: 2.5, h: 0.6, fontSize: 28, bold: true, color: C.or });
      txt(s, cap, { x: x + 0.2, y: 2.78, w: 2.5, h: 0.65, fontSize: 10, color: C.gr });
      txt(s, d, { x: x + 0.2, y: 3.55, w: 2.5, h: 0.95, fontSize: 12 });
    });
    txt(s, "자세한 기술 동향은 2강에서", { x: 0.5, y: 4.8, w: 9, h: 0.3, fontSize: 11, bold: true, color: C.te, align: "right" });
    s.addNotes(NOTES[8]);
  }

  // 10. Korea
  {
    const s = content("3부 · 최신 동향과 국내외 사례", "국내 사례: 등대공장에서 AI 팩토리 정책으로");
    txt(s, "국내 WEF 등대공장", { x: 0.5, y: 1.2, w: 3.2, h: 0.3, fontSize: 12, bold: true, color: C.or });
    const lh = [["2019", "포스코 포항제철소"], ["2021", "LS ELECTRIC 청주"], ["2022", "LG전자 창원"], ["2023", "아모레퍼시픽 뷰티파크\n한국수자원공사 화성 AI 정수장"]];
    s.addShape(pres.shapes.LINE, { x: 0.62, y: 1.7, w: 0, h: 2.75, line: { color: C.lg, width: 2 } });
    lh.forEach(([yr, n], i) => {
      const y = 1.6 + i * 0.68;
      s.addShape(pres.shapes.OVAL, { x: 0.53, y: y + 0.07, w: 0.18, h: 0.18, fill: { color: C.or }, line: { color: C.or } });
      txt(s, yr, { x: 0.85, y, w: 0.6, h: 0.3, fontSize: 12, bold: true, color: C.or });
      txt(s, n, { x: 1.45, y, w: 2.3, h: 0.6, fontSize: 11 });
    });
    txt(s, "2023년 이후 신규 선정 없음", { x: 0.85, y: 4.45, w: 3, h: 0.3, fontSize: 10, bold: true, color: C.gr });
    txt(s, "정책: 몇 개 지었나 → 얼마나 똑똑해졌나", { x: 4.0, y: 1.2, w: 3.2, h: 0.3, fontSize: 12, bold: true, color: C.or });
    const pol = [["2014~", "스마트공장 보급", "3만여 개", C.gr], ["2025.10", "AI 기반 스마트제조혁신 3.0", "AI 중심 스마트공장 1만 2천 곳", C.te], ["2026.6", "제조AI 2030 전략", "AI 팩토리 500개", C.or]];
    pol.forEach(([d, n, g, color], i) => {
      const y = 1.6 + i * 1.05;
      s.addShape(pres.shapes.RECTANGLE, { x: 4.0, y, w: 3.1, h: 0.85, fill: { color }, line: { color } });
      txt(s, d, { x: 4.15, y: y + 0.07, w: 2.8, h: 0.22, fontSize: 9, color: C.wh });
      txt(s, n, { x: 4.15, y: y + 0.28, w: 2.8, h: 0.28, fontSize: 12, bold: true, color: C.wh });
      txt(s, g, { x: 4.15, y: y + 0.56, w: 2.8, h: 0.25, fontSize: 10, color: C.wh });
      if (i < 2) s.addShape(pres.shapes.DOWN_ARROW, { x: 5.45, y: y + 0.86, w: 0.2, h: 0.18, fill: { color: C.lg }, line: { color: C.lg } });
    });
    card(s, 7.4, 1.6, 2.1, 2.95);
    txt(s, "중소 제조\nAI 도입률", { x: 7.55, y: 1.75, w: 1.85, h: 0.6, fontSize: 12, bold: true });
    txt(s, "1%", { x: 7.55, y: 2.4, w: 1.85, h: 0.5, fontSize: 24, bold: true, color: C.gr });
    txt(s, "↓", { x: 7.55, y: 2.88, w: 1.85, h: 0.35, fontSize: 18, bold: true, color: C.gr });
    txt(s, "10%", { x: 7.55, y: 3.2, w: 1.85, h: 0.6, fontSize: 32, bold: true, color: C.or });
    txt(s, "2030년 목표", { x: 7.55, y: 3.85, w: 1.85, h: 0.3, fontSize: 10, color: C.gr });
    source(s, "출처: WEF Global Lighthouse Network, 관계부처 합동 AI 기반 스마트제조혁신 3.0(2025.10.24), 제조AI 2030 전략(2026.6.29)");
    s.addNotes(NOTES[9]);
  }
  videoSlide("3부 · 최신 동향과 국내외 사례", "국내 사례 영상", ["s10_posco", "s10_ls", "s10_lg", "s10_amore", "s10_kwater"]);

  // 11. Global
  {
    const s = content("3부 · 최신 동향과 국내외 사례", "해외 사례: AI 팩토리와 다크팩토리");
    const cs = [
      ["지멘스 암베르크", "독일", "제품 약 1,000종", "품질 99.9989%, 가치사슬 75% 이상 자동화"],
      ["BMW 데브레첸", "헝가리", "디지털 트윈 공장", "양산 2년 전부터 가상 생산으로 검증"],
      ["샤오미 창핑", "중국", "자동화율 81%", "2024.7 가동, 스마트폰 다크팩토리"],
      ["창안자동차", "중국", "60초당 1대", "로봇 1,400대 이상, 핵심 공정 100% 자동화"],
      ["현대차 HMGICS", "싱가포르", "27개 셀", "컨베이어 없이 모바일 로봇 200대, 24시간 자율운영 검증"],
      ["현대차 메타플랜트", "미국 조지아", "2028 휴머노이드", "보스턴다이내믹스 아틀라스 투입 계획"],
    ];
    cs.forEach(([n, c, big, d], i) => {
      const x = 0.5 + (i % 3) * 3.05, y = 1.2 + Math.floor(i / 3) * 1.65;
      card(s, x, y, 2.85, 1.5);
      txt(s, n, { x: x + 0.18, y: y + 0.12, w: 1.8, h: 0.3, fontSize: 12, bold: true });
      txt(s, c, { x: x + 1.9, y: y + 0.14, w: 0.8, h: 0.26, fontSize: 9, color: C.gr, align: "right" });
      txt(s, big, { x: x + 0.18, y: y + 0.45, w: 2.5, h: 0.42, fontSize: 18, bold: true, color: i >= 4 ? C.te : C.or });
      txt(s, d, { x: x + 0.18, y: y + 0.9, w: 2.5, h: 0.52, fontSize: 10 });
    });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.55, w: 9, h: 0.4, fill: { color: C.dk }, line: { color: C.dk } });
    txt(s, "2025 신규 등대공장 평균 성과   노동생산성 +40%   ·   불량 −41%   ·   에너지 −28%", { x: 0.7, y: 4.55, w: 8.6, h: 0.4, fontSize: 12, bold: true, color: C.wh, valign: "middle" });
    s.addNotes(NOTES[10]);
  }
  videoSlide("3부 · 최신 동향과 국내외 사례", "해외 사례 영상", ["s11_siemens", "s11_bmw", "s11_xiaomi", "s11_changan", "s11_hmgics", "s11_atlas"]);

  // 12. Major
  {
    const s = content("4부 · 여러분의 전공과 진로", "AI가 판단하고, 기계와 제어가 실현한다");
    const vc = [[0.7, 1.35, C.gr, "기계"], [2.0, 1.35, C.te, "제어·전자"], [1.35, 2.45, C.or, "SW·AI"]];
    vc.forEach(([x, y, color, t]) => s.addShape(pres.shapes.OVAL, { x, y, w: 2.0, h: 2.0, fill: { color, transparency: 35 }, line: { color, width: 1 } }));
    txt(s, "기계", { x: 0.85, y: 1.85, w: 1.0, h: 0.3, fontSize: 13, bold: true, color: C.wh });
    txt(s, "제어·전자", { x: 2.75, y: 1.85, w: 1.1, h: 0.3, fontSize: 13, bold: true, color: C.wh });
    txt(s, "SW·AI", { x: 1.95, y: 3.85, w: 0.8, h: 0.3, fontSize: 13, bold: true, color: C.wh, align: "center" });
    txt(s, "AI 팩토리\n엔지니어", { x: 1.75, y: 2.45, w: 1.2, h: 0.6, fontSize: 11, bold: true, color: C.wh, align: "center", valign: "middle" });
    const tb = [
      [{ text: "", options: {} }, { text: "기계", options: { bold: true, color: C.wh, fill: { color: C.gr } } }, { text: "제어·전자", options: { bold: true, color: C.wh, fill: { color: C.te } } }, { text: "SW·AI", options: { bold: true, color: C.wh, fill: { color: C.or } } }],
      [{ text: "1~2학년", options: { bold: true } }, "역학, CAD", "회로, 센서 기초", "프로그래밍"],
      [{ text: "3~4학년", options: { bold: true } }, "동역학, 제조공정", "자동제어, 로보틱스", "머신러닝, 컴퓨터비전"],
    ];
    s.addTable(tb, { x: 4.6, y: 1.3, w: 4.9, colW: [0.9, 1.25, 1.4, 1.35], rowH: 0.5, fontFace: FONT, fontSize: 11, color: C.dk, valign: "middle", border: { type: "solid", pt: 0.75, color: C.lg }, fill: { color: C.wh } });
    txt(s, "진로", { x: 4.6, y: 3.0, w: 2, h: 0.3, fontSize: 12, bold: true, color: C.or });
    const jobs = ["스마트팩토리·자동화 엔지니어", "로봇·피지컬 AI 엔지니어", "제조 데이터·AI 엔지니어", "디지털 트윈 개발자", "공정·품질 엔지니어"];
    txt(s, jobs.map((j, i) => ({ text: j, options: { bullet: true, breakLine: i < jobs.length - 1 } })), { x: 4.6, y: 3.3, w: 4.9, h: 1.4, fontSize: 12, paraSpaceAfter: 2 });
    txt(s, "정부가 꼽은 로봇 3대 취약 부품: 액추에이터, 로봇 손, 센서 → 모두 기계제어 분야", { x: 0.5, y: 4.85, w: 9, h: 0.3, fontSize: 11, bold: true, color: C.te });
    s.addNotes(NOTES[11]);
  }

  // 13. Summary
  {
    const s = pres.addSlide({ masterName: "DARK" });
    txt(s, "정리", { x: 0.6, y: 0.5, w: 4, h: 0.35, fontSize: 13, bold: true, color: C.or });
    const sum = ["스마트팩토리 = 공장 전체의 피드백 루프 (본다 · 안다 · 판단한다 · 움직인다)", "DX는 공장을 보이게, AX는 공장이 스스로 판단하게", "AI가 판단하고, 기계와 제어가 그 판단을 실현한다"];
    sum.forEach((t, i) => {
      const y = 1.0 + i * 0.75;
      txt(s, String(i + 1), { x: 0.6, y, w: 0.5, h: 0.55, fontSize: 26, bold: true, color: C.or, valign: "middle" });
      txt(s, t, { x: 1.15, y, w: 8.2, h: 0.55, fontSize: 16, bold: i === 2, color: C.wh, valign: "middle" });
    });
    txt(s, "다음 강의", { x: 0.6, y: 3.45, w: 4, h: 0.3, fontSize: 12, bold: true, color: C.or });
    const nx = [["2강", "제조 AX · AI 팩토리 기술 동향"], ["3강", "영상 기반 품질 검사 사례"], ["4강", "고장 진단 · 예측과 공정 최적화"]];
    nx.forEach(([l, t], i) => {
      const x = 0.6 + i * 3.0;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 3.85, w: 2.8, h: 0.9, fill: { color: "2E3B44" }, line: { color: "2E3B44" } });
      txt(s, l, { x: x + 0.18, y: 3.93, w: 2.5, h: 0.3, fontSize: 13, bold: true, color: C.or });
      txt(s, t, { x: x + 0.18, y: 4.25, w: 2.5, h: 0.4, fontSize: 12, color: C.wh });
    });
    txt(s, LECTURE, { x: 0.6, y: 5.15, w: 5, h: 0.25, fontSize: 9, color: "9AA5AD" });
    s.addNotes(NOTES[12]);
  }

  const out = process.env.OUT || __ROOT + "/lecture1/1강_제조AX와_스마트팩토리.pptx";
  require("fs").mkdirSync(__ROOT + "/lecture1", { recursive: true });
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("written", out);
})();
