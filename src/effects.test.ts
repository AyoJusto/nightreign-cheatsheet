import { describe, expect, it } from "vitest";
import { EFFECTS } from "./data/effects";
import {
  GROUPS,
  applyFilter,
  byCategory,
  effectsIn,
  filtersFor,
  poolsBlurb,
  searchEffects,
  stackLabel,
} from "./effects";

describe("the dataset", () => {
  it("holds every row of the five tabs", () => {
    expect(EFFECTS).toHaveLength(378);
    expect(GROUPS.map((g) => g.count)).toEqual([194, 184]);
  });

  it("gives every row a title, a group and at least one category", () => {
    for (const e of EFFECTS) {
      expect(e.title.trim()).not.toBe("");
      expect(e.cats.length).toBeGreaterThan(0);
    }
  });

  it("has no row whose effect is a shrug", () => {
    // The sheet writes "Self explanatory" 14 times — sometimes with the real
    // numbers stranded in Notes, sometimes because the title carries the whole
    // effect. Both are fixed in this file rather than by a rule in the renderer.
    // The separator varies, and matching only the hyphen missed nine of them.
    const shrugs = EFFECTS.filter((e) => /self[\s-]*explanator/i.test(e.effect));
    expect(shrugs.map((e) => e.title)).toEqual([]);
  });

  it("gives every row either an effect or an honest blank", () => {
    // Five rows are blank because the source left them blank, and the row says so
    // on screen. Anything else empty would be a transcription slip.
    expect(EFFECTS.filter((e) => !e.effect.trim())).toHaveLength(5);
  });

  it("keeps dormant powers in the weapons group", () => {
    expect(EFFECTS.filter((e) => e.pool === "dormant").every((e) => e.group === "weapons")).toBe(true);
  });
});

describe("searchEffects", () => {
  it("matches the in-game wording, not the player's", () => {
    // Nothing in game says "bleed" — it says Blood Loss — so "blood" is the query
    // that has to work.
    expect(searchEffects("blood").length).toBeGreaterThan(0);
    expect(searchEffects("blood").some((e) => e.title === "Power of the Blood Lord")).toBe(true);
  });

  it("does not index the effect text", () => {
    // "stack" appears in 31 effect and notes strings and in no title. Matching it
    // would return rows whose titles say nothing about stacking.
    expect(searchEffects("stack")).toEqual([]);
  });

  it("finds a template row by the word its placeholder hides", () => {
    // The row is titled "Improved [Status] Resistance"; nobody types that.
    const hits = searchEffects("frostbite");
    expect(hits.some((e) => e.title.includes("[Status]"))).toBe(true);
  });

  it("finds a dormant power by what it does, not just its flavour name", () => {
    // "Favor of the Rotten Woods" shares no word with "nullifies scarlet rot".
    const hits = searchEffects("scarlet rot");
    expect(hits.some((e) => e.title === "Favor of the Rotten Woods")).toBe(true);
  });

  it("puts a title match ahead of a row that only covers the word", () => {
    // "blood" hits "Power of the Blood Lord" outright, and also every [Status]
    // template, since blood loss is one of the statuses they stand for. In a
    // capped list the templates must not bury the literal match.
    const hits = searchEffects("blood");
    const lord = hits.findIndex((e) => e.title === "Power of the Blood Lord");
    const template = hits.findIndex((e) => e.title.includes("[Status]"));
    expect(lord).toBeGreaterThanOrEqual(0);
    expect(template).toBeGreaterThan(lord);
    expect(hits.slice(0, 5)).toContain(hits[lord]);
  });

  it("finds the row the sheet misspelled", () => {
    // The source says "Stating armament inflicts \"x\" status". Titles are the whole
    // index, so left as written the row was unreachable by any spelling a player
    // would try, and it was the one placeholder row with no keywords.
    expect(searchEffects("starting armament").map((e) => e.title)).toEqual([
      "Starting armament inflicts [Status]",
    ]);
    expect(searchEffects("blood loss").some((e) => e.title === "Starting armament inflicts [Status]")).toBe(true);
  });

  it("returns nothing for an empty query rather than everything", () => {
    expect(searchEffects("")).toEqual([]);
    expect(searchEffects("   ")).toEqual([]);
  });
});

describe("poolsBlurb", () => {
  it("names every pool a page actually holds", () => {
    expect(poolsBlurb("relics")).toBe("116 base, 78 Deep");
    // The weapons page is the three-pool case; a blurb naming two would deny 52 rows.
    expect(poolsBlurb("weapons")).toBe("78 base, 54 Deep, 52 Dormant");
  });
});

describe("filters", () => {
  it("offers the pools of a group as filters alongside its categories", () => {
    const keys = filtersFor("weapons").map((f) => f.key);
    expect(keys).toContain("pool:deep");
    expect(keys).toContain("pool:dormant");
    // Relics have no dormant pool, so they must not offer the chip.
    expect(filtersFor("relics").map((f) => f.key)).not.toContain("pool:dormant");
  });

  it("never offers a base chip, because base is everything untagged", () => {
    expect(filtersFor("relics").map((f) => f.key)).not.toContain("pool:base");
  });

  it("counts and filters agree for every chip", () => {
    for (const group of ["relics", "weapons"] as const) {
      const list = effectsIn(group);
      for (const f of filtersFor(group)) {
        expect(applyFilter(list, f.key)).toHaveLength(f.count);
      }
    }
  });

  it("matches a row filed under two categories from either chip", () => {
    const both = EFFECTS.find((e) => e.cats.length > 1)!;
    const list = effectsIn(both.group);
    for (const cat of both.cats) {
      expect(applyFilter(list, `cat:${cat}`)).toContain(both);
    }
  });

  it("passes the list through unfiltered when nothing is selected", () => {
    const list = effectsIn("relics");
    expect(applyFilter(list, null)).toHaveLength(list.length);
  });
});

describe("byCategory", () => {
  it("shows every row exactly once", () => {
    // A row filed under two categories is listed under the first only: the page
    // must not be longer than the count in its own header.
    for (const group of ["relics", "weapons"] as const) {
      const list = effectsIn(group);
      const shown = byCategory(list).flatMap((g) => g.items);
      expect(shown).toHaveLength(list.length);
      expect(new Set(shown).size).toBe(list.length);
    }
  });
});

describe("stackLabel", () => {
  it("reads the two clean answers", () => {
    expect(stackLabel("Yes")).toEqual({ label: "Stacks", tone: "yes" });
    expect(stackLabel("No")).toEqual({ label: "No stack", tone: "no" });
  });

  it("repeats an uncertain answer in the sheet's own words", () => {
    expect(stackLabel("See Notes")).toEqual({ label: "See Notes", tone: "unknown" });
    expect(stackLabel("Yes?")).toEqual({ label: "Yes?", tone: "unknown" });
    expect(stackLabel("N/A")).toEqual({ label: "N/A", tone: "unknown" });
  });

  it("says Unknown for the blanks and dashes", () => {
    expect(stackLabel("")).toEqual({ label: "Unknown", tone: "unknown" });
    expect(stackLabel("-")).toEqual({ label: "Unknown", tone: "unknown" });
  });

  it("never claims a row stacks unless the sheet said so", () => {
    const yes = EFFECTS.filter((e) => stackLabel(e.stack).tone === "yes");
    expect(yes.every((e) => e.stack === "Yes")).toBe(true);
  });
});
