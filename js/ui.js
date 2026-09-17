/* משותף לשלושת המסכים: ערבוב הסיבות, ניקוד, ואיור התחנה עם הנקודות.
   תשובה לנקודה נשמרת כמפתח: "pass", או "r0", "r1"... לפי המיקום המקורי ב-reasons.
   בנקודה שנפסלת התשובה הנכונה היא תמיד "r0". הסדר שהקבוצה רואה מעורבב. */
(function () {
  const G = window.gameData;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // מחולל פסאודו-אקראי קבוע לפי מחרוזת, כדי שרענון יחזיר את אותו סדר
  function rng(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // "עובר" תמיד ראשון. סיבות הפסילה אחריו בסדר מעורבב.
  function optionsFor(spot, seed) {
    const r = rng(seed + "|" + spot.id);
    const reasons = spot.reasons.map((text, i) => ({ key: "r" + i, text }));
    for (let i = reasons.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [reasons[i], reasons[j]] = [reasons[j], reasons[i]]; }
    return [{ key: "pass", text: "עובר את פיקוד העורף" }].concat(reasons);
  }

  const correctKey = (spot) => (spot.verdict === "pass" ? "pass" : "r0");

  // exact: הכרעה וסיבה נכונות. verdict: זיהו פסילה, סיבה שגויה. wrong: כל השאר.
  function grade(spot, key) {
    if (!key) return { kind: "none", pts: 0 };
    if (key === correctKey(spot)) return { kind: "exact", pts: G.meta.points.exact };
    if (spot.verdict === "fail" && key !== "pass") return { kind: "verdict", pts: G.meta.points.verdictOnly };
    return { kind: "wrong", pts: G.meta.points.wrong, falseFail: spot.verdict === "pass" };
  }

  function stationScore(st, ans) {
    const out = { pts: 0, exact: 0, verdict: 0, wrong: 0, falseFail: 0, answered: 0 };
    st.spots.forEach((sp) => {
      const g = grade(sp, ans && ans[sp.id]);
      out.pts += g.pts;
      if (g.kind !== "none") out.answered++;
      if (g.kind in out) out[g.kind]++;
      if (g.falseFail) out.falseFail++;
    });
    return out;
  }

  const maxPoints = () => G.stations.reduce((a, s) => a + s.spots.length, 0) * G.meta.points.exact;

  function totalScore(allAns) {
    const t = { pts: 0, exact: 0, verdict: 0, wrong: 0, falseFail: 0, answered: 0, per: {} };
    G.stations.forEach((st) => {
      const s = stationScore(st, allAns && allAns[st.id]);
      t.per[st.id] = s;
      ["pts", "exact", "verdict", "wrong", "falseFail", "answered"].forEach((k) => { t[k] += s[k]; });
    });
    return t;
  }

  /* איור התחנה. marks: { spotId: "ok" | "part" | "bad" | "pass" | "fail" | "sel" } */
  function figureHTML(st, marks) {
    marks = marks || {};
    const pins = st.spots.map((sp, i) => sp.x == null ? "" :
      `<span class="pin ${marks[sp.id] || ""}" style="left:${sp.x}%;top:${sp.y}%" data-spot="${sp.id}" aria-hidden="true">${i + 1}</span>`).join("");
    return `<figure class="fig">
      <div class="fig-in">
        <img src="${esc(st.image)}" alt="${esc(st.alt)}" onerror="this.parentNode.classList.add('noimg')">
        <div class="fig-ph" aria-hidden="true"><span>${esc(st.floor)}</span>${esc(st.title)}</div>
        ${pins}
      </div>
    </figure>`;
  }

  function markFor(spot, key) {
    const g = grade(spot, key).kind;
    return g === "exact" ? "ok" : g === "verdict" ? "part" : "bad";
  }

  window.MUGAN = { esc, optionsFor, correctKey, grade, stationScore, totalScore, maxPoints, figureHTML, markFor };
})();
