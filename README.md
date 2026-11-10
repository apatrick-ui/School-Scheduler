# School Schedule

A small, build-free school schedule dashboard. The app runs in the browser from `index.html`; it uses plain HTML, CSS, and JavaScript with no package install or bundler.

## Files

- `index.html` — semantic page structure, settings dialogs, and feedback form.
- `styles.css` — theme tokens, component styles, responsive layout, and motion rules. The final dashboard and mobile sections intentionally override earlier component defaults; preserve that order when editing.
- `app.js` — settings model, schedule calculations, live dashboard, editor, comparison view, themes, backup/share flows, and dialog events.
- `feedback-config.js` — Google Apps Script `/exec` endpoint used by the feedback form.
- `feedback/Code.gs` — Apps Script handler that appends feedback rows to the linked spreadsheet. `feedback/README.md` covers deployment.
- `icon.svg` — app icon.

## JavaScript map

`app.js` is organized in this order:

1. Defaults, palettes, and small DOM helpers
2. Schedule validation, time parsing, saved-state cleanup, and migration
3. Schedule-group selection and dashboard controls
4. Theme and display preferences
5. Clock formatting, sound, alerts, and celebration effects
6. Today's list, weekly comparison, and the half-second `tick()` update loop
7. Schedule editor and one-day overrides
8. Appearance and reminder settings
9. Share links, import choices, and backup/restore
10. Feedback, dialogs, keyboard shortcuts, and startup

## Data flow and conventions

- `settings` is the source of truth. `load()` cleans browser storage; edits update it, `save()` persists it, and `tick()` derives the live view.
- Browser storage key: `schoolSchedule.v3`. Preserve the `sanitize()` and migration paths when changing the saved shape.
- Weekday values use JavaScript's `Date#getDay()` convention: Sunday is `0`, Saturday is `6`.
- Schedule times are stored as `HH:MM` strings and converted to seconds after midnight for comparisons. Periods in one schedule must not overlap and must include a class period.
- Each schedule belongs to a schedule group (`setId`). One-day overrides and time adjustments are stored separately so they do not rewrite the weekly schedule.
- Dynamic text is inserted with `textContent` through `mk()`; keep imported names, notes, and feedback out of `innerHTML`.
- DOM IDs are shared between `index.html` and `app.js`. Change both together when renaming a control.
- Theme settings map to CSS custom properties and `data-*` states on `<html>`; the live hero uses `data-mode` and `data-level`.

## Feedback integration

The form sends only category, message, and optional name. Google Apps Script's browser response is cross-origin, so the app uses a `no-cors` POST and cannot inspect Google's response body. The form reports that the request was sent; confirm delivery in the spreadsheet. The configured endpoint lives in `feedback-config.js`.

## Styling notes

CSS values are driven by custom properties so user-selected themes and corner styles can flow through the same components. Keep reduced-motion overrides for newly added animations. Later dashboard and responsive rules are intentional overrides; when changing a component, search for every matching selector in `styles.css` before editing.
