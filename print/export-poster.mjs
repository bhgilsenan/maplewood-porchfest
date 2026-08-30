// Screenshots print/poster-2026.html to the final print PNG.
// Run with: node print/export-poster.mjs
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 11x17" @ 300 DPI, portrait.
const WIDTH = 3300;
const HEIGHT = 5100;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });

  const fileUrl = "file://" + path.join(__dirname, "poster-2026.html");
  await page.goto(fileUrl, { waitUntil: "networkidle" });

  const outPath = path.join(__dirname, "poster-2026.png");
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  console.log("Saved", outPath);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
