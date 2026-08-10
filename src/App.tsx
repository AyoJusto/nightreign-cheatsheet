import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EXPEDITIONS, DATA_VERSION } from "./data/nightlords";
import { ALL_BOSSES, BY_SLUG, nightAspectIsNoise, searchAll } from "./search";
import { BossDetail } from "./components/BossDetail";
import { NightBossDetail } from "./components/NightBossDetail";
import { ResultList } from "./components/ResultList";

function useHash() {
  const [id, setId] = useState(() => window.location.hash.replace(/^#\/?/, "") || null);
  useEffect(() => {
    const on = () => setId(window.location.hash.replace(/^#\/?/, "") || null);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = (next: string | null) => {
    // Pushing a real history entry is what makes the phone's back gesture and
    // the browser back button return to the list instead of leaving the site.
    if (next) window.location.hash = `/${next}`;
    else if (window.location.hash) window.history.back();
  };
  return [id, go] as const;
}

function SearchField({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
        list="boss-names"
        placeholder="Expedition, or a boss you saw"
        aria-label="Search expeditions and night bosses"
        className="h-12 w-full rounded-xl border border-ink-500 bg-ink-800 pl-10 pr-3 text-[15px] text-bone placeholder:text-dim focus:border-gold-dim focus:outline-none focus:ring-1 focus:ring-gold-dim/60"
      />
      <svg
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-dim"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <circle cx="9" cy="9" r="6" />
        <path d="m13.5 13.5 3.5 3.5" strokeLinecap="round" />
      </svg>

      {/* Native datalist: real type-ahead with no combobox to build, no keyboard
          trap to get wrong, and it uses the platform's own picker on mobile. */}
      <datalist id="boss-names">
        {EXPEDITIONS.map((e) => (
          <option key={e.id} value={e.expedition}>
            Expedition
          </option>
        ))}
        {ALL_BOSSES.map((b) => (
          <option key={b.name} value={b.name}>
            Night {b.night}
          </option>
        ))}
      </datalist>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [id, go] = useHash();
  const inputRef = useRef<HTMLInputElement>(null);
  const autoOpened = useRef<string | null>(null);

  const results = useMemo(() => searchAll(query), [query]);
  const hits = results.expeditions;
  const noise = useMemo(() => nightAspectIsNoise(hits), [hits]);

  const selected = EXPEDITIONS.find((e) => e.id === id) ?? null;
  const selectedBoss = id?.startsWith("boss/") ? (BY_SLUG.get(id.slice(5)) ?? null) : null;
  const showingDetail = selected !== null || selectedBoss !== null;

  // A search narrowed to exactly one expedition has already answered the
  // question, so open it rather than making the user tap the only card. Guarded
  // so it fires once per query and never yanks a detail view out from under
  // someone who is reading it. Skipped when the query also matched a night boss,
  // since then there are two answers on screen and picking one for the user
  // would hide the other.
  useEffect(() => {
    if (!query.trim() || showingDetail || results.nightBosses.length) return;
    const only = hits.length === 1 ? hits[0]!.expedition.id : null;
    if (only && autoOpened.current !== only) {
      autoOpened.current = only;
      go(only);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hits, query, showingDetail, results.nightBosses.length]);

  useEffect(() => {
    if (!query.trim()) autoOpened.current = null;
  }, [query]);

  return (
    <div className="min-h-full">
      <AnimatePresence mode="wait" initial={false}>
        {showingDetail ? (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="ground sticky top-0 z-10 border-b border-ink-600">
              <div className="w-full px-4 pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-6 lg:px-8 2xl:px-12">
                <button
                  type="button"
                  onClick={() => go(null)}
                  className="flex min-h-11 items-center gap-1.5 text-[15px] text-gold hover:text-bone"
                >
                  <svg
                    className="size-4"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="M12 4 6 10l6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  All expeditions
                </button>
              </div>
            </div>
            {selected ? (
              <BossDetail e={selected} onSelect={go} />
            ) : (
              <NightBossDetail boss={selectedBoss!} onSelect={go} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="w-full px-4 pb-[max(3rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8 2xl:px-12"
          >
            {/* Title and search are one bar. It uses .ground rather than a
                translucent tint so it does not read as a lighter band over the
                page. On mobile it stacks; the subtitle drops rather than
                letting a sticky header eat a seventh of a phone screen. */}
            <header className="ground sticky top-0 z-10 -mx-4 border-b border-ink-600 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:-mx-6 sm:px-6 sm:pb-4 lg:-mx-8 lg:px-8 2xl:-mx-12 2xl:px-12">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                <div className="min-w-0">
                  <h1 className="display text-2xl leading-none text-bone sm:text-3xl">
                    Nightreign
                  </h1>
                  <p className="mt-1 hidden text-xs text-dim sm:block">
                    Boss weaknesses, negation and status buildup · {DATA_VERSION}
                  </p>
                </div>

                {/* An input is not a card — it gets a sane width even though
                    the page itself is fluid. */}
                <div className="w-full sm:max-w-sm lg:max-w-md">
                  <SearchField value={query} onChange={setQuery} inputRef={inputRef} />
                </div>
              </div>
            </header>

            <p className="pb-3 pt-4 text-xs text-dim">
              {query.trim()
                ? [
                    results.nightBosses.length &&
                      `${results.nightBosses.length} night ${results.nightBosses.length === 1 ? "boss" : "bosses"}`,
                    `${hits.length} ${hits.length === 1 ? "expedition" : "expeditions"}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "Saw a boss? Type its name to find which expedition you are in."}
            </p>

            <ResultList
              hits={hits}
              nightBosses={results.nightBosses}
              onSelect={go}
              noise={noise}
              searching={Boolean(query.trim())}
            />

            <footer className="mt-10 border-t border-ink-600 pt-5 text-xs leading-relaxed text-dim">
              Negation is a percentage: negative means the boss takes more damage. Status
              values are buildup thresholds, so lower procs faster.
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
