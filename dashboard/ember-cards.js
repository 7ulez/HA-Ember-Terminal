/* Ember Cards – Lovelace-Karten im Terminal-Look für Home Assistant
 * Passend zum Theme „Ember Terminal“. MIT-Lizenz.
 * cc-greeting-card, cc-news-card, cc-waste-card, cc-energy-card,
 * cc-climate-card, cc-list-card, cc-header-card
 * Das Theme wird nur auf das Dashboard angewendet, in dem die Karten stecken.
 */
const CC_VERSION = "1.2.0";

const C = {
  bg: "#141413", surface: "#1f1e1d", surface2: "#2a2926", border: "#33312d",
  text: "#f0eee6", muted: "#a3a199", faint: "#6f6d66",
  accent: "#d97757", accentSoft: "rgba(217,119,87,0.14)", accent2: "#eba381",
  green: "#8fbf7f", red: "#e5737f", yellow: "#e6b450", blue: "#8fa8d8", lilac: "#b1b9f9",
};
const FONT = `"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`;

/* ---------- Font laden (einmalig, global) ---------- */
(function loadFont() {
  if (document.getElementById("cc-font")) return;
  const l = document.createElement("link");
  l.id = "cc-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
})();

/* ---------- Theme nur für dieses Dashboard ---------- */
const THEME_VARS = {
  "--primary-background-color": C.bg,
  "--secondary-background-color": C.surface2,
  "--lovelace-background": `radial-gradient(1100px 520px at 0% -10%, rgba(217,119,87,0.10), transparent 60%), radial-gradient(900px 500px at 110% 0%, rgba(177,185,249,0.05), transparent 60%), ${C.bg}`,
  "--card-background-color": C.surface,
  "--ha-card-background": C.surface,
  "--ha-card-border-color": C.border,
  "--ha-card-border-width": "1px",
  "--ha-card-border-radius": "14px",
  "--ha-card-box-shadow": "none",
  "--primary-text-color": C.text,
  "--secondary-text-color": C.muted,
  "--disabled-text-color": C.faint,
  "--text-primary-color": "#141413",
  "--primary-color": C.accent,
  "--accent-color": C.accent,
  "--rgb-primary-color": "217, 119, 87",
  "--rgb-accent-color": "217, 119, 87",
  "--rgb-primary-text-color": "240, 238, 230",
  "--divider-color": C.border,
  "--state-icon-color": C.muted,
  "--state-active-color": C.accent,
  "--state-switch-active-color": C.accent,
  "--state-switch-on-color": C.accent,
  "--state-light-active-color": C.yellow,
  "--state-input_boolean-active-color": C.accent,
  "--state-climate-heat-color": C.accent,
  "--state-climate-auto-color": C.green,
  "--state-media_player-active-color": C.lilac,
  "--state-binary_sensor-active-color": C.yellow,
  "--state-unavailable-color": C.faint,
  "--app-header-background-color": "rgba(20,20,19,0.85)",
  "--app-header-text-color": C.text,
  "--app-header-border-bottom": `1px solid ${C.border}`,
  "--mdc-theme-primary": C.accent,
  "--mdc-theme-surface": C.surface,
  "--input-fill-color": C.surface2,
  "--ha-font-family-body": FONT,
  "--ha-font-family-heading": FONT,
  "--ha-font-family-code": FONT,
  "--primary-font-family": FONT,
  "--paper-font-common-base_-_font-family": FONT,
  "--mdc-typography-font-family": FONT,
  "--mush-card-primary-font-weight": "500",
  "--chip-background": C.surface2,
  "--chip-border-color": C.border,
  "--chip-border-radius": "8px",
  "--mush-chip-background": C.surface2,
  "--mush-chip-border-radius": "8px",
};
const _roots = new Map();
function findRoot(el) {
  let n = el;
  for (let i = 0; i < 80 && n; i++) {
    if (n.tagName === "HUI-ROOT") return n;
    n = n.parentNode || (n.host ?? null);
    if (n instanceof ShadowRoot) n = n.host;
  }
  return null;
}
function themeAttach(el) {
  const root = findRoot(el);
  if (!root) return null;
  const c = (_roots.get(root) || 0) + 1;
  _roots.set(root, c);
  if (c === 1) {
    for (const [k, v] of Object.entries(THEME_VARS)) root.style.setProperty(k, v);
    root.style.fontFamily = FONT;
  }
  return root;
}
function themeDetach(root) {
  if (!root) return;
  const c = (_roots.get(root) || 1) - 1;
  if (c <= 0) {
    _roots.delete(root);
    // kurz warten: beim View-Wechsel hängt sich die nächste Karte direkt wieder an
    setTimeout(() => {
      if (_roots.get(root)) return;
      for (const k of Object.keys(THEME_VARS)) root.style.removeProperty(k);
      root.style.fontFamily = "";
    }, 400);
  } else _roots.set(root, c);
}

/* ---------- Helfer ---------- */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const num = (hass, id, d = NaN) => { const s = hass?.states?.[id]; const v = s ? parseFloat(s.state) : NaN; return isNaN(v) ? d : v; };
const st = (hass, id) => hass?.states?.[id];
const fmt = (v, dec = 1) => isNaN(v) ? "–" : v.toLocaleString("de-DE", { minimumFractionDigits: dec, maximumFractionDigits: dec });
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function moreInfo(el, entityId) {
  el.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
}
function navigate(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
}
function relTime(date) {
  const diff = (Date.now() - date.getTime()) / 60000;
  if (diff < 1) return "jetzt";
  if (diff < 60) return `vor ${Math.round(diff)} min`;
  if (diff < 60 * 24) return `vor ${Math.round(diff / 60)} h`;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

const BASE_CSS = `
  :host { display:block; }
  * { box-sizing:border-box; }
  ha-card { display:block; font-family:${FONT}; color:${C.text}; background:${C.surface}; border:1px solid ${C.border}; border-radius:14px; overflow:hidden; }
  .hd { display:flex; align-items:center; gap:10px; padding:14px 16px 6px; }
  .hd .t { font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:${C.muted}; font-weight:500; }
  .hd .t b { color:${C.accent}; font-weight:600; margin-right:6px; }
  .hd .sp { flex:1; }
  .hd .lnk { font-size:11px; color:${C.faint}; cursor:pointer; }
  .hd .lnk:hover { color:${C.accent}; }
  .row { display:flex; align-items:center; gap:12px; padding:9px 16px; cursor:pointer; transition:background .15s; }
  .row:hover { background:rgba(255,255,255,0.03); }
  .row .ic { width:30px; height:30px; border-radius:9px; display:grid; place-items:center; background:${C.surface2}; color:${C.muted}; flex:none; }
  .row .ic ha-icon { --mdc-icon-size:18px; }
  .row .nm { flex:1; min-width:0; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .row .nm small { display:block; font-size:11px; color:${C.faint}; margin-top:2px; }
  .row .vl { font-size:13px; font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .row .vl small { color:${C.faint}; font-weight:400; margin-left:3px; }
  .muted { color:${C.muted}; } .faint { color:${C.faint}; }
  .pad { padding:6px 0 10px; }
`;

class CCBase extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._raf = null; }
  setConfig(c) { this._config = c || {}; this._built = false; }
  connectedCallback() { this._themeRoot = themeAttach(this); if (!this._themeRoot) setTimeout(() => { if (!this._themeRoot && this.isConnected) this._themeRoot = themeAttach(this); }, 300); }
  disconnectedCallback() { themeDetach(this._themeRoot); this._themeRoot = null; }
  set hass(h) { this._hass = h; if (this._raf) return; this._raf = requestAnimationFrame(() => { this._raf = null; this.render(); }); }
  get hass() { return this._hass; }
  getCardSize() { return 3; }
  getGridOptions() { return { columns: 12, rows: "auto", min_columns: 6 }; }
  render() {}
}

/* =================================================================
 * Begrüßung
 * ================================================================= */
const COND = {
  "clear-night": ["☾", "sternklar"], cloudy: ["☁", "bewölkt"], fog: ["≋", "neblig"], hail: ["❄", "Hagel"],
  lightning: ["ϟ", "Gewitter"], "lightning-rainy": ["ϟ", "Gewitter"], partlycloudy: ["⛅", "teils bewölkt"],
  pouring: ["☂", "Starkregen"], rainy: ["☂", "Regen"], snowy: ["❄", "Schnee"], "snowy-rainy": ["❄", "Schneeregen"],
  sunny: ["☀", "sonnig"], windy: ["≈", "windig"], "windy-variant": ["≈", "windig"], exceptional: ["!", "Unwetter"],
};
const SLOTS = [
  { from: 0, to: 4, lines: [
    "Noch wach, {n}? Die Sterne halten die Stellung.",
    "Psst, {n} – das Haus schläft. Nur der Server nicht.",
    "Mitternachtssnack-Patrouille, {n}?",
    "Nachtschicht, {n}? Die Katzen sind schon im Dienst.",
    "Die Eulen lassen grüßen, {n}.",
    "Um diese Uhrzeit? Respekt, {n}." ] },
  { from: 5, to: 8, lines: [
    "Moin {n}! Erst Kaffee, dann Welt.",
    "Frisch aufgewacht, {n}? Das Haus ist schon hellwach.",
    "Guten Start, {n} – der Tag ist noch ganz neu.",
    "Die Katzen fordern Frühstück, {n}. Nur so als Hinweis.",
    "Rise & shine, {n}. Kaffee wird kompiliert …",
    "Morgen, {n}. Heute wird ein guter Tag. Wahrscheinlich." ] },
  { from: 9, to: 11, lines: [
    "Läuft bei dir, {n}?",
    "Schönen Vormittag, {n} – alles im grünen Bereich.",
    "Hallo {n}! Keine besonderen Vorkommnisse im Haus.",
    "Na, {n}, schon beim zweiten Kaffee?",
    "Vormittags-Check, {n}: alles stabil." ] },
  { from: 12, to: 13, lines: [
    "Mahlzeit, {n}!",
    "Halbzeit, {n}. Zeit für was Leckeres.",
    "Mittagspause, {n}? Das Haus passt solange auf.",
    "High Noon, {n}. Alles ruhig an der Front." ] },
  { from: 14, to: 17, lines: [
    "Schönen Nachmittag, {n}!",
    "Hey {n}, der Nachmittag gehört dir.",
    "Kaffee-und-Kuchen-Zeit, {n}?",
    "Willkommen zurück, {n} – alles beim Alten.",
    "Nachmittagstief, {n}? Hier ist alles hellwach." ] },
  { from: 18, to: 21, lines: [
    "Feierabend, {n}! Füße hoch.",
    "Schönen Abend, {n} – das Haus fährt langsam runter.",
    "Na {n}, Sofa oder Projekt?",
    "Zeit zum Abschalten, {n}. Der Beamer wartet.",
    "Abendrunde, {n}: alles ruhig im Haus.",
    "Der Tag ist geschafft, {n}. Gut gemacht." ] },
  { from: 22, to: 23, lines: [
    "Späte Runde, {n}? Alles im Lot.",
    "Noch ein letzter Blick, {n}? Gleich ist Schlafenszeit.",
    "Die Kinder träumen, die Katzen patrouillieren, {n}.",
    "Feierabend vom Feierabend, {n}.",
    "Nachtmodus aktiviert, {n}. Schlaf gut gleich.",
    "Nur noch eine Folge, {n}? Klar. Nur eine." ] },
];
const SPIN_WORDS = ["Grübeln", "Tüfteln", "Schnurren", "Kaffeekochen", "Sinnieren", "Werkeln", "Wuseln", "Orakeln", "Funkeln", "Brüten", "Schlawinern", "Pläneschmieden"];
const SPIN_GLYPHS = ["·", "✢", "✳", "∗", "✻", "✽", "✻", "∗", "✳", "✢"];

class CCGreetingCard extends CCBase {
  static getStubConfig() { return { weather: "weather.home", persons: [] }; }
  connectedCallback() {
    super.connectedCallback();
    this._tick = setInterval(() => this.render(), 20000);
    this._spinI = 0; this._wordI = Math.floor(Math.random() * SPIN_WORDS.length);
    this._spin = setInterval(() => this._spinStep(), 160);
  }
  disconnectedCallback() { super.disconnectedCallback(); clearInterval(this._tick); clearInterval(this._spin); }
  _spinStep() {
    this._spinI++;
    const g = this.shadowRoot.getElementById("glyph"); const w = this.shadowRoot.getElementById("word");
    if (g) g.textContent = SPIN_GLYPHS[this._spinI % SPIN_GLYPHS.length];
    if (w && this._spinI % 25 === 0) { this._wordI = (this._wordI + 1) % SPIN_WORDS.length; w.textContent = SPIN_WORDS[this._wordI] + "…"; }
  }
  _context(h, now) {
    const c = this._config, hass = this._hass, ctx = [];
    const day = now.getDay(), hr = now.getHours();
    const w = st(hass, c.weather); const t = w ? parseFloat(w.attributes.temperature) : NaN;
    if (day === 6 || day === 0) ctx.push("Wochenend-Modus an, {n}.", "Wochenende, {n}! Heute zählen nur gute Pläne.");
    if (day === 5 && hr >= 13) ctx.push("Freitag, {n}! Das Wochenende winkt schon.");
    if (day === 1 && hr < 12) ctx.push("Montag, {n}. Wir schaffen das. Zusammen.");
    if (!isNaN(t) && t <= 0) ctx.push(`Frostig draußen, {n}: ${fmt(t)}°C. Drinnen ist's gemütlicher.`);
    if (!isNaN(t) && t >= 26) ctx.push(`Sommer-Modus, {n}: ${fmt(t)}°C draußen.`);
    if (w && ["rainy", "pouring"].includes(w.state)) ctx.push("Regenwetter, {n}. Perfekt für ein Projekt drinnen.");
    const pv = num(hass, c.pv_power);
    if (pv >= 3) ctx.push(`Die Sonne zahlt gerade mit, {n}: ${fmt(pv)} kW vom Dach.`);
    return ctx;
  }
  _greeting(name, now) {
    const hr = now.getHours();
    // Müll morgen hat Vorrang am Nachmittag/Abend
    const waste = this._nextWaste();
    if (waste && waste.days === 1 && hr >= 15) return `Morgen wird ${waste.name} abgeholt, ${name}. Schon rausgestellt?`;
    if (waste && waste.days === 0 && hr < 10) return `Heute wird ${waste.name} abgeholt, ${name}! Schnell raus damit.`;
    const slot = SLOTS.find((s) => hr >= s.from && hr <= s.to) || SLOTS[0];
    const ctx = this._context(hr, now);
    const pool = [...slot.lines, ...ctx, ...ctx];
    const seed = hashStr(`${now.toDateString()}|${hr}|${name}|${this._reroll || 0}`);
    return pool[seed % pool.length].replaceAll("{n}", name);
  }
  _nextWaste() {
    const list = (this._config.waste || []).map((e) => {
      const s = st(this._hass, e.entity); const d = s ? Number(s.attributes.daysTo) : NaN;
      return { name: e.name || s?.attributes.friendly_name, days: d };
    }).filter((x) => !isNaN(x.days)).sort((a, b) => a.days - b.days);
    return list[0];
  }
  _nextEvent() {
    const now = Date.now(); let best = null;
    for (const id of this._config.calendars || []) {
      const s = st(this._hass, id); if (!s || !s.attributes.start_time) continue;
      const d = new Date(s.attributes.start_time.replace(" ", "T"));
      if (s.state === "on" || d.getTime() > now - 60000) if (!best || d < best.d) best = { d, msg: s.attributes.message, on: s.state === "on" };
    }
    return best;
  }
  render() {
    const hass = this._hass, c = this._config; if (!hass) return;
    const now = new Date();
    const name = (c.name || hass.user?.name || "du").split(" ")[0];
    const greet = this._greeting(name, now);
    const time = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    const date = now.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

    const pills = [];
    const w = st(hass, c.weather);
    if (w) { const [g, label] = COND[w.state] || ["·", w.state]; pills.push({ i: g, t: `${fmt(parseFloat(w.attributes.temperature))}° ${label}`, e: c.weather }); }
    const persons = (c.persons || []).map((p) => st(hass, p.entity || p)).filter(Boolean);
    const home = persons.filter((p) => p.state === "home").length;
    if (persons.length) pills.push({ i: "⌂", t: `${home}/${persons.length} zuhause` });
    const openEnts = Object.entries(hass.states).filter(([id, s]) => id.startsWith("binary_sensor.") && ["window", "door"].includes(s.attributes?.device_class) && s.state === "on").map(([id]) => id);
    pills.push(openEnts.length ? { i: "◫", t: `${openEnts.length} offen`, warn: true, e: openEnts[0] } : { i: "◫", t: "alles zu", ok: true });
    const wst = this._nextWaste();
    if (wst) pills.push({ i: "♻", t: `${wst.name} ${wst.days === 0 ? "heute" : wst.days === 1 ? "morgen" : `in ${wst.days} T.`}`, warn: wst.days <= 1 });
    const ev = this._nextEvent();
    if (ev) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const dd = Math.round((new Date(ev.d).setHours(0, 0, 0, 0) - today) / 86400000);
      const when = ev.on ? "jetzt" : dd === 0 ? `heute ${ev.d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` : dd === 1 ? `morgen ${ev.d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` : ev.d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" });
      pills.push({ i: "▸", t: `${when} · ${ev.msg}` });
    }

    const avatars = (c.persons || []).map((p) => {
      const id = p.entity || p; const s = st(hass, id); if (!s) return "";
      const isHome = s.state === "home"; const pic = s.attributes.entity_picture;
      const label = isHome ? "zuhause" : s.state === "not_home" ? "unterwegs" : s.state === "unknown" ? "unbekannt" : s.state;
      return `<div class="av ${isHome ? "home" : ""}" data-e="${id}" title="${esc(s.attributes.friendly_name)} · ${esc(label)}">
        ${pic ? `<img src="${pic}">` : `<span>${esc((s.attributes.friendly_name || "?")[0])}</span>`}<i></i>
        <div class="avn">${esc(s.attributes.friendly_name)}<small>${esc(label)}</small></div></div>`;
    }).join("");

    this.shadowRoot.innerHTML = `<style>${BASE_CSS}
      ha-card { padding:20px 22px 18px; background:
        linear-gradient(135deg, rgba(217,119,87,0.10), transparent 45%), ${C.surface}; }
      .top { display:flex; align-items:center; gap:10px; font-size:12px; color:${C.muted}; }
      .brand { display:flex; align-items:center; gap:8px; white-space:nowrap; color:${C.accent}; font-weight:600; letter-spacing:.02em; }
      #glyph { display:inline-block; width:14px; text-align:center; color:${C.accent}; font-size:15px; }
      #word { color:${C.faint}; font-style:italic; }
      .sp { flex:1; }
      .clock { text-align:right; }
      .clock b { font-size:28px; font-weight:300; color:${C.text}; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
      .clock div { font-size:11px; color:${C.faint}; margin-top:2px; text-transform:capitalize; }
      .main { display:flex; align-items:flex-end; gap:20px; margin-top:6px; }
      h1 { margin:0; font-size:clamp(20px, 2.6vw, 30px); line-height:1.25; font-weight:500; letter-spacing:-.015em; cursor:pointer; flex:1; }
      h1 .cur { display:inline-block; width:.55em; height:1em; background:${C.accent}; vertical-align:-0.12em; margin-left:6px; animation:blink 1.1s steps(1) infinite; border-radius:1px; }
      @keyframes blink { 50% { opacity:0; } }
      .pills { display:flex; flex-wrap:wrap; gap:6px; margin-top:14px; }
      .pill { font-size:12px; padding:5px 10px; border-radius:8px; background:${C.surface2}; border:1px solid ${C.border}; color:${C.muted}; white-space:nowrap; cursor:default; }
      .pill[data-e] { cursor:pointer; }
      .pill b { color:${C.accent}; font-weight:500; margin-right:6px; }
      .pill.warn { border-color:rgba(230,180,80,.45); color:${C.yellow}; } .pill.warn b { color:${C.yellow}; }
      .pill.ok b { color:${C.green}; }
      .prompt { color:${C.accent}; margin-right:4px; }
      .avs { display:flex; gap:14px; margin-top:16px; flex-wrap:wrap; }
      .av { display:flex; align-items:center; gap:8px; cursor:pointer; position:relative; }
      .av img, .av > span { width:34px; height:34px; border-radius:50%; object-fit:cover; border:2px solid ${C.border}; filter:grayscale(.6) brightness(.8); display:grid; place-items:center; background:${C.surface2}; }
      .av i { position:absolute; left:25px; top:25px; width:10px; height:10px; border-radius:50%; background:${C.faint}; border:2px solid ${C.surface}; }
      .av.home img, .av.home > span { border-color:${C.accent}; filter:none; }
      .av.home i { background:${C.green}; }
      .avn { font-size:12px; line-height:1.2; } .avn small { display:block; color:${C.faint}; font-size:10.5px; }
      @media (max-width: 600px) { #word { display:none; } .clock b { font-size:22px; } .main { flex-direction:column; align-items:flex-start; gap:8px; } ha-card { padding:16px; } }
    </style>
    <ha-card>
      <div class="top">
        <div class="brand"><span id="glyph">✻</span> ${esc(c.brand || "Home")}</div>
        <span id="word">${SPIN_WORDS[this._wordI || 0]}…</span>
        <span class="sp"></span>
        <div class="clock"><b>${time}</b><div>${date}</div></div>
      </div>
      <div class="main"><h1 id="g" title="Klick für eine neue Begrüßung"><span class="prompt">&gt;</span>${esc(greet)}<span class="cur"></span></h1></div>
      <div class="pills">${pills.map((p) => `<span class="pill ${p.warn ? "warn" : ""} ${p.ok ? "ok" : ""}" ${p.e ? `data-e="${p.e}"` : ""}><b>${p.i}</b>${esc(p.t)}</span>`).join("")}</div>
      ${avatars ? `<div class="avs">${avatars}</div>` : ""}
    </ha-card>`;
    this.shadowRoot.getElementById("g").onclick = () => { this._reroll = (this._reroll || 0) + 1; this.render(); };
    this.shadowRoot.querySelectorAll("[data-e]").forEach((el) => (el.onclick = () => moreInfo(this, el.dataset.e)));
  }
  getGridOptions() { return { columns: "full", rows: "auto" }; }
}

/* =================================================================
 * Newsfeed (Tagesschau API, ohne Schlüssel)
 * ================================================================= */
const NEWS_TABS = [
  { k: "top", label: "Top", url: "https://www.tagesschau.de/api2u/homepage/" },
  { k: "nds", label: "Niedersachsen", url: "https://www.tagesschau.de/api2u/news/?regions=9" },
  { k: "wirtschaft", label: "Wirtschaft", url: "https://www.tagesschau.de/api2u/news/?ressort=wirtschaft" },
  { k: "wissen", label: "Wissen", url: "https://www.tagesschau.de/api2u/news/?ressort=wissen" },
  { k: "sport", label: "Sport", url: "https://www.tagesschau.de/api2u/news/?ressort=sport" },
];
const _newsCache = {};
class CCNewsCard extends CCBase {
  static getStubConfig() { return { max: 6 }; }
  setConfig(c) { super.setConfig(c); this._tab = this._tab || (c.local ? "local" : (c.tabs?.[0] || "top")); this._expanded = false; }
  connectedCallback() { super.connectedCallback(); this._load(); this._timer = setInterval(() => this._load(true), 10 * 60 * 1000); }
  disconnectedCallback() { super.disconnectedCallback(); clearInterval(this._timer); }
  set hass(h) {
    const first = !this._hass; this._hass = h;
    const lu = this._config.local ? h.states[this._config.local.entity]?.last_updated : null;
    if ((first || lu !== this._lu) && this._tab === "local") this._load();
    this._lu = lu;
    if (!this._rendered) { this._rendered = true; this.render(); }
  }
  _tabs() {
    const want = this._config.tabs; const base = want ? NEWS_TABS.filter((t) => want.includes(t.k)) : NEWS_TABS;
    const l = this._config.local;
    return l ? [{ k: "local", label: l.label || "Lokal", local: true }, ...base] : base;
  }
  async _loadLocal() {
    const l = this._config.local; if (!this._hass) return;
    try {
      const r = await this._hass.callWS({ type: "todo/item/list", entity_id: l.entity });
      const items = (r.items || []).filter((i) => i.status !== "completed").map((i) => {
        const [link = "", pub = ""] = (i.description || "").split("\n");
        const d = pub ? new Date(pub) : null;
        return { title: i.summary, top: l.topline || l.label || "Lokal", date: d && !isNaN(d) ? d : null, url: link, breaking: false, img: null };
      }).reverse().sort((x, y) => (y.date ? y.date.getTime() : 0) - (x.date ? x.date.getTime() : 0));
      this._items = items;
      this._err = items.length ? null : (l.empty || "Noch keine Lokalmeldungen – der Feed wird gerade eingerichtet.");
    } catch (e) { this._err = "Lokalnachrichten nicht erreichbar."; }
    this._loading = false; this.render();
  }
  async _load(force) {
    if (this._tab === "local") { this._loading = true; this.render(); return this._loadLocal(); }
    const tab = NEWS_TABS.find((t) => t.k === this._tab) || NEWS_TABS[0];
    const cached = _newsCache[tab.k];
    if (cached && !force && Date.now() - cached.at < 5 * 60 * 1000) { this._items = cached.items; this._err = null; this.render(); return; }
    this._loading = true; this.render();
    try {
      const r = await fetch(tab.url); const j = await r.json();
      const seen = new Set();
      const items = (j.news || []).filter((n) => n.title && (n.shareURL || n.detailsweb) && !seen.has(n.title) && seen.add(n.title)).map((n) => ({
        title: n.title, top: n.topline || "", date: n.date ? new Date(n.date) : null,
        url: n.shareURL || n.detailsweb, breaking: !!n.breakingNews,
        img: n.teaserImage?.imageVariants?.["1x1-144"] || n.teaserImage?.imageVariants?.["1x1-256"] || null,
      }));
      _newsCache[tab.k] = { at: Date.now(), items };
      this._items = items; this._err = null;
    } catch (e) { this._err = "Nachrichten gerade nicht erreichbar."; }
    this._loading = false; this.render();
  }
  render() {
    const max = this._config.max || 6;
    const items = (this._items || []).slice(0, this._expanded ? 20 : max);
    this.shadowRoot.innerHTML = `<style>${BASE_CSS}
      .tabs { display:flex; gap:4px; padding:4px 12px 8px; overflow-x:auto; scrollbar-width:none; }
      .tabs::-webkit-scrollbar { display:none; }
      .tab { font:inherit; font-size:11.5px; padding:5px 10px; border-radius:7px; border:1px solid transparent; background:none; color:${C.faint}; cursor:pointer; white-space:nowrap; }
      .tab:hover { color:${C.text}; }
      .tab.on { color:${C.accent}; background:${C.accentSoft}; border-color:rgba(217,119,87,.35); }
      a.it { display:flex; gap:12px; padding:10px 16px; text-decoration:none; color:inherit; border-top:1px solid ${C.border}; transition:background .15s; }
      a.it:hover { background:rgba(255,255,255,0.03); }
      a.it:hover .tt { color:${C.accent2}; }
      .th { width:52px; height:52px; border-radius:9px; flex:none; object-fit:cover; background:${C.surface2}; }
      .tx { min-width:0; flex:1; }
      .tp { font-size:10.5px; color:${C.accent}; text-transform:uppercase; letter-spacing:.06em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .tp .eil { background:${C.red}; color:#141413; padding:1px 5px; border-radius:4px; margin-right:6px; font-weight:700; }
      .tt { font-size:13px; line-height:1.35; margin-top:2px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .tm { font-size:10.5px; color:${C.faint}; margin-top:3px; }
      .more { display:block; width:100%; font:inherit; font-size:11.5px; color:${C.faint}; background:none; border:none; border-top:1px solid ${C.border}; padding:10px; cursor:pointer; }
      .more:hover { color:${C.accent}; }
      .st { padding:18px 16px; font-size:12px; color:${C.faint}; }
      .src { font-size:10px; color:${C.faint}; }
    </style>
    <ha-card>
      <div class="hd"><span class="t"><b>✻</b>Nachrichten</span><span class="sp"></span><span class="src">${this._tab === "local" ? esc(this._config.local?.source || "") : "tagesschau.de"}</span><span class="lnk" id="rf" title="Aktualisieren">↻</span></div>
      <div class="tabs">${this._tabs().map((t) => `<button class="tab ${t.k === this._tab ? "on" : ""}" data-k="${t.k}">${t.label}</button>`).join("")}</div>
      ${this._loading && !items.length ? `<div class="st">✳ Lade Schlagzeilen …</div>` : ""}
      ${this._err ? `<div class="st">${this._err}</div>` : ""}
      ${items.map((n) => `<a class="it" href="${esc(n.url)}" target="_blank" rel="noopener">
        ${n.img && this._config.images !== false ? `<img class="th" loading="lazy" src="${esc(n.img)}">` : ""}
        <div class="tx"><div class="tp">${n.breaking ? `<span class="eil">EIL</span>` : ""}${esc(n.top)}</div>
        <div class="tt">${esc(n.title)}</div>${n.date ? `<div class="tm">${relTime(n.date)}</div>` : ""}</div></a>`).join("")}
      ${(this._items || []).length > max ? `<button class="more" id="more">${this._expanded ? "weniger ▴" : "mehr anzeigen ▾"}</button>` : ""}
    </ha-card>`;
    this.shadowRoot.querySelectorAll(".tab").forEach((b) => (b.onclick = () => { this._tab = b.dataset.k; this._expanded = false; this._items = null; this._load(); }));
    const m = this.shadowRoot.getElementById("more"); if (m) m.onclick = () => { this._expanded = !this._expanded; this.render(); };
    this.shadowRoot.getElementById("rf").onclick = () => this._load(true);
  }
}

/* =================================================================
 * Abfall
 * ================================================================= */
class CCWasteCard extends CCBase {
  static getStubConfig() { return { entities: [] }; }
  render() {
    const hass = this._hass; if (!hass) return;
    const list = (this._config.entities || []).map((e) => {
      const s = st(hass, e.entity); const d = s ? Number(s.attributes.daysTo) : NaN;
      return { ...e, name: e.name || s?.attributes.friendly_name || e.entity, days: s && s.attributes.daysTo !== undefined ? d : NaN };
    }).sort((a, b) => (isNaN(a.days) ? 999 : a.days) - (isNaN(b.days) ? 999 : b.days));
    const label = (d) => isNaN(d) ? "kein Termin" : d === 0 ? "heute" : d === 1 ? "morgen" : `in ${d} Tagen`;
    this.shadowRoot.innerHTML = `<style>${BASE_CSS}
      .dot { width:10px; height:10px; border-radius:3px; flex:none; }
      .bar { height:3px; border-radius:2px; background:${C.surface2}; margin-top:6px; overflow:hidden; }
      .bar i { display:block; height:100%; border-radius:2px; }
      .row.hot { background:${C.accentSoft}; }
      .row.hot .vl { color:${C.accent}; }
      .row.none { opacity:.5; }
    </style>
    <ha-card><div class="hd"><span class="t"><b>♻</b>${esc(this._config.title || "Abfuhr")}</span></div>
    <div class="pad">${list.map((x) => {
      const pct = isNaN(x.days) ? 0 : Math.max(4, 100 - Math.min(x.days, 30) / 30 * 100);
      return `<div class="row ${x.days <= 1 ? "hot" : ""} ${isNaN(x.days) ? "none" : ""}" data-e="${x.entity}">
        <span class="dot" style="background:${x.color || C.muted}"></span>
        <div class="nm">${esc(x.name)}<div class="bar"><i style="width:${pct}%;background:${x.color || C.muted}"></i></div></div>
        <span class="vl">${label(x.days)}</span></div>`;
    }).join("")}</div></ha-card>`;
    this.shadowRoot.querySelectorAll("[data-e]").forEach((el) => (el.onclick = () => moreInfo(this, el.dataset.e)));
  }
}

/* =================================================================
 * Energie-Übersicht
 * ================================================================= */
class CCEnergyCard extends CCBase {
  static getStubConfig() { return {}; }
  render() {
    const h = this._hass, c = this._config; if (!h) return;
    const pv = num(h, c.pv_power), pvToday = num(h, c.pv_today), soc = num(h, c.battery_soc), batP = num(h, c.battery_power);
    const bkw = num(h, c.bkw_power), house = num(h, c.house_power), grid = num(h, c.grid_power);
    const eurDay = num(h, c.eur_today), eurMonth = num(h, c.eur_month), eurTotal = num(h, c.eur_total);
    const invest = num(h, c.invest), earned = num(h, c.earned), rest = num(h, c.rest), earnedToday = num(h, c.earned_today);
    const amPct = invest > 0 ? Math.min(100, earned / invest * 100) : NaN;
    const socCol = soc >= 50 ? C.green : soc >= 20 ? C.yellow : C.red;
    const pvMax = c.pv_max || 7, bkwMax = c.bkw_max || 600;
    const tile = (id, icon, label, value, unit, pct, col, sub) => `
      <div class="tl" data-e="${id}">
        <div class="tl-h"><ha-icon icon="${icon}"></ha-icon><span>${label}</span></div>
        <div class="tl-v">${value}<small>${unit}</small></div>
        ${pct !== null ? `<div class="bar"><i style="width:${isNaN(pct) ? 0 : Math.max(0, Math.min(100, pct))}%;background:${col}"></i></div>` : ""}
        ${sub ? `<div class="tl-s">${sub}</div>` : ""}
      </div>`;
    const gridLbl = isNaN(grid) ? "" : grid > 0.02 ? "Bezug" : grid < -0.02 ? "Einspeisung" : "ausgeglichen";
    this.shadowRoot.innerHTML = `<style>${BASE_CSS}
      .grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; padding:4px 12px 4px; }
      .tl { background:${C.surface2}; border:1px solid ${C.border}; border-radius:11px; padding:10px 12px; cursor:pointer; transition:border-color .15s; min-width:0; }
      .tl:hover { border-color:rgba(217,119,87,.5); }
      .tl-h { display:flex; align-items:center; gap:6px; font-size:11px; color:${C.muted}; white-space:nowrap; overflow:hidden; }
      .tl-h ha-icon { --mdc-icon-size:15px; color:${C.accent}; }
      .tl-v { font-size:20px; font-weight:500; margin-top:4px; font-variant-numeric:tabular-nums; white-space:nowrap; }
      .tl-v small { font-size:11px; color:${C.faint}; margin-left:4px; font-weight:400; }
      .tl-s { font-size:10.5px; color:${C.faint}; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .bar { height:4px; border-radius:3px; background:${C.bg}; margin-top:7px; overflow:hidden; }
      .bar i { display:block; height:100%; border-radius:3px; transition:width .6s; }
      .money { display:flex; gap:6px; padding:10px 12px 4px; flex-wrap:wrap; }
      .chip { flex:1; min-width:90px; font-size:11px; color:${C.muted}; background:${C.surface2}; border:1px solid ${C.border}; border-radius:9px; padding:7px 10px; cursor:pointer; }
      .chip b { display:block; color:${C.green}; font-size:14px; font-weight:600; margin-top:2px; font-variant-numeric:tabular-nums; }
      .amo { margin:10px 12px 14px; padding:12px; border-radius:11px; border:1px dashed ${C.border}; cursor:pointer; }
      .amo .l { display:flex; justify-content:space-between; font-size:11px; color:${C.muted}; }
      .amo .l b { color:${C.text}; font-weight:500; }
      .amo .bar { height:8px; margin-top:8px; background:${C.bg}; }
      .amo .bar i { background:linear-gradient(90deg, ${C.accent}, ${C.yellow}); }
      .amo .s { font-size:10.5px; color:${C.faint}; margin-top:6px; display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; }
    </style>
    <ha-card>
      <div class="hd"><span class="t"><b>ϟ</b>${esc(c.title || "Energie")}</span><span class="sp"></span>${c.link ? `<span class="lnk" id="lnk">Details →</span>` : ""}</div>
      <div class="grid">
        ${tile(c.pv_power, "mdi:solar-power-variant", "PV jetzt", fmt(pv, 2), "kW", pv / pvMax * 100, C.yellow, isNaN(pvToday) ? "" : `heute ${fmt(pvToday, 1)} kWh`)}
        ${tile(c.battery_soc, "mdi:home-battery", "Speicher", fmt(soc, 0), "%", soc, socCol, isNaN(batP) ? "" : batP > 0.02 ? `lädt ${fmt(batP, 2)} kW` : batP < -0.02 ? `entlädt ${fmt(-batP, 2)} kW` : "Standby")}
        ${tile(c.house_power, "mdi:home-lightning-bolt", "Haus", fmt(house, 0), "W", null, "", isNaN(grid) ? "" : `Netz ${fmt(Math.abs(grid), 2)} kW · ${gridLbl}`)}
        ${tile(c.bkw_power, "mdi:solar-panel", "Balkonkraftwerk", fmt(bkw, 0), "W", bkw / bkwMax * 100, C.yellow, "")}
      </div>
      <div class="money">
        <div class="chip" data-e="${c.eur_today}">Einspeisung heute<b>${fmt(eurDay, 2)} €</b></div>
        <div class="chip" data-e="${c.eur_month}">Monat<b>${fmt(eurMonth, 2)} €</b></div>
        <div class="chip" data-e="${c.eur_total}">Gesamt<b>${fmt(eurTotal, 2)} €</b></div>
      </div>
      ${c.invest ? `<div class="amo" data-e="${c.earned}">
        <div class="l"><span>☀ Amortisation</span><b>${fmt(amPct, 1)} %</b></div>
        <div class="bar"><i style="width:${isNaN(amPct) ? 0 : Math.max(1, amPct)}%"></i></div>
        <div class="s"><span>${fmt(earned, 0)} € von ${fmt(invest, 0)} €</span><span>noch ${fmt(rest, 0)} €</span><span>heute +${fmt(earnedToday, 2)} €</span></div>
      </div>` : ""}
    </ha-card>`;
    this.shadowRoot.querySelectorAll("[data-e]").forEach((el) => (el.onclick = () => el.dataset.e && el.dataset.e !== "undefined" && moreInfo(this, el.dataset.e)));
    const l = this.shadowRoot.getElementById("lnk"); if (l) l.onclick = () => navigate(c.link);
  }
}

/* =================================================================
 * Heizung kompakt
 * ================================================================= */
class CCClimateCard extends CCBase {
  static getStubConfig() { return { entities: [] }; }
  render() {
    const h = this._hass, c = this._config; if (!h) return;
    const tcol = (t) => isNaN(t) ? C.faint : t < 18 ? C.blue : t < 21 ? C.green : t < 23.5 ? C.yellow : C.accent;
    const rooms = (c.entities || []).map((e) => {
      const s = st(h, e.entity); if (!s) return null;
      const cur = parseFloat(s.attributes.current_temperature), tgt = parseFloat(s.attributes.temperature);
      const heating = s.attributes.hvac_action === "heating" || (!isNaN(tgt) && !isNaN(cur) && s.state !== "off" && tgt > cur + 0.3);
      return { ...e, cur, tgt, off: s.state === "off", heating };
    }).filter(Boolean);
    const avg = rooms.filter((r) => !isNaN(r.cur)); const mean = avg.reduce((a, r) => a + r.cur, 0) / (avg.length || 1);
    this.shadowRoot.innerHTML = `<style>${BASE_CSS}
      .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(118px, 1fr)); gap:6px; padding:4px 12px 14px; }
      .rm { background:${C.surface2}; border:1px solid ${C.border}; border-radius:10px; padding:8px 10px; cursor:pointer; transition:border-color .15s; min-width:0; }
      .rm:hover { border-color:rgba(217,119,87,.5); }
      .rm .n { font-size:11px; color:${C.muted}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .rm .v { font-size:18px; font-weight:500; margin-top:2px; font-variant-numeric:tabular-nums; }
      .rm .v small { font-size:10.5px; color:${C.faint}; font-weight:400; margin-left:4px; }
      .rm .fl { color:${C.accent}; font-size:11px; margin-left:4px; }
      .rm.off { opacity:.5; }
      .avg { font-size:11px; color:${C.faint}; }
    </style>
    <ha-card><div class="hd"><span class="t"><b>♨</b>${esc(c.title || "Heizung")}</span><span class="sp"></span><span class="avg">Ø ${fmt(mean, 1)}°</span>${c.link ? `<span class="lnk" id="lnk">&nbsp;· Steuern →</span>` : ""}</div>
    <div class="grid">${rooms.map((r) => `<div class="rm ${r.off ? "off" : ""}" data-e="${r.entity}">
      <div class="n">${esc(r.name)}</div>
      <div class="v" style="color:${tcol(r.cur)}">${fmt(r.cur, 1)}°<small>→ ${r.off ? "aus" : fmt(r.tgt, 1) + "°"}</small>${r.heating ? `<span class="fl">▲</span>` : ""}</div>
    </div>`).join("")}</div></ha-card>`;
    this.shadowRoot.querySelectorAll("[data-e]").forEach((el) => (el.onclick = () => moreInfo(this, el.dataset.e)));
    const l = this.shadowRoot.getElementById("lnk"); if (l) l.onclick = () => navigate(c.link);
  }
}

/* =================================================================
 * Generische Liste (Werte mit Einheit)
 * ================================================================= */
class CCListCard extends CCBase {
  static getStubConfig() { return { title: "Liste", entities: [] }; }
  render() {
    const h = this._hass, c = this._config; if (!h) return;
    const rows = (c.entities || []).map((e) => {
      const id = typeof e === "string" ? e : e.entity; const s = st(h, id);
      const conf = typeof e === "string" ? {} : e;
      if (!s) return `<div class="row none"><div class="ic"><ha-icon icon="mdi:help"></ha-icon></div><div class="nm">${esc(conf.name || id)}<small>nicht gefunden</small></div></div>`;
      let val = s.state, unit = conf.unit ?? s.attributes.unit_of_measurement ?? "";
      const n = parseFloat(val);
      if (["on", "off"].includes(val)) { val = val === "on" ? (conf.on || "an") : (conf.off || "aus"); unit = ""; }
      else if (["unavailable", "unknown"].includes(val)) { val = "–"; unit = ""; }
      else if (!isNaN(n) && /^-?[\d.]+$/.test(s.state)) val = fmt(n, conf.decimals ?? (Math.abs(n) >= 100 ? 0 : 2));
      if (unit === "EUR") unit = "€";
      const active = s.state === "on";
      const icon = conf.icon || s.attributes.icon || "mdi:circle-small";
      return `<div class="row" data-e="${id}"><div class="ic" style="${active ? `color:${C.accent};background:${C.accentSoft}` : ""}"><ha-icon icon="${icon}"></ha-icon></div>
        <div class="nm">${esc(conf.name || s.attributes.friendly_name)}${conf.sub ? `<small>${esc(conf.sub)}</small>` : ""}</div>
        <span class="vl" style="${active ? `color:${C.accent}` : ""}">${val}${unit ? `<small>${esc(unit)}</small>` : ""}</span></div>`;
    }).join("");
    this.shadowRoot.innerHTML = `<style>${BASE_CSS} .row.none { opacity:.45; cursor:default; }</style>
      <ha-card>${c.title ? `<div class="hd"><span class="t"><b>${esc(c.glyph || "▸")}</b>${esc(c.title)}</span></div>` : ""}<div class="pad">${rows}</div></ha-card>`;
    this.shadowRoot.querySelectorAll("[data-e]").forEach((el) => (el.onclick = () => moreInfo(this, el.dataset.e)));
  }
}

/* =================================================================
 * Kopfzeile für Unterseiten (setzt auch das Theme)
 * ================================================================= */
class CCHeaderCard extends CCBase {
  static getStubConfig() { return { title: "Titel" }; }
  set hass(h) { this._hass = h; if (!this._done) { this._done = true; this.render(); } }
  render() {
    const c = this._config;
    this.shadowRoot.innerHTML = `<style>${BASE_CSS}
      .w { padding:6px 4px 2px; font-family:${FONT}; }
      .t { font-size:clamp(18px, 2.2vw, 24px); color:${C.text}; font-weight:500; display:flex; align-items:center; gap:10px; }
      .t b { color:${C.accent}; font-weight:600; }
      .s { font-size:12px; color:${C.faint}; margin-top:4px; }
      .s::before { content:"› "; color:${C.accent}; }
    </style><div class="w"><div class="t"><b>✻</b>${esc(c.title || "")}</div>${c.subtitle ? `<div class="s">${esc(c.subtitle)}</div>` : ""}</div>`;
  }
  getGridOptions() { return { columns: "full", rows: "auto" }; }
}

/* =================================================================
 * Radio (Stream im Browser oder per Sprachbefehl auf Echo)
 * ================================================================= */
const RADIO = { audio: null, station: null, listeners: new Set() };
function radioEmit() { RADIO.listeners.forEach((f) => f()); }
class CCRadioCard extends CCBase {
  static getStubConfig() { return { stations: [] }; }
  setConfig(c) { super.setConfig(c); this._sel = this._sel ?? 0; }
  connectedCallback() {
    super.connectedCallback();
    this._onRadio = () => this.render(); RADIO.listeners.add(this._onRadio);
    this._poll(); this._timer = setInterval(() => this._poll(), 30000);
  }
  disconnectedCallback() { super.disconnectedCallback(); RADIO.listeners.delete(this._onRadio); clearInterval(this._timer); }
  get _station() { return (this._config.stations || [])[this._sel] || {}; }
  async _poll() {
    const s = this._station; if (!s.status_url) return;
    try {
      const j = await (await fetch(s.status_url)).json();
      const src = [].concat(j.icestats?.source || []).find((x) => (x.listenurl || "").endsWith(s.mount));
      const t = src?.title || src?.yp_currently_playing || null;
      if (t !== this._now) { this._now = t; this.render(); }
    } catch (e) { /* still */ }
  }
  _play() {
    const s = this._station;
    if (!RADIO.audio) { RADIO.audio = new Audio(); RADIO.audio.preload = "none"; RADIO.audio.addEventListener("playing", radioEmit); RADIO.audio.addEventListener("pause", radioEmit); RADIO.audio.addEventListener("error", radioEmit); }
    RADIO.audio.src = s.url + (s.url.includes("?") ? "&" : "?") + "t=" + Date.now();
    RADIO.audio.volume = this._vol ?? 0.7;
    RADIO.station = s.name;
    RADIO.audio.play().catch(() => radioEmit());
    radioEmit();
  }
  _stop() { if (RADIO.audio) { RADIO.audio.pause(); RADIO.audio.removeAttribute("src"); RADIO.audio.load(); } RADIO.station = null; radioEmit(); }
  _echo(id) {
    const s = this._station;
    this._hass.callService("media_player", "play_media", { entity_id: id, media_content_type: "custom", media_content_id: s.alexa || `spiele ${s.name}` });
    this._sent = id; this.render(); setTimeout(() => { this._sent = null; this.render(); }, 4000);
  }
  render() {
    const h = this._hass, c = this._config; if (!h) return;
    const s = this._station;
    const playingHere = RADIO.audio && !RADIO.audio.paused && RADIO.station === s.name;
    const err = RADIO.audio && RADIO.audio.error && RADIO.station === s.name;
    const speakers = (c.speakers || []).map((sp) => ({ ...sp, st: st(h, sp.entity) })).filter((x) => x.st);
    const active = speakers.filter((x) => x.st.state === "playing");
    this.shadowRoot.innerHTML = `<style>${BASE_CSS}
      .stn { display:flex; gap:14px; align-items:center; padding:6px 16px 12px; }
      .logo { width:58px; height:58px; border-radius:12px; flex:none; display:grid; place-items:center; font-weight:700; font-size:13px; letter-spacing:-.02em; color:#141413; background:linear-gradient(135deg, ${C.accent}, ${C.yellow}); text-align:center; line-height:1.05; }
      .meta { flex:1; min-width:0; }
      .meta .n { font-size:16px; font-weight:600; }
      .meta .s { font-size:11px; color:${C.faint}; margin-top:2px; }
      .meta .np { font-size:12px; color:${C.accent2}; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .live { display:inline-flex; align-items:center; gap:5px; font-size:10px; color:${C.red}; letter-spacing:.08em; font-weight:700; margin-right:6px; }
      .live i { width:6px; height:6px; border-radius:50%; background:${C.red}; animation:pulse 1.4s infinite; }
      @keyframes pulse { 50% { opacity:.25; } }
      .eq { display:flex; gap:2px; align-items:flex-end; height:14px; margin-left:4px; }
      .eq i { width:3px; background:${C.accent}; border-radius:1px; animation:eq .9s ease-in-out infinite; }
      .eq i:nth-child(2){animation-delay:.2s} .eq i:nth-child(3){animation-delay:.4s} .eq i:nth-child(4){animation-delay:.1s}
      @keyframes eq { 0%,100% { height:3px; } 50% { height:14px; } }
      .play { width:46px; height:46px; border-radius:50%; border:none; cursor:pointer; flex:none; background:${C.accent}; color:#141413; font-size:18px; display:grid; place-items:center; transition:transform .1s; }
      .play:active { transform:scale(.94); }
      .play.on { background:${C.surface2}; color:${C.accent}; border:1px solid ${C.accent}; }
      .ctl { display:flex; align-items:center; gap:10px; padding:0 16px 10px; font-size:11px; color:${C.faint}; }
      .ctl input { flex:1; accent-color:${C.accent}; }
      .stns { display:flex; gap:6px; padding:0 16px 10px; flex-wrap:wrap; }
      .chip, .spk { font:inherit; font-size:11.5px; padding:5px 10px; border-radius:8px; border:1px solid ${C.border}; background:${C.surface2}; color:${C.muted}; cursor:pointer; }
      .chip.on { color:${C.accent}; border-color:rgba(217,119,87,.5); background:${C.accentSoft}; }
      .spk:hover, .chip:hover { color:${C.text}; }
      .spk.sent { color:${C.green}; border-color:rgba(143,191,127,.5); }
      .lbl { font-size:10.5px; color:${C.faint}; padding:4px 16px 6px; letter-spacing:.06em; text-transform:uppercase; }
      .spks { display:flex; gap:6px; padding:0 16px 12px; flex-wrap:wrap; }
      .act { border-top:1px solid ${C.border}; padding:8px 0 6px; }
      .act .row .vl button { font:inherit; font-size:11px; background:none; border:1px solid ${C.border}; color:${C.muted}; border-radius:7px; padding:3px 8px; cursor:pointer; }
      .err { color:${C.red}; font-size:11px; padding:0 16px 8px; }
    </style>
    <ha-card>
      <div class="hd"><span class="t"><b>♪</b>${esc(c.title || "Radio")}</span><span class="sp"></span>${playingHere ? `<span class="eq"><i></i><i></i><i></i><i></i></span>` : ""}</div>
      <div class="stn">
        <div class="logo">${esc(s.logo || s.name || "")}</div>
        <div class="meta"><div class="n">${esc(s.name || "")}</div><div class="s">${esc(s.sub || "")}</div>
          <div class="np"><span class="live"><i></i>LIVE</span>${esc(this._now || s.fallback || "Livestream")}</div></div>
        <button class="play ${playingHere ? "on" : ""}" id="pp" title="${playingHere ? "Stopp" : "Hier abspielen"}">${playingHere ? "■" : "▶"}</button>
      </div>
      ${err ? `<div class="err">Stream konnte nicht gestartet werden.</div>` : ""}
      ${playingHere ? `<div class="ctl">🔈<input type="range" id="vol" min="0" max="1" step="0.05" value="${RADIO.audio.volume}">🔊</div>` : ""}
      ${(c.stations || []).length > 1 ? `<div class="stns">${c.stations.map((x, i) => `<button class="chip ${i === this._sel ? "on" : ""}" data-i="${i}">${esc(x.name)}</button>`).join("")}</div>` : ""}
      ${speakers.length ? `<div class="lbl">Auf Echo abspielen</div><div class="spks">${speakers.map((x) => `<button class="spk ${this._sent === x.entity ? "sent" : ""}" data-sp="${x.entity}">${this._sent === x.entity ? "✓ " : ""}${esc(x.name)}</button>`).join("")}</div>` : ""}
      ${active.length ? `<div class="act">${active.map((x) => `<div class="row" data-e="${x.entity}"><div class="ic" style="color:${C.lilac}"><ha-icon icon="mdi:speaker-wireless"></ha-icon></div>
        <div class="nm">${esc(x.name)}<small>${esc(x.st.attributes.media_title || x.st.attributes.media_artist || "spielt")}</small></div>
        <span class="vl"><button data-stop="${x.entity}">Pause</button></span></div>`).join("")}</div>` : ""}
    </ha-card>`;
    const r = this.shadowRoot;
    r.getElementById("pp").onclick = () => (playingHere ? this._stop() : this._play());
    const v = r.getElementById("vol"); if (v) v.oninput = (e) => { this._vol = +e.target.value; RADIO.audio.volume = this._vol; };
    r.querySelectorAll("[data-i]").forEach((b) => (b.onclick = () => { this._sel = +b.dataset.i; this._now = null; this.render(); this._poll(); }));
    r.querySelectorAll("[data-sp]").forEach((b) => (b.onclick = () => this._echo(b.dataset.sp)));
    r.querySelectorAll("[data-stop]").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); this._hass.callService("media_player", "media_pause", { entity_id: b.dataset.stop }); }));
    r.querySelectorAll(".act [data-e]").forEach((el) => (el.onclick = () => moreInfo(this, el.dataset.e)));
  }
}

/* =================================================================
 * Tankstelle als Preistafel
 * ================================================================= */
const pts24 = (r) => (r.pts.length && r.pts[0].t > Date.now() - 24 * 3600 * 1000 ? "24 h" : "zuletzt");
class CCFuelCard extends CCBase {
  static getStubConfig() { return { entities: [] }; }
  connectedCallback() { super.connectedCallback(); this._hist = null; this._histAt = 0; }
  async _history() {
    if (!this._hass || Date.now() - this._histAt < 10 * 60 * 1000) return;
    this._histAt = Date.now();
    const ids = (this._config.entities || []).map((e) => e.entity);
    try {
      const start = new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString();
      const r = await this._hass.callWS({ type: "history/history_during_period", start_time: start, entity_ids: ids, minimal_response: true, no_attributes: true });
      const out = {};
      for (const id of ids) out[id] = (r[id] || []).map((p) => ({ v: parseFloat(p.s), t: (p.lu || p.lc) * 1000 })).filter((p) => !isNaN(p.v));
      this._hist = out; this.render();
    } catch (e) { this._hist = {}; }
  }
  _spark(pts, now) {
    if (isNaN(now)) return "";
    if (!pts || pts.length < 2) return "";
    const t0 = Date.now() - 24 * 3600 * 1000, t1 = Date.now();
    const all = [...pts, { v: now, t: t1 }];
    const vs = all.map((p) => p.v); const mn = Math.min(...vs), mx = Math.max(...vs); const rg = mx - mn || 0.01;
    let d = "", prev = null;
    for (const p of all) {
      const x = ((Math.max(p.t, t0) - t0) / (t1 - t0)) * 100, y = 22 - ((p.v - mn) / rg) * 18;
      d += prev === null ? `M${x.toFixed(1)},${y.toFixed(1)}` : `H${x.toFixed(1)}V${y.toFixed(1)}`; prev = y;
    }
    return `<svg viewBox="0 0 100 26" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="${C.accent}" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>`;
  }
  render() {
    const h = this._hass, c = this._config; if (!h) return;
    this._history();
    const rows = (c.entities || []).map((e) => {
      const s = st(h, e.entity); const live = s ? parseFloat(s.state) : NaN;
      const all = this._hist?.[e.entity] || [];
      const lastKnown = all.length ? all[all.length - 1] : null;
      const v = !isNaN(live) ? live : (lastKnown ? lastKnown.v : NaN);
      const day = all.filter((p) => p.t > Date.now() - 24 * 3600 * 1000);
      const pts = day.length >= 2 ? day : all.slice(-12);
      const vals = [...pts.map((p) => p.v), v].filter((x) => !isNaN(x));
      const first = pts.length ? pts[0].v : NaN;
      return { ...e, v, s, stale: isNaN(live) && !isNaN(v), min: vals.length ? Math.min(...vals) : NaN, max: vals.length ? Math.max(...vals) : NaN, diff: v - first, pts };
    });
    const cheapest = rows.filter((r) => !isNaN(r.v)).sort((a, b) => a.v - b.v)[0];
    const big = (v) => {
      if (isNaN(v)) return `<span class="pr">–</span>`;
      const str = v.toFixed(3); const main = str.slice(0, -1).replace(".", ","); const last = str.slice(-1);
      return `<span class="pr">${main}<sup>${last}</sup></span>`;
    };
    const upd = rows.find((r) => r.s)?.s?.last_changed;
    const open = c.status ? st(h, c.status) : null;
    const isOpen = open ? open.state === "on" : null;
    this.shadowRoot.innerHTML = `<style>${BASE_CSS}
      .brand { display:flex; align-items:center; gap:10px; padding:4px 16px 10px; }
      .brand .lg { background:${C.yellow}; color:#141413; font-weight:800; font-size:13px; padding:3px 8px; border-radius:5px; letter-spacing:.04em; }
      .brand .ad { font-size:11px; color:${C.faint}; }
      .board { margin:0 12px 12px; background:#0d0d0c; border:1px solid ${C.border}; border-radius:12px; overflow:hidden; }
      .fr { display:grid; grid-template-columns:1fr auto; align-items:center; gap:4px 12px; padding:12px 14px; cursor:pointer; border-top:1px solid #1f1e1c; }
      .fr:first-child { border-top:none; }
      .fr:hover { background:rgba(255,255,255,.02); }
      .fn { font-size:12px; color:${C.muted}; display:flex; align-items:center; gap:8px; }
      .fn .best { font-size:9.5px; color:#141413; background:${C.green}; padding:1px 6px; border-radius:4px; font-weight:700; letter-spacing:.04em; }
      .pr { font-size:34px; font-weight:600; color:${C.yellow}; font-variant-numeric:tabular-nums; letter-spacing:.02em; text-shadow:0 0 18px rgba(230,180,80,.25); line-height:1; }
      .pr sup { font-size:.5em; vertical-align:.85em; margin-left:1px; }
      .pv { text-align:right; }
      .fr > .gr { grid-column:1 / -1; }
      .pv small { display:block; font-size:10.5px; color:${C.faint}; margin-top:4px; }
      .sk { height:26px; } .sk svg { width:100%; height:26px; display:block; }
      .tr { font-size:10.5px; color:${C.faint}; }
      .up { color:${C.red}; } .dn { color:${C.green}; }
      .op { font-size:11px; white-space:nowrap; } .op.y { color:${C.green}; } .op.n { color:${C.faint}; }
      .stale .pr { color:${C.muted}; text-shadow:none; }
      .ft { font-size:10.5px; color:${C.faint}; padding:0 16px 12px; display:flex; justify-content:space-between; }
    </style>
    <ha-card>
      <div class="hd"><span class="t"><b>⛽</b>${esc(c.title || "Tankstelle")}</span></div>
      <div class="brand"><span class="lg">${esc(c.brand || "JET")}</span><span class="ad">${esc(c.address || "")}</span><span class="sp" style="flex:1"></span>${isOpen === null ? "" : `<span class="op ${isOpen ? "y" : "n"}">${isOpen ? "● geöffnet" : "● geschlossen"}</span>`}</div>
      <div class="board">${rows.map((r) => `<div class="fr ${r.stale ? "stale" : ""}" data-e="${r.entity}">
        <div class="fn">${esc(r.name)}</div>
        <div class="pv">${big(r.v)}<small>${r.stale ? "zuletzt · " : ""}€/l</small></div>
        <div class="gr"><div class="sk">${this._spark(r.pts, r.v)}</div>
        <div class="tr">${pts24(r)}: ${fmt(r.min, 3)} – ${fmt(r.max, 3)} ${!isNaN(r.diff) && Math.abs(r.diff) >= 0.001 ? `· <span class="${r.diff > 0 ? "up" : "dn"}">${r.diff > 0 ? "▲" : "▼"} ${fmt(Math.abs(r.diff * 100), 1)} ct</span>` : "· unverändert"}</div></div>
      </div>`).join("")}</div>
      <div class="ft"><span>${upd ? `aktualisiert ${relTime(new Date(upd))}` : ""}</span><span>Tankerkönig</span></div>
    </ha-card>`;
    this.shadowRoot.querySelectorAll("[data-e]").forEach((el) => (el.onclick = () => moreInfo(this, el.dataset.e)));
  }
}

const CARDS = [
  ["cc-radio-card", CCRadioCard, "CC Radio", "Livestream im Browser oder auf Echo"],
  ["cc-fuel-card", CCFuelCard, "CC Tankstelle", "Spritpreise als Preistafel"],
  ["cc-greeting-card", CCGreetingCard, "CC Begrüßung", "Kreative Begrüßung mit Status-Zeile"],
  ["cc-news-card", CCNewsCard, "CC Nachrichten", "Tagesschau-Newsfeed mit Rubriken"],
  ["cc-waste-card", CCWasteCard, "CC Abfuhr", "Abfall-Termine sortiert"],
  ["cc-energy-card", CCEnergyCard, "CC Energie", "PV, Speicher, Haus, Vergütung, Amortisation"],
  ["cc-climate-card", CCClimateCard, "CC Heizung", "Alle Räume kompakt"],
  ["cc-list-card", CCListCard, "CC Liste", "Werte-Liste im Terminal-Stil"],
  ["cc-header-card", CCHeaderCard, "CC Kopfzeile", "Seitentitel im Terminal-Stil"],
];
window.customCards = window.customCards || [];
for (const [tag, cls, name, description] of CARDS) {
  if (!customElements.get(tag)) customElements.define(tag, cls);
  window.customCards.push({ type: tag, name, description });
}
console.info(`%c✻ EMBER CARDS %c v${CC_VERSION}`, `color:${C.accent};font-weight:bold`, "color:inherit");
