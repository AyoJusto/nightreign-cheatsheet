import { Icon } from './Icon'

export function AboutScreen({ go }: { go: (path: string, back?: boolean) => void }) {
  return (
    <main className="home about">
      <button className="about-back" onClick={() => go('/', true)}><Icon name="back" />Back</button>
      <h1 className="home-title">About</h1>
      <p>Bonfire Buddy helps you work out your Nightreign seed mid-run and see its full layout.</p>
      <h2>Data</h2>
      <p>
        Seed data was compiled by the Nightreign community. Thanks to Artimuz (nightreign-seed-finder.com),
        thefifthmatt (Nightreign Map Patterns) and the nightreign-seed-observer project.
      </p>
      <p>
        Boss weaknesses come from the Nightreign Cheat Sheet, whose night boss numbers were transcribed from the
        Fextralife Elden Ring Nightreign wiki.
      </p>
      <p>
        The Nightlord medallions, the damage and status icons, the Scarlet Rot icon, the Marsh and Underground Fort
        map icons and the field boss, evergaol, treasure and merchant map markers come from the Fextralife Elden
        Ring Nightreign wiki, used here for a free fan project.
      </p>
      <p>Titles are set in Cinzel by Natanael Gama, under the SIL Open Font License (fonts/OFL.txt).</p>
      <p>Not affiliated with FromSoftware or Bandai Namco. Game art belongs to its owners.</p>
    </main>
  )
}
