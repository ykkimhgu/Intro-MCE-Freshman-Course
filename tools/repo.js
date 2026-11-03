// 빌드 스크립트 공통 도우미: 저장소 루트 경로와 PPT 테마 색 적용.
// 원래 스크립트는 Claude 프로젝트 폴더(/mnt/project-files)를 직접 가리켰는데,
// 다른 컴퓨터에서도 돌아가도록 저장소 루트 기준 경로로 바꿨습니다.
const fs = require("fs");
const path = require("path");

// 저장소 루트 (이 파일은 <루트>/tools/repo.js)
const ROOT = path.resolve(__dirname, "..");

const KEYS = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];

// pptxgenjs는 테마 색을 Office 기본값으로 고정해 저장하므로,
// 저장된 pptx의 ppt/theme/theme1.xml 색 구성표를 시리즈 색으로 바꿔 씁니다.
// theme: { name, colors: { dk1, lt1, ... } }  (색은 # 없는 6자리 hex)
async function applyTheme(file, theme) {
  const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const colors = theme.colors || theme;
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/theme\/theme\d+\.xml$/.test(n))) {
    let xml = await zip.file(name).async("string");
    for (const k of KEYS) {
      const v = colors[k];
      if (!v) continue;
      if (!/^[0-9A-Fa-f]{6}$/.test(v)) throw new Error(`색 ${k}=${v} 는 6자리 hex가 아닙니다`);
      xml = xml.replace(new RegExp(`<a:${k}>[\\s\\S]*?</a:${k}>`), `<a:${k}><a:srgbClr val="${v.toUpperCase()}"/></a:${k}>`);
    }
    if (theme.name) {
      const esc = theme.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
      xml = xml.replace(/<a:clrScheme name="[^"]*"/, `<a:clrScheme name="${esc}"`);
      xml = xml.replace(/(<a:theme\b[^>]*\bname=")[^"]*"/, `$1${esc}"`);
    }
    zip.file(name, xml);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

module.exports = { ROOT, applyTheme };
