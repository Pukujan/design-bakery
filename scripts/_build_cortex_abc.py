# one-shot: A/B/C cortex case study variants + version switcher
from __future__ import annotations

import pathlib
import re
import shutil
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
CORTEX = ROOT / "frontend" / "public" / "case-studies" / "cortex"


SWITCHER_CSS = """
  /* version switcher A/B/C */
  .ver-switch{position:fixed; right:16px; bottom:16px; z-index:60;
    display:flex; flex-direction:column; gap:8px; align-items:flex-end;
    font-family:"IBM Plex Mono",monospace; pointer-events:none;}
  .ver-switch .ver-panel{pointer-events:auto; background:color-mix(in srgb, var(--ink, #0A0D13) 92%, transparent);
    border:1px solid var(--line, #222b3d); border-radius:12px; padding:10px 12px;
    box-shadow:0 12px 40px rgba(0,0,0,.35); min-width:220px;}
  .ver-switch .ver-label{font-size:10px; letter-spacing:.16em; text-transform:uppercase;
    color:var(--muted, #7c8698); margin-bottom:8px;}
  .ver-switch .ver-btns{display:flex; gap:6px;}
  .ver-switch a.ver-btn{flex:1; text-align:center; font-size:12px; letter-spacing:.04em;
    padding:8px 6px; border-radius:8px; border:1px solid var(--line, #222b3d);
    color:var(--muted, #7c8698); background:transparent; transition:all .15s; text-decoration:none;}
  .ver-switch a.ver-btn:hover{color:var(--text-strong, #f2f5fa); border-color:var(--seal, #f5b640);}
  .ver-switch a.ver-btn.is-active{color:#0A0D13; background:var(--seal, #f5b640); border-color:var(--seal, #f5b640); font-weight:600;}
  .ver-switch .ver-hint{font-size:10px; color:var(--muted-2, #5c6577); margin-top:8px; line-height:1.4; max-width:220px;}
  @media (max-width:520px){
    .ver-switch{right:10px; bottom:10px; left:10px; align-items:stretch;}
    .ver-switch .ver-panel{min-width:0;}
  }
"""

SWITCHER_HTML = """
<div class="ver-switch" role="navigation" aria-label="Case study layout version">
  <div class="ver-panel">
    <div class="ver-label">Layout version</div>
    <div class="ver-btns">
      <a class="ver-btn" data-ver="a" href="/case-studies/cortex/a/index.html" title="Quiet instrument">A</a>
      <a class="ver-btn" data-ver="b" href="/case-studies/cortex/b/index.html" title="Current full redesign">B</a>
      <a class="ver-btn" data-ver="c" href="/case-studies/cortex/c/index.html" title="Declutter redesign">C</a>
    </div>
    <div class="ver-hint" id="verHint">A quiet · B current · C declutter</div>
  </div>
</div>
"""

SWITCHER_JS = r"""
(function(){
  var m = location.pathname.match(/\/case-studies\/cortex\/(a|b|c)\//i);
  var ver = m ? m[1].toLowerCase() : 'b';
  try { localStorage.setItem('cortex-case-ver', ver); } catch(e){}
  var hints = {
    a: 'A · quiet instrument (pre CRT)',
    b: 'B · current full redesign',
    c: 'C · declutter redesign'
  };
  document.querySelectorAll('.ver-switch a.ver-btn').forEach(function(el){
    if (el.getAttribute('data-ver') === ver) el.classList.add('is-active');
  });
  var h = document.getElementById('verHint');
  if (h) h.textContent = hints[ver] || hints.b;
})();
"""


def git_show(path: str) -> bytes:
    return subprocess.check_output(["git", "show", path], cwd=ROOT)


def inject(path: pathlib.Path) -> None:
    text = path.read_text(encoding="utf-8")
    if "ver-switch" in text:
        print("skip (already)", path)
        return
    if "</style>" in text:
        text = text.replace("</style>", SWITCHER_CSS + "\n</style>", 1)
    else:
        text = text.replace("</head>", f"<style>{SWITCHER_CSS}</style></head>", 1)
    if "</body>" in text:
        text = text.replace(
            "</body>",
            SWITCHER_HTML + "\n<script>\n" + SWITCHER_JS + "\n</script>\n</body>",
            1,
        )
    path.write_text(text, encoding="utf-8")
    print("injected", path.relative_to(ROOT), path.stat().st_size)


def declutter_c(html: str) -> str:
    """Light C pass: kill stacked .note blocks, soften hero CRT labels, short pills."""
    # Remove standalone note divs (keep one under status if present via re-add)
    notes = list(re.finditer(r'<div class="note">[\s\S]*?</div>', html))
    # Keep last note (status product line) if >=2, drop earlier
    if len(notes) >= 2:
        for m in notes[:-1]:
            html = html.replace(m.group(0), "", 1)
    # Hero HUD label quieter
    html = html.replace(
        "CHECKPOINT REPLAY // SCC-V2",
        "reference-monitor · checkpoint",
    )
    html = html.replace(
        '<span class="live">component build</span>',
        '<span class="live">component</span>',
    )
    # Short comparison microcopy if present
    html = re.sub(
        r'(<td class="cx">)[^<]{40,}(</td>)',
        r"\1unwired\2",
        html,
        count=12,
    )
    # Soft-hide CRT overlay via CSS on C only
    if "/* c declutter */" not in html:
        extra = """
  /* c declutter */
  .hero .crt{opacity:0.18;}
  .instrument .cap{opacity:0.55; font-size:11px;}
  .sec-head > p{max-width:62ch;}
  .mod p{font-size:0.95em;}
  .note{margin-top:18px;}
"""
        html = html.replace("</style>", extra + "\n</style>", 1)
    return html


def main() -> None:
    for ver in ("a", "b", "c"):
        (CORTEX / ver).mkdir(parents=True, exist_ok=True)

    # A from daf4d8c
    (CORTEX / "a" / "index.html").write_bytes(
        git_show("daf4d8c:frontend/public/case-studies/cortex/index.html")
    )
    try:
        (CORTEX / "a" / "specs.html").write_bytes(
            git_show("daf4d8c:frontend/public/case-studies/cortex/specs.html")
        )
    except subprocess.CalledProcessError:
        print("warn: no a specs at daf4d8c")

    # B = current redesign snapshot (prefer existing b, else root pre-redirect body)
    b_src = CORTEX / "b" / "index.html"
    if not b_src.exists() or b_src.stat().st_size < 5000:
        # recover from git HEAD redesign if needed
        b_src.write_bytes(
            git_show("9250278:frontend/public/case-studies/cortex/index.html")
        )
    if not (CORTEX / "b" / "specs.html").exists():
        try:
            (CORTEX / "b" / "specs.html").write_bytes(
                git_show("9250278:frontend/public/case-studies/cortex/specs.html")
            )
        except subprocess.CalledProcessError:
            pass

    # C from B + declutter
    b_html = (CORTEX / "b" / "index.html").read_text(encoding="utf-8")
    # strip prior switcher if re-run
    b_html = re.sub(r"/\* version switcher A/B/C \*/[\s\S]*?@media \(max-width:520px\)\{[\s\S]*?\n  \}", "", b_html)
    b_html = re.sub(r'<div class="ver-switch"[\s\S]*?</div>\s*</div>\s*', "", b_html)
    b_html = re.sub(
        r"<script>\s*\(function\(\)\{\s*var m = location\.pathname\.match[\s\S]*?\}\)\(\);\s*</script>",
        "",
        b_html,
    )
    c_html = declutter_c(b_html)
    (CORTEX / "c" / "index.html").write_text(c_html, encoding="utf-8")
    if (CORTEX / "b" / "specs.html").exists():
        shutil.copy2(CORTEX / "b" / "specs.html", CORTEX / "c" / "specs.html")

    for ver in ("a", "b", "c"):
        inject(CORTEX / ver / "index.html")
        sp = CORTEX / ver / "specs.html"
        if sp.exists():
            inject(sp)

    # root redirects
    (CORTEX / "index.html").write_text(
        """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Cortex · case study</title>
<meta http-equiv="refresh" content="0;url=/case-studies/cortex/b/index.html" />
<script>
(function(){
  var v = 'b';
  try { v = localStorage.getItem('cortex-case-ver') || 'b'; } catch(e){}
  if (v !== 'a' && v !== 'b' && v !== 'c') v = 'b';
  location.replace('/case-studies/cortex/' + v + '/index.html' + location.search + location.hash);
})();
</script>
</head>
<body>
<p style="font-family:system-ui;padding:2rem;color:#666">Loading Cortex case study…
  <a href="/case-studies/cortex/b/index.html">continue</a></p>
</body>
</html>
""",
        encoding="utf-8",
    )
    (CORTEX / "specs.html").write_text(
        """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Cortex · technical specs</title>
<meta http-equiv="refresh" content="0;url=/case-studies/cortex/b/specs.html" />
<script>
(function(){
  var v = 'b';
  try { v = localStorage.getItem('cortex-case-ver') || 'b'; } catch(e){}
  if (v !== 'a' && v !== 'b' && v !== 'c') v = 'b';
  location.replace('/case-studies/cortex/' + v + '/specs.html' + location.search + location.hash);
})();
</script>
</head>
<body>
<p style="font-family:system-ui;padding:2rem;color:#666">
  <a href="/case-studies/cortex/b/specs.html">Technical specs</a></p>
</body>
</html>
""",
        encoding="utf-8",
    )
    print("done")


if __name__ == "__main__":
    main()
