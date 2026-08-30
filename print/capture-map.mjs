// Screenshots the live 2026 My Maps embed at high resolution for use as the
// poster's map image. Run with: node print/capture-map.mjs
//
// Uses the same mid= map ID as embed/schedule.html's iframe src, with an
// explicit center/zoom (found by resolving the default embed URL, then
// bumping zoom by 1) so the frame is tightly cropped to the actual porch
// footprint instead of showing the whole surrounding town. Hides the My
// Maps chrome (title bar, zoom/fullscreen buttons, Google/My Maps
// watermark) via injected CSS, and explicitly toggles the Food layer off
// (Brendan's call — restaurants aren't shown on the printable map). The
// small "Map data / Terms" attribution line is deliberately left visible
// (Google's own attribution requirement), unlike the rest of the UI.
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MAP_ID = "1BdF9F9VBZwKVFPumgYlu57XXHtihNTw";
// Center resolved from the default (no ll/z) embed URL's post-load
// redirect; zoom bumped from the default 16 to 17 to tighten the frame
// around the actual porch cluster (was showing lots of dead space —
// I-78 to the south, far residential blocks to the northeast).
const CENTER_LL = "40.71888605411781,-74.26418719999997";
const ZOOM = 17;
const MAP_URL = `https://www.google.com/maps/d/u/0/embed?mid=${MAP_ID}&ehbc=2E312F&noprof=1&ll=${encodeURIComponent(CENTER_LL)}&z=${ZOOM}`;

// Capture wider than the final crop so edge porches (e.g. #1, #8/#9 to the
// east, #3/#4/#5 to the south) have margin at this zoom level, then crop
// down to the actual porch footprint below. Bounds were found by eyeballing
// pin positions in a full-size capture, not computed exactly — good enough,
// don't over-engineer this further.
const VIEWPORT = { width: 2600, height: 1300 };
const DEVICE_SCALE = 2;
// Title bar height in CSS px, measured from an uncropped capture.
const TITLE_BAR_HEIGHT = 59;
// Final crop, in CSS px (device px / DEVICE_SCALE), tight around the porch
// footprint with modest padding.
const CROP = { x: 475, y: 225, width: 2075, height: 925 };

const HIDE_CSS = `
  .gm-fullscreen-control,
  .gm-bundled-control,
  #watermark,
  .nJjxad-bMcfAe-haAclf,
  .yePe5c-haAclf {
    display: none !important;
  }
`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
  });

  await page.goto(MAP_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Toggle the Food layer off (Brendan's call — no restaurants on the
  // printable map). The checkbox is a custom ARIA widget sitting in a
  // collapsed legend drawer, so it's not "visible" by Playwright's
  // actionability rules even though a direct DOM .click() still reaches
  // Google's jsaction handler fine. Found via the layer's visible label
  // text rather than hardcoding its "layer N" id, which isn't a stable
  // public API.
  function isFoodLayerChecked() {
    const label = Array.from(document.querySelectorAll("label")).find(
      (el) => el.getAttribute("aria-label") === "Food (Hilton Neighborhood).csv"
    );
    const checkbox = label && document.getElementById(label.getAttribute("for"));
    return checkbox ? checkbox.getAttribute("aria-checked") === "true" : null;
  }
  function clickFoodLayerCheckbox() {
    const label = Array.from(document.querySelectorAll("label")).find(
      (el) => el.getAttribute("aria-label") === "Food (Hilton Neighborhood).csv"
    );
    const checkbox = label && document.getElementById(label.getAttribute("for"));
    if (checkbox) checkbox.click();
  }
  // The click can be a little racy against My Maps' own re-render, so
  // retry until the state actually lands on unchecked.
  let foodHidden = false;
  for (let attempt = 0; attempt < 5 && !foodHidden; attempt++) {
    await page.evaluate(clickFoodLayerCheckbox);
    await page.waitForTimeout(600);
    const checked = await page.evaluate(isFoodLayerChecked);
    if (checked === null) throw new Error("Could not find the Food layer checkbox");
    foodHidden = checked === false;
  }
  if (!foodHidden) throw new Error("Could not toggle the Food layer off after retries");

  await page.addStyleTag({ content: HIDE_CSS });
  await page.waitForTimeout(300);

  const outPath = path.join(__dirname, "map-2026.png");
  await page.screenshot({
    path: outPath,
    clip: {
      x: CROP.x,
      y: TITLE_BAR_HEIGHT + CROP.y,
      width: CROP.width,
      height: CROP.height,
    },
  });
  console.log("Saved", outPath);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
