const __ROOT = require(require("path").join(__dirname, "../../tools/repo.js")).ROOT; // 저장소 루트
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const NOTES = require("./notes.js");

// 시리즈 공통 스타일: <저장소>/lecture-series/style.md
const C = { ink: "1E2A32", orange: "F28C28", teal: "2A9D8F", gray: "5B6770", card: "F2F4F5", white: "FFFFFF", light: "C9D1D6" };
const FONT = "Malgun Gothic";
const FOOT = "제조 AX 혁신과 공학진로 · 2강 제조AX·AI팩토리 기술 동향";

async function icon(Comp, color = "FFFFFF", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.title = "제조AX·AI팩토리 기술 동향";
  pres.author = "김영근";
  pres.theme = { headFontFace: FONT, bodyFontFace: FONT };

  pres.defineSlideMaster({
    title: "CONTENT",
    background: { color: C.white },
    objects: [
      { text: { text: FOOT, options: { x: 0.5, y: 5.22, w: 7, h: 0.28, fontFace: FONT, fontSize: 9, color: C.gray, margin: 0 } } },
    ],
    slideNumber: { x: 9.0, y: 5.22, w: 0.5, h: 0.28, fontFace: FONT, fontSize: 9, color: C.gray, align: "right" },
  });
  pres.defineSlideMaster({ title: "DARK", background: { color: C.ink } });

  const I = {};
  for (const [k, comp] of Object.entries({
    robot: fa.FaRobot, userClock: fa.FaUserClock, globe: fa.FaGlobeAsia, chip: fa.FaMicrochip, server: fa.FaServer,
    industry: fa.FaIndustry, cogs: fa.FaCogs, eye: fa.FaEye, brain: fa.FaBrain, hand: fa.FaHandPaper, comment: fa.FaCommentDots,
    code: fa.FaCode, cube: fa.FaCube, cubes: fa.FaCubes, cloud: fa.FaCloud, shield: fa.FaShieldAlt, database: fa.FaDatabase,
    users: fa.FaUsers, leaf: fa.FaLeaf, sync: fa.FaSyncAlt, user: fa.FaUserCog, arrowR: fa.FaArrowRight, arrowD: fa.FaArrowDown,
    exchange: fa.FaExchangeAlt, bolt: fa.FaBolt, tools: fa.FaTools, graduation: fa.FaGraduationCap, question: fa.FaQuestion,
  })) I[k] = await icon(comp);
  const IO = { arrowR: await icon(fa.FaArrowRight, C.orange), arrowD: await icon(fa.FaArrowDown, C.orange), exchange: await icon(fa.FaExchangeAlt, C.orange), arrowG: await icon(fa.FaArrowRight, C.gray) };

  const T = (o) => Object.assign({ fontFace: FONT, isTextBox: true, margin: 0, color: C.ink, valign: "top" }, o);
  const shadow = () => ({ type: "outer", color: "000000", blur: 4, offset: 1.5, angle: 90, opacity: 0.12 });
  function card(s, x, y, w, h, fill = C.card) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { type: "none" }, rectRadius: 0.08, shadow: shadow() });
  }
  function iconCircle(s, ic, x, y, d = 0.5, fill = C.orange) {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" } });
    const p = d * 0.25;
    s.addImage({ data: ic, x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
  }
  function header(s, label, title) {
    s.addText(label, T({ x: 0.5, y: 0.12, w: 9, h: 0.22, fontSize: 11, bold: true, color: C.orange }));
    s.addText(title, T({ x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, bold: true, valign: "middle" }));
  }
  function src(s, text) {
    s.addText(text, T({ x: 0.5, y: 4.93, w: 9, h: 0.25, fontSize: 9, color: C.gray }));
  }
  // 사진: lecture-series/images/lecture2/<key>.jpg + credits.json (없으면 건너뜀)
  const fs = require("fs");
  const IMG = __ROOT + "/lecture-series/images/lecture2/";
  const CREDITS = fs.existsSync(IMG + "credits.json") ? JSON.parse(fs.readFileSync(IMG + "credits.json", "utf8")) : {};
  const has = (k) => fs.existsSync(IMG + k + ".jpg");
  const photo = (s, k, x, y, w, h) => { if (has(k)) s.addImage({ path: IMG + k + ".jpg", x, y, w, h, sizing: { type: "cover", w, h } }); return has(k); };
  const cr = (...ks) => { const c = ks.filter(has).map((k) => (CREDITS[k] || "").replace(/^사진: /, "").replace(/, Wikimedia Commons$/, "")); return c.length ? " / 사진: " + c.join(" · ") + ", Wikimedia Commons" : ""; };
  let n = 0;
  function slide(master) { const s = pres.addSlide({ masterName: master }); s.addNotes(NOTES[n++]); return s; }

  // 1 표지
  {
    const s = slide("DARK");
    s.addText("제조 AX 혁신과 공학진로 · 2강", T({ x: 0.6, y: 1.05, w: 5.5, h: 0.35, fontSize: 16, bold: true, color: C.orange }));
    s.addText("제조 AX와 AI 팩토리,\n지금 어디까지 왔나", T({ x: 0.6, y: 1.5, w: 6, h: 1.6, fontSize: 36, bold: true, color: C.white }));
    s.addText("2026년 제조 AX·AI 팩토리 핵심 기술 동향", T({ x: 0.6, y: 3.2, w: 6, h: 0.4, fontSize: 16, color: C.light }));
    s.addText("한동대학교 기계제어공학부  김영근 교수", T({ x: 0.6, y: 4.5, w: 6, h: 0.35, fontSize: 13, color: C.light }));
    iconCircle(s, I.robot, 6.9, 1.35, 2.4);
  }

  // 2 오늘의 질문
  {
    const s = slide("CONTENT");
    header(s, "도입", "불을 끄고도 돌아가는 공장, 다크 팩토리");
    s.addText("샤오미 베이징 스마트폰 공장", T({ x: 0.5, y: 1.05, w: 9, h: 0.35, fontSize: 15, bold: true, color: C.gray }));
    const stats = [["81%", "자동화율"], ["약 6초", "스마트폰 1대 생산"], ["1,000만+", "연간 생산 대수"]];
    stats.forEach(([v, l], i) => {
      const x = 0.5 + i * 3.07;
      card(s, x, 1.5, 2.86, 1.45);
      s.addText(v, T({ x: x + 0.2, y: 1.62, w: 2.46, h: 0.75, fontSize: 36, bold: true, color: C.orange, valign: "middle" }));
      s.addText(l, T({ x: x + 0.2, y: 2.42, w: 2.46, h: 0.38, fontSize: 15, color: C.ink }));
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 3.25, w: 9, h: 1.55, fill: { color: C.ink }, line: { type: "none" }, rectRadius: 0.08 });
    iconCircle(s, I.question, 0.8, 3.6, 0.85);
    photo(s, "s02_electronics_line", 7.25, 3.37, 2.1, 1.31);
    s.addText("오늘의 질문", T({ x: 1.95, y: 3.45, w: 7.3, h: 0.35, fontSize: 14, bold: true, color: C.orange }));
    s.addText([
      { text: "공장은 어떻게 스스로 생각하게 되었을까?", options: { breakLine: true } },
      { text: "그 공장을 만드는 사람은 누구일까?" },
    ], T({ x: 1.95, y: 3.82, w: 7.3, h: 0.85, fontSize: 19, bold: true, color: C.white, paraSpaceAfter: 4 }));
    src(s, "출처: Euronews, Inside Xiaomi's Beijing factory (2026.4)" + cr("s02_electronics_line"));
  }

  // 3 세 가지 힘
  {
    const s = slide("CONTENT");
    header(s, "1부 · 왜 지금 제조 AX인가", "제조 AX를 밀어붙이는 세 가지 힘");
    const cols = [
      [I.userClock, "사람", ["빠른 고령화, 일할 사람 감소", "숙련공 은퇴로 노하우 단절 위기"]],
      [I.globe, "경쟁", ["중국의 대규모 자동화 투자", "미국·유럽의 공장 회귀, 인건비를 AI·로봇으로 해결"]],
      [I.chip, "기술", ["3~4년 사이 생성형 AI 등장", "AI가 로봇의 몸을 얻기 시작 (피지컬 AI)"]],
    ];
    cols.forEach(([ic, h, lines], i) => {
      const x = 0.5 + i * 3.07;
      card(s, x, 1.15, 2.86, 3.6);
      iconCircle(s, ic, x + 0.3, 1.45, 0.75);
      s.addText(h, T({ x: x + 0.3, y: 2.38, w: 2.3, h: 0.45, fontSize: 22, bold: true }));
      s.addText(lines.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < lines.length - 1 } })),
        T({ x: x + 0.3, y: 2.95, w: 2.35, h: 1.6, fontSize: 14, paraSpaceAfter: 8, color: C.ink }));
    });
  }

  // 4 숫자로 보는 효과
  {
    const s = slide("CONTENT");
    header(s, "1부 · 왜 지금 제조 AX인가", "숫자로 보는 제조 AX의 효과");
    card(s, 0.5, 1.1, 5.0, 3.65);
    s.addText("국내 M.AX 성과 확인 현장 42곳 평균", T({ x: 0.75, y: 1.3, w: 4.5, h: 0.35, fontSize: 14, bold: true, color: C.gray }));
    s.addText("+30%", T({ x: 0.75, y: 1.75, w: 2.2, h: 0.85, fontSize: 40, bold: true, color: C.orange, valign: "middle" }));
    s.addText("생산성", T({ x: 0.75, y: 2.6, w: 2.2, h: 0.35, fontSize: 15 }));
    s.addText("−15%", T({ x: 3.0, y: 1.75, w: 2.2, h: 0.85, fontSize: 40, bold: true, color: C.teal, valign: "middle" }));
    s.addText("불량률", T({ x: 3.0, y: 2.6, w: 2.2, h: 0.35, fontSize: 15 }));
    s.addText([
      { text: "M.AX 얼라이언스: 약 1,500개 기업 참여 (2025.9 출범)", options: { bullet: true, breakLine: true } },
      { text: "HD현대삼호 용접 공정 생산성 +50%", options: { bullet: true, breakLine: true } },
      { text: "전기차 배터리 검사 시간 −90%", options: { bullet: true } },
    ], T({ x: 0.75, y: 3.15, w: 4.6, h: 1.45, fontSize: 14, paraSpaceAfter: 6 }));
    const right = [["1,220대", "근로자 1만 명당 산업용 로봇", "한국, 세계 1위 (2024)"], ["238곳", "WEF 등대공장", "전 세계, 2026년 6월 기준"]];
    right.forEach(([v, l, c], i) => {
      const y = 1.1 + i * 1.88;
      card(s, 5.75, y, 3.75, 1.77);
      s.addText(v, T({ x: 6.0, y: y + 0.18, w: 3.3, h: 0.7, fontSize: 34, bold: true, color: C.orange, valign: "middle" }));
      s.addText(l, T({ x: 6.0, y: y + 0.92, w: 3.3, h: 0.35, fontSize: 15, bold: true }));
      s.addText(c, T({ x: 6.0, y: y + 1.27, w: 3.3, h: 0.3, fontSize: 12, color: C.gray }));
    });
    src(s, "출처: 산업통상자원부 업무보고(2026.8, 뉴시스), IFR World Robotics 2025, WEF Global Lighthouse Network(2026.6)");
  }

  // 5 스마트공장 → 지능화
  {
    const s = slide("CONTENT");
    header(s, "1부 · 왜 지금 제조 AX인가", "스마트공장 3만 개, 그런데 왜 다시 '지능화'인가");
    card(s, 0.5, 1.1, 4.3, 3.65);
    s.addText("성과", T({ x: 0.75, y: 1.28, w: 3.8, h: 0.3, fontSize: 13, bold: true, color: C.teal }));
    s.addText("31,782개", T({ x: 0.75, y: 1.58, w: 3.8, h: 0.65, fontSize: 32, bold: true, color: C.orange, valign: "middle" }));
    s.addText("스마트공장 도입 기업 (2014~2024)", T({ x: 0.75, y: 2.23, w: 3.8, h: 0.3, fontSize: 13 }));
    [["+30%", "생산성"], ["−16%", "제조원가"], ["−18%", "산업재해"]].forEach(([v, l], i) => {
      const x = 0.75 + i * 1.3;
      s.addText(v, T({ x, y: 2.62, w: 1.25, h: 0.4, fontSize: 20, bold: true, color: C.teal }));
      s.addText(l, T({ x, y: 3.02, w: 1.25, h: 0.3, fontSize: 12, color: C.gray }));
    });
    s.addText("한계", T({ x: 0.75, y: 3.48, w: 3.8, h: 0.3, fontSize: 13, bold: true, color: C.orange }));
    s.addText("대부분 기초 단계에 머묾. 설비는 연결됐지만 데이터가 의사결정으로 이어지지 못함", T({ x: 0.75, y: 3.78, w: 3.85, h: 0.85, fontSize: 14 }));

    s.addText("정부 정책의 변화", T({ x: 5.1, y: 1.1, w: 4.4, h: 0.32, fontSize: 14, bold: true, color: C.gray }));
    const tl = [["2014", "스마트공장 보급"], ["2024", "AI 자율제조 전략"], ["2025.10", "AI 기반 스마트제조혁신 3.0"], ["2026.6", "제조AI 2030 전략 (AI 팩토리 500개)"]];
    s.addShape(pres.shapes.LINE, { x: 5.32, y: 1.68, w: 0, h: 2.1, line: { color: C.light, width: 2 } });
    tl.forEach(([d, t], i) => {
      const y = 1.55 + i * 0.7;
      const last = i === tl.length - 1;
      s.addShape(pres.shapes.OVAL, { x: 5.2, y: y + 0.03, w: 0.24, h: 0.24, fill: { color: last ? C.orange : C.gray }, line: { color: C.white, width: 1.5 } });
      s.addText(d, T({ x: 5.6, y: y - 0.02, w: 1.0, h: 0.34, fontSize: 13, bold: true, color: last ? C.orange : C.gray, valign: "middle" }));
      s.addText(t, T({ x: 6.6, y: y - 0.02, w: 2.9, h: 0.6, fontSize: 14, bold: last }));
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.1, y: 4.3, w: 4.4, h: 0.45, fill: { color: C.ink }, line: { type: "none" }, rectRadius: 0.06 });
    s.addText("‘몇 개를 지었나’ → ‘AI로 판단하는가’", T({ x: 5.25, y: 4.3, w: 4.1, h: 0.45, fontSize: 14, bold: true, color: C.white, valign: "middle", align: "center" }));
    src(s, "출처: 중소벤처기업부·스마트제조혁신추진단 실태조사(2024)·성과보고서(2025), 관계부처 합동(2025.10, 2026.6)");
  }

  // 6 네 단계
  {
    const s = slide("CONTENT");
    header(s, "1부 · 스마트팩토리에서 AI 팩토리로", "공장 진화의 네 단계: 누가 판단하는가");
    const st = [
      [I.cogs, "자동화", "정해진 동작의 반복", "사람이 정한 규칙"],
      [I.eye, "디지털화", "공장이 ‘눈’을 갖다", "데이터를 본 사람"],
      [I.brain, "지능화", "공장이 ‘두뇌’를 갖다", "AI (사람은 목표·기준)"],
      [I.hand, "자율화", "공장이 ‘손’까지 갖다", "AI가 판단하고 실행"],
    ];
    const w = 2.0, gap = 0.33;
    st.forEach(([ic, h, m, who], i) => {
      const x = 0.5 + i * (w + gap);
      const hi = i >= 2;
      card(s, x, 1.1, w, 2.95, hi ? "FDEBD9" : C.card);
      iconCircle(s, ic, x + 0.65, 1.3, 0.7, hi ? C.orange : C.gray);
      s.addText(`${i + 1}. ${h}`, T({ x: x + 0.1, y: 2.1, w: w - 0.2, h: 0.4, fontSize: 18, bold: true, align: "center" }));
      s.addText(m, T({ x: x + 0.1, y: 2.5, w: w - 0.2, h: 0.35, fontSize: 13, align: "center", color: C.gray }));
      s.addText("판단 주체", T({ x: x + 0.1, y: 3.05, w: w - 0.2, h: 0.28, fontSize: 11, align: "center", color: hi ? C.orange : C.gray, bold: true }));
      s.addText(who, T({ x: x + 0.1, y: 3.33, w: w - 0.2, h: 0.6, fontSize: 14, bold: true, align: "center" }));
      if (i < 3) s.addImage({ data: IO.arrowR, x: x + w + 0.06, y: 2.42, w: 0.21, h: 0.21 });
    });
    s.addText([
      { text: "2026년 선도 기업은 3단계를 넘어 4단계로  ", options: { bold: true } },
      { text: "예) 현대차그룹 싱가포르 HMGICS: 컨베이어 없는 셀 생산, SDF 기반 24시간 자율운영 검증", options: { color: C.gray } },
    ], T({ x: 0.5, y: 4.25, w: 9, h: 0.55, fontSize: 13 }));
    src(s, "출처: 헤럴드경제(2026.5.30)");
  }

  // 7 AI 팩토리 두 의미
  {
    const s = slide("CONTENT");
    header(s, "1부 · 스마트팩토리에서 AI 팩토리로", "‘AI 팩토리’의 두 가지 의미");
    const two = [
      [I.server, "AI를 만드는 공장", "GPU 데이터센터. 데이터를 넣으면 AI 모델이 나온다 (엔비디아의 용법)"],
      [I.industry, "AI로 움직이는 공장", "실제 제조 공장. AI가 품질·설비·생산을 판단하고 운영한다"],
    ];
    two.forEach(([ic, h, d], i) => {
      const x = i === 0 ? 0.5 : 5.55;
      card(s, x, 1.15, 3.95, 2.45);
      iconCircle(s, ic, x + 0.3, 1.4, 0.75, i === 0 ? C.teal : C.orange);
      photo(s, i === 0 ? "s07_datacenter" : "s03_robot_row", x + 1.4, 1.3, 2.4, 0.92);
      s.addText(h, T({ x: x + 0.3, y: 2.3, w: 3.4, h: 0.45, fontSize: 20, bold: true }));
      s.addText(d, T({ x: x + 0.3, y: 2.78, w: 3.4, h: 0.75, fontSize: 14, color: C.ink }));
    });
    s.addImage({ data: IO.arrowR, x: 4.75, y: 2.05, w: 0.55, h: 0.55 });
    s.addText("두뇌 제공", T({ x: 4.5, y: 2.65, w: 1.05, h: 0.3, fontSize: 12, bold: true, color: C.orange, align: "center" }));
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 3.85, w: 9, h: 0.9, fill: { color: C.ink }, line: { type: "none" }, rectRadius: 0.08 });
    s.addText([
      { text: "2025.10 삼성전자·현대차그룹, 각각 GPU 5만 장 규모 AI 팩토리 발표", options: { breakLine: true, bold: true } },
      { text: "목적: 반도체 공장·자동차 공장을 더 똑똑하게 만드는 것", options: { color: C.light } },
    ], T({ x: 0.8, y: 3.95, w: 8.5, h: 0.7, fontSize: 14, color: C.white, valign: "middle" }));
    src(s, "출처: eWEEK(2025.10), NVIDIA 보도자료(2025.10)" + cr("s07_datacenter", "s03_robot_row"));
  }

  // 8 동향1 AI 에이전트
  {
    const s = slide("CONTENT");
    header(s, "2부 · 핵심 기술 동향 ① 산업 AI 에이전트", "말로 설명하면 AI가 일한다");
    card(s, 0.5, 1.1, 4.3, 0.95);
    iconCircle(s, I.comment, 0.7, 1.3, 0.55, C.gray);
    s.addText("“불량품이 감지되면 라인을 멈추고 알람을 울려라”", T({ x: 1.4, y: 1.18, w: 3.3, h: 0.8, fontSize: 14, bold: true, valign: "middle" }));
    s.addImage({ data: IO.arrowD, x: 2.48, y: 2.12, w: 0.3, h: 0.3 });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 2.5, w: 4.3, h: 0.7, fill: { color: C.orange }, line: { type: "none" }, rectRadius: 0.08 });
    s.addText("AI 에이전트", T({ x: 0.5, y: 2.5, w: 4.3, h: 0.7, fontSize: 18, bold: true, color: C.white, align: "center", valign: "middle" }));
    s.addImage({ data: IO.arrowD, x: 2.48, y: 3.27, w: 0.3, h: 0.3 });
    ["PLC 코드", "생산 계획", "설비 정비"].forEach((t, i) => {
      const x = 0.5 + i * 1.45;
      card(s, x, 3.65, 1.4, 0.65);
      s.addText(t, T({ x, y: 3.65, w: 1.4, h: 0.65, fontSize: 14, bold: true, align: "center", valign: "middle" }));
    });
    s.addText("사람은 무엇을 맡길지 정하고 결과를 검토", T({ x: 0.5, y: 4.4, w: 4.3, h: 0.35, fontSize: 12, color: C.gray, align: "center" }));

    card(s, 5.1, 1.1, 4.4, 1.7);
    s.addText("지멘스 ‘산업용 코파일럿’", T({ x: 5.35, y: 1.28, w: has("s08_plc") ? 2.75 : 4.0, h: 0.38, fontSize: has("s08_plc") ? 15 : 16, bold: true }));
    const plc = photo(s, "s08_plc", 8.15, 1.25, 1.2, 1.4);
    s.addText("엔지니어의 자연어 설명으로 PLC 제어 코드를 생성. 설계·계획·정비 전체 흐름을 맡는 AI 에이전트로 확장 중", T({ x: 5.35, y: 1.7, w: plc ? 2.7 : 3.95, h: 1.0, fontSize: plc ? 12.5 : 14 }));
    card(s, 5.1, 3.0, 4.4, 1.75);
    iconCircle(s, I.database, 5.35, 3.22, 0.5);
    s.addText("열쇠는 공장의 데이터", T({ x: 6.0, y: 3.25, w: 3.4, h: 0.45, fontSize: 16, bold: true, valign: "middle" }));
    s.addText("숙련공의 머릿속 암묵지를 데이터로 만들어 AI에게 가르친다", T({ x: 5.35, y: 3.85, w: 3.95, h: 0.8, fontSize: 14 }));
    src(s, "출처: Siemens, AI agents for industrial automation (2025.5)" + cr("s08_plc"));
  }

  // 9 동향2 디지털 트윈
  {
    const s = slide("CONTENT");
    header(s, "2부 · 핵심 기술 동향 ② 디지털 트윈과 시뮬레이션", "가상 공장에서 먼저 만들어 본다");
    const box = (x, ic, h, d, fill) => {
      card(s, x, 1.15, 3.3, 1.55);
      iconCircle(s, ic, x + 0.25, 1.4, 0.65, fill);
      s.addText(h, T({ x: x + 1.05, y: 1.38, w: 2.15, h: 0.45, fontSize: 18, bold: true, valign: "middle" }));
      s.addText(d, T({ x: x + 1.05, y: 1.85, w: 2.15, h: 0.75, fontSize: 13, color: C.gray }));
    };
    box(0.5, I.industry, "실제 공장", "설비·로봇·센서", C.gray);
    box(6.2, I.cube, "가상 공장", "형상 + 물리 특성 + 실시간 데이터", C.orange);
    s.addText("센서 데이터 →", T({ x: 3.9, y: 1.4, w: 2.2, h: 0.35, fontSize: 13, bold: true, color: C.teal, align: "center" }));
    s.addImage({ data: IO.exchange, x: 4.7, y: 1.78, w: 0.6, h: 0.45 });
    s.addText("← 검증된 최적안", T({ x: 3.9, y: 2.3, w: 2.2, h: 0.35, fontSize: 13, bold: true, color: C.orange, align: "center" }));
    const two = [
      [I.cubes, "공장 운영", "생산을 멈추지 않고 가상에서 수백 번 실험. 삼성전자: 옴니버스로 반도체 공장 전체를 실시간 트윈화"],
      [I.robot, "로봇 훈련 (Sim-to-Real)", "가상에서 학습한 뒤 현실로. 삼성전자: 아이작 심에서 로봇을 훈련·검증 후 공장 투입"],
    ];
    two.forEach(([ic, h, d], i) => {
      const x = 0.5 + i * 4.6;
      card(s, x, 2.95, 4.4, 1.8);
      iconCircle(s, ic, x + 0.25, 3.15, 0.5);
      s.addText(h, T({ x: x + 0.9, y: 3.15, w: 3.3, h: 0.5, fontSize: 16, bold: true, valign: "middle" }));
      s.addText(d, T({ x: x + 0.25, y: 3.75, w: 3.95, h: 0.95, fontSize: 13.5 }));
    });
    src(s, "출처: eWEEK, Nvidia and Samsung to Build New AI Factory (2025.10)");
  }

  // 10 동향3 피지컬 AI
  {
    const s = slide("CONTENT");
    header(s, "2부 · 핵심 기술 동향 ③ 피지컬 AI와 휴머노이드", "AI가 몸을 얻다");
    s.addText("BMW × 피규어 AI: 미국 스파탄버그 공장 실증", T({ x: 0.5, y: 1.05, w: 5, h: 0.35, fontSize: 14, bold: true, color: C.gray }));
    const st = [["11개월", "생산 라인 투입"], ["9만 개+", "철판 부품 처리"], ["3만 대+", "차량 생산 참여"], ["5mm", "부품 배치 오차 이내"]];
    st.forEach(([v, l], i) => {
      const x = 0.5 + (i % 2) * 2.55, y = 1.48 + Math.floor(i / 2) * 1.25;
      card(s, x, y, 2.4, 1.12);
      s.addText(v, T({ x: x + 0.2, y: y + 0.1, w: 2.0, h: 0.6, fontSize: 28, bold: true, color: C.orange, valign: "middle" }));
      s.addText(l, T({ x: x + 0.2, y: y + 0.7, w: 2.0, h: 0.32, fontSize: 13 }));
    });
    const r = [["현대차그룹 × 보스턴 다이내믹스", "휴머노이드 ‘아틀라스’, 2028년부터 미국 메타플랜트 투입 (CES 2026)"], ["정부 업종별 휴머노이드", "조선·자동차·철강 등 10개 업종 맞춤 개발"]];
    r.forEach(([h, d], i) => {
      const y = 1.1 + i * 1.3;
      card(s, 5.75, y, 3.75, 1.18);
      const p = i === 0 && photo(s, "s10_atlas", 8.6, y + 0.06, 0.82, 1.06);
      s.addText(h, T({ x: 5.95, y: y + 0.12, w: p ? 2.6 : 3.4, h: 0.35, fontSize: p ? 12.5 : 14, bold: true }));
      s.addText(d, T({ x: 5.95, y: y + 0.5, w: p ? 2.6 : 3.4, h: 0.62, fontSize: p ? 11.5 : 13 }));
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 4.08, w: 9, h: 0.75, fill: { color: C.ink }, line: { type: "none" }, rectRadius: 0.08 });
    iconCircle(s, I.tools, 0.7, 4.17, 0.55);
    s.addText([
      { text: "성능의 열쇠: ", options: { color: C.orange, bold: true } },
      { text: "구동기·감속기·로봇 손·센서와 제어 → 기계제어공학의 영역", options: { color: C.white, bold: true } },
    ], T({ x: 1.4, y: 4.08, w: 7.9, h: 0.75, fontSize: 14, valign: "middle" }));
    src(s, "출처: IIoT World(2026), Automotive World(2026.1), 산업통상자원부(2026.8)" + cr("s10_atlas"));
  }

  // 11 동향4 엣지 AI·데이터
  {
    const s = slide("CONTENT");
    header(s, "2부 · 핵심 기술 동향 ④ 엣지 AI와 산업 데이터", "현장에서 바로 판단한다");
    const cmp = [[I.cloud, "클라우드에서 판단", ["멀리 있는 서버에 매번 질의", "네트워크가 늦으면 로봇이 멈춤"], C.gray], [I.bolt, "엣지에서 판단", ["설비·로봇 안의 AI 칩", "현장에서 즉시 판단"], C.orange]];
    cmp.forEach(([ic, h, lines, col], i) => {
      const x = i === 0 ? 0.5 : 5.2;
      card(s, x, 1.1, 4.3, 1.8, i === 1 ? "FDEBD9" : C.card);
      iconCircle(s, ic, x + 0.25, 1.3, 0.6, col);
      s.addText(h, T({ x: x + 1.0, y: 1.3, w: 3.1, h: 0.6, fontSize: 17, bold: true, valign: "middle" }));
      const p = i === 1 && photo(s, "s11_jetson", x + 2.95, 1.95, 1.2, 0.85);
      s.addText(lines.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < lines.length - 1 } })), T({ x: x + 0.3, y: 2.0, w: p ? 2.6 : 3.85, h: 0.85, fontSize: p ? 13 : 14, paraSpaceAfter: 4 }));
    });
    if (has("s11_jetson")) src(s, cr("s11_jetson").replace(/^ \/ /, ""));
    s.addImage({ data: IO.arrowR, x: 4.85, y: 1.85, w: 0.3, h: 0.3 });
    const three = [[I.chip, "로봇용 AI 칩", "삼성: 엔비디아 엣지 AI 모듈\n현대차: 저전력 AI 칩 개발"], [I.database, "제조 데이터", "제각각인 데이터 형식이 큰 장벽.\n국가 제조 데이터 라이브러리 구축"], [I.shield, "공장 보안", "연결될수록 해킹 위험 증가.\n공장 제어 시스템 보안이 필수"]];
    three.forEach(([ic, h, d], i) => {
      const x = 0.5 + i * 3.07;
      card(s, x, 3.1, 2.86, 1.7);
      iconCircle(s, ic, x + 0.2, 3.25, 0.45);
      s.addText(h, T({ x: x + 0.75, y: 3.25, w: 2.0, h: 0.45, fontSize: 15, bold: true, valign: "middle" }));
      s.addText(d, T({ x: x + 0.2, y: 3.8, w: 2.5, h: 0.95, fontSize: 12.5 }));
    });
  }

  // 12 동향5 사람 중심
  {
    const s = slide("CONTENT");
    header(s, "2부 · 핵심 기술 동향 ⑤ 사람 중심의 자율 공장", "사람과 AI가 함께 일한다");
    card(s, 0.5, 1.1, 2.6, 1.6);
    iconCircle(s, I.tools, 0.7, 1.3, 0.55, C.gray);
    s.addText("직접 조립하던 사람", T({ x: 0.7, y: 1.95, w: 2.25, h: 0.6, fontSize: 15, bold: true }));
    s.addImage({ data: IO.arrowR, x: 3.25, y: 1.7, w: 0.4, h: 0.4 });
    card(s, 3.8, 1.1, 5.7, 1.6, "FDEBD9");
    iconCircle(s, I.user, 4.0, 1.3, 0.55);
    const cob = photo(s, "s12_cobot", 8.05, 1.2, 1.35, 1.4);
    s.addText("로봇과 AI를 설계하고, 가르치고, 감독하는 사람", T({ x: 4.0, y: 1.95, w: cob ? 3.9 : 5.3, h: 0.6, fontSize: 15, bold: true }));
    if (cob) src(s, cr("s12_cobot").replace(/^ \/ /, ""));
    s.addText("유럽 ‘인더스트리 5.0’의 세 가지 가치", T({ x: 0.5, y: 2.95, w: 9, h: 0.35, fontSize: 14, bold: true, color: C.gray }));
    [[I.users, "사람 중심"], [I.leaf, "지속가능성"], [I.sync, "회복탄력성"]].forEach(([ic, h], i) => {
      const x = 0.5 + i * 1.75;
      iconCircle(s, ic, x + 0.45, 3.4, 0.6, C.teal);
      s.addText(h, T({ x, y: 4.08, w: 1.5, h: 0.35, fontSize: 14, bold: true, align: "center" }));
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.9, y: 3.3, w: 3.6, h: 1.5, fill: { color: C.ink }, line: { type: "none" }, rectRadius: 0.08 });
    s.addText([
      { text: "가장 부족한 인재", options: { color: C.orange, bold: true, breakLine: true, fontSize: 13 } },
      { text: "기계 + 제어 + AI를\n함께 아는 사람", options: { color: C.white, bold: true, fontSize: 18 } },
    ], T({ x: 6.15, y: 3.4, w: 3.2, h: 1.3, valign: "middle" }));
  }

  // 13 사례 표
  {
    const s = slide("CONTENT");
    header(s, "3부 · 국내외 사례", "한눈에 보는 국내외 AI 팩토리 사례");
    const hdr = ["구분", "기업", "동향", "핵심 내용"].map((t) => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.ink } } }));
    const rows = [
      ["국내", "삼성전자", "②④", "GPU 5만 장급 AI 팩토리, 반도체 공장 실시간 트윈 (2025.10)"],
      ["국내", "현대차그룹", "③", "휴머노이드 아틀라스, 2028년 메타플랜트 투입 계획"],
      ["국내", "현대차 HMGICS", "③ 자율화", "셀 생산, SDF 기반 24시간 자율운영 검증 (2026.5)"],
      ["국내", "HD현대중공업", "①③", "용접 협동로봇 생산성 약 +70%, 러그 공정 6명→2명"],
      ["국내", "M.AX 참여기업", "①", "42개 현장 평균 생산성 +30%, 불량률 −15% (2026.8)"],
      ["해외", "샤오미 (중국)", "자율화", "자동화율 81%, 약 6초당 스마트폰 1대"],
      ["해외", "지멘스 (독일)", "①", "산업용 코파일럿, 자연어로 PLC 코드 생성"],
      ["해외", "BMW × 피규어 AI", "③", "휴머노이드 11개월, 부품 9만 개, 차량 3만 대 참여"],
      ["해외", "록웰 (싱가포르)", "①⑤", "WEF 등대공장, 인당 생산성 +43%, 불량 −35%"],
    ].map((r, i) => r.map((t, j) => ({ text: t, options: { fill: { color: i % 2 ? C.white : C.card }, color: j === 0 ? (t === "국내" ? C.orange : C.teal) : C.ink, bold: j <= 1 } })));
    s.addTable([hdr, ...rows], { x: 0.5, y: 1.05, w: 9, colW: [0.7, 1.75, 0.95, 5.6], fontFace: FONT, fontSize: 11, rowH: 0.37, valign: "middle", border: { type: "solid", pt: 0.5, color: "DDE2E5" }, margin: 0.06 });
    s.addText("동향 번호: ① AI 에이전트  ② 디지털 트윈  ③ 피지컬 AI  ④ 엣지 AI·데이터  ⑤ 사람 중심", T({ x: 0.5, y: 4.82, w: 9, h: 0.3, fontSize: 10, color: C.gray }));
  }

  // 13-1 사례 영상 (대본 없음): 썸네일을 누르면 공식 유튜브 영상으로 이동
  {
    const VIDEOS = JSON.parse(require("fs").readFileSync(__ROOT + "/lecture-series/thumbnails/lecture2/videos.json", "utf8"));
    const s = pres.addSlide({ masterName: "CONTENT" });
    s.addNotes("");
    header(s, "3부 · 국내외 사례", "사례 영상으로 보기");
    const groups = [["국내", C.orange, ["s07_samsung_ai_factory", "s10_atlas", "s13_hmgics", "s13_hd_hyundai", "s13_max"]],
      ["해외", C.teal, ["s02_xiaomi", "s08_siemens_copilot", "s10_bmw_figure", "s13_rockwell", "s09_digital_twin"]]];
    const SHORT = { s07_samsung_ai_factory: "삼성전자 AI 팩토리", s10_atlas: "현대차 아틀라스", s13_hmgics: "현대차 HMGICS", s13_hd_hyundai: "HD현대 스마트 조선소", s13_max: "M.AX 얼라이언스",
      s02_xiaomi: "샤오미 다크 팩토리", s08_siemens_copilot: "지멘스 코파일럿", s10_bmw_figure: "BMW × 피규어 AI", s13_rockwell: "록웰 싱가포르", s09_digital_twin: "엔비디아 디지털 트윈" };
    const w = 1.65, h = w * 9 / 16, gx = 0.1875;
    groups.forEach(([g, color, keys], r) => {
      const y = 1.3 + r * 1.78;
      s.addText(g, T({ x: 0.5, y: y - 0.3, w: 2, h: 0.26, fontSize: 12, bold: true, color }));
      keys.map((k) => VIDEOS.find((v) => v.key === k)).forEach((v, i) => {
        const x = 0.5 + i * (w + gx);
        s.addImage({ path: require("path").resolve(__ROOT, v.thumbnail), x, y, w, h, hyperlink: { url: v.url, tooltip: v.title } });
        s.addShape(pres.shapes.OVAL, { x: x + w / 2 - 0.17, y: y + h / 2 - 0.17, w: 0.34, h: 0.34, fill: { color: C.orange }, line: { color: C.white, width: 1.25 }, hyperlink: { url: v.url } });
        s.addText("▶", T({ x: x + w / 2 - 0.16, y: y + h / 2 - 0.17, w: 0.34, h: 0.34, fontSize: 11, color: C.white, align: "center", valign: "middle" }));
        s.addText([{ text: SHORT[v.key], options: { bold: true, breakLine: true, hyperlink: { url: v.url } } },
          { text: `${v.channel.trim().replace(/\s*\(.*\)$/, "")} · ${v.length}`, options: { fontSize: 8, color: C.gray } }],
          T({ x, y: y + h + 0.04, w, h: 0.55, fontSize: 10 }));
      });
    });
    src(s, "썸네일을 누르면 각 기업·기관의 공식 유튜브 영상이 열립니다. 삼성 AI 팩토리와 록웰은 공식 영상이 없어 뉴스 영상입니다.");
  }

  // 14 전공 연결
  {
    const s = slide("CONTENT");
    header(s, "4부 · 기계제어공학과의 연결", "AI 팩토리는 기계제어공학 위에 서 있다");
    [[I.brain, "AI", "두뇌"], [I.robot, "기계", "몸"], [I.cogs, "제어", "신경"]].forEach(([ic, h, d], i) => {
      const x = 0.5 + i * 3.07;
      card(s, x, 1.05, 2.86, 0.8);
      iconCircle(s, ic, x + 0.15, 1.15, 0.6, i === 0 ? C.teal : C.orange);
      s.addText([{ text: h + "  ", options: { bold: true, fontSize: 17 } }, { text: d, options: { fontSize: 14, color: C.gray } }], T({ x: x + 0.9, y: 1.05, w: 1.9, h: 0.8, valign: "middle" }));
    });
    const hdr = ["핵심 동향", "필요한 역량", "연결 과목 예시"].map((t) => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.ink } } }));
    const rows = [
      ["① 산업 AI 에이전트", "공정 이해, 프로그래밍, PLC", "프로그래밍, 자동제어, 생산공학"],
      ["② 디지털 트윈", "모델링과 시뮬레이션", "동역학, CAD, 수치해석"],
      ["③ 피지컬 AI·휴머노이드", "로봇 설계와 제어", "로보틱스, 제어공학, 기계설계"],
      ["④ 엣지 AI·데이터", "센서, 임베디드, 신호처리", "메카트로닉스, 임베디드시스템"],
      ["⑤ 사람 중심 자율 공장", "시스템 통합, 문제 해결", "캡스톤 설계, 산업인공지능"],
    ].map((r, i) => r.map((t, j) => ({ text: t, options: { fill: { color: i % 2 ? C.white : C.card }, bold: j === 0 } })));
    s.addTable([hdr, ...rows], { x: 0.5, y: 2.05, w: 9, colW: [2.6, 3.0, 3.4], fontFace: FONT, fontSize: 13, color: C.ink, rowH: 0.45, valign: "middle", border: { type: "solid", pt: 0.5, color: "DDE2E5" }, margin: 0.08 });
  }

  // 15 정리
  {
    const s = slide("DARK");
    s.addText("정리", T({ x: 0.6, y: 0.45, w: 8.8, h: 0.35, fontSize: 14, bold: true, color: C.orange }));
    s.addText("공장이 스스로 생각하게 된 이유", T({ x: 0.6, y: 0.8, w: 8.8, h: 0.6, fontSize: 28, bold: true, color: C.white }));
    [[I.eye, "눈", "데이터"], [I.brain, "두뇌", "AI"], [I.hand, "손", "로봇과 제어"]].forEach(([ic, h, d], i) => {
      const x = 0.6 + i * 2.2;
      iconCircle(s, ic, x + 0.5, 1.65, 0.8);
      s.addText(h, T({ x, y: 2.55, w: 1.8, h: 0.4, fontSize: 18, bold: true, color: C.white, align: "center" }));
      s.addText(d, T({ x, y: 2.95, w: 1.8, h: 0.35, fontSize: 14, color: C.light, align: "center" }));
    });
    s.addText([
      { text: "그 공장을 만드는 사람은?", options: { color: C.light, fontSize: 15, breakLine: true } },
      { text: "바로 여러분입니다", options: { color: C.orange, fontSize: 26, bold: true } },
    ], T({ x: 7.0, y: 1.75, w: 2.6, h: 1.4, valign: "middle" }));
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 3.75, w: 8.8, h: 1.15, fill: { color: "2B3A44" }, line: { type: "none" }, rectRadius: 0.08 });
    s.addText("다음 강의", T({ x: 0.85, y: 3.88, w: 3, h: 0.3, fontSize: 12, bold: true, color: C.orange }));
    s.addText([
      { text: "3강  제조 AX: 영상 기반 품질검사 사례", options: { breakLine: true } },
      { text: "4강  제조 AX: 고장 진단/예측 및 공정 최적화 사례" },
    ], T({ x: 0.85, y: 4.2, w: 8.3, h: 0.65, fontSize: 15, color: C.white, bold: true, paraSpaceAfter: 2 }));
  }

  const out = process.env.OUT || __ROOT + "/lecture2/2강_제조AX_AI팩토리_기술동향.pptx";
  require("fs").mkdirSync(__ROOT + "/lecture2", { recursive: true });
  await pres.writeFile({ fileName: "deck.pptx" });
  await require(require("path").join(__dirname, "../../tools/repo.js")).applyTheme("deck.pptx", { name: "제조 AX 혁신과 공학진로", headFontFace: FONT, bodyFontFace: FONT, colors: { dk1: "1E2A32", lt1: "FFFFFF", dk2: "5B6770", lt2: "F2F4F5", accent1: "F28C28", accent2: "2A9D8F", accent3: "5B6770", accent4: "3D5A6C", accent5: "E9C46A", accent6: "8FA6B8", hlink: "2A9D8F", folHlink: "5B6770" } });
  require("fs").copyFileSync("deck.pptx", out);
  console.log("ok", n);
})();
