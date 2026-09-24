export function AboutScreen({ go }: { go: (path: string) => void }) {
  return (
    <main className="home about">
      <button className="about-back" onClick={() => go('/')}>‹ Back</button>
      <h1 className="title home-title">About</h1>
      <p>Bonfire Buddy helps you work out your Nightreign seed mid-run and see its full layout.</p>
      <h2>Data</h2>
      <p>
        Seed data was compiled by the Nightreign community. Thanks to Artimuz (nightreign-seed-finder.com),
        thefifthmatt (Nightreign Map Patterns) and the nightreign-seed-observer project.
      </p>
      <p>Not affiliated with FromSoftware or Bandai Namco. Game art belongs to its owners.</p>
    </main>
  )
}
