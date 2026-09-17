// בונה מ-image-prompts.md דף HTML עם כפתורי העתקה, לייצור התמונות אחת-אחת.
// כל כפתור מעתיק את בלוק הסגנון ואחריו את הפרומפט של התמונה, כפרומפט אחד.
// הרצה: node tools/mkpage.mjs   (מתיקיית המשחק)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const md = readFileSync(path.join(DIR, "tools/image-prompts.md"), "utf8");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const style = md.split("## בלוק הסגנון")[1].split("```")[1].trim();

const shots = [];
for (const part of md.split(/^## /m).slice(1)) {
  const head = part.split("\n")[0].trim();
  const m = head.match(/^(st\d\.jpg)\s*·\s*(.+)$/);
  if (!m) continue;
  const [, file, title] = m;
  const where = ((part.match(/^מופיעה ליד:\s*(.+)$/m) || [])[1] || "").trim();
  const prompt = part.includes("```") ? part.split("```")[1].trim() : "";
  const have = existsSync(path.join(DIR, "images", file));
  shots.push({ file, title, where, prompt, have });
}

const cards = shots.map((s, i) => {
  const hot = /\*\*/.test(s.where);
  const whereText = s.where.replace(/\*\*/g, "");
  return `
  <article class="shot${s.have ? " have" : ""}">
    <header>
      <span class="n">${i + 1}</span>
      <h3>${esc(s.title)}</h3>
      <code class="file">${esc(s.file)}</code>
      ${s.have ? `<span class="status ok">בתיקייה</span>` : `<span class="status todo">לייצור</span>`}
      <button class="copy" data-i="${i}">העתקת הפרומפט</button>
    </header>
    <p class="where${hot ? " hot" : ""}">${esc(whereText)}</p>
    <details${i === 0 ? " open" : ""}><summary>הצגת הפרומפט</summary><pre dir="ltr" id="p${i}">${esc(s.prompt)}</pre></details>
  </article>`;
}).join("");

const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>פרומפטים לסיור בבניין המוגן</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;900&family=Assistant:wght@400;600&display=swap">
<style>
:root{
  --bg:#f3f1ec; --surface:#fffdf9; --code:#1d2328; --code-ink:#e8edf0;
  --ink:#1c2226; --dim:#5f6b73; --line:#dcd8cf; --line-2:#c4bfb3;
  --accent:#a86f0c; --ok:#2f6b44; --ok-bg:#dcebe0; --todo:#8a5a14; --todo-bg:#f3e7cd;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#141a1f; --surface:#1b232a; --code:#0e1215; --code-ink:#dfe6ea;
  --ink:#eaeef0; --dim:#98a6af; --line:#2c3740; --line-2:#3b4852;
  --accent:#e0a526; --ok:#8fcfa5; --ok-bg:#1d3025; --todo:#dcb766; --todo-bg:#332a17;
}}
:root[data-theme="dark"]{
  --bg:#141a1f; --surface:#1b232a; --code:#0e1215; --code-ink:#dfe6ea;
  --ink:#eaeef0; --dim:#98a6af; --line:#2c3740; --line-2:#3b4852;
  --accent:#e0a526; --ok:#8fcfa5; --ok-bg:#1d3025; --todo:#dcb766; --todo-bg:#332a17;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 Assistant,"Segoe UI",system-ui,sans-serif}
.wrap{max-width:960px;margin:0 auto;padding:32px 18px 80px}
h1,h2,h3{font-family:Heebo,"Segoe UI",sans-serif;margin:0;text-wrap:balance}
h1{font-size:2rem;font-weight:900;letter-spacing:-.02em}
h2{font-size:1.15rem;font-weight:700}
h3{font-size:1.02rem;font-weight:700}
p{margin:0}
.eyebrow{font-family:Heebo,sans-serif;font-size:.72rem;font-weight:700;letter-spacing:.14em;color:var(--accent)}
.sub{color:var(--dim);margin-top:10px;max-width:66ch}
header.top{border-bottom:2px solid var(--line-2);padding-bottom:22px;margin-bottom:22px}
.tally{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}

.rule{background:var(--surface);border:1px solid var(--line);border-inline-start:4px solid var(--accent);border-radius:9px;padding:16px 18px;margin-bottom:20px}
.rule p{color:var(--dim);font-size:.95rem;max-width:74ch;margin-top:6px}
.rule b{color:var(--ink)}
.steps{margin:8px 0 0;padding-inline-start:20px;color:var(--dim);font-size:.93rem}
.steps li{margin-bottom:4px}
.steps b{color:var(--ink)}

.stylebox{background:var(--surface);border:1px solid var(--line);border-radius:9px;padding:16px 18px;margin-bottom:26px}
.stylehead{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px}
.stylehead p{color:var(--dim);font-size:.89rem;flex:1;min-width:200px}
details summary{cursor:pointer;color:var(--dim);font-size:.86rem;font-family:Heebo,sans-serif;font-weight:700}
details[open] summary{margin-bottom:9px}
pre{background:var(--code);color:var(--code-ink);border-radius:7px;padding:13px 15px;margin:0;
  font-family:ui-monospace,"Cascadia Mono",Consolas,monospace;font-size:.8rem;line-height:1.55;
  white-space:pre-wrap;overflow-x:auto;direction:ltr;text-align:left}

.shot{background:var(--surface);border:1px solid var(--line);border-radius:9px;padding:15px 17px;margin-bottom:12px}
.shot.have{opacity:.72}
.shot header{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px}
.shot h3{flex:1;min-width:140px}
.n{font-family:Heebo,sans-serif;font-weight:900;font-size:.8rem;background:var(--ink);color:var(--bg);border-radius:5px;padding:2px 9px;font-variant-numeric:tabular-nums}
.file{font-size:.82rem;color:var(--dim);direction:ltr}
.status{font-family:Heebo,sans-serif;font-size:.77rem;font-weight:700;padding:3px 9px;border-radius:5px;white-space:nowrap}
.status.ok{background:var(--ok-bg);color:var(--ok)}
.status.todo{background:var(--todo-bg);color:var(--todo)}
.where{color:var(--dim);font-size:.9rem;margin-bottom:9px;max-width:76ch}
.where.hot{color:var(--todo);font-weight:600}

button{font:inherit;font-family:Heebo,sans-serif;font-weight:700;font-size:.85rem;cursor:pointer;
  background:var(--accent);color:var(--bg);border:none;border-radius:7px;padding:7px 15px;white-space:nowrap}
button:hover{opacity:.88}
button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
button.done{background:var(--ok)}
.check{margin-top:30px;padding-top:18px;border-top:2px solid var(--line-2)}
.check ol{margin:10px 0 0;padding-inline-start:20px;color:var(--dim);font-size:.93rem}
.check li{margin-bottom:5px}
.check b{color:var(--ink)}
</style>
</head>
<body>
<div class="wrap">
<header class="top">
  <p class="eyebrow">תחיקת הבנייה · שיעור 18 · מרחבים מוגנים</p>
  <h1>פרומפטים לסיור בבניין המוגן</h1>
  <p class="sub">${shots.length} תמונות, אחת לכל תחנה. תחנה 6 משתמשת בתמונה של תחנה 5. כל כפתור מעתיק את בלוק הסגנון ואת הפרומפט יחד.</p>
  <div class="tally">
    <span class="status ok">${shots.filter((s) => s.have).length} בתיקייה</span>
    <span class="status todo">${shots.filter((s) => !s.have).length} לייצור</span>
  </div>
</header>

<div class="rule">
  <h2>הכלל שקובע את כל הפרומפטים</h2>
  <p><b>אותה תמונה משמשת גם תיק תקין וגם תיק שבור.</b> תמונת הכבש מופיעה ליד "עולה 0.45 מ'" וגם ליד "עולה 0.90 מ' במהלך אחד". לכן התמונה אסור שתכריע שום מידה: לא שיפוע שאפשר לאמוד, לא סף שאפשר למדוד בעין, לא פרוזדור שאפשר לספור. המידות יושבות ברצועה מעל התמונה.</p>
  <ol class="steps">
    <li>לוחצים <b>העתקת הפרומפט</b> ומדביקים כפרומפט אחד.</li>
    <li>יחס <b>16:9</b> לרוחב.</li>
    <li>שומרים בשם שבכרטיס (<b>st1.jpg</b> וכו') ושולחים אחת-אחת.</li>
  </ol>
</div>

<div class="stylebox">
  <div class="stylehead">
    <h2>בלוק הסגנון</h2>
    <p>כלול אוטומטית בכל כפתור העתקה. כאן רק לעיון.</p>
  </div>
  <details><summary>הצגת הבלוק</summary><pre dir="ltr" id="pstyle">${esc(style)}</pre></details>
</div>

<h2 style="margin-bottom:12px">התמונות</h2>
${cards}

<div class="check">
  <h2>מה אני בודק בכל תמונה</h2>
  <ol>
    <li><b>האם היא מכריעה מידה שמשתנה בין התיקים.</b> מדרגות ליד הכבש, פודסט, סף שנראה גבוה או נמוך, פרוזדור שאפשר לספור. כל אחד מאלה פוסל.</li>
    <li><b>האם נכנס טקסט, מספר או חץ</b> למרות האיסור.</li>
    <li><b>האם הנושא נקרא</b> כשהתמונה בגודל רבע מסך.</li>
    <li><b>האם הרבע התחתון שקט</b>, כי רצועת המידות מכסה אותו.</li>
    <li><b>אחידות הסדרה</b>: אותה שעה ביום, אותה פלטה, אותה עדשה.</li>
  </ol>
</div>
</div>

<script>
const STYLE = ${JSON.stringify(style)};
const PROMPTS = ${JSON.stringify(shots.map((s) => s.prompt))};
function copyText(t) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
  const ta = document.createElement("textarea");
  ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  const ok = document.execCommand("copy");
  ta.remove();
  return ok ? Promise.resolve() : Promise.reject(new Error("copy failed"));
}
document.querySelectorAll("button.copy").forEach((b) => {
  b.addEventListener("click", () => {
    copyText(STYLE + "\\n\\n" + PROMPTS[Number(b.dataset.i)]).then(() => {
      b.textContent = "הועתק"; b.classList.add("done");
      setTimeout(() => { b.textContent = "העתקת הפרומפט"; b.classList.remove("done"); }, 1600);
    }).catch(() => {
      b.textContent = "לא הצלחתי, סמנו ידנית";
      setTimeout(() => { b.textContent = "העתקת הפרומפט"; }, 2600);
    });
  });
});
</script>
</body>
</html>`;

writeFileSync(path.join(DIR, "tools/image-prompts.html"), html);
console.log("תמונות:", shots.length, "| עם פרומפט:", shots.filter((s) => s.prompt).length, "| בתיקייה:", shots.filter((s) => s.have).length);
