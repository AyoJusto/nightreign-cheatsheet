import { Page, type Go } from './Page'

export function AboutScreen({ go }: { go: Go }) {
  return (
    <Page title="About" go={go}>
      <div className="surface rounded-card px-5 py-1 text-[17px] leading-relaxed text-label-2">
        <p>Find your Nightreign seed mid-run, see its whole map, and look up what every boss on it is weak to.</p>
        <p>
          Seed data was compiled by the Nightreign community. Thanks to Artimuz (nightreign-seed-finder.com),
          thefifthmatt (Nightreign Map Patterns) and the nightreign-seed-observer project.
        </p>
        <p>
          Enemy negation and status numbers come from the game's own data tables, as exported by the
          nightreign-relic-checker and Evil-Nightreign projects, checked against the Fextralife Elden Ring Nightreign wiki.
        </p>
        <p>
          The Nightlord portraits, damage and status icons, and the map markers come from the Fextralife Elden Ring
          Nightreign wiki, used here for a free fan project.
        </p>
        <p>Not affiliated with FromSoftware or Bandai Namco. Game art belongs to its owners.</p>
      </div>
    </Page>
  )
}
