// 3·4강 복습 퀴즈 PPT 생성 (pptxgenjs). 시리즈 스타일(lecture-series/style.md)과 1강 참고 구현의 헬퍼를 따름.
// 실행: NODE_PATH=<pptxgenjs·sharp·react-icons 설치 위치>/node_modules node build_quiz.js
// 출력: PPT, TTS용 대본, 문항·정답 목록
const __ROOT = require(require("path").join(__dirname, "../../tools/repo.js")).ROOT; // 저장소 루트
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { applyTheme } = require(require("path").join(__dirname, "../../tools/repo.js"));
// 인자: 문항 데이터 파일 (기본 quiz_data.js). META 로 제목과 출력 파일 이름을 정함
const DATA = require(require("path").resolve(__dirname, process.argv[2] || "quiz_data.js"));
const { PAUSE, INTRO, SECTIONS, OUTRO, Q } = DATA;
const META = DATA.META || { title: "복습 퀴즈", file: "3-4강_복습퀴즈" };

const FONT = "맑은 고딕";
const C = { dk: "1E2A32", or: "F28C28", te: "2A9D8F", gr: "5B6770", lt: "F2F4F5", wh: "FFFFFF", lg: "D5DADD" };
const THEME = {
  name: "제조AX 혁신과 공학진로", headFontFace: FONT, bodyFontFace: FONT,
  colors: { dk1: C.dk, lt1: C.wh, dk2: "2E3B44", lt2: C.lt, accent1: C.or, accent2: C.te, accent3: C.gr,
    accent4: "E9C46A", accent5: "264653", accent6: "8AB17D", hlink: C.te, folHlink: C.gr },
};
const LECTURE = `제조AX 혁신과 공학진로 · 3·4강 ${META.title}`;
const OUT_DIR = __ROOT + "/quiz34";
const NUM = ["①", "②", "③", "④"];
const ORD = ["첫", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열", "열한", "열두", "열세", "열네", "열다섯", "열여섯", "열일곱", "열여덟", "열아홉", "스무"];
const N3 = Q.filter((q) => q.lec === 3).length;

// 문제 낭독 앞에 붙는 서수 문장
function lead(i) {
  const q = Q[i], last = i === Q.length - 1;
  if (i === N3 - 1) return `3강의 마지막, ${ORD[i]} 번째 문제입니다. `;
  if (i === N3) return `4강의 첫 문제, 전체로는 ${ORD[i]} 번째 문제입니다. `;
  if (last) return `마지막 ${ORD[i]} 번째 문제입니다. `;
  return q.type === "ox" ? `${ORD[i]} 번째는 오엑스 문제입니다. ` : `${ORD[i]} 번째 문제입니다. `;
}

async function icon(Comp, color = "#FFFFFF") {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.title = `3·4강 ${META.title}`;
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
  for (const [k, comp] of Object.entries({ hourglass: fa.FaHourglassHalf, check: fa.FaCheck, eye: fa.FaEye, cogs: fa.FaCogs, book: fa.FaBookOpen, question: fa.FaQuestion }))
    I[k] = await icon(comp);

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
  const label = (q) => (q.lec === 3 ? "3강 퀴즈 · 영상 기반 품질검사" : "4강 퀴즈 · 고장 진단·예측과 공정 최적화");

  const narr = []; // 슬라이드 순서대로 낭독문 (TTS 파일용)
  const notes = (s, t) => { s.addNotes(t); narr.push(t); };

  // 표지
  {
    const s = pres.addSlide({ masterName: "DARK" });
    txt(s, LECTURE, { x: 0.6, y: 0.9, w: 5.5, h: 0.3, fontSize: 12, bold: true, color: C.or });
    txt(s, `3·4강\n${META.title}`, { x: 0.6, y: 1.3, w: 5.4, h: 1.6, fontSize: 40, bold: true, color: C.wh, valign: "middle" });
    txt(s, "영상 기반 품질검사 · 고장 진단·예측과 공정 최적화", { x: 0.6, y: 3.0, w: 5.6, h: 0.4, fontSize: 15, color: "C9D1D6" });
    txt(s, "한동대학교 기계제어공학부 김영근 교수", { x: 0.6, y: 4.4, w: 5.5, h: 0.35, fontSize: 14, bold: true, color: C.wh });
    const items = [[I.eye, `3강 ${N3}문제`], [I.cogs, `4강 ${Q.length - N3}문제`], [I.question, "4지선다와 O/X 문제"], [I.book, "해설에 복습할 강의 장면 표시"]];
    items.forEach(([img, t], i) => {
      const y = 1.35 + i * 0.75;
      iconCircle(s, img, 6.5, y, 0.5);
      txt(s, t, { x: 7.15, y, w: 2.6, h: 0.5, fontSize: 14, color: C.wh, valign: "middle" });
    });
    notes(s, INTRO);
  }

  const section = (sec) => {
    const s = pres.addSlide({ masterName: "DARK" });
    txt(s, sec.part, { x: 0.6, y: 1.5, w: 4, h: 0.5, fontSize: 20, bold: true, color: C.or });
    txt(s, sec.title, { x: 0.6, y: 2.05, w: 8.8, h: 0.9, fontSize: 32, bold: true, color: C.wh, valign: "middle" });
    txt(s, sec.range, { x: 0.6, y: 3.05, w: 6, h: 0.4, fontSize: 16, color: "C9D1D6" });
    txt(s, LECTURE, { x: 0.6, y: 5.15, w: 5, h: 0.25, fontSize: 9, color: "9AA5AD" });
    notes(s, sec.narr);
  };

  Q.forEach((q, i) => {
    if (i === 0) section(SECTIONS[0]);
    if (i === N3) section(SECTIONS[1]);
    const n = i + 1;

    // 문제 슬라이드
    {
      const s = content(label(q), `문제 ${n}` + (q.type === "ox" ? "  ·  O / X" : ""));
      txt(s, q.q, { x: 0.5, y: 1.15, w: 9, h: 0.95, fontSize: 19, bold: true, valign: "middle" });
      if (q.type === "mc") {
        const long = q.opts.some((o) => o.length > 18);
        q.opts.forEach((o, k) => {
          const x = long ? 0.5 : 0.5 + (k % 2) * 4.6, y = long ? 2.25 + k * 0.6 : 2.3 + Math.floor(k / 2) * 1.1;
          const w = long ? 9 : 4.4, h = long ? 0.5 : 0.92;
          card(s, x, y, w, h);
          const d = long ? 0.36 : 0.5;
          s.addShape(pres.shapes.OVAL, { x: x + 0.15, y: y + (h - d) / 2, w: d, h: d, fill: { color: C.or }, line: { color: C.or } });
          txt(s, String(k + 1), { x: x + 0.15, y: y + (h - d) / 2, w: d, h: d, fontSize: long ? 13 : 16, bold: true, color: C.wh, align: "center", valign: "middle" });
          txt(s, o, { x: x + 0.3 + d, y, w: w - 0.45 - d, h, fontSize: long ? 15 : 17, valign: "middle", fit: "shrink" });
        });
      } else {
        [["O", C.te], ["X", C.or]].forEach(([m, color], k) => {
          const x = 1.3 + k * 3.9;
          card(s, x, 2.3, 3.5, 2.05);
          txt(s, m, { x, y: 2.3, w: 3.5, h: 2.05, fontSize: 96, bold: true, color, align: "center", valign: "middle" });
        });
      }
      notes(s, lead(i) + q.nq + PAUSE);
    }

    // 정답·해설 슬라이드
    {
      const ansText = q.type === "ox" ? q.opts[q.ans] : `${NUM[q.ans]} ${q.opts[q.ans]}`;
      const s = content(label(q), `문제 ${n} 정답과 해설`);
      s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.2, w: 3.4, h: 3.5, fill: { color: C.or }, line: { color: C.or } });
      iconCircle(s, I.check, 0.75, 1.42, 0.55, C.dk);
      txt(s, "정답", { x: 1.42, y: 1.42, w: 2.3, h: 0.55, fontSize: 16, bold: true, color: C.wh, valign: "middle" });
      if (q.type === "ox") txt(s, ansText, { x: 0.5, y: 2.1, w: 3.4, h: 2.3, fontSize: 110, bold: true, color: C.wh, align: "center", valign: "middle" });
      else txt(s, ansText, { x: 0.75, y: 2.2, w: 2.95, h: 2.3, fontSize: ansText.length > 24 ? 17 : 22, bold: true, color: C.wh, valign: "middle", fit: "shrink" });
      card(s, 4.15, 1.2, 5.35, 3.5);
      txt(s, "해설", { x: 4.4, y: 1.35, w: 4.9, h: 0.35, fontSize: 15, bold: true, color: C.or });
      txt(s, q.expl.map((e, k) => ({ text: e, options: { bullet: true, breakLine: k < q.expl.length - 1 } })),
        { x: 4.4, y: 1.8, w: 4.9, h: 2.8, fontSize: 14, paraSpaceAfter: 8, fit: "shrink" });
      iconCircle(s, I.book, 0.5, 4.8, 0.3, C.te);
      txt(s, "복습: " + q.ref, { x: 0.9, y: 4.8, w: 7.5, h: 0.3, fontSize: 12, bold: true, color: C.te, valign: "middle" });
      notes(s, q.na);
    }
  });

  // 마무리
  {
    const s = pres.addSlide({ masterName: "DARK" });
    txt(s, "정리", { x: 0.6, y: 0.5, w: 4, h: 0.35, fontSize: 13, bold: true, color: C.or });
    txt(s, `${Q.length}문제 중 몇 문제를 맞혔나요?`, { x: 0.6, y: 0.9, w: 8.8, h: 0.6, fontSize: 26, bold: true, color: C.wh });
    const sum = DATA.SUMMARY || [
      "불량 데이터 부족(3강)과 고장 데이터 부족(4강)은 같은 문제, 해법도 닮았다",
      "영상 AI와 예측 제어는 한 설비 안에서 함께 쓰인다 (포스코 고로, 대양전기공업)",
      "AI 모델만으로 해결된 사례는 없다: 센서·광학, 동역학·진동, 제어·로봇, 데이터·AI",
    ];
    sum.forEach((t, k) => {
      const y = 1.75 + k * 0.78;
      txt(s, String(k + 1), { x: 0.6, y, w: 0.5, h: 0.6, fontSize: 26, bold: true, color: C.or, valign: "middle" });
      txt(s, t, { x: 1.15, y, w: 8.3, h: 0.6, fontSize: 15, bold: k === 2, color: C.wh, valign: "middle" });
    });
    txt(s, "틀린 문제는 해설 아래 '복습' 장면으로 돌아가 다시 보세요", { x: 0.6, y: 4.3, w: 8.8, h: 0.4, fontSize: 14, color: "C9D1D6" });
    txt(s, LECTURE, { x: 0.6, y: 5.15, w: 5, h: 0.25, fontSize: 9, color: "9AA5AD" });
    notes(s, OUTRO);
  }

  const out = `${OUT_DIR}/${META.file}.pptx`;
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);

  // TTS 파일: 영어 약어는 1강과 같은 규칙으로 한글 표기
  const tts = (t) => t.replace(/\bAI/g, "에이아이").replace(/\bAX/g, "에이엑스").replace(/BMW/g, "비엠더블유").replace(/·/g, ", ");
  fs.writeFileSync(`${OUT_DIR}/${META.file}_대본_TTS용.txt`, narr.map((t, k) => `[슬라이드 ${k + 1}]\n${tts(t)}\n`).join("\n"));

  // 문항·정답 목록 (검토용)
  let md = `# 3·4강 ${META.title} 문항과 정답\n\n문제 슬라이드 다음에 정답·해설 슬라이드가 이어집니다.
`;
  Q.forEach((q, i) => {
    if (i === 0) md += `\n## 3강 · 영상 기반 품질검사\n`;
    if (i === N3) md += `\n## 4강 · 고장 진단·예측과 공정 최적화\n`;
    md += `\n**${i + 1}. ${q.q}**${q.type === "ox" ? " (O/X)" : ""}\n\n`;
    if (q.type === "mc") md += q.opts.map((o, k) => `${NUM[k]} ${o}`).join("  \n") + "\n\n";
    md += `정답: ${q.type === "ox" ? q.opts[q.ans] : NUM[q.ans] + " " + q.opts[q.ans]}  \n해설: ${q.expl.join(" / ")}  \n복습: ${q.ref}\n`;
  });
  fs.writeFileSync(`${OUT_DIR}/${META.file}_문항과정답.md`, md);
  console.log("written", out, "slides", narr.length);
})();
