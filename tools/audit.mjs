/**
 * Layout gate. Builds nothing, assumes a server is already up, and fails with a
 * non-zero exit if any view stops using the window or starts scrolling
 * sideways.
 *
 * This exists because "looks fine on my monitor" is not a check. Fixed
 * max-widths that quietly wasted half a 1440px screen shipped once already.
 *
 *   node tools/audit.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:5177";
const OUT = "tools/shots";
mkdirSync(OUT, { recursive: true });

// Content must occupy at least this share of the window width. Not 100%: the
// page has side padding by design, and a search input is capped on purpose.
const MIN_WIDTH_USE = 0.85;
const MIN_TAP_TARGET = 44;
const MIN_FONT_PX = 12;

const VIEWPORTS = [
  { name: "mobile-360", width: 360, height: 780 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-1280", width: 1280, height: 800 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "wide-1920", width: 1920, height: 1080 },
  { name: "ultra-2560", width: 2560, height: 1440 },
  { name: "ultrawide-3440", width: 3440, height: 1440 },
];

const ROUTES = [
  { name: "list", hash: "" },
  { name: "detail", hash: "#/tricephalos" },
  { name: "detail-2form", hash: "#/sentient-pest" },
  { name: "detail-nodmg", hash: "#/gaping-jaw" },
];

const browser = await chromium.launch();
const rows = [];
const failures = [];

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  for (const route of ROUTES) {
    await page.goto(`${BASE}/${route.hash}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(200);

    const m = await page.evaluate(
      ({ MIN_TAP_TARGET, MIN_FONT_PX }) => {
        const de = document.documentElement;
        const widest = Math.max(
          0,
          ...[...document.querySelectorAll("main, article, ul, header, section, footer")]
            .map((el) => el.getBoundingClientRect().width)
            .filter((w) => w > 0),
        );
        const tiny = [...document.querySelectorAll("*")]
          .filter((el) => el.children.length === 0 && el.textContent.trim())
          .map((el) => parseFloat(getComputedStyle(el).fontSize))
          .filter((px) => px < MIN_FONT_PX);
        const smallTargets = [...document.querySelectorAll("button, a, input, select")]
          .map((el) => ({ tag: el.tagName, h: el.getBoundingClientRect().height }))
          .filter((t) => t.h > 0 && t.h < MIN_TAP_TARGET);
        const brokenImgs = [...document.images].filter((i) => !i.complete || i.naturalWidth === 0);
        return {
          viewportW: de.clientWidth,
          widest: Math.round(widest),
          overflowX: de.scrollWidth > de.clientWidth,
          tinyCount: tiny.length,
          smallestFont: tiny.length ? Math.min(...tiny) : null,
          smallTargets: smallTargets.length,
          brokenImgs: brokenImgs.length,
        };
      },
      { MIN_TAP_TARGET, MIN_FONT_PX },
    );

    const use = m.widest / m.viewportW;
    const where = `${vp.name}/${route.name}`;

    if (use < MIN_WIDTH_USE) {
      failures.push(
        `${where}: uses ${Math.round(use * 100)}% of width (${m.widest}px of ${m.viewportW}px)`,
      );
    }
    if (m.overflowX) failures.push(`${where}: scrolls horizontally`);
    if (m.tinyCount) failures.push(`${where}: ${m.tinyCount} nodes under ${MIN_FONT_PX}px (min ${m.smallestFont}px)`);
    if (m.smallTargets) failures.push(`${where}: ${m.smallTargets} tap targets under ${MIN_TAP_TARGET}px`);
    if (m.brokenImgs) failures.push(`${where}: ${m.brokenImgs} broken images`);

    rows.push({
      viewport: vp.name,
      route: route.name,
      width: m.viewportW,
      content: m.widest,
      use: `${Math.round(use * 100)}%`,
      overflowX: m.overflowX,
      tinyText: m.tinyCount,
    });

    await page.screenshot({ path: `${OUT}/${vp.name}-${route.name}.png` });
  }
  await page.close();
}

await browser.close();
console.table(rows);

if (failures.length) {
  console.error(`\nLAYOUT AUDIT FAILED — ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`\nLayout audit passed: ${rows.length} views, all >=${MIN_WIDTH_USE * 100}% width use.`);
