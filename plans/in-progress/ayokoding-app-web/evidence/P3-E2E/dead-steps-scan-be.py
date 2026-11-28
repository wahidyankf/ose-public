import glob, os, re, sys

repo = sys.argv[1]
home = os.path.join(repo, "apps/ayokoding-web-be-e2e/tests/e2e/steps")
behaviours = os.path.join(repo, "specs/apps/ayokoding/web/behaviours")
http_only = {
    "content/content-tree-routes.feature",
    "content/content-rendering-http.feature",
    "navigation/url-compatibility.feature",
    "navigation/routes-and-navigation-http.feature",
    "navigation/entry-pages-http.feature",
    "search/search-http.feature",
    "discovery/discovery-documents.feature",
    "discovery/http-caching.feature",
    "local-development/local-development-http.feature",
}
feature_lines = []
for path in glob.glob(os.path.join(behaviours, "**/*.feature"), recursive=True):
    rel = os.path.relpath(path, behaviours)
    if rel not in http_only:
        continue
    for line in open(path, encoding="utf-8"):
        s = line.strip()
        m = re.match(r"(Given|When|Then|And|But)\s+(.*)", s)
        if m:
            feature_lines.append(m.group(2))

pattern = re.compile(r'(Given|When|Then)\(\s*"((?:[^"\\]|\\.)*)"', re.S)
unused = []
total = 0
for path in sorted(glob.glob(os.path.join(home, "*.steps.ts"))):
    text = open(path, encoding="utf-8").read()
    for m in pattern.finditer(text):
        total += 1
        step = m.group(2)
        regex = re.escape(step)
        regex = regex.replace(r"\{string\}", r'"[^"]*"').replace(r"\{int\}", r"\d+")
        regex = re.sub(r"<[^<>]*>", r".*?", regex)
        regex = re.sub(r"\\<.*?\\>", r".*?", regex)
        compiled = re.compile("^" + regex + "$")
        if not any(compiled.match(f) for f in feature_lines):
            unused.append((os.path.basename(path), step))
print(f"step patterns: {total}; with no fe-bound feature line: {len(unused)}")
for name, step in unused:
    print(f"  {name}: {step}")
