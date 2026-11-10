const SPREADSHEET_ID = "1qF_qj5hqwOOFUiFeuewFTpQp6QnR_6Oa-dHpOSTUYLE";
const FEEDBACK_SHEET_NAME = "Feedback";
const MAX_PER_MINUTE = 30;

function doPost(e) {
  let lock;
  try {
    const body = JSON.parse(e && e.postData && e.postData.contents || "{}");
    // Silently discard basic bot submissions without storing them.
    if (String(body.website || "").trim()) return output_({ ok: true });

    const message = String(body.message || "").trim().slice(0, 1200);
    const name = String(body.name || "").trim().slice(0, 60);
    const allowedTypes = ["Idea", "Bug", "Other"];
    const type = allowedTypes.includes(body.type) ? body.type : "Other";
    if (!message) return output_({ ok: false, error: "Feedback is empty." });

    lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) return output_({ ok: false, error: "Please try again shortly." });

    const cache = CacheService.getScriptCache();
    const minute = Math.floor(Date.now() / 60000);
    const key = "feedback_count_" + minute;
    const count = Number(cache.get(key) || 0);
    if (count >= MAX_PER_MINUTE) return output_({ ok: false, error: "Feedback limit reached. Try again later." });
    cache.put(key, String(count + 1), 120);

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(FEEDBACK_SHEET_NAME);
    if (!sheet) sheet = spreadsheet.insertSheet(FEEDBACK_SHEET_NAME);
    const headers = ["Submitted at", "Type", "Feedback", "Name"];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 4).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, 4).setFontWeight("bold");
      sheet.setColumnWidth(1, 155);
      sheet.setColumnWidth(2, 100);
      sheet.setColumnWidth(3, 500);
      sheet.setColumnWidth(4, 180);
    } else {
      const existingHeaders = sheet.getRange(1, 1, 1, 4).getDisplayValues()[0];
      const oldHeadersMatch = headers.every((header, i) => existingHeaders[i] === header);
      if (!oldHeadersMatch) {
        throw new Error("The Feedback tab already has different columns. Rename it or clear it before using this connector.");
      }
    }
    sheet.appendRow([new Date(), safeCell_(type), safeCell_(message), safeCell_(name)]);
    return output_({ ok: true });
  } catch (error) {
    console.error(error);
    return output_({ ok: false, error: "Unable to save feedback." });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function safeCell_(value) {
  const text = String(value || "");
  // Treat user text as plain text in Sheets, even if it begins with a formula marker.
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function output_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
