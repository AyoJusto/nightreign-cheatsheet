import { Icon } from './Icon'
import { Frame, Flourish } from './Frame'

export function AboutScreen({ go }: { go: (path: string, back?: boolean) => void }) {
  return (
    <main className="home about">
      <button className="about-back" onClick={() => go('/', true)}><Icon name="back" />Back</button>
      <div className="about-panel">
        <Frame />
        <h1 className="home-title">About</h1>
        <Flourish className="home-flourish" />
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
        <p>Text is set in EB Garamond by Georg Duffner and Octavio Pardo, under the SIL Open Font License (fonts/OFL.txt).</p>
        <p>Not affiliated with FromSoftware or Bandai Namco. Game art belongs to its owners.</p>
      </div>
    </main>
  )
}
