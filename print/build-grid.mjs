// Generates print/grid-2026.html — a standalone version of just the
// schedule grid table (no map, no rail), for handing to Tracy to drop into
// her own printable. Reuses print/build-poster.mjs's PF_DATA/TIME_SLOTS/
// parseHour/shortDescriptor so this never drifts from the poster or the
// embed's own Grid view.
// Run with: node print/build-grid.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PF_DATA, TIME_SLOTS, parseHour, shortDescriptor } from "./build-poster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const scheduleRowsHtml = PF_DATA.porches
  .map((porch) => {
    const cells = TIME_SLOTS.map((slot) => {
      const act = porch.performers.find(
        (p) => parseHour(p.time_start) < slot.hourEnd && parseHour(p.time_end) > slot.hourStart
      );
      if (!act) return '<td class="cell"></td>';
      const blurb = shortDescriptor(porch.id, act.name) || act.genre;
      return (
        '<td class="cell">' +
        '<div class="act-name">' + escapeHtml(act.name) + "</div>" +
        '<div class="act-genre">' + escapeHtml(blurb) + "</div>" +
        "</td>"
      );
    }).join("");
    return (
      '<tr>' +
      '<td class="col-porch"><span class="porch-badge">' + porch.id + "</span> " +
      '<span class="porch-address">' + escapeHtml(porch.address) + "</span></td>" +
      cells +
      "</tr>"
    );
  })
  .join("\n");

const timeHeaderCellsHtml = TIME_SLOTS.map((slot) => "<th>" + escapeHtml(slot.label) + "</th>").join("");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Maplewood Porchfest 2026 — Schedule Grid</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  :root {
    --pf-bg: #ffffff;
    --pf-surface-2: #eeeeef;
    --pf-border: #e7e7e8;
    --pf-text: #000000;
    --pf-text-muted: rgba(0,0,0,.62);
    --pf-text-faint: rgba(0,0,0,.42);
    --pf-primary: #93358d;
    --pf-primary-contrast: #ffffff;
    --pf-cta: #ff5d00;
    --pf-cta-contrast: #000000;
    --pf-font-display: 'kepler-std', Georgia, serif;
    --pf-font-body: 'DM Sans', -apple-system, sans-serif;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    width: 11in;
    background: var(--pf-bg);
    color: var(--pf-text);
    font-family: var(--pf-font-body);
  }
  .page { width: 11in; height: 17in; padding: .32in .55in; }

  .header { text-align: center; margin-bottom: .14in; }
  .title { font-family: var(--pf-font-display); font-weight: 400; font-size: 32px; margin: 0; line-height: 1; }
  .subtitle { font-size: 15px; margin: 8px 0 0; }
  .subtitle .date { color: var(--pf-primary); font-weight: 700; }
  .subtitle .dot { color: var(--pf-cta); margin: 0 8px; }
  .subtitle .hours { color: var(--pf-text-muted); }

  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  col.col-porch { width: 27%; }
  thead th {
    background: var(--pf-primary); color: var(--pf-primary-contrast);
    font-size: 12px; font-weight: 700; padding: 5px 8px; text-align: left;
  }
  tbody tr:nth-child(even) { background: var(--pf-surface-2); }
  tbody td { padding: 2px 8px; border-bottom: 1px solid var(--pf-border); vertical-align: middle; font-size: 10px; line-height: 1.1; }
  td.col-porch { white-space: nowrap; }
  .porch-badge {
    display: inline-flex; align-items: center; justify-content: center; vertical-align: middle;
    width: 19px; height: 19px; border-radius: 50%; background: var(--pf-cta); color: var(--pf-cta-contrast);
    font-family: var(--pf-font-display); font-weight: 800; font-size: 10px;
  }
  .porch-address {
    display: inline-block; vertical-align: middle; margin-left: 8px;
    font-family: var(--pf-font-display); font-weight: 600; font-size: 10px; white-space: normal; line-height: 1.1;
  }
  td.cell { font-size: 10px; line-height: 1.1; }
  .act-name { font-weight: 700; line-height: 1.1; }
  .act-genre { color: var(--pf-text-muted); font-size: 9px; line-height: 1.1; }

  .footer {
    margin-top: .1in; padding-top: .06in; border-top: 1px solid var(--pf-border);
    text-align: center; font-size: 9px; color: var(--pf-text-faint); font-style: italic;
  }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <h1 class="title">Maplewood Porchfest 2026 — Schedule</h1>
    <p class="subtitle">
      <span class="date">${escapeHtml(PF_DATA.event.date)}</span>
      <span class="dot">•</span>
      <span class="hours">${escapeHtml(PF_DATA.event.hours)}</span>
    </p>
  </div>

  <table>
    <colgroup>
      <col class="col-porch"><col><col><col><col>
    </colgroup>
    <thead>
      <tr>
        <th class="col-porch">Porch / Address</th>
        ${timeHeaderCellsHtml}
      </tr>
    </thead>
    <tbody>
${scheduleRowsHtml}
    </tbody>
  </table>

  <div class="footer">Rain date: ${escapeHtml(PF_DATA.event.rain_date)}</div>

</div>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, "grid-2026.html"), html);
console.log("Wrote", path.join(__dirname, "grid-2026.html"));
console.log(PF_DATA.porches.length, "porches");
