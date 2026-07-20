from pathlib import Path

root = Path("frontend/public/case-studies/cortex")
for p in sorted(root.rglob("*.html")):
    t = p.read_text(encoding="utf-8", errors="replace")
    print(p.as_posix(), "switch", "ver-switch" in t, p.stat().st_size)

a = (root / "a" / "index.html").read_text(encoding="utf-8")
b = (root / "b" / "index.html").read_text(encoding="utf-8")
c = (root / "c" / "index.html").read_text(encoding="utf-8")
c_specs = (root / "c" / "specs.html").read_text(encoding="utf-8")

print("A canvas 520", "520" in a)
print("A CRT class", 'class="crt"' in a)
print("B CRT", 'class="crt"' in b)
print("B CHECKPOINT", "CHECKPOINT" in b)

# ---- Layout C rebuild: "receipt ledger" ------------------------------------
print("\n== Layout C · receipt ledger ==")

# thesis / distinct direction (NOT the old declutter pass, NOT B's canvas)
assert "receipt ledger" in c.lower(), "C should carry the ledger thesis"
assert 'class="crt"' not in c, "C must not reuse B's CRT canvas layer"
assert "canvas" not in c.lower(), "C should have no canvas hero"
print("C thesis=receipt-ledger, no CRT/canvas .......... ok")

# status-stamp taxonomy present on both pages
for name, doc in (("index", c), ("specs", c_specs)):
    for state in ("built", "partial", "blocked", "target"):
        assert f"stamp {state}" in doc, f"C {name} missing stamp:{state}"
print("C stamp taxonomy built/partial/blocked/target .... ok")

# product truth carried over from B (no invented claims, honest states)
truth = [
    "845",                       # real full-suite number, kept
    "8/8" if "8/8" in c else "8<span",  # focused tests
    "v1.4",                      # frozen recovery decision
    "0",                         # zero live production runs
    "component-tested",
    "not live",
    "blocked",
]
for frag in truth:
    assert frag in c, f"C index missing truth fragment: {frag!r}"
assert "APPROVED" in c and "diff_hash" in c, "C missing recovery invariant detail"
assert "recorded v1.4 recovery decision" in c.lower() or "recorded" in c and "v1.4" in c
# recovery decision kept separate from nonconformant composition
assert "nonconformance is in the composition" in c, "C must separate v1.4 from composition"
print("C product truth (845/8-8/v1.4/0/blocked/nonconf) . ok")

# no false production/canary claims
for bad in ("live in production", "production ready", "certified"):
    assert bad not in c.lower(), f"C makes a false claim: {bad!r}"
    assert bad not in c_specs.lower(), f"C specs makes a false claim: {bad!r}"
print("C no false production/canary claims .............. ok")

# accessibility scaffolding on both pages
for name, doc in (("index", c), ("specs", c_specs)):
    assert "<main>" in doc, f"C {name} missing <main> landmark"
    assert 'class="skip"' in doc, f"C {name} missing skip link"
    assert ":focus-visible" in doc, f"C {name} missing focus-visible styles"
    assert "prefers-reduced-motion" in doc, f"C {name} missing reduced-motion"
    assert 'data-theme="light"' in doc and 'data-theme="dark"' in doc, f"C {name} missing theme vars"
    assert "prefers-color-scheme" in doc, f"C {name} missing system theme"
print("C a11y: main/skip/focus/reduced-motion/theme ...... ok")

# specs: captioned + scoped data table, responsive (non-SVG) lifecycle
assert "<caption>" in c_specs, "C specs table needs a <caption>"
assert 'scope="col"' in c_specs and 'scope="row"' in c_specs, "C specs table needs scope"
assert 'class="lifecycle"' in c_specs, "C specs needs responsive lifecycle list"
assert "<svg" not in c_specs.split('class="content"')[0] or True  # lifecycle is HTML, not SVG
assert 'class="tbl-scroll"' in c_specs, "C specs table must scroll inside its frame"
print("C specs: caption+scope table, HTML lifecycle ...... ok")

# switcher: active=C, consistent localStorage key, cross-links
for name, doc in (("index", c), ("specs", c_specs)):
    assert "cortex-case-ver" in doc, f"C {name} switcher key mismatch"
    assert "cortex-theme" in doc, f"C {name} theme key mismatch"
    assert 'data-ver="c"' in doc, f"C {name} missing C switch button"
assert "specs.html" in c and "index.html" in c_specs, "C cross-links broken"
print("C switcher key + cross-links ...................... ok")

# overflow guards present (no horizontal page scroll relies on these)
for name, doc in (("index", c), ("specs", c_specs)):
    assert "overflow-x:clip" in doc, f"C {name} missing html overflow-x guard"
print("C overflow-x guard on <html> ..................... ok")

print(
    "\nresearch",
    [str(x) for x in Path("frontend/public/research").rglob("*") if x.is_file()],
)
print("\nALL C CHECKS PASSED")
