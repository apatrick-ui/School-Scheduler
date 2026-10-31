/*
  School Schedule
  ===============
  The static page loads styles.css and app.js without a build step.
  The app is organized around one settings object: storage loads it,
  controls edit it, and tick() derives the live dashboard from it.
*/
// ---- Defaults and supported appearance options ----
const DEFAULTS = {
  sets: [{ id: "set1", name: "My week" }],
  schedules: [{
    id: "s1", setId: "set1", name: "Regular day", days: [1, 2, 3, 4, 5],   // 0 = Sunday ... 6 = Saturday
    passing: 5,                                              // minutes between classes, used when adding a period
    periods: [
      { name: "Period 1", start: "08:00", end: "08:50", teacher: "", room: "" },
      { name: "Period 2", start: "08:55", end: "09:45", teacher: "", room: "" },
      { name: "Period 3", start: "09:50", end: "10:40", teacher: "", room: "" },
      { name: "Period 4", start: "10:45", end: "11:35", teacher: "", room: "" },
      { name: "Lunch",    start: "11:35", end: "12:10", teacher: "", room: "" },
      { name: "Period 5", start: "12:15", end: "13:05", teacher: "", room: "" },
      { name: "Period 6", start: "13:10", end: "14:00", teacher: "", room: "" },
      { name: "Period 7", start: "14:05", end: "14:55", teacher: "", room: "" }
    ]
  }],
  editing: "s1", editingSetId: "set1", activeSetId: "set1", compareSetId: "",
  override: null,   // { date, id }: use a different schedule for one day
  adjust: null,     // { date, shift, endAt }: late start / early release for one day
  theme: { preset: "auto", autoLight: "paper", autoDark: "midnight",
           mode: "system",
           custom: { bg: "#eef1f4", card: "#ffffff", ink: "#14213d", hi: "#ffd23f", bar: "#14213d", warn: "#c2410c", go: "#0b8a74", gold: "#d99a00", danger: "#d62828", glow: "#ffd23f" } },
  use24: false, seconds: true, size: "normal", showPassing: true, effects: true,
  font: "rounded", corners: "normal", ring: "normal", bgStyle: "glow", showNote: true, showPercent: true, showNumDate: true,
  alert: { on: true, mins: 5, sound: false }
};
// Complete palettes used by the theme cards. Semantic colors (warning, danger,
// passing and completion) stay distinct from the user-selected accent.
const PRESETS = {
  paper:     { label: "Paper", bg: "#eef1f4", card: "#ffffff", ink: "#14213d", hi: "#ffd23f", bar: "#14213d", warn: "#c2410c", go: "#0b8a74", gold: "#d99a00", danger: "#d62828", glow: "#ffd23f" },
  midnight:  { label: "Midnight", bg: "#10151f", card: "#18202e", ink: "#e8ecf3", hi: "#ffd23f", bar: "#ffd23f", warn: "#ff8a4c", go: "#3ddbc0", gold: "#ffd23f", danger: "#ff6b6b", glow: "#ffd23f" },
  forest:    { label: "Forest", bg: "#e9f0e6", card: "#f8fbf6", ink: "#1e3a2b", hi: "#9be564", bar: "#2f6b47", warn: "#c2410c", go: "#0e7490", gold: "#b7791f", danger: "#b91c1c", glow: "#9be564" },
  sunset:    { label: "Sunset", bg: "#fff1e6", card: "#fffaf5", ink: "#4a1f2e", hi: "#ff8a5b", bar: "#b83a5a", warn: "#c2410c", go: "#0f766e", gold: "#b45309", danger: "#be123c", glow: "#ff8a5b" },
  ocean:     { label: "Ocean", bg: "#e4f1f7", card: "#f6fbfd", ink: "#0b3a52", hi: "#5cc8f2", bar: "#0f6b94", warn: "#c2410c", go: "#0d9488", gold: "#ca8a04", danger: "#c92a2a", glow: "#5cc8f2" },
  grape:     { label: "Grape", bg: "#1b1328", card: "#261a38", ink: "#efe6ff", hi: "#c792ff", bar: "#c792ff", warn: "#ffa94d", go: "#5eead4", gold: "#ffd866", danger: "#ff6b8b", glow: "#c792ff" },
  ember:     { label: "Ember", bg: "#1a1210", card: "#261a16", ink: "#f6e9e1", hi: "#ff7a45", bar: "#ff7a45", warn: "#ffb347", go: "#4fd1c5", gold: "#ffd23f", danger: "#ff5252", glow: "#ff7a45" },
  slate:     { label: "Slate", bg: "#1e2530", card: "#2a3441", ink: "#e6edf5", hi: "#7aa2f7", bar: "#7aa2f7", warn: "#f0a35e", go: "#4fd6be", gold: "#e5c07b", danger: "#f7768e", glow: "#7aa2f7" },
  sand:      { label: "Sand", bg: "#f3ece0", card: "#fbf7ef", ink: "#3b2f22", hi: "#e3b04b", bar: "#8a5a2b", warn: "#b8470a", go: "#2f7d6d", gold: "#b8860b", danger: "#b3261e", glow: "#e3b04b" },
  rose:      { label: "Rose", bg: "#fbeff2", card: "#fffafb", ink: "#4a1d2c", hi: "#f78fb3", bar: "#c2185b", warn: "#c2410c", go: "#00897b", gold: "#b7791f", danger: "#c62828", glow: "#f78fb3" },
  neon:      { label: "Neon", bg: "#0b0b14", card: "#14142a", ink: "#eaeaff", hi: "#00f0ff", bar: "#00f0ff", warn: "#ffb800", go: "#39ff88", gold: "#fff200", danger: "#ff2e63", glow: "#00f0ff" },
  terminal:  { label: "Terminal", bg: "#07110a", card: "#0d1b11", ink: "#c8ffd4", hi: "#39ff14", bar: "#39ff14", warn: "#ffb000", go: "#00e5ff", gold: "#f5e642", danger: "#ff4d4d", glow: "#39ff14" },
  mono:      { label: "Mono", bg: "#ffffff", card: "#f2f2f2", ink: "#111111", hi: "#111111", bar: "#111111", warn: "#8a4b00", go: "#005f56", gold: "#6b5200", danger: "#b00020", glow: "#9a9a9a" },
  candy:     { label: "Candy", bg: "#fdf0fa", card: "#ffffff", ink: "#3d1f4d", hi: "#ffb3e6", bar: "#7c3aed", warn: "#c2410c", go: "#0ea5a4", gold: "#b8860b", danger: "#dc2626", glow: "#ff9de0" },
  coffee:    { label: "Coffee", bg: "#1c1410", card: "#2a1f19", ink: "#f1e4d6", hi: "#d6a56a", bar: "#d6a56a", warn: "#ff9f43", go: "#6fd6c4", gold: "#f2c14e", danger: "#ff6b5e", glow: "#d6a56a" },
  arctic:    { label: "Arctic", bg: "#eaf4fb", card: "#ffffff", ink: "#12344d", hi: "#8fd3ff", bar: "#1d6fa5", warn: "#c2410c", go: "#0b9488", gold: "#c28a00", danger: "#c92a2a", glow: "#8fd3ff" }
};
// These keys must match the CSS custom properties and the color input IDs.
const COLORS = [["bg", "Background"], ["card", "Cards"], ["ink", "Text"], ["hi", "Current class"], ["bar", "Progress ring"],
  ["warn", "Heads-up"], ["go", "Passing time"], ["gold", "Last class and done"], ["danger", "Final minute"], ["glow", "Glow"]];
const FONTS = {
  rounded: { label: "Rounded", stack: 'ui-rounded,"SF Pro Rounded","Nunito","Avenir Next","Segoe UI",system-ui,sans-serif' },
  clean:   { label: "Clean",   stack: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif' },
  serif:   { label: "Serif",   stack: '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif' },
  mono:    { label: "Mono",    stack: 'ui-monospace,"SF Mono",Menlo,Consolas,monospace' }
};
const CORNERS = { sharp: ["4px", "3px", "4px"], normal: ["20px", "10px", "12px"], round: ["30px", "18px", "20px"] };
const RINGS = { thin: 8, normal: 12, thick: 18 };
const BGS = ["glow", "flat", "gradient"];
const SIZES = { small: "14px", normal: "16px", large: "19px" };
const DAYNAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ALERT_MINS = [1, 2, 3, 5, 10];
const KEY = "schoolSchedule.v3";
const RING = 552.92;

// Small DOM helpers keep the UI-building code concise and consistent.
const $ = id => document.getElementById(id);
const clone = o => JSON.parse(JSON.stringify(o));
const pad = n => String(n).padStart(2, "0");
const mk = (tag, props = {}, ...kids) => { const e = document.createElement(tag); Object.assign(e, props); e.append(...kids); return e; };
const newId = (prefix = "s") => prefix + Date.now().toString(36) + Math.floor(Math.random() * 1000);
// Local date keys deliberately use local calendar parts; school schedules are
// interpreted in the student's device timezone, not UTC.
const dayKey = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());

// ---- Schedule parsing, validation, and display helpers ----
// Times are stored as seconds since midnight while calculations run, then
// formatted only at the UI boundary. Invalid user-entered times return null.
const toSec = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ""); return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 3600 + +m[2] * 60 : null; };
const fromSec = s => pad(Math.floor(s / 3600) % 24) + ":" + pad(Math.floor(s % 3600 / 60));
const roomTxt = r => /\d/.test(r) && /^\S{1,6}$/.test(r) ? "Room " + r : r;
const detail = p => p ? [p.teacher, p.room ? roomTxt(p.room) : ""].filter(Boolean).join(", ") : "";
const head = p => { const d = detail(p); return d ? "Head to " + d : ""; };

function check(periods) {
  // Normalize imported and edited entries to one internal shape before use.
  // Reject overlaps here so every caller (editor, import, and runtime) agrees
  // on which schedules are safe to display.
  const list = [];
  for (const p of periods) {
    const kind = p.kind === "passing" ? "passing" : "class";
    const a = toSec(p.start), b = toSec(p.end), name = (p.name || "").trim() || (kind === "passing" ? "Passing time" : "Untitled");
    if (a == null || b == null) return { ok: false, msg: "Set a start and end time for every period." };
    if (b <= a) return { ok: false, msg: name + ": the end time must be after the start time." };
    list.push({ name, start: a, end: b, teacher: (p.teacher || "").trim(), room: (p.room || "").trim(), note: (p.note || "").trim(), kind });
  }
  if (!list.length) return { ok: false, msg: "Add at least one class." };
  if (!list.some(p => p.kind !== "passing")) return { ok: false, msg: "Add at least one class, not just passing periods." };
  list.sort((x, y) => x.start - y.start);
  for (let i = 1; i < list.length; i++)
    if (list[i].start < list[i - 1].end) return { ok: false, msg: list[i - 1].name + " and " + list[i].name + " overlap." };
  return { ok: true, list };
}

// Today-only changes: shift every period, and/or cut the day off at a set time
function applyAdjust(list, d) {
  // One-day overrides are kept separate from the saved weekly schedule.
  // Shifting happens before an optional early-release cutoff is applied.
  const a = settings.adjust;
  if (!a || a.date !== dayKey(d)) return { list, adjusted: false };
  let out = list.map(p => ({ ...p, start: p.start + a.shift * 60, end: p.end + a.shift * 60 }));
  const cut = toSec(a.endAt);
  if (cut != null) out = out.filter(p => p.start < cut).map(p => ({ ...p, end: Math.min(p.end, cut) }));
  return { list: out, adjusted: a.shift !== 0 || cut != null };
}

// ---- Stored state and migration ----
// Local storage and share links are untrusted input. These cleaners bound text,
// validate identifiers and times, and restore missing values from DEFAULTS.
function cleanSchedules(arr) {
  if (!Array.isArray(arr)) return [];
  const ids = new Set();
  const list = arr.filter(x => x && Array.isArray(x.periods) && check(x.periods).ok).map(x => {
    const id = typeof x.id === "string" && x.id && !ids.has(x.id) ? x.id : newId(); ids.add(id);
    return {
      id, name: String(x.name || "Schedule").slice(0, 40),
      setId: typeof x.setId === "string" ? x.setId : "",
      passing: Number.isInteger(x.passing) && x.passing >= 0 && x.passing <= 30 ? x.passing : 5,
      days: (Array.isArray(x.days) ? x.days : []).filter(n => Number.isInteger(n) && n >= 0 && n <= 6),
      periods: x.periods.map(p => ({
        name: String(p.name || "").slice(0, 40), start: p.start, end: p.end,
        teacher: String(p.teacher || "").slice(0, 40), room: String(p.room || "").slice(0, 20),
        note: String(p.note || "").slice(0, 120), kind: p.kind === "passing" ? "passing" : "class"
      })).sort((a, b) => (toSec(a.start) == null ? 1e9 : toSec(a.start)) - (toSec(b.start) == null ? 1e9 : toSec(b.start)))
    };
  });
  // Schedules may share weekdays. Keep each schedule's valid day assignment
  // intact so students can compare multiple plans for the same day.
  return list;
}
function cleanSets(arr) {
  if (!Array.isArray(arr) || !arr.length) return clone(DEFAULTS.sets);
  const ids = new Set();
  const sets = arr.filter(item => item && typeof item === "object").map(item => {
    const id = typeof item.id === "string" && item.id && !ids.has(item.id) ? item.id : newId("set");
    ids.add(id);
    return { id, name: String(item.name || "Schedule group").trim().slice(0, 40) || "Schedule group" };
  });
  return sets.length ? sets : clone(DEFAULTS.sets);
}
function sanitize(o) {
  // Rebuild rather than mutate the input so obsolete or malformed properties
  // cannot silently leak into the live settings object.
  const s = clone(DEFAULTS);
  s.sets = cleanSets(o.sets);
  const validSetIds = new Set(s.sets.map(item => item.id));
  const sch = cleanSchedules(o.schedules);
  if (sch.length) s.schedules = sch.map(item => ({ ...item, setId: validSetIds.has(item.setId) ? item.setId : s.sets[0].id }));
  else s.schedules = clone(DEFAULTS.schedules).map(item => ({ ...item, setId: s.sets[0].id }));
  for (const set of s.sets) if (!s.schedules.some(item => item.setId === set.id)) {
    const seed = clone(s.schedules[0] || DEFAULTS.schedules[0]);
    s.schedules.push({ ...seed, id: newId(), setId: set.id, name: "Regular day", days: [] });
  }
  if (o.theme) {
    const t = o.theme.preset;
    if (t === "auto" || t === "custom" || PRESETS[t]) s.theme.preset = t;
    if (["system", "light", "dark"].includes(o.theme.mode)) s.theme.mode = o.theme.mode;
    if (PRESETS[o.theme.autoLight]) s.theme.autoLight = o.theme.autoLight;
    if (PRESETS[o.theme.autoDark]) s.theme.autoDark = o.theme.autoDark;
    for (const [k] of COLORS) if (o.theme.custom && /^#[0-9a-f]{6}$/i.test(o.theme.custom[k])) s.theme.custom[k] = o.theme.custom[k].toLowerCase();
  }
  if (typeof o.use24 === "boolean") s.use24 = o.use24;
  if (typeof o.seconds === "boolean") s.seconds = o.seconds;
  if (typeof o.showPassing === "boolean") s.showPassing = o.showPassing;
  if (typeof o.effects === "boolean") s.effects = o.effects;
  if (FONTS[o.font]) s.font = o.font;
  if (CORNERS[o.corners]) s.corners = o.corners;
  if (RINGS[o.ring]) s.ring = o.ring;
  if (BGS.includes(o.bgStyle)) s.bgStyle = o.bgStyle;
  for (const k of ["showNote", "showPercent", "showNumDate"]) if (typeof o[k] === "boolean") s[k] = o[k];
  if (SIZES[o.size]) s.size = o.size;
  if (o.alert && typeof o.alert === "object") {
    if (typeof o.alert.on === "boolean") s.alert.on = o.alert.on;
    if (ALERT_MINS.includes(o.alert.mins)) s.alert.mins = o.alert.mins;
    if (typeof o.alert.sound === "boolean") s.alert.sound = o.alert.sound;
  }
  s.editingSetId = validSetIds.has(o.editingSetId) ? o.editingSetId : s.sets[0].id;
  s.activeSetId = validSetIds.has(o.activeSetId) ? o.activeSetId : s.sets[0].id;
  s.compareSetId = validSetIds.has(o.compareSetId) && o.compareSetId !== s.activeSetId ? o.compareSetId : "";
  const editSetSchedule = s.schedules.find(x => x.setId === s.editingSetId) || s.schedules[0];
  s.editing = s.schedules.some(x => x.id === o.editing && x.setId === s.editingSetId) ? o.editing : editSetSchedule.id;
  if (o.override && typeof o.override.date === "string" && s.schedules.some(x => x.id === o.override.id)) s.override = { date: o.override.date, id: o.override.id };
  if (o.adjust && typeof o.adjust.date === "string") {
    let sh = Math.round(Number(o.adjust.shift)); if (!Number.isFinite(sh)) sh = 0;
    sh = Math.max(-180, Math.min(300, sh));
    const ea = toSec(o.adjust.endAt) != null ? o.adjust.endAt : "";
    if (sh || ea) s.adjust = { date: o.adjust.date, shift: sh, endAt: ea };
  }
  return s;
}
function load() {
  // v2 was a single-schedule format. Migrate it once when no v3 data exists;
  // storage failures should never prevent the dashboard from opening.
  try {
    let o = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!o) { // bring over a single schedule saved by an older version
      const old = JSON.parse(localStorage.getItem("schoolSchedule.v2") || "null");
      if (old && Array.isArray(old.periods) && check(old.periods).ok)
        o = { schedules: [{ id: "s1", name: "Regular day", days: Array.isArray(old.days) ? old.days : [1, 2, 3, 4, 5], periods: old.periods }],
              theme: old.theme, use24: old.use24, seconds: old.seconds, size: old.size };
    }
    if (o) return sanitize(o);
  } catch (e) {}
  return clone(DEFAULTS);
}
let settings = load();
// Dashboard selection is session-only: all schedules remain saved, while the
// student chooses which one to inspect in the main countdown.
let viewScheduleId = null;
let compareViewScheduleId = null;
let lastKey = "", lastListKey = "";
// Persistence is best-effort: private browsing or quota restrictions must not
// make normal in-memory editing fail.
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) {} };
const editingSet = () => settings.sets.find(set => set.id === settings.editingSetId) || settings.sets[0];
const setLabel = set => {
  const name = set.name || "Schedule group";
  const sameName = settings.sets.filter(item => item.name.toLowerCase() === name.toLowerCase());
  return sameName.length > 1 && sameName.includes(set) ? name + " (" + (sameName.indexOf(set) + 1) + ")" : name;
};
const schedulesInSet = (setId = settings.editingSetId) => settings.schedules.filter(s => s.setId === setId);
const ed = () => settings.schedules.find(s => s.id === settings.editing && s.setId === settings.editingSetId);
const label = s => {
  const name = s.name || "Untitled";
  const matches = settings.schedules.filter(item => (item.name || "Untitled").toLowerCase() === name.toLowerCase());
  return matches.length > 1 && matches.includes(s) ? name + " (" + (matches.indexOf(s) + 1) + ")" : name;
};

function activeSchedule(d) {
  // A dashboard preview and one-day override are only meaningful inside the
  // selected set; otherwise use that set's first schedule assigned to today.
  const o = settings.override;
  const override = o && o.date === dayKey(d) ? settings.schedules.find(x => x.id === o.id && x.setId === settings.activeSetId) : null;
  const selected = settings.schedules.find(x => x.id === viewScheduleId && x.setId === settings.activeSetId);
  const sc = selected || override || schedulesForDay(d, settings.activeSetId)[0] || null;
  return { sc, forced: Boolean(override && sc.id === override.id) };
}

// Schedules assigned to a weekday appear together in previews and set
// comparisons. More than one schedule may be assigned to any weekday.
function schedulesForDay(d, setId = settings.activeSetId) { return settings.schedules.filter(sc => sc.setId === setId && sc.days.includes(d.getDay())); }

let dashboardDateKey = "";
function buildDashboardControls() {
  const today = new Date(), todayKey = dayKey(today);
  if (!settings.sets.some(set => set.id === settings.activeSetId)) settings.activeSetId = settings.sets[0].id;
  if (settings.compareSetId === settings.activeSetId || !settings.sets.some(set => set.id === settings.compareSetId)) settings.compareSetId = "";
  $("dashboardGroupControls").hidden = settings.sets.length < 2;

  const activeSelect = $("activeSetSelect"), compareSelect = $("compareSetSelect");
  activeSelect.textContent = "";
  settings.sets.forEach(set => activeSelect.append(mk("option", { value: set.id, textContent: setLabel(set) })));
  activeSelect.value = settings.activeSetId;
  compareSelect.textContent = "";
  compareSelect.append(mk("option", { value: "", textContent: "Don’t compare" }));
  settings.sets.filter(set => set.id !== settings.activeSetId)
    .forEach(set => compareSelect.append(mk("option", { value: set.id, textContent: setLabel(set) })));
  compareSelect.value = settings.compareSetId;
  const activeSchedules = schedulesInSet(settings.activeSetId);
  if (dashboardDateKey && dashboardDateKey !== todayKey &&
      !schedulesForDay(today, settings.activeSetId).some(sc => sc.id === viewScheduleId)) viewScheduleId = null;
  dashboardDateKey = todayKey;
  if (!activeSchedules.some(sc => sc.id === viewScheduleId)) {
    const override = settings.override && settings.override.date === todayKey &&
      activeSchedules.some(sc => sc.id === settings.override.id) ? settings.override.id : null;
    viewScheduleId = override || (schedulesForDay(today, settings.activeSetId)[0] || activeSchedules[0] || {}).id || null;
  }
  const activeRingSelect = $("activeRingSchedule");
  activeRingSelect.textContent = "";
  activeSchedules.forEach(sc => activeRingSelect.append(mk("option", { value: sc.id, textContent: label(sc) })));
  activeRingSelect.value = viewScheduleId || "";
  activeRingSelect.onchange = e => {
    chooseComparisonSchedule(settings.activeSetId, e.target.value);
  };

  const compareSchedules = schedulesInSet(settings.compareSetId);
  const todaySchedules = schedulesForDay(today, settings.compareSetId);
  if (!compareSchedules.some(sc => sc.id === compareViewScheduleId))
    compareViewScheduleId = (todaySchedules[0] || compareSchedules[0] || {}).id || null;
  const compareRingSelect = $("compareRingSchedule");
  compareRingSelect.textContent = "";
  compareSchedules.forEach(sc => compareRingSelect.append(mk("option", { value: sc.id, textContent: label(sc) })));
  compareRingSelect.value = compareViewScheduleId || "";
  compareRingSelect.onchange = e => {
    chooseComparisonSchedule(settings.compareSetId, e.target.value);
  };

  $("compareRingPanel").hidden = !settings.compareSetId;
  $("ringPair").classList.toggle("is-comparing", Boolean(settings.compareSetId));
  $("main").dataset.comparing = String(Boolean(settings.compareSetId));
  $("hero").classList.toggle("compare-mode", Boolean(settings.compareSetId));
  $("activeRingLabel").textContent = setLabel(settings.sets.find(set => set.id === settings.activeSetId));
  $("compareRingLabel").textContent = settings.sets.find(set => set.id === settings.compareSetId)
    ? setLabel(settings.sets.find(set => set.id === settings.compareSetId)) : "Compared group";
}
// Give ring content a quick, calm fade when the selected timetable changes.
// The progress stroke already has its own transition; this adds motion to the
// text as well without forcing users who request reduced motion to see it.
function animateRingChange(select) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const center = select.closest(".ring-panel")?.querySelector(".center");
  if (center && typeof center.animate === "function") center.animate(
    [{ opacity: .55, transform: "translateY(5px) scale(.985)" }, { opacity: 1, transform: "translateY(0) scale(1)" }],
    { duration: 260, easing: "cubic-bezier(.2,.7,.2,1)" });
}
function syncEditorScheduleToDashboard(schedule) {
  if (!schedule) return;
  const today = new Date();
  ensureComparisonDay(today);
  if (schedule.setId === settings.activeSetId) {
    viewScheduleId = schedule.id;
    animateRingChange($("activeRingSchedule"));
  }
  if (schedule.setId === settings.compareSetId) {
    compareViewScheduleId = schedule.id;
    animateRingChange($("compareRingSchedule"));
  }
  if (schedule.days.length && !schedule.days.includes(comparisonDayIndex)) {
    comparisonDayIndex = schedule.days.includes(today.getDay()) ? today.getDay() : schedule.days[0];
    syncComparisonRingSelections(today, schedule.setId);
  }
}
function setDashboardSet(id) {
  if (!settings.sets.some(set => set.id === id)) return;
  settings.activeSetId = id;
  if (settings.compareSetId === id) settings.compareSetId = "";
  viewScheduleId = null;
  comparisonDayIndex = new Date().getDay();
  comparisonDateKey = dayKey(new Date());
  buildDashboardControls();
  save(); lastKey = ""; tick();
}
$("activeSetSelect").onchange = e => setDashboardSet(e.target.value);
$("compareSetSelect").onchange = e => {
  settings.compareSetId = e.target.value;
  compareViewScheduleId = null;
  const today = new Date();
  ensureComparisonDay(today);
  save(); comparisonRenderKey = ""; buildDashboardControls();
  syncComparisonRingSelections(today);
  tick();
};

// ---- Theme resolution and application ----
// Presets provide accents; appearance mode supplies the neutral light/dark
// surfaces. This separation lets every palette support both appearances.
function resolved() {
  // Auto picks its configured palette from the operating-system preference;
  // the separate mode setting controls whether neutral surfaces are light/dark.
  const t = settings.theme;
  let c = t.preset === "custom" ? t.custom : t.preset === "auto"
    ? PRESETS[matchMedia("(prefers-color-scheme: dark)").matches ? t.autoDark : t.autoLight]
    : PRESETS[t.preset];
  const dark = t.mode === "dark" || (t.mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  const neutral = dark ? ["#10151f", "#18202e"] : ["#f4f6f8", "#ffffff"];
  // Carry the selected palette into the page surfaces in both appearance
  // modes. If a palette background clashes with the chosen mode, its accent
  // supplies the hue instead, keeping light themes light and dark themes dark.
  const surfaceHue = dark ? (lum(c.bg) < 0.34 ? c.bg : c.bar) : (lum(c.bg) > 0.72 ? c.bg : c.hi);
  const cardHue = dark ? (lum(c.card) < 0.38 ? c.card : surfaceHue) : (lum(c.card) > 0.72 ? c.card : surfaceHue);
  const surfaces = [mixHex(neutral[0], surfaceHue, 0.34), mixHex(neutral[1], cardHue, 0.13)];
  return { ...c, bg: surfaces[0], card: surfaces[1], ink: bestTextColor(c.ink, surfaces) };
}
function lum(hex) {
  // Convert sRGB channels to relative luminance for contrast decisions below.
  const c = [1, 3, 5].map(i => { const v = parseInt(hex.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function mixHex(base, tint, amount) {
  const channels = [1, 3, 5].map(i => Math.round(
    parseInt(base.slice(i, i + 2), 16) * (1 - amount) + parseInt(tint.slice(i, i + 2), 16) * amount
  ));
  return "#" + channels.map(value => value.toString(16).padStart(2, "0")).join("");
}
function autoChip() {
  const L = PRESETS[settings.theme.autoLight], D = PRESETS[settings.theme.autoDark];
  return "linear-gradient(90deg," + L.bg + " 25%," + L.hi + " 25% 50%," + D.bg + " 50% 75%," + D.hi + " 75%)";
}
// Check the chosen ink against both large neutral surfaces. If a palette's ink
// misses WCAG AA's 4.5:1 text target, select the best of its own ink, near-black,
// or white. This keeps custom palettes legible without changing their accents.
function bestTextColor(preferred, surfaces) {
  return [preferred, "#111111", "#ffffff"].reduce((best, candidate) => {
    const score = Math.min(...surfaces.map(surface => ratio(candidate, surface)));
    const bestScore = Math.min(...surfaces.map(surface => ratio(best, surface)));
    return score > bestScore ? candidate : best;
  });
}
function buildPresets() {
  // Recreate the swatch cards from settings so the selected card and previews
  // always reflect the current palette, including custom colors.
  const box = $("presets"); box.textContent = "";
  const items = [["auto", "Automatic"], ...Object.keys(PRESETS).map(k => [k, PRESETS[k].label]), ["custom", "Custom"]];
  for (const [k, name] of items) {
    const c = k === "auto" ? null : k === "custom" ? settings.theme.custom : PRESETS[k];
    const colors = c || PRESETS[settings.theme.autoLight];
    const preview = mk("span", { className: "theme-preview" });
    preview.style.background = colors.bg;
    preview.append(mk("i"), mk("i"), mk("i"));
    preview.children[0].style.background = colors.card;
    preview.children[1].style.background = colors.hi;
    preview.children[2].style.background = colors.bar;
    if (k === "auto") preview.style.background = autoChip();
    const b = mk("button", { type: "button", className: "theme-card" }, preview, mk("strong", { textContent: name }));
    b.setAttribute("aria-pressed", String(settings.theme.preset === k));
    b.onclick = () => { settings.theme.preset = k; save(); applyTheme(); };
    box.append(b);
  }
  $("contrastStatus").textContent = "Text colors adjust automatically to stay readable.";
  $("appearance").querySelectorAll("[data-mode]").forEach(b => b.setAttribute("aria-pressed", String(settings.theme.mode === b.dataset.mode)));
}
// Text drawn on top of a palette color uses whichever palette color reads best on it
function ratio(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function pickOn(color, c) {
  // Include dark/light endpoints so colored badges and selected controls get
  // the strongest available foreground even for unusually bright accents.
  return [c.ink, c.card, c.bg, "#111111", "#ffffff"].reduce((best, t) => ratio(color, t) > ratio(color, best) ? t : best);
}
function applyTheme() {
  // Resolve contrast-aware text colors before applying the palette. The page's
  // semantic variables remain centralized in CSS rather than inline styles.
  const c = resolved(), r = document.documentElement.style;
  for (const [k] of COLORS) r.setProperty("--" + k, c[k]);
  r.setProperty("--hi-ink", pickOn(c.hi, c));
  r.setProperty("--on-warn", pickOn(c.warn, c));
  r.setProperty("--on-danger", pickOn(c.danger, c));
  r.setProperty("--scrim", lum(c.ink) < lum(c.bg) ? c.ink : c.bg);
  r.colorScheme = lum(c.bg) < 0.3 ? "dark" : "light";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", c.bg);
  buildPresets();
  for (const [k] of COLORS) { const i = $("c_" + k); if (i && i.value !== c[k]) i.value = c[k]; }
}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  // Re-resolve when the OS appearance changes, but preserve explicit user mode.
  if (settings.theme.mode === "system" || settings.theme.preset === "auto") applyTheme();
});
$("appearance").addEventListener("click", e => {
  const b = e.target.closest("[data-mode]");
  if (!b) return;
  settings.theme.mode = b.dataset.mode; save(); applyTheme();
});

// ---- Display preferences and time formatting ----
function applyLook() {
  // Convert saved display choices into CSS variables and root state flags.
  const root = document.documentElement, st = root.style;
  st.fontSize = SIZES[settings.size];
  st.setProperty("--font", FONTS[settings.font].stack);
  const [rc, rm, rs] = CORNERS[settings.corners];
  st.setProperty("--rc", rc); st.setProperty("--rm", rm); st.setProperty("--rs", rs);
  st.setProperty("--ringw", RINGS[settings.ring]);
  root.dataset.bg = settings.bgStyle;
  root.dataset.note = settings.showNote ? "on" : "off";
  root.dataset.pct = settings.showPercent ? "on" : "off";
  root.dataset.numdate = settings.showNumDate ? "on" : "off";
}
function applyDisplay() {
  applyLook();
  lastKey = ""; tick();
}
function fmtClock(s) {
  // Schedule times have no date component; formatting uses the selected 12/24h
  // preference and the same helper is used for all periods and countdown labels.
  const h = Math.floor(s / 3600) % 24, m = Math.floor(s % 3600 / 60);
  if (settings.use24) return pad(h) + ":" + pad(m);
  return ((h + 11) % 12 + 1) + ":" + pad(m) + (h < 12 ? " AM" : " PM");
}
function fmtNow(d) {
  const h = d.getHours(), m = pad(d.getMinutes()), s = settings.seconds ? ":" + pad(d.getSeconds()) : "";
  return settings.use24 ? pad(h) + ":" + m + s : ((h + 11) % 12 + 1) + ":" + m + s + (h < 12 ? " AM" : " PM");
}
const countdown = s => {
  // Ceil prevents the display from showing zero a fraction of a second early.
  s = Math.max(0, Math.ceil(s));
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
  return h ? h + ":" + pad(m) + ":" + pad(sec) : pad(m) + ":" + pad(sec);
};
const words = s => {
  s = Math.max(0, Math.round(s / 60));
  const h = Math.floor(s / 60), m = s % 60;
  return h ? h + " hr " + m + " min" : m + " min";
};

// ---- Sound, alerts, and celebration effects ----
// Audio is created only after a user gesture because browsers block autoplay.
let ac = null;
function audio() {
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); } catch (e) {}
  return ac;
}
function beep(times, freq) {
  // Build short oscillator tones directly with Web Audio; no audio asset is
  // required, and each repeated tone begins after the previous one ends.
  const c = audio(); if (!c) return;
  let t = c.currentTime;
  for (let i = 0; i < times; i++) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + 0.3);
    t += 0.38;
  }
}
const bell = () => beep(3, 660);
function flashHero() {
  // Restart the CSS animation by removing and re-adding its class in one frame.
  const h = $("hero");
  h.classList.remove("flash"); void h.offsetWidth; h.classList.add("flash");
}
function fireAlert() { flashHero(); if (settings.alert.sound) beep(2, 880); }
function confetti() {
  // Confetti is decorative only and is skipped by tick() for reduced-motion
  // users. Its container is cleared after the longest piece has fallen.
  const box = $("confetti"); box.textContent = "";
  const cols = ["--hi", "--bar", "--warn", "--go", "--gold", "--danger", "--glow"];
  for (let i = 0; i < 34; i++) {
    const c = mk("span");
    c.style.left = Math.random() * 100 + "%";
    c.style.background = "var(" + cols[i % cols.length] + ")";
    c.style.setProperty("--dx", (Math.random() * 120 - 60) + "px");
    c.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
    c.style.animationDelay = Math.random() * 0.8 + "s";
    c.style.animationDuration = (2.4 + Math.random() * 1.6) + "s";
    box.append(c);
  }
  setTimeout(() => { box.textContent = ""; }, 6000);
}
$("hero").addEventListener("animationend", e => { if (e.animationName === "flash") e.currentTarget.classList.remove("flash"); });
// Browsers only let a page make sound after a tap, so unlock audio on the first one
addEventListener("pointerdown", () => audio(), { once: true });
addEventListener("keydown", () => audio(), { once: true });

// ---- Dashboard rendering ----
function renderList(daySchedules, d, now) {
  // Render every schedule assigned to today as its own clearly labeled group.
  // The ring can still preview one schedule; the day list should not hide the
  // other schedules merely because a single ring preview is selected.
  const ol = $("list"); ol.textContent = "";
  if (!daySchedules.length) {
    ol.append(mk("li", { className: "empty", textContent: "Nothing is scheduled for today. You can add a schedule in Settings." }));
    return;
  }
  const span = (a, b) => fmtClock(a) + " – " + fmtClock(b);
  daySchedules.forEach(schedule => {
    const checked = check(schedule.periods);
    const adjusted = checked.ok ? applyAdjust(checked.list, d).list : null;
    const periods = adjusted && adjusted.length ? adjusted : null;
    if (daySchedules.length > 1) {
      ol.append(mk("li", { className: "schedule-heading", textContent: schedule.name || "Untitled schedule" }));
    }
    if (!periods) {
      ol.append(mk("li", { className: "empty", textContent: checked.ok ? "No classes in this schedule." : "This schedule needs attention: " + checked.msg }));
      return;
    }
    const current = periods.findIndex(period => now >= period.start && now < period.end);
    periods.forEach((p, i) => {
      const prev = periods[i - 1];
      // A gap with no explicit passing entry is still useful to show as passing.
      if (settings.showPassing && prev && p.start > prev.end) {
        const mins = Math.round((p.start - prev.end) / 60), isCur = now >= prev.end && now < p.start;
        ol.append(mk("li", { className: "pass" + (isCur ? " cur" : now >= p.start ? " done" : "") },
          mk("span", { textContent: "Passing time (" + mins + " min)" }),
          mk("span", { className: "t", textContent: span(prev.end, p.start) })));
      }
      if (p.kind === "passing") {
        if (settings.showPassing) ol.append(mk("li", { className: "pass" + (i === current ? " cur" : now >= p.end ? " done" : "") },
          mk("span", { textContent: p.name + " (" + Math.round((p.end - p.start) / 60) + " min)" }),
          mk("span", { className: "t", textContent: span(p.start, p.end) })));
        return;
      }
      const left = mk("span", {}, mk("span", { className: "nm", textContent: p.name }));
      const description = detail(p);
      if (description) left.append(mk("span", { className: "dt", textContent: description }));
      ol.append(mk("li", { className: i === current ? "cur" : now >= p.end ? "done" : "" },
        left,
        mk("span", { className: "t", textContent: span(p.start, p.end) })));
    });
  });
}

let watch = null, warnedFor = null, dangerFor = null, firstTick = true, prevMode = "";
const clamp01 = x => Math.max(0, Math.min(1, x));
// Calculate the selected schedule's live class state. The same result powers
// the dashboard status and every matching row in the weekly set comparison.
function scheduleSnapshot(sc, d, now) {
  const checked = check(sc.periods);
  if (!checked.ok) return { status: "Schedule needs attention: " + checked.msg, progress: 0, count: "--:--", unit: "Needs attention" };
  const periods = applyAdjust(checked.list, d).list;
  const classes = periods.filter(period => period.kind !== "passing");
  if (!classes.length) return { status: "No classes", progress: 0, count: "--:--", unit: "No classes" };
  const current = periods.find(period => now >= period.start && now < period.end);
  const first = classes[0], last = classes[classes.length - 1];
  if (now < first.start) return { status: "Starts in " + countdown(first.start - now) + " · " + first.name, progress: 0, count: countdown(first.start - now), unit: "until first bell" };
  if (now >= last.end) return { status: "Finished for today", progress: 100, count: "00:00", unit: "School is out" };
  if (current) {
    const progress = (now - current.start) / (current.end - current.start) * 100;
    if (current.kind !== "passing") return { status: "In " + current.name + " · " + countdown(current.end - now) + " left", progress, count: countdown(current.end - now), unit: "left in " + current.name };
    const nextClass = classes.find(period => period.start >= current.end);
    return { status: "Passing · " + countdown(current.end - now) + (nextClass ? " until " + nextClass.name : " left"), progress, count: countdown(current.end - now), unit: nextClass ? "until " + nextClass.name : "passing time" };
  }
  const next = classes.find(period => period.start > now);
  const previous = [...classes].reverse().find(period => period.end <= now);
  const progress = previous && next ? (now - previous.end) / (next.start - previous.end) * 100 : 0;
  if (next) return { status: "Passing · " + countdown(next.start - now) + " until " + next.name, progress, count: countdown(next.start - now), unit: "until " + next.name };
  return { status: "School day in progress", progress: 0, count: "--:--", unit: "In a gap" };
}

let comparisonRenderKey = "", comparisonDayIndex = null, comparisonDateKey = "";
function dayDateInCurrentWeek(index, today) {
  const date = new Date(today);
  date.setDate(today.getDate() + index - today.getDay());
  return date;
}
function ensureComparisonDay(today) {
  const key = dayKey(today);
  if (comparisonDateKey !== key || !Number.isInteger(comparisonDayIndex)) {
    comparisonDateKey = key;
    comparisonDayIndex = today.getDay();
  }
}
function syncComparisonRingSelections(today, preserveSetId = "") {
  const comparisonDate = dayDateInCurrentWeek(comparisonDayIndex, today);
  for (const setId of [settings.activeSetId, settings.compareSetId]) {
    const assigned = schedulesForDay(comparisonDate, setId);
    if (!assigned.length) continue;
    const selectedId = setId === settings.activeSetId ? viewScheduleId : compareViewScheduleId;
    if (assigned.some(schedule => schedule.id === selectedId)) continue;
    const nextId = setId === preserveSetId && selectedId
      ? selectedId
      : assigned[0].id;
    if (setId === settings.activeSetId) viewScheduleId = nextId;
    else compareViewScheduleId = nextId;
  }
  $("activeRingSchedule").value = viewScheduleId || "";
  $("compareRingSchedule").value = compareViewScheduleId || "";
}
function chooseComparisonDay(dayIndex, today = new Date()) {
  if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) return;
  ensureComparisonDay(today);
  if (comparisonDayIndex === dayIndex) return;
  comparisonDayIndex = dayIndex;
  syncComparisonRingSelections(today);
  animateRingChange($("activeRingSchedule"));
  animateRingChange($("compareRingSchedule"));
  lastKey = "";
  comparisonRenderKey = "";
  tick();
}
function chooseComparisonSchedule(setId, scheduleId) {
  const schedule = settings.schedules.find(item => item.id === scheduleId && item.setId === setId);
  if (!schedule) return;
  const isActive = setId === settings.activeSetId;
  const currentId = isActive ? viewScheduleId : compareViewScheduleId;
  if (currentId === scheduleId) return;
  if (isActive) viewScheduleId = scheduleId;
  else compareViewScheduleId = scheduleId;

  const today = new Date();
  ensureComparisonDay(today);
  if (schedule.days.length && !schedule.days.includes(comparisonDayIndex)) {
    comparisonDayIndex = schedule.days.includes(today.getDay()) ? today.getDay() : schedule.days[0];
    syncComparisonRingSelections(today, setId);
  }
  $("activeRingSchedule").value = viewScheduleId || "";
  $("compareRingSchedule").value = compareViewScheduleId || "";
  animateRingChange(isActive ? $("activeRingSchedule") : $("compareRingSchedule"));
  save();
  lastKey = "";
  comparisonRenderKey = "";
  tick();
}
function buildSetComparison(today, now) {
  const root = $("weekComparison"), dayTabs = $("compareDayTabs");
  root.textContent = "";
  dayTabs.textContent = "";
  const active = settings.sets.find(set => set.id === settings.activeSetId);
  const compare = settings.sets.find(set => set.id === settings.compareSetId);
  if (!active || !compare) return;
  ensureComparisonDay(today);
  const comparisonDate = dayDateInCurrentWeek(comparisonDayIndex, today);
  const isToday = comparisonDayIndex === today.getDay();
  $("comparisonTitle").textContent = "Compare schedules";
  $("comparisonHint").textContent = comparisonDate.toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric"
  }) + (isToday ? " · Today" : " · Tap a schedule to see its class times.");

  DAYNAMES.forEach((dayName, dayIndex) => {
    const date = dayDateInCurrentWeek(dayIndex, today);
    const button = mk("button", { type: "button", className: "compare-day-tab" },
      mk("span", { textContent: dayName.slice(0, 3) }),
      mk("small", { textContent: String(date.getDate()) }));
    button.setAttribute("aria-pressed", String(dayIndex === comparisonDayIndex));
    button.setAttribute("aria-label", date.toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric"
    }));
    if (dayIndex === today.getDay()) button.setAttribute("aria-current", "date");
    button.onclick = () => chooseComparisonDay(dayIndex, today);
    dayTabs.append(button);
  });

  for (const set of [active, compare]) {
    const schedules = schedulesForDay(comparisonDate, set.id);
    const column = mk("section", { className: "compare-set-column" });
    const countText = schedules.length ? schedules.length + (schedules.length === 1 ? " schedule" : " schedules") : "No school";
    column.append(mk("h3", {},
      mk("span", { textContent: setLabel(set) }),
      mk("span", { className: "compare-set-count", textContent: countText })));
    const selectedId = set.id === settings.activeSetId ? viewScheduleId : compareViewScheduleId;
    const selectedSchedule = settings.schedules.find(item => item.id === selectedId && item.setId === set.id);
    const needsPreview = Boolean(selectedSchedule && !schedules.some(schedule => schedule.id === selectedSchedule.id));
    const schedulesToShow = needsPreview ? [...schedules, selectedSchedule] : schedules;
    if (!schedules.length && !needsPreview) {
      column.append(mk("p", { className: "compare-empty", textContent: "No schedule assigned for this day." }));
    }

    schedulesToShow.forEach(schedule => {
      const selected = schedule.id === selectedId;
      const preview = !schedules.some(assigned => assigned.id === schedule.id);
      const card = mk("details", { className: "compare-schedule" + (preview ? " preview" : "") });
      card.open = selected;
      card.dataset.scheduleId = schedule.id;
      card.dataset.setId = set.id;
      card.dataset.today = String(isToday);
      card.dataset.preview = String(preview);

      const status = mk("span", { className: "compare-live", textContent: "" });
      status.dataset.scheduleId = schedule.id;
      const summary = mk("summary", {}, mk("strong", { textContent: label(schedule) }));
      if (preview) summary.append(mk("span", { className: "compare-preview", textContent: "Preview" }));
      summary.append(status);
      summary.onclick = () => setTimeout(() => chooseComparisonSchedule(set.id, schedule.id), 0);
      card.append(summary);

      const list = mk("ol", { className: "compare-periods" });
      list.dataset.today = String(isToday);
      const checked = check(schedule.periods);
      const shown = checked.ok ? applyAdjust(checked.list, comparisonDate).list : [];
      if (checked.ok) shown.forEach(period => {
        const meta = [detail(period), period.note].filter(Boolean).join(" · ");
        const row = mk("li", {},
          mk("span", { className: "period-time", textContent: fmtClock(period.start) + "–" + fmtClock(period.end) }),
          mk("span", { className: "period-name", textContent: period.name }),
          mk("span", { className: "period-meta", textContent: meta }));
        row.dataset.start = period.start;
        row.dataset.end = period.end;
        list.append(row);
      });
      else list.append(mk("li", { className: "compare-empty", textContent: "This schedule needs attention: " + checked.msg }));
      card.append(list);
      column.append(card);
    });
    root.append(column);
  }
}
function updateSetComparisonLive(today, now) {
  document.querySelectorAll(".compare-schedule[data-schedule-id]").forEach(card => {
    const selectedId = card.dataset.setId === settings.activeSetId ? viewScheduleId : compareViewScheduleId;
    card.classList.toggle("ring-selected", card.dataset.scheduleId === selectedId);
  });
  document.querySelectorAll(".compare-live[data-schedule-id]").forEach(status => {
    const sc = settings.schedules.find(schedule => schedule.id === status.dataset.scheduleId);
    if (!sc) return;
    const card = status.closest(".compare-schedule");
    status.textContent = card.dataset.preview === "true" ? "Preview"
      : card.dataset.today === "true" ? scheduleSnapshot(sc, today, now).status
      : "Preview";
  });
  document.querySelectorAll(".compare-periods li[data-start]").forEach(row => {
    const isToday = row.closest(".compare-periods").dataset.today === "true";
    row.classList.toggle("current", isToday && now >= Number(row.dataset.start) && now < Number(row.dataset.end));
  });
}
function updateComparisonRings(today, now, activeSchedule) {
  const comparing = Boolean(settings.compareSetId && settings.compareSetId !== settings.activeSetId);
  $("ringPair").classList.toggle("is-comparing", comparing);
  $("compareRingPanel").hidden = !comparing;
  $("main").dataset.comparing = String(comparing);
  $("hero").classList.toggle("compare-mode", comparing);
  $("activeRingLabel").textContent = setLabel(settings.sets.find(set => set.id === settings.activeSetId));
  const active = activeSchedule || schedulesForDay(today, settings.activeSetId)[0];
  if (!comparing) { $("activeRingLabel").textContent = setLabel(settings.sets.find(set => set.id === settings.activeSetId)); return; }
  $("activeRingLabel").textContent = setLabel(settings.sets.find(set => set.id === settings.activeSetId));
  if (active) {
    const own = scheduleSnapshot(active, today, now);
    $("ring").style.strokeDashoffset = RING * (1 - Math.min(100, Math.max(0, own.progress || 0)) / 100);
  }
  const comparedSet = settings.sets.find(set => set.id === settings.compareSetId);
  const compared = settings.schedules.find(schedule => schedule.id === compareViewScheduleId && schedule.setId === settings.compareSetId);
  $("compareRingLabel").textContent = comparedSet ? setLabel(comparedSet) : "Compared group";
  if (!compared) {
    $("compareRingCount").textContent = "--:--";
    $("compareRingUnit").textContent = "No schedule";
    $("compareRingPct").textContent = "";
    $("compareRing").style.strokeDashoffset = RING;
    return;
  }
  const snapshot = scheduleSnapshot(compared, today, now);
  $("compareRingCount").textContent = snapshot.count || "--:--";
  $("compareRingUnit").textContent = snapshot.unit || snapshot.status;
  $("compareRingPct").textContent = snapshot.progress == null ? "" : Math.floor(snapshot.progress) + "% through period";
  $("compareRing").style.strokeDashoffset = RING * (1 - Math.min(100, Math.max(0, snapshot.progress || 0)) / 100);
}
function renderSetComparison(today, now) {
  const panel = $("comparison");
  const show = settings.compareSetId && settings.compareSetId !== settings.activeSetId;
  panel.hidden = !show;
  if (!show) { comparisonRenderKey = ""; return; }
  ensureComparisonDay(today);
  const key = JSON.stringify([dayKey(today), comparisonDayIndex, settings.activeSetId, settings.compareSetId,
    viewScheduleId, compareViewScheduleId, settings.use24, settings.sets, settings.schedules, settings.adjust]);
  if (key !== comparisonRenderKey) { buildSetComparison(today, now); comparisonRenderKey = key; }
  updateSetComparisonLive(today, now);
}

function tick() {
  // The single clock loop derives today's active schedule, current period,
  // countdown, alerts, progress ring, and page title from the current time.
  const d = new Date();
  if (dayKey(d) !== weekOverviewDate) { renderWeekOverview(); buildDashboardControls(); }
  const now = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  $("date").textContent = d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  $("dnum").textContent = d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
  $("clock").textContent = fmtNow(d);

  const { sc, forced } = activeSchedule(d);
  renderSetComparison(d, now);
  const assignedToday = schedulesForDay(d, settings.activeSetId);
  // The ring can preview one schedule, but the normal day list includes every
  // schedule assigned to today. If none are assigned, keep the preview useful.
  const listSchedules = assignedToday.length ? assignedToday : (sc ? [sc] : []);
  $("scheduleTitle").textContent = assignedToday.length > 1 ? "Today’s schedules" : sc ? label(sc) + " schedule" : "Today’s schedule";
  const res = sc ? check(sc.periods) : null;
  let P = res && res.ok ? res.list : null, adjusted = false;
  if (P) { const r = applyAdjust(P, d); P = r.list.length ? r.list : null; adjusted = r.adjusted; }
  const C = P ? P.filter(p => p.kind !== "passing") : [];   // classes only
  if (!C.length) P = null;
  const pill = $("pill");
  const previewing = Boolean(sc && !sc.days.includes(d.getDay()));
  pill.hidden = !(P && (schedulesInSet(settings.activeSetId).length > 1 || forced || adjusted || previewing));
  if (P) {
    const notes = [];
    if (forced) notes.push("today only");
    if (adjusted) notes.push("adjusted");
    if (previewing) notes.push("preview");
    pill.textContent = label(sc) + (notes.length ? " (" + notes.join(", ") + ")" : "");
  }

  // These output fields are assembled by the state branches below, then written
  // to the DOM once at the end of the tick to keep rendering easy to follow.
  const fx = settings.effects;
  let nowTxt, count, unit = "", sub, pct = 0, sLeft = "--", sPct = 0, cur = -1, key,
      pctTxt = "", detTxt = "", nextLine = "", noteTxt = "", inClass = false,
      mode = "off", tone = "", level = "", badge = "", badgeKind = "info", hype = 0, leftSec = -1, dk = "";

  if (!P) {
    nowTxt = "No school today"; count = "--:--"; sub = "Enjoy it."; key = "none";
    if (fx) { tone = "off"; badge = "Day off"; }
  } else {
    const first = C[0], last = C[C.length - 1], dayLen = last.end - first.start;
    cur = P.findIndex(p => now >= p.start && now < p.end);
    const item = cur >= 0 ? P[cur] : null;
    const nextClass = from => C.find(p => p.start >= from);
    key = sc.id + "|" + cur + "|" + (now >= last.end) + "|" + (now < first.start) + "|" + adjusted;
    // Select one of three day phases. Passing periods and unlisted gaps share
    // the same countdown mode, while class mode can trigger end-of-class alerts.
    if (now < first.start) {
      mode = "before";
      const lb = first.start - now;
      nowTxt = "School hasn’t started"; count = countdown(lb); unit = "until first bell";
      sub = first.name + " starts at " + fmtClock(first.start);
      sLeft = words(dayLen); detTxt = head(first); noteTxt = first.note;
      if (fx) {
        tone = "dawn"; hype = clamp01(1 - lb / 300) * 0.6; dk = "before";
        if (lb <= 60) { level = "danger"; badge = "First bell in under a minute"; badgeKind = "danger"; }
        else if (lb <= 300) badge = "First bell soon";
      }
    } else if (now >= last.end) {
      mode = "out";
      nowTxt = "School’s out"; count = "00:00"; unit = "see you tomorrow"; sub = "The last bell rang at " + fmtClock(last.end);
      sLeft = "0 min"; sPct = 100; pct = 100;
      if (fx) { tone = "gold"; hype = 0.5; badge = "School’s out!"; }
    } else {
      leftSec = last.end - now;
      sLeft = words(leftSec);
      sPct = (now - first.start) / dayLen * 100;
      const hS = fx ? clamp01(1 - leftSec / 3600) : 0;   // builds over the last hour of school
      if (item && item.kind !== "passing") {
        mode = "class"; inClass = true;
        const p = item, nx = nextClass(p.end), left = p.end - now, id = sc.id + "|" + cur + "|" + dayKey(d);
        const lastClass = !nx, warnNow = settings.alert.on && left <= settings.alert.mins * 60;
        nowTxt = p.name; count = countdown(left); unit = "left in class";
        sub = "Ends at " + fmtClock(p.end);
        pct = (now - p.start) / (p.end - p.start) * 100;
        pctTxt = Math.floor(pct) + "% through class";
        detTxt = detail(p); noteTxt = p.note;
        nextLine = nx ? "Next: " + nx.name + " at " + fmtClock(nx.start) + (detail(nx) ? " (" + detail(nx) + ")" : "") : "Last class of the day";
        level = fx && left <= 60 ? "danger" : warnNow ? "warn" : "";
        if (fx) { tone = lastClass ? "gold" : ""; hype = Math.max(clamp01(1 - left / 300) * 0.75, hS * (lastClass ? 1 : 0.85)); }
        if (level === "danger") { badge = lastClass ? "Last minute of school!" : "Last minute!"; badgeKind = "danger"; }
        else if (level === "warn") { badge = fx && lastClass ? "Almost free!" : "Class ends soon"; badgeKind = "warn"; }
        else if (fx && lastClass) badge = "Last class of the day";
        dk = id;
        // A class transition marks whether the previous class ended just now,
        // which is when the optional scheduled bell should ring.
        if (watch && watch.id !== id && now >= watch.end && now - watch.end < 6 && settings.alert.sound) bell();
        watch = { end: p.end, id };
        if (warnNow && warnedFor !== id) { const quiet = firstTick; warnedFor = id; if (!quiet) fireAlert(); }
      } else {
        // a passing period you entered, or an unlisted gap between classes
        mode = "passing";
        const nx = nextClass(item ? item.end : now);
        const leftP = (item ? item.end : nx.start) - now;
        if (item) {
          nowTxt = item.name; count = countdown(item.end - now);
          unit = item.end === nx.start ? "until " + nx.name : "left in passing time";
          pct = (now - item.start) / (item.end - item.start) * 100;
          noteTxt = item.note || nx.note;
        } else {
          const prev = [...P].reverse().find(p => p.end <= now);
          nowTxt = "Passing time"; count = countdown(nx.start - now); unit = "until " + nx.name;
          pct = (now - prev.end) / (nx.start - prev.end) * 100;
          noteTxt = nx.note;
        }
        sub = nx.name + " starts at " + fmtClock(nx.start);
        detTxt = head(nx);
        if (fx) {
          tone = "go"; badge = "Head to class";
          hype = Math.max(clamp01(1 - leftP / 120) * 0.9, hS * 0.85);
          if (leftP <= 60) { level = "danger"; badge = "Hurry! Under a minute"; badgeKind = "danger"; }
          dk = sc.id + "|pass|" + (item ? cur : "g" + nx.start);
        }
      }
    }
  }
  if (level) tone = level;
  if (level === "danger" && fx && dangerFor !== dk) { dangerFor = dk; if (!firstTick) flashHero(); }
  // the bell: a class we were watching has just ended
  if (!inClass && watch) {
    if (now >= watch.end && now - watch.end < 6 && settings.alert.sound) bell();
    watch = null;
  }
  // confetti when the last bell rings while the page is open
  if (fx && mode === "out" && (prevMode === "class" || prevMode === "passing") && !matchMedia("(prefers-reduced-motion: reduce)").matches) confetti();
  prevMode = mode;

  const root = document.documentElement;
  root.dataset.tone = tone; root.dataset.level = level;
  root.style.setProperty("--hype", hype.toFixed(3));
  $("hero").dataset.mode = mode;
  const bd = $("badge"); bd.hidden = !badge; bd.textContent = badge; bd.dataset.kind = badgeKind;
  $("statLeft").dataset.final = fx && leftSec >= 0 ? (leftSec <= 600 ? "2" : leftSec <= 3600 ? "1" : "") : "";

  $("now").textContent = nowTxt;
  $("count").textContent = count;
  $("unit").textContent = unit;
  $("pct").textContent = pctTxt;
  $("sub").textContent = sub;
  $("det").textContent = detTxt;
  $("nextLine").textContent = nextLine;
  $("ring").style.strokeDashoffset = RING * (1 - Math.min(100, Math.max(0, pct)) / 100);
  updateComparisonRings(d, now, sc);
  $("schoolLeft").textContent = sLeft;
  $("schoolPct").textContent = P ? Math.floor(Math.min(100, sPct)) + "% through the day" : "";
  const nt = $("noteTxt");
  nt.textContent = noteTxt || "No note for this period.";
  nt.classList.toggle("muted", !noteTxt);
  const live = P && now >= C[0].start && now < C[C.length - 1].end;
  document.title = live ? (level === "danger" ? "! " : "") + count + " · " + nowTxt : "School Schedule";

  // Key list rendering by every schedule's contents and live time segment, so
  // secondary schedules update independently of the schedule shown by the ring.
  const listKey = JSON.stringify([dayKey(d), settings.showPassing, settings.adjust,
    listSchedules.map(schedule => {
      const checked = check(schedule.periods);
      const periods = checked.ok ? applyAdjust(checked.list, d).list : [];
      const current = periods.findIndex(period => now >= period.start && now < period.end);
      const classes = periods.filter(period => period.kind !== "passing");
      return [schedule.id, schedule.name, schedule.periods, current,
        classes.length ? now < classes[0].start : false,
        classes.length ? now >= classes[classes.length - 1].end : false];
    })]);
  if (key !== lastKey || listKey !== lastListKey) {
    renderList(listSchedules, d, now);
    lastKey = key; lastListKey = listKey;
  }
  firstTick = false;
}

// ---- Settings: weekly schedule editor ----
// The editor is a projection of the chosen set. Input events read the form,
// validate the whole schedule, save accepted state, and refresh the dashboard.
function buildSetTabs() {
  const tabs = $("setTabs"); tabs.textContent = "";
  settings.sets.forEach(set => {
    const button = mk("button", { type: "button", className: "tab", textContent: setLabel(set) });
    button.setAttribute("aria-pressed", String(set.id === settings.editingSetId));
    button.onclick = () => {
      settings.editingSetId = set.id;
      settings.editing = schedulesInSet(set.id)[0].id;
      syncEditorScheduleToDashboard(ed());
      save(); buildSchedUI(); lastKey = ""; tick();
    };
    tabs.append(button);
  });
  const add = mk("button", { type: "button", className: "alt tab", textContent: "+ Copy group" });
  add.onclick = () => {
    const source = schedulesInSet(settings.editingSetId), id = newId("set");
    const set = { id, name: "Group " + (settings.sets.length + 1) };
    settings.sets.push(set);
    const copies = source.map(schedule => ({ ...clone(schedule), id: newId(), setId: id }));
    settings.schedules.push(...copies);
    settings.editingSetId = id;
    settings.editing = copies[0].id;
    save(); buildAll();
  };
  tabs.append(add);
  const set = editingSet();
  $("setName").value = set.name;
  $("deleteSet").disabled = settings.sets.length < 2;
}
function buildTabs() {
  // Schedule tabs edit one timetable inside the current set. If that set is
  // visible in either ring, the ring selection follows the editor selection.
  const tabs = $("tabs"); tabs.textContent = "";
  schedulesInSet().forEach(s => {
    const b = mk("button", { type: "button", className: "tab", textContent: label(s) });
    b.setAttribute("aria-pressed", String(s.id === settings.editing));
    b.onclick = () => {
      settings.editing = s.id;
      syncEditorScheduleToDashboard(s);
      save(); buildSchedUI(); lastKey = ""; tick();
    };
    tabs.append(b);
  });
  const add = mk("button", { type: "button", className: "alt tab", textContent: "+ Add schedule" });
  add.onclick = () => {
    const n = { id: newId(), setId: settings.editingSetId, name: "Schedule " + (schedulesInSet().length + 1), days: [], passing: ed().passing, periods: clone(ed().periods) };
    settings.schedules.push(n); settings.editing = n.id; save();
    if (settings.activeSetId === settings.editingSetId) viewScheduleId = n.id;
    if (settings.compareSetId === settings.editingSetId) compareViewScheduleId = n.id;
    buildSchedUI(); lastKey = ""; tick(); $("sname").select();
  };
  tabs.append(add);
}
function buildToday() {
  // Today-only controls are populated from the override records only when their
  // stored date matches today's local calendar date.
  const sel = $("today"); sel.textContent = "";
  sel.append(mk("option", { value: "", textContent: "Use the schedule assigned to this day" }));
  schedulesInSet().forEach(s => sel.append(mk("option", { value: s.id, textContent: label(s) })));
  const today = dayKey(new Date()), o = settings.override, a = settings.adjust;
  sel.value = o && o.date === today ? o.id : "";
  $("shift").value = a && a.date === today ? a.shift : 0;
  $("endAt").value = a && a.date === today ? a.endAt : "";
}
function dayHint() {
  const missing = DAYNAMES.filter((n, i) => !schedulesInSet().some(s => s.days.includes(i)));
  $("dayhint").textContent = "More than one schedule can run on the same day. " +
    (missing.length ? "No schedule assigned to: " + missing.join(", ") + "." : "Every day has at least one schedule.");
}
// A week strip makes day assignments scannable without opening each schedule.
// Today receives a border cue, while uncovered days are labeled No school.
let weekOverviewDate = "";
function renderWeekOverview() {
  const box = $("weekOverview");
  box.textContent = "";
  weekOverviewDate = dayKey(new Date());
  DAYNAMES.forEach((day, index) => {
    const schedules = schedulesInSet().filter(item => item.days.includes(index));
    const list = mk("div", { className: "week-day-list" });
    if (schedules.length) schedules.forEach(schedule => list.append(mk("span", { textContent: label(schedule) })));
    else list.append(mk("span", { className: "week-day-empty", textContent: "No school" }));
    const cell = mk("div", {}, mk("strong", { textContent: day }), list);
    cell.className = "week-day";
    cell.dataset.empty = String(!schedules.length);
    if (schedules.length) cell.title = schedules.map(label).join(", ");
    cell.dataset.today = String(index === new Date().getDay());
    box.append(cell);
  });
}
function addRow(p) {
  // Construct each period with the same field order as readRows() below.
  // Labels are attached for assistive technology even when placeholders exist.
  const kind = p.kind === "passing" ? "passing" : "class", pass = kind === "passing";
  const n = mk("input", { type: "text", value: p.name, placeholder: pass ? "Passing time" : "Name", className: "f-n", maxLength: 40 });
  const s = mk("input", { type: "time", value: p.start, className: "f-s" });
  const e = mk("input", { type: "time", value: p.end, className: "f-e" });
  const t = mk("input", { type: "text", value: p.teacher || "", placeholder: "Teacher (optional)", className: "f-t", maxLength: 40 });
  const r = mk("input", { type: "text", value: p.room || "", placeholder: "Room (optional)", className: "f-r", maxLength: 20 });
  const o = mk("input", { type: "text", value: p.note || "", placeholder: pass ? "Note (optional)" : "Note, e.g. “Welcome to school”", className: "f-o", maxLength: 120 });
  n.setAttribute("aria-label", pass ? "Passing period name" : "Period name");
  s.setAttribute("aria-label", "Start time");
  e.setAttribute("aria-label", "End time");
  t.setAttribute("aria-label", "Teacher");
  r.setAttribute("aria-label", "Room");
  o.setAttribute("aria-label", "Note shown in the note box");
  const x = mk("button", { type: "button", className: "x f-x", textContent: "✕" });
  x.setAttribute("aria-label", pass ? "Remove this passing time" : "Remove this class");
  // The grid-area classes in CSS map this fixed DOM order to desktop and mobile
  // arrangements without duplicating or moving the input elements.
  const more = mk("details", { className: "period-details" },
    mk("summary", { textContent: pass ? "Add a note (optional)" : "Add a room, teacher, or note" }), t, r, o);
  more.open = Boolean(t.value || r.value || o.value);
  const row = mk("div", { className: "prow" + (pass ? " pass" : "") }, n, s, e, more, x);
  row.dataset.kind = kind;
  x.onclick = () => { row.remove(); commitRows(); };
  $("rows").append(row);
  return n;
}
function readRows() {
  // Convert the editor DOM back into plain data; persistence never stores DOM
  // nodes or relies on their visual order before sorting.
  return [...$("rows").children].map(row => {
    const [n, s, e, t, r, o] = row.querySelectorAll("input");
    return { name: n.value, start: s.value, end: e.value, teacher: t.value, room: r.value, note: o.value, kind: row.dataset.kind || "class" };
  });
}
function commitRows() {
  // Commit only complete, non-overlapping schedules so a half-edited row cannot
  // replace the last valid schedule in storage.
  const rows = readRows(), res = check(rows);
  if (!res.ok) { $("err").textContent = res.msg; return; }
  $("err").textContent = "";
  ed().periods = byStart(rows); save(); lastKey = ""; tick();
}
const startKey = t => { const v = toSec(t); return v == null ? Infinity : v; };
const byStart = rows => rows.map((r, i) => ({ r, i, k: startKey(r.start) })).sort((a, b) => a.k - b.k || a.i - b.i).map(x => x.r);
// Reorder the rows on screen by start time (done when you leave a row, so rows don't jump while you type)
function sortRows() {
  // Preserve stable order for equal/invalid starts; check() will report invalid
  // times instead of the editor unexpectedly jumping them to the top.
  const box = $("rows"), rows = [...box.children];
  const sorted = rows.map((r, i) => ({ r, i, k: startKey(r.querySelectorAll("input")[1].value) }))
    .sort((a, b) => a.k - b.k || a.i - b.i).map(x => x.r);
  if (sorted.every((r, i) => r === rows[i])) return false;
  sorted.forEach(r => box.append(r));
  return true;
}
function buildSchedUI() {
  // Refresh every control that depends on the selected schedule after tab
  // switches, imports, deletions, and resets.
  const sc = ed();
  buildSetTabs();
  buildTabs();
  renderWeekOverview();
  $("sname").value = sc.name;
  $("passMin").value = sc.passing;
  const days = $("days"); days.textContent = "";
  DAYNAMES.forEach((name, i) => {
    const cb = mk("input", { type: "checkbox", checked: sc.days.includes(i) });
    cb.onchange = () => {
      if (cb.checked) ed().days.push(i);
      else ed().days = ed().days.filter(x => x !== i);
      save(); dayHint(); renderWeekOverview(); buildDashboardControls(); lastKey = ""; tick();
    };
    days.append(mk("label", { className: "day" }, cb, name));
  });
  dayHint();
  $("rows").textContent = "";
  sc.periods.forEach(addRow);
  $("err").textContent = "";
  $("del").disabled = schedulesInSet().length < 2;
  buildToday();
  buildDashboardControls();
}
// Delegate input handling from the stable container because period rows are
// created and removed dynamically.
$("rows").addEventListener("input", commitRows);
$("rows").addEventListener("focusout", e => {
  const row = e.target.closest && e.target.closest(".prow");
  if (row && !row.contains(e.relatedTarget) && sortRows()) commitRows();
});
$("sname").oninput = () => { ed().name = $("sname").value; save(); buildTabs(); buildToday(); renderWeekOverview(); buildDashboardControls(); lastKey = ""; tick(); };
$("setName").oninput = () => {
  editingSet().name = $("setName").value.slice(0, 40);
  const selected = $("setTabs").querySelector('[aria-pressed="true"]');
  if (selected) selected.textContent = setLabel(editingSet());
  save(); buildDashboardControls(); comparisonRenderKey = ""; tick();
};
$("passMin").oninput = () => {
  let v = Math.round(Number($("passMin").value)); if (!Number.isFinite(v)) v = 5;
  ed().passing = Math.max(0, Math.min(30, v)); save();
};
$("today").onchange = e => {
  settings.override = e.target.value ? { date: dayKey(new Date()), id: e.target.value } : null;
  if (settings.override) settings.activeSetId = settings.editingSetId;
  viewScheduleId = settings.override ? settings.override.id : (schedulesForDay(new Date(), settings.activeSetId)[0] || {}).id || null;
  buildDashboardControls();
  save(); lastKey = ""; tick();
};
function setAdjust() {
  // Clamp shift values to the same range enforced by sanitize() for imported
  // settings so manual editing and link imports behave alike.
  let sh = Math.round(Number($("shift").value)); if (!Number.isFinite(sh)) sh = 0;
  sh = Math.max(-180, Math.min(300, sh));
  const ea = toSec($("endAt").value) != null ? $("endAt").value : "";
  settings.adjust = sh || ea ? { date: dayKey(new Date()), shift: sh, endAt: ea } : null;
  save(); lastKey = ""; tick();
}
$("shift").oninput = setAdjust;
$("endAt").oninput = setAdjust;
$("clearToday").onclick = () => {
  settings.override = null; settings.adjust = null;
  viewScheduleId = (schedulesForDay(new Date(), settings.activeSetId)[0] || {}).id || null;
  save(); buildToday(); buildDashboardControls(); lastKey = ""; tick();
};
const LAST_MIN = 23 * 3600 + 59 * 60;
function endOfDay(rows) { // Latest ending time, or null if the editor has no usable times.
  const ends = rows.map(r => toSec(r.end)).filter(v => v != null);
  return ends.length ? Math.max(...ends) : null;
}
$("addRow").onclick = () => {
  const rows = readRows(), end = endOfDay(rows);
  let s = end == null ? 8 * 3600 : end;
  const lastRow = rows.filter(r => toSec(r.end) === end).pop(), gap = ed().passing;
  if (end != null && gap > 0 && lastRow && lastRow.kind !== "passing") {
    const pe = Math.min(s + gap * 60, LAST_MIN);
    addRow({ name: "Passing time", start: fromSec(s), end: fromSec(pe), kind: "passing" });
    s = pe;
  }
  s = Math.min(s, 22 * 3600);
  const count = rows.filter(r => r.kind !== "passing").length;
  const n = addRow({ name: "Period " + (count + 1), start: fromSec(s), end: fromSec(Math.min(s + 50 * 60, LAST_MIN)), teacher: "", room: "", note: "", kind: "class" });
  sortRows(); n.focus();
  $("gapMsg").textContent = "";
  commitRows();
};
$("addPass").onclick = () => {
  const end = endOfDay(readRows()), s = Math.min(end == null ? 8 * 3600 : end, 23 * 3600);
  const n = addRow({ name: "Passing time", start: fromSec(s), end: fromSec(Math.min(s + (ed().passing || 5) * 60, LAST_MIN)), kind: "passing" });
  sortRows(); n.focus();
  $("gapMsg").textContent = "";
  commitRows();
};
$("fillGaps").onclick = () => {
  const res = check(readRows()), msg = $("gapMsg");
  if (!res.ok) { msg.textContent = "Fix the problem above first: " + res.msg; return; }
  let n = 0;
  for (let i = 1; i < res.list.length; i++) {
    const a = res.list[i - 1], b = res.list[i];
    if (b.start > a.end) { addRow({ name: "Passing time", start: fromSec(a.end), end: fromSec(b.start), kind: "passing" }); n++; }
  }
  msg.textContent = n ? "Added " + n + " passing period" + (n === 1 ? "" : "s") + "." : "There are no gaps to fill.";
  if (n) { sortRows(); commitRows(); }
};

// Two-tap confirmation avoids browser confirm() dialogs, which may be blocked.
// The action runs only on the second click inside the short confirmation window.
function arm(btn, confirmText, action) {
  // Reusing this helper keeps destructive actions consistent and gives the
  // user a visible undo window before the action runs.
  const orig = btn.textContent; let t = null;
  btn.onclick = () => {
    if (t) { clearTimeout(t); t = null; btn.textContent = orig; btn.classList.remove("danger"); action(); return; }
    btn.textContent = confirmText; btn.classList.add("danger");
    t = setTimeout(() => { t = null; btn.textContent = orig; btn.classList.remove("danger"); }, 3500);
  };
}
arm($("del"), "Tap again to delete", () => {
  const id = settings.editing;
  settings.schedules = settings.schedules.filter(s => s.id !== id);
  if (settings.override && settings.override.id === id) settings.override = null;
  settings.editing = schedulesInSet(settings.editingSetId)[0].id;
  if (viewScheduleId === id) viewScheduleId = null;
  save(); buildSchedUI(); lastKey = ""; tick();
});
arm($("deleteSet"), "Tap again to delete group", () => {
  const removed = settings.editingSetId;
  settings.sets = settings.sets.filter(set => set.id !== removed);
  settings.schedules = settings.schedules.filter(schedule => schedule.setId !== removed);
  if (settings.override && !settings.schedules.some(schedule => schedule.id === settings.override.id)) settings.override = null;
  settings.editingSetId = settings.sets[0].id;
  settings.editing = schedulesInSet(settings.editingSetId)[0].id;
  if (settings.activeSetId === removed) settings.activeSetId = settings.editingSetId;
  if (settings.compareSetId === removed || settings.compareSetId === settings.activeSetId) settings.compareSetId = "";
  viewScheduleId = null;
  save(); buildAll();
});

// ---- Settings: theme, display, and alert controls ----
function buildThemeUI() {
  // Populate native inputs from the current settings object. Input listeners
  // below keep those settings in sync as soon as the user changes a control.
  const pk = $("pickers"); pk.textContent = "";
  for (const [k, name] of COLORS) {
    const inp = mk("input", { type: "color", id: "c_" + k });
    inp.setAttribute("aria-label", name + " color");
    inp.oninput = () => {
      // Start from the fully resolved palette so changing one color does not
      // erase the other colors selected by the active preset.
      const c = {}, cur = resolved();
      for (const [kk] of COLORS) c[kk] = cur[kk];
      c[k] = inp.value;
      settings.theme.custom = c; settings.theme.preset = "custom";
      save(); applyTheme();
    };
    pk.append(mk("label", { className: "pick" }, name, inp));
  }
  $("fmt").value = settings.use24 ? "24" : "12";
  $("size").value = settings.size;
  $("secs").checked = settings.seconds;
  $("showPass").checked = settings.showPassing;
  $("fx").checked = settings.effects;
  for (const id of ["autoL", "autoD"]) {
    const sel = $(id); sel.textContent = "";
    Object.keys(PRESETS).forEach(k => sel.append(mk("option", { value: k, textContent: PRESETS[k].label })));
  }
  $("autoL").value = settings.theme.autoLight; $("autoD").value = settings.theme.autoDark;
  $("font").value = settings.font; $("corners").value = settings.corners;
  $("ringw").value = settings.ring; $("bgstyle").value = settings.bgStyle;
  $("shNote").checked = settings.showNote; $("shPct").checked = settings.showPercent; $("shNum").checked = settings.showNumDate;
  $("alOn").checked = settings.alert.on;
  $("alMins").value = String(settings.alert.mins);
  $("alSound").checked = settings.alert.sound;
}
$("fmt").onchange = e => { settings.use24 = e.target.value === "24"; save(); applyDisplay(); };
$("size").onchange = e => { settings.size = e.target.value; save(); applyDisplay(); };
$("secs").onchange = e => { settings.seconds = e.target.checked; save(); tick(); };
$("autoL").onchange = e => { settings.theme.autoLight = e.target.value; save(); applyTheme(); };
$("autoD").onchange = e => { settings.theme.autoDark = e.target.value; save(); applyTheme(); };
for (const [id, key] of [["font", "font"], ["corners", "corners"], ["ringw", "ring"], ["bgstyle", "bgStyle"]]) {
  // These appearance controls share the same save-and-refresh behavior.
  $(id).onchange = e => { settings[key] = e.target.value; save(); applyDisplay(); };
}
for (const [id, key] of [["shNote", "showNote"], ["shPct", "showPercent"], ["shNum", "showNumDate"]])
  $(id).onchange = e => { settings[key] = e.target.checked; save(); applyDisplay(); };
$("fx").onchange = e => { settings.effects = e.target.checked; save(); lastKey = ""; tick(); };
$("showPass").onchange = e => { settings.showPassing = e.target.checked; save(); lastKey = ""; tick(); };
$("alOn").onchange = e => { settings.alert.on = e.target.checked; save(); tick(); };
$("alMins").onchange = e => { settings.alert.mins = +e.target.value; save(); tick(); };
$("alSound").onchange = e => { settings.alert.sound = e.target.checked; save(); if (e.target.checked) beep(1, 880); };
$("alTest").onclick = () => beep(2, 880);

// ---- Share and import ----
// Shared settings are compressed when the browser supports CompressionStream,
// then encoded as URL-safe base64. The raw encoding remains a compatibility
// fallback for older browsers.
// These two helpers implement the compact, URL-safe share codec.
class ShareError extends Error {}
// URL-safe base64 replaces the two characters that have special meaning in
// fragments and drops padding to keep shared links short.
const b64 = u8 => { let s = ""; u8.forEach(b => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const unb64 = t => { t = t.replace(/-/g, "+").replace(/_/g, "/"); while (t.length % 4) t += "="; return Uint8Array.from(atob(t), c => c.charCodeAt(0)); };
async function encode(str) {
  const bytes = new TextEncoder().encode(str);
  if (typeof CompressionStream !== "undefined") {
    try {
      const buf = await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
      return "z" + b64(new Uint8Array(buf));
    } catch (e) {}
  }
  return "r" + b64(bytes);
}
async function decode(code) {
  // Check the version marker before parsing so unsupported or malformed links
  // produce a clear import error instead of partially changing application state.
  const tag = code[0];
  const bytes = unb64(code.slice(1));
  if (tag === "z") {
    if (typeof DecompressionStream === "undefined") throw new ShareError("This browser can’t open that link. Try a newer browser.");
    const buf = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
    return JSON.parse(new TextDecoder().decode(buf));
  }
  if (tag === "r") return JSON.parse(new TextDecoder().decode(bytes));
  throw new ShareError("That link or code isn’t valid.");
}

async function makePayload(full) {
  // Share one complete weekly set at a time. This keeps a friend's imported
  // schedules together instead of mixing them into unrelated local sets.
  const active = editingSet();
  const o = { v: 1, setName: setLabel(active), schedules: schedulesInSet(active.id).map(s => ({ name: s.name, days: s.days, passing: s.passing, periods: s.periods })) };
  if (full) { o.theme = settings.theme; o.use24 = settings.use24; o.seconds = settings.seconds; o.size = settings.size; o.showPassing = settings.showPassing; o.effects = settings.effects; o.alert = settings.alert;
    for (const k of ["font", "corners", "ring", "bgStyle", "showNote", "showPercent", "showNumDate"]) o[k] = settings[k];
  }
  return encode(JSON.stringify(o));
}
function importPayload(o, mode = "replace") {
  // Imported schedules are routed into the set currently open in the editor.
  // Replacement removes only that set; every other set stays untouched.
  const incoming = cleanSchedules(o && o.schedules);
  if (!incoming.length) throw new ShareError("No schedule was found in that link or code.");
  const targetId = settings.editingSetId;
  const before = schedulesInSet(targetId);
  const retained = mode === "add" ? settings.schedules : settings.schedules.filter(item => item.setId !== targetId);
  const ids = new Set(retained.map(item => item.id));
  const names = new Set((mode === "add" ? before : []).map(item => item.name.toLowerCase()));
  const added = incoming.map(item => {
    const copy = clone(item);
    while (ids.has(copy.id)) copy.id = newId();
    ids.add(copy.id);
    copy.setId = targetId;
    if (mode === "add") {
      const baseName = copy.name;
      let uniqueName = baseName, suffix = 0;
      while (names.has(uniqueName.toLowerCase())) {
        suffix++;
        const ending = suffix === 1 ? " (imported)" : " (imported " + suffix + ")";
        uniqueName = baseName.slice(0, 40 - ending.length) + ending;
      }
      copy.name = uniqueName;
      names.add(copy.name.toLowerCase());
    }
    return copy;
  });
  settings.schedules = [...retained, ...added];
  settings.editingSetId = targetId;
  settings.editing = added[0].id;
  if (settings.activeSetId === targetId) viewScheduleId = added[0].id;
  if (mode === "replace") {
    const remainingIds = new Set(settings.schedules.map(item => item.id));
    if (settings.override && !remainingIds.has(settings.override.id)) settings.override = null;
    if (settings.activeSetId === targetId) settings.adjust = null;
    if (o.theme) settings.theme = sanitize(o).theme;
    const importedSettings = sanitize(o);
    if ("use24" in o || "seconds" in o || "size" in o) { settings.use24 = importedSettings.use24; settings.seconds = importedSettings.seconds; settings.size = importedSettings.size; }
    if ("showPassing" in o) settings.showPassing = importedSettings.showPassing;
    if ("effects" in o) settings.effects = importedSettings.effects;
    for (const k of ["font", "corners", "ring", "bgStyle", "showNote", "showPercent", "showNumDate"]) if (k in o) settings[k] = importedSettings[k];
    if (o.alert) settings.alert = importedSettings.alert;
  }
  save(); buildAll();
}
let pendingImport = null;
function requestImport(payload) {
  if (!cleanSchedules(payload && payload.schedules).length) throw new ShareError("No schedule was found in that link or code.");
  pendingImport = payload;
  const count = cleanSchedules(payload.schedules).length;
  const destination = setLabel(editingSet());
  $("importChoiceText").textContent = count + (count === 1 ? " schedule is" : " schedules are") +
    " ready for “" + destination + "”. Add them to this group or replace its schedules?";
  $("addImport").textContent = "Add to " + destination;
  $("replaceImport").textContent = "Replace this group’s schedules";
  $("importChoice").showModal();
}
function completeImport(mode) {
  if (!pendingImport) return;
  try {
    importPayload(pendingImport, mode);
    const result = mode === "add" ? "Schedules added to “" + setLabel(editingSet()) + "”." : "Group schedules replaced.";
    $("shareMsg").textContent = result;
    $("importStatus").textContent = result;
    $("importStatus").hidden = false;
    $("backupMsg").textContent = "";
  } catch (error) {
    $("shareMsg").textContent = error.message || "The schedules could not be imported.";
  }
  pendingImport = null;
  $("importChoice").close();
  $("banner").hidden = true;
  pendingShare = null;
  clearHash();
}
$("addImport").onclick = () => completeImport("add");
$("replaceImport").onclick = () => completeImport("replace");
$("cancelImport").onclick = () => { pendingImport = null; $("importChoice").close(); };
$("importChoice").addEventListener("click", e => { if (e.target === e.currentTarget) { pendingImport = null; e.currentTarget.close(); } });
// Export the complete local settings object as a portable, versioned JSON file.
// URL shares stay compact and schedule-focused; backups preserve local display
// choices and temporary overrides as well.
$("exportBackup").onclick = () => {
  const backup = { format: "school-schedule-backup", version: 1, settings };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob), link = mk("a", { href: url, download: "school-schedule-backup-" + dayKey(new Date()) + ".json" });
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("backupMsg").textContent = "Backup downloaded.";
};
$("chooseBackup").onclick = () => $("backupFile").click();
$("backupFile").onchange = async e => {
  const file = e.target.files[0], msg = $("backupMsg");
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.format !== "school-schedule-backup" || data.version !== 1 ||
        !data.settings || !Array.isArray(data.settings.schedules) ||
        cleanSchedules(data.settings.schedules).length !== data.settings.schedules.length) {
      throw new Error("The selected file is not a supported School Schedule backup.");
    }
    settings = sanitize(data.settings);
    save(); buildAll();
    msg.textContent = "Backup restored.";
  } catch (error) {
    msg.textContent = error instanceof SyntaxError ? "That file is not valid JSON." : error.message;
  } finally {
    e.target.value = "";
  }
};
const clearHash = () => { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} };

$("mkLink").onclick = async () => {
  const msg = $("shareMsg");
  try {
    const url = location.href.split("#")[0] + "#s=" + await makePayload($("shareAll").checked);
    const out = $("linkOut"); out.value = url; out.hidden = false; out.select();
    let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; } catch (e) {}
    msg.textContent = ok ? "Link copied. Open it on another device to import." : "Select the link above and copy it, then open it on another device.";
  } catch (e) { msg.textContent = "Couldn’t make a link. Try again."; }
};
$("doImport").onclick = async () => {
  const msg = $("shareMsg"), raw = $("importIn").value.trim();
  if (!raw) { msg.textContent = "Paste a share link or code first."; return; }
  try {
    const m = /[#&?]s=([A-Za-z0-9_-]+)/.exec(raw);
    requestImport(await decode(m ? m[1] : raw.replace(/\s+/g, "")));
  } catch (e) {
    msg.textContent = e instanceof ShareError ? e.message : "That link or code could not be read. Check that you copied all of it.";
  }
};

// Opening a share link offers an explicit import; reading the URL never replaces
// local schedules until the user confirms in the banner.
let pendingShare = null;
async function checkHash() {
  // Shared data is staged in the import banner; no local state changes until
  // the user presses Import.
  const m = /[#&]s=([A-Za-z0-9_-]+)/.exec(location.hash);
  if (!m) return;
  try {
    const o = await decode(m[1]), sch = cleanSchedules(o.schedules);
    if (!sch.length) throw new ShareError("empty");
    pendingShare = o;
    $("bannerTxt").textContent = "Shared " + (sch.length === 1 ? "schedule" : "schedules") + " (" + sch.length + ") ready: " +
      sch.slice(0, 3).map(label).join(", ") + (sch.length > 3 ? ", …" : "") + ". Add these to your group or replace its schedules.";
    $("banner").hidden = false;
  } catch (e) { clearHash(); }
}
$("bImport").onclick = () => { try { requestImport(pendingShare); } catch (e) { pendingShare = null; $("banner").hidden = true; clearHash(); } };
$("bDismiss").onclick = () => { pendingShare = null; $("banner").hidden = true; clearHash(); };
addEventListener("hashchange", checkHash);

// ---- Dialog lifecycle, reset, and startup ----
function buildAll() {
  // Build controls before applying appearances so palette inputs and UI labels
  // exist when the current settings are pushed into the page.
  buildSchedUI();
  buildThemeUI();
  applyTheme();
  applyDisplay();
}
arm($("reset"), "Tap again to reset", () => {
  try { localStorage.removeItem(KEY); localStorage.removeItem("schoolSchedule.v2"); } catch (e) {}
  settings = clone(DEFAULTS);
  buildAll();
});

const dlg = $("dlg");
// Clicking inside the dialog body does not dismiss an in-progress edit.
$("gear").onclick = () => dlg.showModal();
$("close").onclick = $("done2").onclick = () => dlg.close();
dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });

// Keyboard shortcuts act only on the page itself. Editing controls, modified
// key combinations, and open dialogs keep their normal browser behavior.
const keysDlg = $("keysDlg");
$("helpKeys").onclick = () => keysDlg.showModal();
$("keysClose").onclick = () => keysDlg.close();
keysDlg.addEventListener("click", e => { if (e.target === keysDlg) keysDlg.close(); });
document.addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey || dlg.open || keysDlg.open) return;
  if (e.target.closest && e.target.closest("input,textarea,select,[contenteditable='true']")) return;
  if (e.key.toLowerCase() === "s") { e.preventDefault(); dlg.showModal(); }
  else if (e.key.toLowerCase() === "t") {
    $("scheduleTitle").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    $("scheduleTitle").focus({ preventScroll: true });
  } else if (e.key === "?") keysDlg.showModal();
});

// Settings tabs keep the dialog compact. Remember the last section locally, but
// fall back to Schedules when storage contains an unknown tab name.
(function () {
  const bar = $("stabs"); if (!bar) return;
  const panels = [...document.querySelectorAll(".panel")];
  const btns = [...bar.querySelectorAll(".stab")];
  const read = () => { try { return localStorage.getItem("settingsTab"); } catch (e) { return null; } };
  function show(id) {
    panels.forEach(p => { p.hidden = p.dataset.tab !== id; });
    btns.forEach(b => { const on = b.dataset.tab === id; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
  }
  btns.forEach(b => {
    b.tabIndex = -1;
    b.onclick = () => { show(b.dataset.tab); try { localStorage.setItem("settingsTab", b.dataset.tab); } catch (e) {} };
  });
  bar.addEventListener("keydown", e => {
    const current = btns.indexOf(document.activeElement);
    if (current < 0) return;
    let next = current;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (current + 1) % btns.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (current - 1 + btns.length) % btns.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = btns.length - 1;
    else return;
    e.preventDefault();
    btns[next].focus();
    btns[next].click();
  });
  let start = read();
  if (!panels.some(p => p.dataset.tab === start)) start = "schedules";
  show(start);
})();

buildAll();
checkHash();
setInterval(tick, 500);
