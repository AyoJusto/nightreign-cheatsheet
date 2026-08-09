/**
 * Content check: assert what the page actually renders, not what the source
 * says. Catches the case where a stale server is serving an old build — which
 * is exactly how a "verified" screenshot lied once already.
 *
 *   node tools/verify.mjs [baseUrl]
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:5177";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const fail = [];

async function textOf(hash) {
  await page.goto(`${BASE}/${hash}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(150);
  return page.evaluate(() => document.body.innerText);
}

const list = await textOf("");
const detail = await textOf("#/dreglord");

// Check this first and bail. A blank page fails every assertion below for the
// same single reason, and the useful message is "nothing rendered" — not a
// selector timeout thirty seconds later, which is how a base-path bug that
// 404'd the whole bundle nearly went unnoticed.
if (!list.trim() || !detail.trim()) {
  console.error("CONTENT VERIFY FAILED: the page rendered nothing.");
  console.error("  Usually a base-path mismatch — open devtools and check for 404s on /assets/.");
  await browser.close();
  process.exit(1);
}

// The expedition name is the only name shown. Nightlord names were removed
// from the UI but deliberately kept searchable.
const NIGHTLORD_NAMES = [
  "Traitorous Straghess",
  "Gladius",
  "Adel",
  "Gnoster",
  "Maris",
  "Libra",
  "Fulghor",
  "Caligo",
  "Heolstor",
  "Harmonia",
];
for (const name of NIGHTLORD_NAMES) {
  if (list.includes(name)) fail.push(`list still renders Nightlord name: ${name}`);
  if (detail.includes(name)) fail.push(`detail still renders Nightlord name: ${name}`);
}

const EXPEDITIONS = [
  "Tricephalos",
  "Gaping Jaw",
  "Sentient Pest",
  "Augur",
  "Equilibrious Beast",
  "Darkdrift Knight",
  "Fissure in the Fog",
  "Night Aspect",
  "Balancers",
  "Dreglord",
];
for (const e of EXPEDITIONS) {
  if (!list.includes(e)) fail.push(`list is missing expedition: ${e}`);
}
if (!detail.includes("Dreglord")) fail.push("detail is missing its expedition title");

// The searchable-but-hidden alias has to keep working. Going via about:blank
// forces a real document load: navigating from "#/dreglord" back to "/" only
// changes the fragment, so the search field may not be mounted yet.
await page.goto("about:blank");
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForSelector('input[type="search"]');
await page.fill('input[type="search"]', "heolstor");
await page.waitForTimeout(300);
if (!(await page.evaluate(() => document.body.innerText)).includes("Night Aspect")) {
  fail.push("searching a Nightlord name no longer finds its expedition");
}

await browser.close();

if (fail.length) {
  console.error(`CONTENT VERIFY FAILED — ${fail.length} problem(s):`);
  for (const f of fail) console.error(`  ${f}`);
  process.exit(1);
}
console.log("Content verify passed: expedition names only, Nightlord names still searchable.");
