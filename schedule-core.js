(function (root, factory) {
  const core = factory();
  if (typeof module === "object" && module.exports) module.exports = core;
  else root.SchoolScheduleCore = core;
})(globalThis, function () {
  "use strict";

  const timeToSeconds = value => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value || "");
    return match && Number(match[1]) < 24 && Number(match[2]) < 60
      ? Number(match[1]) * 3600 + Number(match[2]) * 60 : null;
  };

  function checkPeriods(periods) {
    if (!Array.isArray(periods)) return { ok: false, msg: "Add at least one class." };
    const list = [];
    for (const period of periods) {
      if (!period || typeof period !== "object") return { ok: false, msg: "Set a start and end time for every period." };
      const kind = period.kind === "passing" ? "passing" : "class";
      const start = timeToSeconds(period.start), end = timeToSeconds(period.end);
      const name = (period.name || "").trim() || (kind === "passing" ? "Passing time" : "Untitled");
      if (start == null || end == null) return { ok: false, msg: "Set a start and end time for every period." };
      if (end <= start) return { ok: false, msg: name + ": the end time must be after the start time." };
      list.push({
        name, start, end,
        teacher: (period.teacher || "").trim(),
        room: (period.room || "").trim(),
        note: (period.note || "").trim(),
        kind
      });
    }
    if (!list.length) return { ok: false, msg: "Add at least one class." };
    if (!list.some(period => period.kind !== "passing")) return { ok: false, msg: "Add at least one class, not just passing periods." };
    list.sort((a, b) => a.start - b.start);
    for (let index = 1; index < list.length; index++) {
      if (list[index].start < list[index - 1].end) {
        return { ok: false, msg: list[index - 1].name + " and " + list[index].name + " overlap." };
      }
    }
    return { ok: true, list };
  }

  function isValidDateKey(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!match) return false;
    const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  const dateOrdinal = value => {
    if (!isValidDateKey(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    return Date.UTC(year, month - 1, day) / 86400000;
  };

  function isMonday(value) {
    const ordinal = dateOrdinal(value);
    return ordinal != null && new Date(ordinal * 86400000).getUTCDay() === 1;
  }

  function weekIndex(dateKey, anchorMonday) {
    const day = dateOrdinal(dateKey), anchor = dateOrdinal(anchorMonday);
    if (day == null || anchor == null || !isMonday(anchorMonday)) return null;
    return Math.floor((day - anchor) / 7);
  }

  function rotatingSetId(dateKey, rotation, fallbackSetId) {
    if (!rotation || rotation.enabled !== true ||
        typeof rotation.setAId !== "string" || typeof rotation.setBId !== "string" ||
        !rotation.setAId || !rotation.setBId || rotation.setAId === rotation.setBId) return fallbackSetId;
    const index = weekIndex(dateKey, rotation.anchorMonday);
    if (index == null) return fallbackSetId;
    return ((index % 2 + 2) % 2) === 0 ? rotation.setAId : rotation.setBId;
  }

  function findDateException(dateKey, exceptions) {
    if (!isValidDateKey(dateKey) || !Array.isArray(exceptions)) return null;
    return exceptions.find(exception => exception && exception.date === dateKey) || null;
  }

  return { checkPeriods, findDateException, isMonday, isValidDateKey, rotatingSetId, weekIndex };
});
