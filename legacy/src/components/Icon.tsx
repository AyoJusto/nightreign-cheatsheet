import { useState } from "react";
import type { IconKey } from "../types";

export const LABELS: Record<IconKey, string> = {
  standard: "Standard",
  slash: "Slash",
  strike: "Strike",
  pierce: "Pierce",
  magic: "Magic",
  fire: "Fire",
  lightning: "Lightning",
  holy: "Holy",
  bleed: "Blood Loss",
  frost: "Frostbite",
  rot: "Scarlet Rot",
  poison: "Poison",
  sleep: "Sleep",
  madness: "Madness",
};

/** Tints for the four elements only; physical and status icons carry their own. */
export const TINT: Partial<Record<IconKey, string>> = {
  magic: "text-magic",
  fire: "text-fire",
  lightning: "text-lightning",
  holy: "text-holy",
};

const BASE = import.meta.env.BASE_URL;

/**
 * The real in-game icon, copied into public/icons/ so nothing is fetched from
 * the wiki at runtime. Falls back to a lettered glyph rather than a broken
 * image box if a file is ever missing.
 */
export function Icon({ name, size = 20 }: { name: IconKey; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-hidden
        className="inline-flex shrink-0 items-center justify-center rounded-full border border-ink-400 bg-ink-600 font-semibold text-ash"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        {LABELS[name][0]}
      </span>
    );
  }

  return (
    <img
      src={`${BASE}icons/${name}.png`}
      alt=""
      aria-hidden
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="icon-lift shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}
