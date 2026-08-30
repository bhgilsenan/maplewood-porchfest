// Generates print/poster-2026.html — the printable poster (11x17 @300dpi
// portrait, 3300x5100px canvas). Pulls real content straight from the
// existing sources of truth instead of hand-transcribing 40 rows:
//   - embed/schedule.html's inline PF_DATA (event info + full porch lineup)
//   - data/2026/map-import/Lemonade Stands.csv (Refreshments for a Good Cause)
// Run with: node print/build-poster.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

// ---------- extract PF_DATA from the live embed ----------
const scheduleHtml = fs.readFileSync(path.join(repoRoot, "embed/schedule.html"), "utf8");
const match = scheduleHtml.match(/var PF_DATA = (\{[\s\S]*?\n\s{2}\};)/);
if (!match) throw new Error("Could not find PF_DATA in embed/schedule.html");
// eslint-disable-next-line no-new-func
const PF_DATA = new Function("return " + match[1].replace(/;$/, ""))();

// ---------- parse Lemonade Stands.csv (Address,Charity) ----------
const csvRaw = fs.readFileSync(
  path.join(repoRoot, "data/2026/map-import/Lemonade Stands.csv"),
  "utf8"
);
const lemonadeRows = csvRaw
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => {
    const m = line.match(/^"([^"]+)",(.+)$/);
    if (!m) return null;
    const address = m[1].replace(/,\s*Maplewood,\s*NJ$/i, "");
    return { address, charity: m[2].trim() };
  })
  .filter(Boolean);

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- short act descriptors ----------
// The 2025 printed schedule used a short, specific phrase under each act
// name instead of a bare genre word (e.g. "Kief Shuvel (Hazy Heavy Folk
// Rock)", "Over My Dad Body (Sad dad indie rawk you need in your life)").
// These are hand-compressed from PF_DATA's own longer `description` field
// for each performer (same source the digital schedule uses) — not new
// claims, just shorter phrasings of what's already there. Keyed by
// "porchId|performer name" since a couple of names could theoretically
// repeat across different porches. Falls back to the genre tag if a
// performer is ever added here without a matching entry (see cell render
// below), so this list can lag a lineup change without breaking the build.
const SHORT_DESCRIPTIONS = {
  "1|Jason Didner and the GSPs": "Jersey rock with a side of humor",
  "1|Lorraine": "High-energy pop-rock from Summit, NJ",
  "2|Daniel Scanfeld": "Solo folk-rock: originals + Tweedy/Petty/Prine covers",
  "2|HEEL STRIKE": "Live modular-synth ambient/industrial/techno",
  "3|Pegasus Meteor Fist": "Power trio: classic rock, emo, punk & metal",
  "3|The Melancholy Kings": "Jangly indie rock, Teenage Fanclub/R.E.M. vein",
  "3|Tri-State": "Big hooks & tight harmonies, post-youth stories",
  "4|belikeAlice": "Rock/New Wave/punk spanning the 60s-2000s",
  "4|Cassette Tape Ministry": "Improvised rock with original poetry",
  "4|Schplinkus": "Upbeat, genre-bending alt rock",
  "5|Rory D'Lasnow": "Folk-Americana storytelling singer-songwriter",
  "5|Delta": "Fiery teen blues trio",
  "6|Breaknrecords band": "High-energy soul-funk with a twist",
  "6|Bangarang": "Dad band blasting 90s grunge/alt-rock",
  "7|Mannekin Skywalker/Jessica Keuskamp": "Deadpan lyrics, saucy guitar riffs",
  "7|Avery Sinclair": "Homegrown teen singer-songwriter, debut album",
  "7|Max Kravitz": "Pop/indie/electronic crossover",
  "8|The Coverup": "Straight-up classic rock, no gimmicks",
  "8|Tiger Bomb": "Dad-band 90s alt-rock & classics",
  "8|Over My Dad Body": "Self-described “sad-dad rock”",
  "9|Alex Klint": "Maplewood local singer-songwriter",
  "9|Michael Sorensen": "Electronic rock & experimental soundscapes",
  "10|Smoove": "Classic reggae/lovers rock, laid-back groove",
  "10|Carnival Dogs": "Acoustic chill to rock-and-roll party",
  "11|Chris Mozy": "Pop/rock/alt-country multi-instrumentalist",
  "12|Michael Glazier": "Acoustic covers & originals, crowd-pleasing",
  "13|Mag Electric": "Full-volume hard rock, Hendrix/Mountain covers",
  "14|Yeah Is What We Have": "Power pop, hooks that stick",
  "15|Useful Engines": "Original funk/classic-rock/alt jams",
  "15|The Accelerators": "Power pop trio: British Invasion to New Wave",
  "16|The Refugee Dogs": "Original rock, insightful to off-color",
  "17|The Spectrums": "Teen rock: alt/grunge/metal influences",
  "18|The Illars": "Ukulele/bass indie-folk “reggae-folk-hop”",
  "18|mombrain.": "Moms-turned-band: 90s grunge/punk/indie",
  "19|Paul Burroughs": "Guitar-drums duo, heartfelt folk rock",
  "19|Triskele NJ": "Traditional Irish jigs, reels & hornpipes",
  "20|Somebody’s Uncle": "High-energy classic/alt-rock sing-alongs",
  "20|Travel Team": "All-star dad-band rock debut",
  "21|Flip Da Skrip": "R&B/hip-hop/soul, uptempo to smooth",
  "22|Double A band": "12-year-old duo, Apollo Amateur Night winners",
  "23|Bearded Jon’s Artless Commerce Laboratory": "Solo bass, psychedelic ambient loops",
  "23|Jay Daniels": "Piano & vocals: Songbook, pop, Broadway",
  "24|Paul Crane and the Overend Watts": "Americana-infused power-pop",
  "24|Not Nothing But Something": "Self-styled “Minimalist 90s Midwest Emo Talkcore”",
  "25|oscar and the ladybugs": "Intimate indie-folk, Sufjan/Lenker vein",
  "25|Catch Me If You Can": "Narrative acoustic folk with an edge",
  "26|Paul Whitty/The Whitby": "Acoustic guitar & mandolin, covers/originals",
  "26|ZööS": "High-energy classic rock covers",
  "27|The Maybes": "Family band: pop, folk & rock",
  "28|Içosery": "Teen covers: Linkin Park to Olivia Rodrigo",
  "28|Rebecca KellyG": "Solo vocal looping, guttural to ethereal",
  "29|DJ OP!": "DJ set: house, disco, funk & soul",
  "29|EvrDream": "“Beats, Synths & Riffs” alt-rock/electronica",
  "30|Crow Magnum": "Hard-hitting rock anthems",
  "30|Dizzy Lizard": "Teen band: classic rock to pop hits",
  "31|Meant to be": "Jazz standards, Latin/R&B edge",
  "31|Gina Royale": "High-energy pop, Paramore/Taylor Swift vibes",
  "32|The Mutts": "Rock debut: originals & classic covers",
  "32|Tweezer": "Middle-schoolers’ Weezer tribute",
  "32|Foggy Family (Foggy Minded Boys and Foggettes)": "Bluegrass, country & comedy mix",
  "33|Big Train": "Horn-infused R&B/soul block-party grooves",
  "34|Bern & the Brights": "Melodic indie duo, Jeff Buckley vein",
  "34|The Nightly Noodle": "Instrumental lo-fi guitar, Khruangbin-esque",
  "35|Harrison Clock Band": "Indie rock, “strangely moving”",
  "35|The Resolve": "Heavy rock trio, originals & covers",
  "35|DC & the Desperados": "Loud, straight-up rock and roll",
  "36|Sh*tburger": "Old-school country/rock antidote",
  "36|The Third Project": "Family band’s Beatles-covers set",
  "36|Unheard Of": "Fuzzy, noisy art rock",
  "37|My lost horse": "Duo playing 80s/90s radio favorites",
  "37|Sarah Hodd + The Drive": "8-piece band: bluesy soul originals",
  "38|LAREDO and Friends": "Neighborhood favorites’ Americana smorgasbord",
  "38|Ziggy Grover": "Life-stories-into-song singer-songwriter",
  "39|In My Basement": "High-energy indie rock, catchy riffs",
  "39|The Burrhead Ramblers": "High-energy bluegrass & folk debut",
  "40|Just For Fun": "Soul/R&B/pop-rock covers",
  "40|No Left Turn": "Alt-rock: Pearl Jam meets Radiohead",
};

function shortDescriptor(porchId, name) {
  return SHORT_DESCRIPTIONS[porchId + "|" + name] || null;
}

// ---------- build the schedule grid: one row per porch, 4 time columns ----------
const TIME_SLOTS = [
  { label: "1–2 PM", hourStart: 13, hourEnd: 14 },
  { label: "2–3 PM", hourStart: 14, hourEnd: 15 },
  { label: "3–4 PM", hourStart: 15, hourEnd: 16 },
  { label: "4–5 PM", hourStart: 16, hourEnd: 17 },
];

function parseHour(t) {
  const m = /(\d+)(?::\d+)?\s*(AM|PM)/i.exec(t);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  if (m[2].toUpperCase() === "PM" && h !== 12) h += 12;
  return h;
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

// ---------- refreshments list ----------
const refreshmentsHtml = lemonadeRows
  .map(
    (r) =>
      '<li><span class="refresh-address">' + escapeHtml(r.address) + "</span> — " +
      '<span class="refresh-charity">' + escapeHtml(r.charity) + "</span></li>"
  )
  .join("\n");

// ---------- QR code ----------
// Points at the live My Maps viewer link (same map ID used in the embed's
// iframe) as a stand-in target — swap for the real maplewoodporchfest.com
// schedule URL once Tracy confirms which she wants (see plan's open
// questions).
const QR_TARGET = "https://www.google.com/maps/d/u/0/viewer?mid=1BdF9F9VBZwKVFPumgYlu57XXHtihNTw";
const qrDataUrl = await QRCode.toDataURL(QR_TARGET, { margin: 1, width: 400 });

// ---------- assemble the page ----------
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Maplewood Porchfest 2026 — Poster</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  :root {
    --pf-bg: #ffffff;
    --pf-surface: #ffffff;
    --pf-surface-2: #eeeeef;
    --pf-border: #e7e7e8;
    --pf-text: #000000;
    --pf-text-muted: rgba(0,0,0,.62);
    --pf-text-faint: rgba(0,0,0,.42);
    --pf-primary: #93358d;
    --pf-primary-contrast: #ffffff;
    --pf-cta: #ff5d00;
    --pf-cta-contrast: #000000;
    --pf-cta-soft: rgba(255,93,0,.14);
    --pf-font-display: 'kepler-std', Georgia, serif;
    --pf-font-body: 'DM Sans', -apple-system, sans-serif;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    width: 3300px;
    background: var(--pf-bg);
    color: var(--pf-text);
    font-family: var(--pf-font-body);
  }
  .poster { width: 3300px; height: 5100px; padding: 100px; position: relative; }

  /* ---- header ---- */
  .header { text-align: center; margin-bottom: 44px; }
  .title { font-family: var(--pf-font-display); font-weight: 400; font-size: 150px; margin: 0; line-height: 1; }
  .subtitle { font-size: 42px; margin: 22px 0 0; }
  .subtitle .date { color: var(--pf-primary); font-weight: 700; }
  .subtitle .dot { color: var(--pf-cta); margin: 0 18px; }
  .subtitle .hours { color: var(--pf-text-muted); }
  .raindate { font-size: 30px; color: var(--pf-text-faint); font-style: italic; margin: 14px 0 0; }

  /* ---- map ---- */
  .map-wrap {
    border-radius: 36px; border: 5px solid var(--pf-border); overflow: hidden;
    margin-bottom: 48px; line-height: 0;
  }
  .map-wrap img { width: 100%; display: block; }

  /* ---- body: table + rail ---- */
  .body-row { display: flex; gap: 56px; }
  .schedule-col { flex: 1 1 68%; min-width: 0; }
  .rail-col { flex: 0 0 30%; display: flex; flex-direction: column; gap: 36px; justify-content: space-between; }

  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  col.col-porch { width: 30%; }
  thead th {
    background: var(--pf-primary); color: var(--pf-primary-contrast);
    font-size: 26px; font-weight: 700; padding: 14px 10px; text-align: left;
  }
  tbody tr:nth-child(even) { background: var(--pf-surface-2); }
  tbody td { padding: 10px; border-bottom: 1px solid var(--pf-border); vertical-align: middle; font-size: 22px; }
  td.col-porch { white-space: nowrap; }
  .porch-badge {
    display: inline-flex; align-items: center; justify-content: center; vertical-align: middle;
    width: 46px; height: 46px; border-radius: 50%; background: var(--pf-cta); color: var(--pf-cta-contrast);
    font-family: var(--pf-font-display); font-weight: 800; font-size: 22px;
  }
  .porch-address {
    display: inline-block; vertical-align: middle; margin-left: 14px;
    font-family: var(--pf-font-display); font-weight: 600; font-size: 22px; white-space: normal;
  }
  td.cell { font-size: 20px; line-height: 1.25; }
  .act-name { font-weight: 700; }
  .act-genre { color: var(--pf-text-muted); font-size: 17px; }

  /* ---- rail ---- */
  .wordmark {
    text-align: center; font-family: var(--pf-font-body); font-size: 24px; font-weight: 700;
    letter-spacing: .12em; text-transform: uppercase; color: var(--pf-primary);
  }

  .card {
    background: var(--pf-surface); border-radius: 24px; padding: 32px;
  }
  .card--parade { border: 4px solid var(--pf-cta); }
  .card--refresh { border: 1.5px solid var(--pf-border); }
  .card-title { display: flex; align-items: center; gap: 14px; font-family: var(--pf-font-display); font-weight: 700; font-size: 34px; margin: 0 0 14px; }
  .card-icon { font-size: 40px; line-height: 1; }
  .card-body { font-size: 22px; line-height: 1.5; }
  .card-body strong { font-weight: 700; }

  .refresh-list { list-style: none; margin: 0; padding: 0; font-size: 19px; line-height: 1.7; }
  .refresh-list li { padding: 6px 0; border-bottom: 1px solid var(--pf-border); }
  .refresh-list li:last-child { border-bottom: none; }
  .refresh-address { font-weight: 700; }
  .refresh-charity { color: var(--pf-text-muted); }

  .qr-card { text-align: center; }
  .qr-card img { width: 260px; height: 260px; display: block; margin: 0 auto 16px; }
  .qr-caption { font-size: 20px; color: var(--pf-text-muted); }

  /* ---- footer ---- */
  .footer {
    margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--pf-border);
    text-align: center; font-size: 20px; color: var(--pf-text-faint); font-style: italic;
  }
</style>
</head>
<body>
<div class="poster">

  <div class="header">
    <h1 class="title">Maplewood Porchfest 2026</h1>
    <p class="subtitle">
      <span class="date">${escapeHtml(PF_DATA.event.date)}</span>
      <span class="dot">•</span>
      <span class="hours">${escapeHtml(PF_DATA.event.hours)}</span>
    </p>
    <p class="raindate">Rain date: ${escapeHtml(PF_DATA.event.rain_date)}</p>
  </div>

  <div class="map-wrap">
    <img src="map-2026.png" alt="Map of Porchfest porches, lemonade stands, services, and the Honk Parade route">
  </div>

  <div class="body-row">
    <div class="schedule-col">
      <table>
        <colgroup>
          <col class="col-porch"><col><col><col><col>
        </colgroup>
        <thead>
          <tr>
            <th class="col-porch">Porch / Address</th>
            <th>1–2 PM</th><th>2–3 PM</th><th>3–4 PM</th><th>4–5 PM</th>
          </tr>
        </thead>
        <tbody>
${scheduleRowsHtml}
        </tbody>
      </table>
    </div>

    <div class="rail-col">
      <div class="wordmark">Maplewood Porchfest</div>

      <div class="card card--parade">
        <p class="card-title"><span class="card-icon">🏁</span> Honk Parade</p>
        <p class="card-body">
          Gather at ${escapeHtml(PF_DATA.event.honk_parade_location)}: rehearsal
          <strong>${escapeHtml(PF_DATA.event.honk_parade_rehearsal)}</strong>, kickoff
          <strong>${escapeHtml(PF_DATA.event.honk_parade_kickoff)}</strong>.
          Marches through the Hilton neighborhood down Lexington Ave. All welcome to march or watch.
        </p>
      </div>

      <div class="card card--refresh">
        <p class="card-title"><span class="card-icon">🍋</span> Refreshments for a Good Cause</p>
        <ul class="refresh-list">
${refreshmentsHtml}
        </ul>
      </div>

      <div class="card card--refresh qr-card">
        <img src="${qrDataUrl}" alt="QR code to the interactive map">
        <p class="qr-caption">Scan for the live interactive map</p>
      </div>
    </div>
  </div>

  <div class="footer">
    Welcome! Several streets will be closed to car traffic during Porchfest — these streets remain open to pedestrians and bicyclists. On other streets, please be mindful of traffic.
  </div>

</div>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, "poster-2026.html"), html);
console.log("Wrote", path.join(__dirname, "poster-2026.html"));
console.log(PF_DATA.porches.length, "porches,", lemonadeRows.length, "lemonade stands");

const missingDescriptors = [];
PF_DATA.porches.forEach((porch) => {
  porch.performers.forEach((p) => {
    if (!shortDescriptor(porch.id, p.name)) missingDescriptors.push(porch.id + "|" + p.name);
  });
});
if (missingDescriptors.length) {
  console.warn(
    "Falling back to genre tag for",
    missingDescriptors.length,
    "performer(s) with no short descriptor (likely a name-matching typo):"
  );
  missingDescriptors.forEach((k) => console.warn("  " + k));
}

// Exported for print/dump-table-json.mjs, which reuses this same data to
// feed the Figma rebuild — keeps the two outputs (PNG poster, Figma file)
// from drifting out of sync with two copies of the descriptor list.
export { PF_DATA, TIME_SLOTS, parseHour, shortDescriptor, lemonadeRows };
