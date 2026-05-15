/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const DIR = __dirname;

function setPath(obj, dotPath, value) {
  const parts = dotPath.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function applyFlat(base, flat) {
  const out = JSON.parse(JSON.stringify(base));
  for (const [k, v] of Object.entries(flat)) {
    if (typeof v !== "string") {
      console.warn("skip non-string", k);
      continue;
    }
    setPath(out, k, v);
  }
  return out;
}

function walkStringPaths(obj, p, out) {
  for (const k of Object.keys(obj)) {
    const q = p ? `${p}.${k}` : k;
    if (typeof obj[k] === "string") out.push(q);
    else if (obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k])) walkStringPaths(obj[k], q, out);
  }
}

function build(locale) {
  const en = JSON.parse(fs.readFileSync(path.join(DIR, "en.json"), "utf8"));
  const flatPath = path.join(DIR, `${locale}.strings.json`);
  if (!fs.existsSync(flatPath)) {
    console.error("missing", flatPath);
    process.exit(1);
  }
  const flat = JSON.parse(fs.readFileSync(flatPath, "utf8"));
  const paths = [];
  walkStringPaths(en, "", paths);
  const missing = paths.filter((k) => !(k in flat));
  const extra = Object.keys(flat).filter((k) => !paths.includes(k));
  if (missing.length) console.warn(locale, "missing translations:", missing.join(", "));
  if (extra.length) console.warn(locale, "unknown keys (ignored):", extra.join(", "));
  const merged = applyFlat(en, flat);
  fs.writeFileSync(path.join(DIR, `${locale}.json`), JSON.stringify(merged, null, 2) + "\n");
  console.log("wrote", locale + ".json");
}

const loc = process.argv[2];
if (!loc) {
  console.error("usage: node build-locales.cjs <he|ru|fr>");
  process.exit(1);
}
build(loc);
