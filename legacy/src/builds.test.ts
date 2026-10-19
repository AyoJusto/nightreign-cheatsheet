import { describe as group, expect, it } from "vitest";
import { BUILDS, groupSlots, isRelicEffect } from "./builds";

/**
 * The whole builds page rests on one assumption: every string in builds.ts names
 * a real relic effect. The source spreadsheet writes the same effect a dozen
 * ways, so those strings were mapped to canonical titles by hand — and a hand
 * mapping is exactly the kind of thing that rots silently when a title on the
 * effects page is later reworded. This is the alarm.
 */
group("every build line names a real relic effect", () => {
  const orphans: string[] = [];
  for (const c of BUILDS)
    for (const b of c.builds)
      for (const slots of [b.relics, b.deep])
        for (const s of slots)
          for (const l of s.lines) {
            if (!isRelicEffect(l.effect)) orphans.push(`${c.name} / ${b.name}: ${l.effect}`);
            for (const curse of l.curses ?? [])
              if (!isRelicEffect(curse)) orphans.push(`${c.name} / ${b.name} curse: ${curse}`);
          }

  it("has no orphaned titles", () => {
    expect(orphans).toEqual([]);
  });
});

group("every build is a complete loadout", () => {
  for (const c of BUILDS)
    for (const b of c.builds) {
      it(`${c.name} / ${b.name}`, () => {
        for (const [side, slots] of [
          ["relics", b.relics],
          ["deep", b.deep],
        ] as const) {
          // Not "exactly three slots": a variant is a second entry sharing a
          // slot number, so the check is that 1, 2 and 3 are all covered.
          expect(groupSlots(slots).map((g) => g.n)).toEqual([1, 2, 3]);
          for (const s of slots) {
            expect(s.lines.length, `${side} ${s.n} ${s.label ?? ""}`).toBeGreaterThanOrEqual(3);
            expect(s.lines.length, `${side} ${s.n} ${s.label ?? ""}`).toBeLessThanOrEqual(4);
          }
        }
      });
    }
});

group("variants are distinguishable", () => {
  it("a shared slot number means every option is named", () => {
    const unnamed: string[] = [];
    for (const c of BUILDS)
      for (const b of c.builds)
        for (const slots of [b.relics, b.deep])
          for (const g of groupSlots(slots))
            if (g.options.length > 1 && g.options.some((o) => !o.label))
              unnamed.push(`${c.name} / ${b.name} slot ${g.n}`);
    expect(unnamed).toEqual([]);
  });
});
