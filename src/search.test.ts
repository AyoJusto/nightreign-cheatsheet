import { describe, expect, it } from "vitest";
import { search, normalize, ALL_BOSSES, searchAll, searchNightBosses, BY_NAME } from "./search";
import { EXPEDITIONS } from "./data/nightlords";
import { partialLabel } from "./components/NightBossCard";
import { NIGHT_BOSSES } from "./data/nightbosses";
import { summaryOf } from "./summary";

const ids = (q: string) => search(q).map((h) => h.expedition.id).sort();
const nights = (q: string) => [...new Set(search(q).flatMap((h) => h.via.map((v) => v.night)))];

describe("dataset", () => {
  it("has all ten expeditions", () => {
    expect(EXPEDITIONS).toHaveLength(10);
  });

  it("collapses the two duplicate boss spellings, leaving 35 not 37", () => {
    expect(ALL_BOSSES).toHaveLength(35);
  });

  it("never lists a boss on both nights, which is what lets a row carry one badge", () => {
    const n1 = new Set(EXPEDITIONS.flatMap((e) => e.night1));
    const n2 = new Set(EXPEDITIONS.flatMap((e) => e.night2));
    expect([...n1].filter((b) => n2.has(b))).toEqual([]);
  });

  it("never claims a weakness that is not actually negative", () => {
    for (const e of EXPEDITIONS) {
      if (e.weaknesses.length) expect(e.weaknessValue!).toBeLessThan(0);
      else expect(e.weaknessValue).toBeNull();
    }
  });

  it("gives Adel no damage weakness but four tied statuses", () => {
    const adel = EXPEDITIONS.find((e) => e.id === "gaping-jaw")!;
    expect(adel.weaknesses).toEqual([]);
    expect(adel.fastestStatuses).toContain("poison");
    expect(adel.fastestStatusValue).toBe(154);
  });

  it("headlines the weakness the game lists, not the one arithmetic prefers", () => {
    // These are the two the derived value gets wrong. Adel negates every damage
    // type at 0 or better, and Harmonia has a -10 strike that would otherwise
    // outrank the Sleep the fight is actually built around.
    const listed = Object.fromEntries(EXPEDITIONS.map((e) => [e.id, e.listed.key]));
    expect(listed["gaping-jaw"]).toBe("poison");
    expect(listed["balancers"]).toBe("sleep");
    expect(listed["equilibrious-beast"]).toBe("madness");
    expect(listed["tricephalos"]).toBe("holy");
    expect(listed["augur"]).toBe("lightning");
    expect(listed["sentient-pest"]).toBe("fire");
  });

  it("keeps every listed weakness backed by its own numbers", () => {
    for (const e of EXPEDITIONS) {
      if (e.listed.kind === "damage") expect(e.listed.value).toBeLessThan(0);
      else expect(e.listed.value).toBe(e.fastestStatusValue);
    }
  });

  it("flags only Dreglord as derived, since no source lists one for it", () => {
    expect(EXPEDITIONS.filter((e) => e.listed.derived).map((e) => e.id)).toEqual(["dreglord"]);
  });

  it("picks the worst-case form on multi-form fights, not the best", () => {
    // Gnoster takes fire at -40, Faurtis at -35. You bring one weapon, so the
    // honest headline is -35. A best-case pick would print -40 and oversell it.
    const pest = EXPEDITIONS.find((e) => e.id === "sentient-pest")!;
    expect(pest.weaknesses).toEqual(["fire"]);
    expect(pest.weaknessValue).toBe(-35);
  });

  it("keeps Harmonia's near-instant sleep proc", () => {
    const b = EXPEDITIONS.find((e) => e.id === "balancers")!;
    expect(b.fastestStatuses).toEqual(["sleep"]);
    expect(b.fastestStatusValue).toBe(84);
  });
});

describe("alias merging", () => {
  // The upstream data spelled this boss "...CAVALRYMAN" under Augur and
  // "...CAVALRYMEN" under Tricephalos. Spelled two ways, the search answers
  // "Tricephalos" and quietly drops Augur, so the names were merged. Keep them
  // identical when hand-editing the dataset.
  it("finds both expeditions for Tree Sentinel, not one", () => {
    const got = search("tree sentinel & royal cavalrymen").map((h) => h.expedition.id);
    expect(got).toContain("tricephalos");
    expect(got).toContain("augur");
  });

  it("finds all three expeditions for Night's Cavalry", () => {
    expect(ids("night's cavalry")).toEqual(["darkdrift-knight", "gaping-jaw", "night-aspect"]);
  });

  it("keeps Draconic Tree Sentinel separate — it is a different boss", () => {
    expect(ids("draconic tree sentinel")).toEqual(["fissure-in-the-fog", "sentient-pest"]);
  });
});

describe("search", () => {
  it("returns all ten on an empty query", () => {
    expect(search("")).toHaveLength(10);
    expect(search("   ")).toHaveLength(10);
  });

  it("pins the expedition from a unique night boss", () => {
    expect(ids("ulcerated")).toEqual(["fissure-in-the-fog"]);
    expect(nights("ulcerated")).toEqual([1]);
    expect(ids("great red bear")).toEqual(["dreglord"]);
    expect(ids("knight artorias")).toEqual(["dreglord"]);
    expect(nights("knight artorias")).toEqual([2]);
  });

  it("renders the worst case as four rows rather than giving up", () => {
    expect(search("gaping dragon")).toHaveLength(4);
    expect(nights("gaping dragon")).toEqual([1]);
  });

  it("matches Nightlord and expedition names too", () => {
    expect(ids("gladius")).toEqual(["tricephalos"]);
    expect(ids("fissure")).toEqual(["fissure-in-the-fog"]);
    expect(ids("heolstor")).toEqual(["night-aspect"]);
  });

  it("puts name matches above night-boss matches", () => {
    // "night" appears in Night Aspect's name and in Night's Cavalry elsewhere.
    const hits = search("night aspect");
    expect(hits[0]!.expedition.id).toBe("night-aspect");
    expect(hits[0]!.nameMatch).toBe(true);
  });

  it("collapses two matching bosses in one expedition into a single row", () => {
    // Sentient Pest has both Centipede Demon and Smelter Demon on night 1.
    const pest = search("demon").find((h) => h.expedition.id === "sentient-pest")!;
    expect(pest.via.length).toBeGreaterThan(1);
    expect(search("demon").filter((h) => h.expedition.id === "sentient-pest")).toHaveLength(1);
  });

  it("survives punctuation the player will not type", () => {
    expect(normalize("Night's Cavalry")).toBe("nights cavalry");
    expect(ids("nights cavalry")).toEqual(ids("night's cavalry"));
    expect(ids("tibia mariner and those who live in death")).toEqual(
      ids("Tibia Mariner & Those Who Live in Death"),
    );
  });

  it("returns nothing for a boss that is not in the game", () => {
    expect(search("malenia")).toHaveLength(0);
  });

  it("title-cases possessives without capitalising the trailing s", () => {
    // The source is SCREAMING CASE, so "DUKE'S" round-tripped to "Duke'S"
    // until the caser learned to skip a letter run following an apostrophe.
    const names = EXPEDITIONS.flatMap((e) => [...e.night1, ...e.night2]);
    expect(names).toContain("Duke's Dear Freja");
    expect(names).toContain("Night's Cavalry");
    expect(names.filter((n) => /'[A-Z]/.test(n))).toEqual([]);
  });

  it("keeps hyphenated names capitalised on both sides", () => {
    const names = EXPEDITIONS.flatMap((e) => [...e.night1, ...e.night2]);
    expect(names).toContain("Demi-Human Queen & Swordmaster");
  });

  it("only lowercases articles and prepositions, not any short word", () => {
    // "who" and "live" were in the small-word list and mangled this name.
    const names = EXPEDITIONS.flatMap((e) => [...e.night1, ...e.night2]);
    expect(names).toContain("Tibia Mariner & Those Who Live in Death");
  });
});

describe("night bosses", () => {
  it("covers every boss named in a schedule, with no orphans either way", () => {
    const scheduled = new Set(EXPEDITIONS.flatMap((e) => [...e.night1, ...e.night2]));
    const known = new Set(NIGHT_BOSSES.map((b) => b.name));
    expect([...scheduled].filter((n) => !known.has(n))).toEqual([]);
    expect([...known].filter((n) => !scheduled.has(n))).toEqual([]);
    expect(NIGHT_BOSSES).toHaveLength(35);
  });

  it("records the night and expeditions each boss belongs to", () => {
    for (const b of NIGHT_BOSSES) {
      expect(b.expeditions.length).toBeGreaterThan(0);
      for (const id of b.expeditions) {
        const e = EXPEDITIONS.find((x) => x.id === id)!;
        expect(b.night === 1 ? e.night1 : e.night2).toContain(b.name);
      }
    }
  });

  it("has slugs that are unique and URL-safe", () => {
    const slugs = NIGHT_BOSSES.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });

  it("never claims a weakness the numbers do not support", () => {
    for (const b of NIGHT_BOSSES) {
      const s = summaryOf(b);
      if (!s) continue;
      const { weaknesses, weaknessValue, neg } = s;
      if (weaknesses.length) {
        expect(weaknessValue!).toBeLessThan(0);
        // Every listed key must actually sit at that value.
        for (const k of weaknesses) expect(neg[k]).toBe(weaknessValue);
        expect(Math.min(...Object.values(neg))).toBe(weaknessValue);
      } else {
        expect(weaknessValue).toBeNull();
        expect(Math.min(...Object.values(neg))).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("only reports a form-only weakness when the worst case has none", () => {
    for (const b of NIGHT_BOSSES) {
      const s = summaryOf(b);
      if (!s?.formOnly) continue;
      expect(s.weaknesses).toEqual([]);
      expect(s.formOnly.value).toBeLessThan(0);
      expect(s.formCount).toBeGreaterThan(1);
    }
  });

  it("keeps Nameless King's phase 1 lightning rather than hiding it", () => {
    // Lightning is -31 in phase 1 and +83 in phase 2, so the worst case says
    // "no weakness". That is true for weapon choice and useless as advice.
    const s = summaryOf(BY_NAME.get("Nameless King")!)!;
    expect(s.weaknesses).toEqual([]);
    expect(s.formOnly).toEqual({ label: "Phase 1 (dragon)", value: -31, keys: ["lightning"] });
  });

  it("lets one immune form veto a status the other form takes", () => {
    // Both merges that this replaced got exactly this wrong: the summary named
    // a status that one half of the fight can never be given.
    const nk = summaryOf(BY_NAME.get("Nameless King")!)!;
    expect(nk.status.poison).toBe("Immune");
    expect(nk.fastestStatuses).not.toContain("poison");

    const ck = summaryOf(BY_NAME.get("Crucible Knight & Golden Hippopotamus")!)!;
    expect(ck.status.sleep).toBe("Immune");
    expect(ck.fastestStatuses).not.toContain("sleep");
  });

  it("keeps every form the source page gives numbers for", () => {
    // The point of the detail page: a duo shows both halves, not their worst case.
    const forms = (n: string) => BY_NAME.get(n)!.data!.forms.map((f) => f.label);
    expect(forms("Crucible Knight & Golden Hippopotamus")).toEqual([
      "Crucible Knight",
      "Golden Hippopotamus",
    ]);
    expect(forms("Tree Sentinel & Royal Cavalrymen")).toHaveLength(3);
    expect(forms("Gaping Dragon")).toEqual([null]);
  });

  it("labels every form of a multi-form fight, and none of a single-form one", () => {
    for (const b of NIGHT_BOSSES) {
      if (!b.data) continue;
      const labels = b.data.forms.map((f) => f.label);
      if (labels.length === 1) expect(labels).toEqual([null]);
      else for (const l of labels) expect(l).toBeTruthy();
    }
  });

  it("leaves Knight Artorias blank rather than importing another boss's numbers", () => {
    // Its wiki page is largely a copy of the Heolstor page.
    const art = BY_NAME.get("Knight Artorias")!;
    expect(art.data).toBeNull();
    expect(NIGHT_BOSSES.filter((b) => !b.data)).toHaveLength(1);
  });

  it("finds a night boss by name and returns it alongside its expeditions", () => {
    const r = searchAll("gaping dragon");
    expect(r.nightBosses.map((b) => b.name)).toEqual(["Gaping Dragon"]);
    expect(r.expeditions).toHaveLength(4);
  });

  it("returns no night bosses for an empty or expedition-only query", () => {
    expect(searchNightBosses("")).toEqual([]);
    expect(searchNightBosses("tricephalos")).toEqual([]);
  });

  it("matches night bosses through the same punctuation folding", () => {
    expect(searchNightBosses("nights cavalry").map((b) => b.name)).toEqual(["Night's Cavalry"]);
    expect(searchNightBosses("demon").length).toBeGreaterThan(2);
  });
});

describe("multi-target wording", () => {
  // "Tree Sentinel & Royal Cavalrymen" is three enemies in a field, not a boss
  // with three phases, and the scraper labelled every negation block a "phase".
  it("calls simultaneous fights targets, not phases", () => {
    const groups = NIGHT_BOSSES.filter((b) => /\s&\s|\bDuo\b/.test(b.name));
    expect(groups.length).toBeGreaterThan(4);
    for (const b of groups) expect(partialLabel(b)).toBe("one target only");
  });

  it("still calls a genuinely sequential fight a phase", () => {
    // King of the Storm, then the Nameless King himself.
    expect(partialLabel(BY_NAME.get("Nameless King")!)).toBe("one phase only");
  });

  it("never names a specific phase or target number", () => {
    // The number was the order blocks appeared on the source page, which does
    // not map to a particular enemy, so it is not claimed anywhere.
    for (const b of NIGHT_BOSSES) expect(partialLabel(b)).not.toMatch(/\d/);
  });
});
