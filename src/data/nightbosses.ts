// Night 1 and Night 2 bosses. Scraped once from the Fextralife per-boss pages
// and committed — there is no upstream dataset for these, only the Nightlords.
//
// Same conventions as nightlords.ts: negation is a percentage where NEGATIVE
// means the boss takes MORE damage, and status values are buildup thresholds
// where LOWER procs faster.
//
// Multi-phase and duo fights are scored on their WORST form, so the weakness
// shown works for the whole fight. When a form has a weakness the worst case
// cancels out — Nameless King takes lightning at -31 in phase 1 and +83 in
// phase 2 — it is reported separately as phaseOnly rather than hidden.
//
// Knight Artorias has no data: its Fextralife page is largely a copy of the
// Heolstor page (72 mentions of Heolstor to 31 of Artorias, with negation
// blocks identical to Heolstor's two phases), so importing it would have
// silently attributed the wrong numbers.
import type { NightBoss } from "../types";

export const NIGHT_BOSSES: NightBoss[] = [
  {
    "slug": "ancient-dragon",
    "name": "Ancient Dragon",
    "night": 2,
    "expeditions": [
      "gaping-jaw",
      "night-aspect"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed",
        "frost",
        "poison",
        "rot"
      ],
      "fastestStatusValue": 252,
      "formCount": 1,
      "neg": {
        "standard": 35,
        "slash": 35,
        "strike": 35,
        "pierce": 10,
        "magic": 40,
        "fire": 40,
        "lightning": 80,
        "holy": 40
      },
      "status": {
        "poison": 252,
        "rot": 252,
        "bleed": 252,
        "frost": 252,
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "battlefield-commander",
    "name": "Battlefield Commander",
    "night": 1,
    "expeditions": [
      "equilibrious-beast",
      "night-aspect",
      "sentient-pest"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed",
        "frost",
        "poison",
        "rot",
        "sleep"
      ],
      "fastestStatusValue": 154,
      "formCount": 1,
      "neg": {
        "standard": 10,
        "slash": 35,
        "strike": 10,
        "pierce": 0,
        "magic": 20,
        "fire": 20,
        "lightning": 20,
        "holy": 20
      },
      "status": {
        "poison": 154,
        "rot": 154,
        "bleed": 154,
        "frost": 154,
        "sleep": 154,
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "bell-bearing-hunter",
    "name": "Bell Bearing Hunter",
    "night": 1,
    "expeditions": [
      "night-aspect",
      "tricephalos"
    ],
    "data": {
      "weaknesses": [
        "pierce"
      ],
      "weaknessValue": -10,
      "phaseOnly": null,
      "fastestStatuses": [
        "poison",
        "rot",
        "sleep"
      ],
      "fastestStatusValue": 154,
      "formCount": 1,
      "neg": {
        "standard": 35,
        "slash": 35,
        "strike": 35,
        "pierce": -10,
        "magic": 40,
        "fire": 40,
        "lightning": 20,
        "holy": 40
      },
      "status": {
        "poison": 154,
        "rot": 154,
        "bleed": 252,
        "frost": 252,
        "sleep": 154,
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "centipede-demon",
    "name": "Centipede Demon",
    "night": 1,
    "expeditions": [
      "darkdrift-knight",
      "equilibrious-beast",
      "night-aspect",
      "sentient-pest"
    ],
    "data": {
      "weaknesses": [
        "magic"
      ],
      "weaknessValue": -20,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed",
        "frost",
        "poison",
        "rot"
      ],
      "fastestStatusValue": 252,
      "formCount": 2,
      "neg": {
        "standard": 0,
        "slash": 0,
        "strike": -10,
        "pierce": 0,
        "magic": -20,
        "fire": 80,
        "lightning": -10,
        "holy": -10
      },
      "status": {
        "poison": 252,
        "rot": 252,
        "bleed": 252,
        "frost": 252,
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "crucible-knight-golden-hippopotamus",
    "name": "Crucible Knight & Golden Hippopotamus",
    "night": 2,
    "expeditions": [
      "equilibrious-beast",
      "gaping-jaw",
      "night-aspect"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": {
        "form": 2,
        "value": -20,
        "keys": [
          "fire",
          "lightning"
        ]
      },
      "fastestStatuses": [
        "frost",
        "poison",
        "rot",
        "sleep"
      ],
      "fastestStatusValue": 252,
      "formCount": 2,
      "neg": {
        "standard": 35,
        "slash": 35,
        "strike": 35,
        "pierce": 35,
        "magic": 40,
        "fire": 20,
        "lightning": 20,
        "holy": 40
      },
      "status": {
        "poison": 252,
        "rot": 252,
        "bleed": "Immune",
        "frost": 252,
        "sleep": 252,
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "curseblade-divine-beast-warrior",
    "name": "Curseblade & Divine Beast Warrior",
    "night": 1,
    "expeditions": [
      "balancers"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": {
        "form": 1,
        "value": -20,
        "keys": [
          "slash"
        ]
      },
      "fastestStatuses": [
        "rot"
      ],
      "fastestStatusValue": 1,
      "formCount": 2,
      "neg": {
        "standard": 40,
        "slash": 40,
        "strike": 40,
        "pierce": 0,
        "magic": 2,
        "fire": 20,
        "lightning": 2,
        "holy": 0
      },
      "status": {
        "poison": 112,
        "rot": 1,
        "bleed": 112,
        "frost": 112,
        "sleep": 63,
        "madness": "Immune"
      },
      "source": "Curseblade"
    }
  },
  {
    "slug": "dancer-of-the-boreal-valley",
    "name": "Dancer of the Boreal Valley",
    "night": 2,
    "expeditions": [
      "fissure-in-the-fog",
      "night-aspect"
    ],
    "data": {
      "weaknesses": [
        "holy"
      ],
      "weaknessValue": -26,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed",
        "rot"
      ],
      "fastestStatusValue": 252,
      "formCount": 1,
      "neg": {
        "standard": 20,
        "slash": 22,
        "strike": 19,
        "pierce": 20,
        "magic": 19,
        "fire": 18,
        "lightning": 17,
        "holy": -26
      },
      "status": {
        "poison": "Immune",
        "rot": 252,
        "bleed": 252,
        "frost": "Immune",
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "death-knight",
    "name": "Death Knight",
    "night": 1,
    "expeditions": [
      "dreglord"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": null,
      "fastestStatuses": [
        "frost",
        "poison",
        "rot"
      ],
      "fastestStatusValue": 252,
      "formCount": 1,
      "neg": {
        "standard": 40,
        "slash": 40,
        "strike": 40,
        "pierce": 20,
        "magic": 40,
        "fire": 2,
        "lightning": 40,
        "holy": 0
      },
      "status": {
        "poison": 252,
        "rot": 252,
        "bleed": "Immune",
        "frost": 252,
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "death-rite-bird",
    "name": "Death Rite Bird",
    "night": 2,
    "expeditions": [
      "equilibrious-beast"
    ],
    "data": {
      "weaknesses": [
        "holy",
        "strike"
      ],
      "weaknessValue": -40,
      "phaseOnly": null,
      "fastestStatuses": [
        "rot"
      ],
      "fastestStatusValue": 253,
      "formCount": 1,
      "neg": {
        "standard": 10,
        "slash": 10,
        "strike": -40,
        "pierce": 35,
        "magic": 20,
        "fire": 20,
        "lightning": 40,
        "holy": -40
      },
      "status": {
        "poison": "Immune",
        "rot": 253,
        "bleed": "Immune",
        "frost": "Immune",
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "demi-human-queen-swordmaster",
    "name": "Demi-Human Queen & Swordmaster",
    "night": 1,
    "expeditions": [
      "night-aspect",
      "tricephalos"
    ],
    "data": {
      "weaknesses": [
        "fire"
      ],
      "weaknessValue": -20,
      "phaseOnly": null,
      "fastestStatuses": [
        "poison",
        "rot"
      ],
      "fastestStatusValue": 84,
      "formCount": 1,
      "neg": {
        "standard": 0,
        "slash": -10,
        "strike": 0,
        "pierce": 0,
        "magic": 0,
        "fire": -20,
        "lightning": 0,
        "holy": 0
      },
      "status": {
        "poison": 84,
        "rot": 84,
        "bleed": 112,
        "frost": 112,
        "sleep": 112,
        "madness": "Immune"
      },
      "source": "Demi-Human Queen"
    }
  },
  {
    "slug": "demon-in-pain-demon-from-below",
    "name": "Demon in Pain & Demon from Below",
    "night": 1,
    "expeditions": [
      "balancers"
    ],
    "data": {
      "weaknesses": [
        "slash"
      ],
      "weaknessValue": -18,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed"
      ],
      "fastestStatusValue": 252,
      "formCount": 1,
      "neg": {
        "standard": 0,
        "slash": -18,
        "strike": 1,
        "pierce": -2,
        "magic": 20,
        "fire": 78,
        "lightning": 22,
        "holy": 17
      },
      "status": {
        "poison": "Immune",
        "rot": 542,
        "bleed": 252,
        "frost": "Immune",
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "demon-prince",
    "name": "Demon Prince",
    "night": 2,
    "expeditions": [
      "balancers"
    ],
    "data": {
      "weaknesses": [
        "slash"
      ],
      "weaknessValue": -18,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed"
      ],
      "fastestStatusValue": 252,
      "formCount": 1,
      "neg": {
        "standard": 0,
        "slash": -18,
        "strike": 1,
        "pierce": -2,
        "magic": 20,
        "fire": 78,
        "lightning": 22,
        "holy": 17
      },
      "status": {
        "poison": "Immune",
        "rot": 542,
        "bleed": 252,
        "frost": "Immune",
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "divine-beast-dancing-lion",
    "name": "Divine Beast Dancing Lion",
    "night": 2,
    "expeditions": [
      "dreglord"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed",
        "rot"
      ],
      "fastestStatusValue": 112,
      "formCount": 1,
      "neg": {
        "standard": 30,
        "slash": 20,
        "strike": 30,
        "pierce": 0,
        "magic": 40,
        "fire": 0,
        "lightning": 4,
        "holy": 40
      },
      "status": {
        "poison": 154,
        "rot": 112,
        "bleed": 112,
        "frost": 252,
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "draconic-tree-sentinel-royal-cavalrymen",
    "name": "Draconic Tree Sentinel & Royal Cavalrymen",
    "night": 2,
    "expeditions": [
      "fissure-in-the-fog",
      "sentient-pest"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": {
        "form": 3,
        "value": -10,
        "keys": [
          "slash"
        ]
      },
      "fastestStatuses": [
        "poison",
        "rot",
        "sleep"
      ],
      "fastestStatusValue": 154,
      "formCount": 3,
      "neg": {
        "standard": 10,
        "slash": 35,
        "strike": 10,
        "pierce": 10,
        "magic": 20,
        "fire": 40,
        "lightning": 40,
        "holy": 20
      },
      "status": {
        "poison": 154,
        "rot": 154,
        "bleed": 252,
        "frost": 252,
        "sleep": 154,
        "madness": "Immune"
      },
      "source": "Draconic Tree Sentinel"
    }
  },
  {
    "slug": "duke-s-dear-freja",
    "name": "Duke's Dear Freja",
    "night": 1,
    "expeditions": [
      "equilibrious-beast",
      "fissure-in-the-fog",
      "gaping-jaw"
    ],
    "data": {
      "weaknesses": [
        "strike"
      ],
      "weaknessValue": -10,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed",
        "frost",
        "rot"
      ],
      "fastestStatusValue": 252,
      "formCount": 1,
      "neg": {
        "standard": 16,
        "slash": 7,
        "strike": -10,
        "pierce": 30,
        "magic": 50,
        "fire": 30,
        "lightning": 50,
        "holy": 50
      },
      "status": {
        "poison": "Immune",
        "rot": 252,
        "bleed": 252,
        "frost": 252,
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "fell-omen",
    "name": "Fell Omen",
    "night": 2,
    "expeditions": [
      "night-aspect",
      "tricephalos"
    ],
    "data": {
      "weaknesses": [
        "slash"
      ],
      "weaknessValue": -10,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed",
        "frost",
        "poison",
        "rot"
      ],
      "fastestStatusValue": 154,
      "formCount": 1,
      "neg": {
        "standard": 0,
        "slash": -10,
        "strike": 0,
        "pierce": 0,
        "magic": 0,
        "fire": 0,
        "lightning": 0,
        "holy": 40
      },
      "status": {
        "poison": 154,
        "rot": 154,
        "bleed": 154,
        "frost": 154,
        "sleep": 252,
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "full-grown-fallingstar-beast",
    "name": "Full-Grown Fallingstar Beast",
    "night": 2,
    "expeditions": [
      "augur",
      "night-aspect"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed",
        "poison",
        "rot"
      ],
      "fastestStatusValue": 252,
      "formCount": 1,
      "neg": {
        "standard": 35,
        "slash": 35,
        "strike": 35,
        "pierce": 35,
        "magic": 20,
        "fire": 20,
        "lightning": 20,
        "holy": 20
      },
      "status": {
        "poison": 252,
        "rot": 252,
        "bleed": 252,
        "frost": "Immune",
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "gaping-dragon",
    "name": "Gaping Dragon",
    "night": 1,
    "expeditions": [
      "augur",
      "darkdrift-knight",
      "gaping-jaw",
      "night-aspect"
    ],
    "data": {
      "weaknesses": [
        "lightning"
      ],
      "weaknessValue": -20,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed",
        "frost"
      ],
      "fastestStatusValue": 154,
      "formCount": 1,
      "neg": {
        "standard": 0,
        "slash": 0,
        "strike": 0,
        "pierce": 0,
        "magic": -10,
        "fire": -15,
        "lightning": -20,
        "holy": -10
      },
      "status": {
        "poison": "Immune",
        "rot": "Immune",
        "bleed": 154,
        "frost": 154,
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "godskin-duo",
    "name": "Godskin Duo",
    "night": 2,
    "expeditions": [
      "augur",
      "equilibrious-beast",
      "fissure-in-the-fog"
    ],
    "data": {
      "weaknesses": [
        "slash"
      ],
      "weaknessValue": -10,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed",
        "sleep"
      ],
      "fastestStatusValue": 112,
      "formCount": 2,
      "neg": {
        "standard": 0,
        "slash": -10,
        "strike": 35,
        "pierce": 0,
        "magic": 20,
        "fire": 40,
        "lightning": 20,
        "holy": 40
      },
      "status": {
        "poison": 154,
        "rot": 154,
        "bleed": 112,
        "frost": 154,
        "sleep": 112,
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "grafted-monarch",
    "name": "Grafted Monarch",
    "night": 1,
    "expeditions": [
      "augur",
      "fissure-in-the-fog",
      "night-aspect"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed",
        "frost",
        "poison",
        "rot",
        "sleep"
      ],
      "fastestStatusValue": 154,
      "formCount": 1,
      "neg": {
        "standard": 0,
        "slash": 0,
        "strike": 0,
        "pierce": 0,
        "magic": 20,
        "fire": 20,
        "lightning": 20,
        "holy": 40
      },
      "status": {
        "poison": 154,
        "rot": 154,
        "bleed": 154,
        "frost": 154,
        "sleep": 154,
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "great-red-bear",
    "name": "Great Red Bear",
    "night": 1,
    "expeditions": [
      "dreglord"
    ],
    "data": {
      "weaknesses": [
        "slash"
      ],
      "weaknessValue": -10,
      "phaseOnly": null,
      "fastestStatuses": [
        "sleep"
      ],
      "fastestStatusValue": 84,
      "formCount": 1,
      "neg": {
        "standard": 0,
        "slash": -10,
        "strike": 0,
        "pierce": 0,
        "magic": 0,
        "fire": -2,
        "lightning": 0,
        "holy": 0
      },
      "status": {
        "poison": 154,
        "rot": 154,
        "bleed": 252,
        "frost": 252,
        "sleep": 84,
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "great-wyrm",
    "name": "Great Wyrm",
    "night": 2,
    "expeditions": [
      "night-aspect",
      "sentient-pest"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": null,
      "fastestStatuses": [
        "sleep"
      ],
      "fastestStatusValue": 112,
      "formCount": 1,
      "neg": {
        "standard": 10,
        "slash": 35,
        "strike": 10,
        "pierce": 10,
        "magic": 40,
        "fire": 80,
        "lightning": 40,
        "holy": 40
      },
      "status": {
        "poison": 252,
        "rot": 252,
        "bleed": 252,
        "frost": 542,
        "sleep": 112,
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "knight-artorias",
    "name": "Knight Artorias",
    "night": 2,
    "expeditions": [
      "dreglord"
    ],
    "data": null,
    "note": "source page contaminated"
  },
  {
    "slug": "lord-of-blood",
    "name": "Lord of Blood",
    "night": 2,
    "expeditions": [
      "balancers"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed"
      ],
      "fastestStatusValue": 154,
      "formCount": 1,
      "neg": {
        "standard": 10,
        "slash": 10,
        "strike": 10,
        "pierce": 10,
        "magic": 40,
        "fire": 80,
        "lightning": 40,
        "holy": 40
      },
      "status": {
        "poison": 252,
        "rot": 252,
        "bleed": 154,
        "frost": 252,
        "sleep": 542,
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "nameless-king",
    "name": "Nameless King",
    "night": 2,
    "expeditions": [
      "darkdrift-knight",
      "night-aspect"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": {
        "form": 1,
        "value": -31,
        "keys": [
          "lightning"
        ]
      },
      "fastestStatuses": [
        "frost"
      ],
      "fastestStatusValue": 154,
      "formCount": 2,
      "neg": {
        "standard": 21,
        "slash": 22,
        "strike": 19,
        "pierce": 20,
        "magic": 24,
        "fire": 35,
        "lightning": 83,
        "holy": 0
      },
      "status": {
        "poison": 252,
        "rot": 252,
        "bleed": 252,
        "frost": 154,
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "night-s-cavalry",
    "name": "Night's Cavalry",
    "night": 1,
    "expeditions": [
      "darkdrift-knight",
      "gaping-jaw",
      "night-aspect"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": null,
      "fastestStatuses": [
        "poison",
        "rot"
      ],
      "fastestStatusValue": 154,
      "formCount": 1,
      "neg": {
        "standard": 35,
        "slash": 35,
        "strike": 35,
        "pierce": 10,
        "magic": 40,
        "fire": 40,
        "lightning": 20,
        "holy": 40
      },
      "status": {
        "poison": 154,
        "rot": 154,
        "bleed": 252,
        "frost": 252,
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "nox-dragonkin-soldier",
    "name": "Nox Dragonkin Soldier",
    "night": 2,
    "expeditions": [
      "darkdrift-knight",
      "night-aspect",
      "sentient-pest"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed",
        "poison",
        "rot"
      ],
      "fastestStatusValue": 252,
      "formCount": 1,
      "neg": {
        "standard": 10,
        "slash": 0,
        "strike": 10,
        "pierce": 10,
        "magic": 20,
        "fire": 20,
        "lightning": 40,
        "holy": 20
      },
      "status": {
        "poison": 252,
        "rot": 252,
        "bleed": 252,
        "frost": 542,
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "outland-commander",
    "name": "Outland Commander",
    "night": 2,
    "expeditions": [
      "darkdrift-knight",
      "gaping-jaw"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed",
        "frost",
        "poison",
        "rot",
        "sleep"
      ],
      "fastestStatusValue": 154,
      "formCount": 1,
      "neg": {
        "standard": 10,
        "slash": 35,
        "strike": 10,
        "pierce": 0,
        "magic": 20,
        "fire": 20,
        "lightning": 20,
        "holy": 20
      },
      "status": {
        "poison": 154,
        "rot": 154,
        "bleed": 154,
        "frost": 154,
        "sleep": 154,
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "royal-revenant",
    "name": "Royal Revenant",
    "night": 1,
    "expeditions": [
      "darkdrift-knight",
      "equilibrious-beast",
      "night-aspect"
    ],
    "data": {
      "weaknesses": [
        "slash"
      ],
      "weaknessValue": -10,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed",
        "frost",
        "poison",
        "rot"
      ],
      "fastestStatusValue": 154,
      "formCount": 1,
      "neg": {
        "standard": 0,
        "slash": -10,
        "strike": 0,
        "pierce": 0,
        "magic": 0,
        "fire": 0,
        "lightning": 0,
        "holy": 40
      },
      "status": {
        "poison": 154,
        "rot": 154,
        "bleed": 154,
        "frost": 154,
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "smelter-demon",
    "name": "Smelter Demon",
    "night": 1,
    "expeditions": [
      "augur",
      "fissure-in-the-fog",
      "night-aspect",
      "sentient-pest"
    ],
    "data": {
      "weaknesses": [
        "standard",
        "strike"
      ],
      "weaknessValue": -10,
      "phaseOnly": null,
      "fastestStatuses": [
        "poison",
        "rot"
      ],
      "fastestStatusValue": 154,
      "formCount": 1,
      "neg": {
        "standard": -10,
        "slash": 6,
        "strike": -10,
        "pierce": 8,
        "magic": 30,
        "fire": 80,
        "lightning": 30,
        "holy": 30
      },
      "status": {
        "poison": 154,
        "rot": 154,
        "bleed": "Immune",
        "frost": 252,
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "tibia-mariner-those-who-live-in-death",
    "name": "Tibia Mariner & Those Who Live in Death",
    "night": 1,
    "expeditions": [
      "equilibrious-beast",
      "fissure-in-the-fog",
      "sentient-pest"
    ],
    "data": {
      "weaknesses": [
        "holy",
        "strike"
      ],
      "weaknessValue": -40,
      "phaseOnly": null,
      "fastestStatuses": [
        "rot"
      ],
      "fastestStatusValue": 154,
      "formCount": 1,
      "neg": {
        "standard": 10,
        "slash": 10,
        "strike": -40,
        "pierce": 35,
        "magic": 20,
        "fire": 20,
        "lightning": 40,
        "holy": -40
      },
      "status": {
        "poison": "Immune",
        "rot": 154,
        "bleed": "Immune",
        "frost": "Immune",
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": "Tibia Mariner"
    }
  },
  {
    "slug": "tree-sentinel-royal-cavalrymen",
    "name": "Tree Sentinel & Royal Cavalrymen",
    "night": 2,
    "expeditions": [
      "augur",
      "tricephalos"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": {
        "form": 3,
        "value": -10,
        "keys": [
          "slash"
        ]
      },
      "fastestStatuses": [
        "poison",
        "rot",
        "sleep"
      ],
      "fastestStatusValue": 154,
      "formCount": 3,
      "neg": {
        "standard": 10,
        "slash": 35,
        "strike": 10,
        "pierce": 10,
        "magic": 20,
        "fire": 40,
        "lightning": 40,
        "holy": 40
      },
      "status": {
        "poison": 154,
        "rot": 154,
        "bleed": 252,
        "frost": 252,
        "sleep": 154,
        "madness": "Immune"
      },
      "source": "Tree Sentinel"
    }
  },
  {
    "slug": "ulcerated-tree-spirit",
    "name": "Ulcerated Tree Spirit",
    "night": 1,
    "expeditions": [
      "fissure-in-the-fog"
    ],
    "data": {
      "weaknesses": [
        "fire"
      ],
      "weaknessValue": -20,
      "phaseOnly": null,
      "fastestStatuses": [
        "frost"
      ],
      "fastestStatusValue": 112,
      "formCount": 1,
      "neg": {
        "standard": 0,
        "slash": 0,
        "strike": 0,
        "pierce": 0,
        "magic": 20,
        "fire": -20,
        "lightning": 20,
        "holy": 40
      },
      "status": {
        "poison": 252,
        "rot": 252,
        "bleed": 252,
        "frost": 112,
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "valiant-gargoyle",
    "name": "Valiant Gargoyle",
    "night": 1,
    "expeditions": [
      "augur",
      "gaping-jaw",
      "night-aspect"
    ],
    "data": {
      "weaknesses": [],
      "weaknessValue": null,
      "phaseOnly": null,
      "fastestStatuses": [],
      "fastestStatusValue": null,
      "formCount": 1,
      "neg": {
        "standard": 10,
        "slash": 35,
        "strike": 0,
        "pierce": 35,
        "magic": 20,
        "fire": 40,
        "lightning": 40,
        "holy": 40
      },
      "status": {
        "poison": "Immune",
        "rot": "Immune",
        "bleed": "Immune",
        "frost": "Immune",
        "sleep": "Immune",
        "madness": "Immune"
      },
      "source": null
    }
  },
  {
    "slug": "wormface",
    "name": "Wormface",
    "night": 1,
    "expeditions": [
      "augur",
      "darkdrift-knight",
      "gaping-jaw"
    ],
    "data": {
      "weaknesses": [
        "slash"
      ],
      "weaknessValue": -10,
      "phaseOnly": null,
      "fastestStatuses": [
        "bleed",
        "frost",
        "rot",
        "sleep"
      ],
      "fastestStatusValue": 231,
      "formCount": 1,
      "neg": {
        "standard": 0,
        "slash": -10,
        "strike": 0,
        "pierce": 0,
        "magic": 0,
        "fire": 0,
        "lightning": 0,
        "holy": 40
      },
      "status": {
        "poison": 308,
        "rot": 231,
        "bleed": 231,
        "frost": 231,
        "sleep": 231,
        "madness": "Immune"
      },
      "source": null
    }
  }
];
