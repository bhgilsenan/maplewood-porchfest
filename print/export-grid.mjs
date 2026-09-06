// Renders print/grid-2026.html to print/grid-2026.pdf (vector, 17x11in
// landscape) via Chromium print-to-PDF, so Tracy can drop it straight into
// her own printable at any scale.
// Run with: node print/export-grid.mjs
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const fileUrl = "file://" + path.join(__dirname, "grid-2026.html");
  await page.goto(fileUrl, { waitUntil: "networkidle" });

  const outPath = path.join(__dirname, "grid-2026.pdf");
  await page.pdf({
    path: outPath,
    width: "11in",
    height: "17in",
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  console.log("Saved", outPath);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
