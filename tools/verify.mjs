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

// Anything under 16px makes iOS Safari zoom the page on focus and stay zoomed,
// which shows up as the page scrolling sideways on a phone. No emulator
// reproduces it, so the size is asserted here. Checked before the search below,
// which narrows to one expedition and unmounts the field.
const inputPx = await page.evaluate(() =>
  parseFloat(getComputedStyle(document.querySelector('input[type="search"]')).fontSize),
);
if (inputPx < 16) fail.push(`search input is ${inputPx}px; iOS zooms anything under 16px`);

await page.fill('input[type="search"]', "heolstor");
await page.waitForTimeout(300);
if (!(await page.evaluate(() => document.body.innerText)).includes("Night Aspect")) {
  fail.push("searching a Nightlord name no longer finds its expedition");
}

// Two deep — expedition, then one of its night bosses — is where the header's
// second button used to need two taps, because it was history.back() wearing a
// label that promised the list.
await page.goto("about:blank");
await page.goto(`${BASE}/#/dreglord`, { waitUntil: "networkidle" });
await page.click("text=Great Red Bear");
await page.waitForTimeout(250);
if (!(await page.evaluate(() => document.body.innerText)).includes("Great Red Bear")) {
  fail.push("could not reach a night boss from its expedition");
}
await page.click('button:has-text("Home")');
await page.waitForTimeout(250);
if (!(await page.$('input[type="search"]'))) {
  fail.push("Home from two deep did not reach the list in one tap");
}

// Effects. The numbers below are the point of the whole section, so the check is
// that a real one reaches the screen — not that a heading rendered.
await page.goto("about:blank");
await page.goto(`${BASE}/#/effects/weapons`, { waitUntil: "networkidle" });
await page.waitForTimeout(250);
const weapons = await page.evaluate(() => document.body.innerText);
if (!weapons.includes("Weapon effects")) fail.push("effects page is missing its title");
// Dormant powers and Deep weapon effects share this title with different numbers,
// which is the reason the two pools share a page instead of each getting their own.
if (!weapons.includes("Increased Maximum HP")) fail.push("effects page is missing a known row");
for (const tag of ["Deep", "Dormant"]) {
  if (!weapons.includes(tag)) fail.push(`effects page is missing the ${tag} tag`);
}
if (!/Stacks|No stack/.test(weapons)) fail.push("effects page renders no stacking answer");

// Filtering is the browse affordance; without it the page is a 184-row scroll.
await page.click('button:has-text("Dormant")');
await page.waitForTimeout(250);
const filtered = await page.evaluate(() => document.body.innerText);
if (!filtered.includes("52 of 184")) fail.push("filtering by a pool did not narrow the count");

// Nothing in game says "bleed" — it says Blood Loss — so "blood" is the query
// that has to reach the four rows that do it.
await page.goto("about:blank");
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForSelector('input[type="search"]');
await page.fill('input[type="search"]', "blood");
await page.waitForTimeout(300);
const blood = await page.evaluate(() => document.body.innerText);
if (!blood.includes("Power of the Blood Lord")) {
  fail.push('searching "blood" no longer finds the effects that say Blood Loss');
}
if (!blood.includes("Lord of Blood")) {
  fail.push('searching "blood" stopped finding the night boss — effects crowded it out');
}

// The cap has to survive the next keystroke. Expanding it once used to stick for
// the rest of the session, so every later search rendered uncapped and buried the
// expedition cards under a wall of relic text — the exact thing the cap prevents.
await page.goto("about:blank");
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForSelector('input[type="search"]');
await page.fill('input[type="search"]', "attack");
await page.waitForTimeout(300);
await page.click('button:has-text("Show all")');
await page.waitForTimeout(200);
await page.fill('input[type="search"]', "attack power");
await page.waitForTimeout(300);
if (!(await page.$('button:has-text("Show all")'))) {
  fail.push("the effects cap stayed expanded into the next search");
}

// Opening a page from the bottom of the list used to keep the old scroll offset,
// landing the reader past the title, the count and the whole filter row.
//
// At this file's default 1440x900 the home page fits without scrolling, so this
// check is vacuous there — it passed against the unfixed build. A phone is the
// viewport where the list is long enough to have somewhere to carry over from.
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("about:blank");
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForSelector('input[type="search"]');
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(200);
const scrolledFrom = await page.evaluate(() => Math.round(window.scrollY));
await page.click('button:has-text("Relic effects")');
await page.waitForSelector('h1:text-is("Relic effects")', { state: "visible" });
await page.waitForTimeout(250);
const top = {
  scrolledFrom,
  ...(await page.evaluate(() => ({
    scrollY: Math.round(window.scrollY),
    titleTop: Math.round(document.querySelector("h1").getBoundingClientRect().top),
  }))),
};
if (top.scrollY > 0 || top.titleTop < 0) {
  fail.push(`effects page opened mid-list (scrollY ${top.scrollY}, title at ${top.titleTop}px)`);
}
if (top.scrolledFrom === 0) {
  fail.push("home did not scroll, so the carry-over check proved nothing");
}
await page.setViewportSize({ width: 1440, height: 900 });

// Weapons is the three-pool page; a subtitle naming two denies 52 rows.
await page.goto("about:blank");
await page.goto(`${BASE}/#/effects/weapons`, { waitUntil: "networkidle" });
await page.waitForSelector('h1:text-is("Weapon effects")', { state: "visible" });
const subtitle = await page.evaluate(() => document.body.innerText);
if (!subtitle.includes("52 Dormant")) {
  fail.push("the weapons subtitle does not account for the dormant pool");
}

await browser.close();

if (fail.length) {
  console.error(`CONTENT VERIFY FAILED — ${fail.length} problem(s):`);
  for (const f of fail) console.error(`  ${f}`);
  process.exit(1);
}
console.log("Content verify passed: expeditions, night bosses and effects all reachable.");
