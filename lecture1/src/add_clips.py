"""1강 사례 영상 슬라이드(11, 13)의 썸네일을 YouTube 온라인 비디오로 바꾼다.
각 썸네일은 clips.json의 start~end 구간(약 10초)만 재생한다.
사용법: python3 add_clips.py 원본.pptx 결과.pptx [clips.json]
"""
import json, re, sys, zipfile
from pathlib import Path
from lxml import etree

NS = {"p": "http://schemas.openxmlformats.org/presentationml/2006/main",
      "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
VIDEO_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/video"
P, A, R = ("{%s}" % NS[k] for k in "par")

def sec(t):
    m, s = t.split(":")
    return int(m) * 60 + int(s)

def badge(spid, x, y, text):
    # 썸네일 오른쪽 위의 작은 구간 표시
    xml = f'''<p:sp xmlns:p="{NS['p']}" xmlns:a="{NS['a']}"><p:nvSpPr><p:cNvPr id="{spid}" name="Clip Badge {spid}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="1005840" cy="201168"/></a:xfrm><a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
<a:solidFill><a:srgbClr val="F28C28"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr>
<p:txBody><a:bodyPr wrap="none" lIns="45720" tIns="0" rIns="45720" bIns="0" anchor="ctr"/><a:lstStyle/>
<a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="ko-KR" sz="800" b="1"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:latin typeface="맑은 고딕"/><a:ea typeface="맑은 고딕"/></a:rPr><a:t>{text}</a:t></a:r></a:p></p:txBody></p:sp>'''
    return etree.fromstring(xml)

def timing(spids):
    nodes = "".join(
        f'<p:video><p:cMediaNode vol="80000"><p:cTn id="{i + 2}" fill="hold" display="0">'
        f'<p:stCondLst><p:cond delay="indefinite"/></p:stCondLst></p:cTn>'
        f'<p:tgtEl><p:spTgt spid="{s}"/></p:tgtEl></p:cMediaNode></p:video>'
        for i, s in enumerate(spids))
    return etree.fromstring(
        f'<p:timing xmlns:p="{NS["p"]}"><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot">'
        f'<p:childTnLst>{nodes}</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>')

def process_slide(slide_xml, rels_xml, clips):
    root = etree.fromstring(slide_xml)
    rels = etree.fromstring(rels_xml)
    target = {r.get("Id"): r.get("Target") for r in rels}
    tree = root.find(".//p:spTree", NS)
    max_id = max(int(e.get("id")) for e in root.iter(P + "cNvPr"))
    n_rel = max(int(r.get("Id")[3:]) for r in rels)
    spids = []
    for pic in tree.findall("p:pic", NS):
        cnv = pic.find("p:nvPicPr/p:cNvPr", NS)
        link = cnv.find("a:hlinkClick", NS)
        if link is None:
            continue
        m = re.search(r"v=([\w-]{11})", target.get(link.get(R + "id"), ""))
        if not m or m.group(1) not in clips:
            continue
        vid = m.group(1)
        c = clips[vid]
        url = target[link.get(R + "id")]
        # 썸네일 위의 ▶ 동그라미와 글자는 영상 클릭을 가리므로 제거
        off = pic.find("p:spPr/a:xfrm/a:off", NS)
        ext = pic.find("p:spPr/a:xfrm/a:ext", NS)
        x0, y0 = int(off.get("x")), int(off.get("y"))
        w, h = int(ext.get("cx")), int(ext.get("cy"))
        for sp in tree.findall("p:sp", NS):
            o = sp.find("p:spPr/a:xfrm/a:off", NS)
            if o is None or sp is pic:
                continue
            ox, oy = int(o.get("x")), int(o.get("y"))
            txt = "".join(sp.itertext()).strip()
            hl = sp.find("p:nvSpPr/p:cNvPr/a:hlinkClick", NS)
            inside = x0 < ox < x0 + w and y0 < oy < y0 + h
            if inside and (txt == "▶" or (hl is not None and target.get(hl.get(R + "id")) == url)):
                tree.remove(sp)
        # 온라인 비디오로 전환
        n_rel += 1
        rid = f"rId{n_rel}"
        etree.SubElement(rels, f"{{{REL_NS}}}Relationship", Id=rid, Type=VIDEO_REL,
                         Target=f"https://www.youtube.com/embed/{vid}?start={sec(c['start'])}&end={sec(c['end'])}&rel=0",
                         TargetMode="External")
        link.set(R + "id", "")
        link.set("action", "ppaction://media")
        cnv.set("name", f"Online Media {c['case']}")
        cnv.set("descr", f"{c['case']} 하이라이트 {c['start']}~{c['end']}")
        locks = pic.find("p:nvPicPr/p:cNvPicPr/a:picLocks", NS)
        if locks is not None:
            locks.set("noRot", "1")
        nvpr = pic.find("p:nvPicPr/p:nvPr", NS)
        vf = etree.SubElement(nvpr, A + "videoFile")
        vf.set(R + "link", rid)
        spids.append(cnv.get("id"))
        max_id += 1
        tree.append(badge(max_id, x0 + w - 1005840 - 45720, y0 + 45720, f"▶ 10초 · {c['start']}~{c['end']}"))
    # 안내 문구 수정
    for t in root.iter(A + "t"):
        if t.text and t.text.startswith("썸네일을 누르면"):
            t.text = "영상을 클릭하면 각 기업·기관 공식 유튜브 영상의 핵심 10초가 재생됩니다 (인터넷 연결 필요)."
    old = root.find("p:timing", NS)
    if old is not None:
        root.remove(old)
    root.find("p:clrMapOvr", NS).addnext(timing(spids))
    return (etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True),
            etree.tostring(rels, xml_declaration=True, encoding="UTF-8", standalone=True), len(spids))

def main(src, dst, clips_path):
    clips_list = json.loads(Path(clips_path).read_text(encoding="utf-8"))
    by_slide = {}
    for c in clips_list:
        by_slide.setdefault(c["slide"], {})[c["id"]] = c
    zin = zipfile.ZipFile(src)
    out = {n: zin.read(n) for n in zin.namelist()}
    for s, clips in by_slide.items():
        sx, rx = f"ppt/slides/slide{s}.xml", f"ppt/slides/_rels/slide{s}.xml.rels"
        out[sx], out[rx], n = process_slide(out[sx], out[rx], clips)
        print(f"slide {s}: {n}개 클립")
    with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
        for n in zin.namelist():
            z.writestr(zin.getinfo(n), out[n])

if __name__ == "__main__":
    here = Path(__file__).parent
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else here / "clips.json")
