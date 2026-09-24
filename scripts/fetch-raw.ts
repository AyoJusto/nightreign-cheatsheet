// One-time download. Never run by the build. Kept as a record of where the data came from.
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import sharp from 'sharp'

const OBSERVER = 'https://raw.githubusercontent.com/stockholm754-source/nightreign-seed-observer/main'
const OLD_REPO = 'https://raw.githubusercontent.com/abhishek-nerella/Nightreign-Seed-Finder'
// The old app repo (abhishek-nerella/Nightreign-Seed-Finder) was deleted from GitHub on or
// before 2026-09-23. Its per-Nightlord portraits in data/raw/assets were instead copied by
// hand from a local clone taken that day, before the deletion — this fetch script will
// skip-and-warn on the now-dead URLs below rather than reproduce that output.

const files: Record<string, string> = {
  'data/raw/observer.json': `${OBSERVER}/data/nightreign-data.json`,
  'data/raw/artimuz.json': 'https://nightreign-seed-finder.com/data/trusted/seed_data.json',
  'data/raw/assets/maps/Default.png': `${OBSERVER}/assets/Default.png`,
  'data/raw/assets/maps/Crater.png': `${OBSERVER}/assets/Crater.png`,
  'data/raw/assets/maps/Mountaintop.png': `${OBSERVER}/assets/Mountaintop.png`,
  'data/raw/assets/maps/RottedWoods.png': `${OBSERVER}/assets/RottedWoods.png`,
  'data/raw/assets/maps/Noklateo.png': `${OBSERVER}/assets/Noklateo.png`,
  'data/raw/assets/maps/GreatHollow.webp': `${OBSERVER}/assets/GreatHollow.webp`,
}

// Fextralife's map-icon images for the three location kinds missing from OBSERVER's icon set
// (marsh, western/eastern underground fort). Stable file-storage URLs, not the wiki page
// itself. Served as PNG; converted to webp to match the other icons.
const pngToWebp: Record<string, string> = {
  'data/raw/assets/icons/marsh.webp': 'https://static0.fextralifeimages.com/file/eldenringnightreign/5/5a/Dlc2-location-icon-nightreign-wiki-guide-64px.png',
  'data/raw/assets/icons/WUF.webp': 'https://static0.fextralifeimages.com/file/eldenringnightreign/3/30/Dlc5-location-icon-nightreign-wiki-guide-64px.png',
  'data/raw/assets/icons/EUF.webp': 'https://static0.fextralifeimages.com/file/eldenringnightreign/8/81/Dlc1-location-icon-nightreign-wiki-guide-64px.png',
}

const icons = [
  'church', 'church_spawn', 'diff_sorcerers', 'empty_spawn', 'forge', 'forge_bleed', 'forge_eletric', 'forge_fire',
  'forge_holy', 'forge_poison', 'fort', 'fort_magic', 'greatchurch', 'greatchurch_eletric', 'greatchurch_fire',
  'greatchurch_frostbite', 'greatchurch_holy', 'greatchurch_sleep', 'mainencampment', 'mainencampment_eletric',
  'mainencampment_fire', 'mainencampment_madness', 'ruins', 'ruins_bleed', 'ruins_blight', 'ruins_eletric',
  'ruins_fire', 'ruins_frostbite', 'ruins_holy', 'ruins_magic', 'ruins_poison', 'ruins_sleep', 'sorcerers',
  'township', 'ScaleBearingMerchant',
]
for (const name of icons) files[`data/raw/assets/icons/${name}.webp`] = `${OBSERVER}/assets/icons/${name}.webp`

// Old app portraits are named "<n>_<internal name>.webp". Discover them at run time and
// save them by number only, so no internal name is ever written in this file.
// The upstream repo has gone offline (404 as of 2026-09-23) — skip discovery rather than
// fail the whole run, so the still-live sources below are still fetched.
try {
  const tree = await (await fetch('https://api.github.com/repos/abhishek-nerella/Nightreign-Seed-Finder/git/trees/main?recursive=1')).json()
  for (const entry of tree.tree as { path: string }[]) {
    const match = entry.path.match(/^public\/Images\/nightlordIcons\/(\d+)_[^/]+\.webp$/)
    if (match) files[`data/raw/assets/nightlords/${match[1]}.webp`] = `${OLD_REPO}/main/${entry.path}`
  }
} catch (err) {
  console.warn('skipped nightlord portrait discovery:', err instanceof Error ? err.message : err)
}

for (const [out, url] of Object.entries(files)) {
  const res = await fetch(url)
  if (!res.ok) {
    // Only the dead old-app repo is allowed to fail quietly; every other source (OBSERVER,
    // artimuz) is expected to be live, so a failure there is a real problem and must throw.
    if (url.startsWith(OLD_REPO)) {
      console.warn('skipped', out, `(${res.status} ${url})`)
      continue
    }
    throw new Error(`${res.status} ${url}`)
  }
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, Buffer.from(await res.arrayBuffer()))
  console.log('saved', out)
}

for (const [out, url] of Object.entries(pngToWebp)) {
  const res = await fetch(url)
  if (!res.ok) {
    console.warn('skipped', out, `(${res.status} ${url})`)
    continue
  }
  await mkdir(dirname(out), { recursive: true })
  await sharp(Buffer.from(await res.arrayBuffer())).webp().toFile(out)
  console.log('saved', out)
}
