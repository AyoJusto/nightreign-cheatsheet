import { Icon } from './Icon'

export function AboutScreen({ go }: { go: (path: string) => void }) {
  return (
    <main className="home about">
      <button className="about-back" onClick={() => go('/')}><Icon name="back" />Back</button>
      <h1 className="home-title">About</h1>
      <p>Bonfire Buddy helps you work out your Nightreign seed mid-run and see its full layout.</p>
      <h2>Data</h2>
      <p>
        Seed data was compiled by the Nightreign community. Thanks to Artimuz (nightreign-seed-finder.com),
        thefifthmatt (Nightreign Map Patterns) and the nightreign-seed-observer project.
      </p>
      <p>
        The Nightlord medallions, the Scarlet Rot icon and the Marsh and Underground Fort map icons come from the
        Fextralife Elden Ring Nightreign wiki, used here for a free fan project.
      </p>
      <p>Not affiliated with FromSoftware or Bandai Namco. Game art belongs to its owners.</p>
    </main>
  )
}
