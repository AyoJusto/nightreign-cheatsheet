// Night 1 and Night 2 bosses, transcribed from the Fextralife per-boss pages —
// there is no upstream dataset for these, only the Nightlords.
//
// Same conventions as nightlords.ts: negation is a percentage where NEGATIVE
// means the boss takes MORE damage, and status values are buildup thresholds
// where LOWER procs faster.
//
// Every form a page gives numbers for is kept, labelled the way that page
// labels it. Nothing derived lives here: the worst case a fight can put in
// front of you, and the headline weakness that follows from it, are computed by
// summarize() in src/summary.ts. Both used to be hand-merged into this file
// alongside the forms, which is how Nameless King came to advertise a poison
// proc against a phase that is poison-immune.
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 35,
            "slash": 35,
            "strike": 35,
            "pierce": 10
          },
          "elem": {
            "magic": 40,
            "fire": 40,
            "lightning": 80,
            "holy": 40
          },
          "status": {
            "bleed": 252,
            "frost": 252,
            "rot": 252,
            "poison": 252,
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 10,
            "slash": 35,
            "strike": 10,
            "pierce": 0
          },
          "elem": {
            "magic": 20,
            "fire": 20,
            "lightning": 20,
            "holy": 20
          },
          "status": {
            "bleed": 154,
            "frost": 154,
            "rot": 154,
            "poison": 154,
            "sleep": 154,
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 35,
            "slash": 35,
            "strike": 35,
            "pierce": -10
          },
          "elem": {
            "magic": 40,
            "fire": 40,
            "lightning": 20,
            "holy": 40
          },
          "status": {
            "bleed": 252,
            "frost": 252,
            "rot": 154,
            "poison": 154,
            "sleep": 154,
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": "Centipede Demon",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": 0,
            "strike": -10,
            "pierce": 0
          },
          "elem": {
            "magic": -20,
            "fire": 80,
            "lightning": -10,
            "holy": -10
          },
          "status": {
            "bleed": 252,
            "frost": 252,
            "rot": 252,
            "poison": 252,
            "sleep": "Immune",
            "madness": "Immune"
          }
        },
        {
          "label": "Centipede Grub (severed tail)",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": 0,
            "strike": -10,
            "pierce": 0
          },
          "elem": {
            "magic": -20,
            "fire": 80,
            "lightning": -10,
            "holy": -10
          },
          "status": {
            "bleed": 154,
            "frost": 154,
            "rot": 252,
            "poison": 252,
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": "Crucible Knight",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 35,
            "slash": 35,
            "strike": 35,
            "pierce": 35
          },
          "elem": {
            "magic": 40,
            "fire": 20,
            "lightning": 20,
            "holy": 40
          },
          "status": {
            "bleed": "Immune",
            "frost": 252,
            "rot": 252,
            "poison": 252,
            "sleep": 252,
            "madness": "Immune"
          }
        },
        {
          "label": "Golden Hippopotamus",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": -10,
            "strike": 0,
            "pierce": 0
          },
          "elem": {
            "magic": 0,
            "fire": -20,
            "lightning": -20,
            "holy": 0
          },
          "status": {
            "bleed": 252,
            "frost": 252,
            "rot": 154,
            "poison": 154,
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": "Curseblade",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": -20,
            "strike": 0,
            "pierce": 0
          },
          "elem": {
            "magic": 0,
            "fire": 0,
            "lightning": 0,
            "holy": 0
          },
          "status": {
            "bleed": 112,
            "frost": 112,
            "rot": 112,
            "poison": 112,
            "sleep": 63,
            "madness": "Immune"
          }
        },
        {
          "label": "Divine Beast Warrior",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 40,
            "slash": 40,
            "strike": 40,
            "pierce": 0
          },
          "elem": {
            "magic": 20,
            "fire": 20,
            "lightning": 20,
            "holy": 0
          },
          "status": {
            "bleed": 112,
            "frost": 112,
            "rot": 112,
            "poison": 112,
            "sleep": 63,
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 20,
            "slash": 22,
            "strike": 19,
            "pierce": 20
          },
          "elem": {
            "magic": 19,
            "fire": 18,
            "lightning": 17,
            "holy": -26
          },
          "status": {
            "bleed": 252,
            "frost": "Immune",
            "rot": 252,
            "poison": "Immune",
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 40,
            "slash": 40,
            "strike": 40,
            "pierce": 20
          },
          "elem": {
            "magic": 40,
            "fire": 20,
            "lightning": 40,
            "holy": 0
          },
          "status": {
            "bleed": "Immune",
            "frost": 252,
            "rot": 252,
            "poison": 252,
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 10,
            "slash": 10,
            "strike": -40,
            "pierce": 35
          },
          "elem": {
            "magic": 20,
            "fire": 20,
            "lightning": 40,
            "holy": -40
          },
          "status": {
            "bleed": "Immune",
            "frost": "Immune",
            "rot": 253,
            "poison": "Immune",
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": "Demi-Human Queen",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": -10,
            "strike": 0,
            "pierce": 0
          },
          "elem": {
            "magic": 0,
            "fire": -20,
            "lightning": 0,
            "holy": 0
          },
          "status": {
            "bleed": 112,
            "frost": 112,
            "rot": 84,
            "poison": 84,
            "sleep": 112,
            "madness": "Immune"
          }
        },
        {
          "label": "Demi-Human Swordmaster",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": -20,
            "strike": 0,
            "pierce": 0
          },
          "elem": {
            "magic": 0,
            "fire": -20,
            "lightning": 0,
            "holy": 0
          },
          "status": {
            "bleed": 112,
            "frost": 112,
            "rot": 84,
            "poison": 84,
            "sleep": 112,
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": -18,
            "strike": 1,
            "pierce": -2
          },
          "elem": {
            "magic": 20,
            "fire": 78,
            "lightning": 22,
            "holy": 17
          },
          "status": {
            "bleed": 252,
            "frost": "Immune",
            "rot": 542,
            "poison": "Immune",
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": -18,
            "strike": 1,
            "pierce": -2
          },
          "elem": {
            "magic": 20,
            "fire": 78,
            "lightning": 22,
            "holy": 17
          },
          "status": {
            "bleed": 252,
            "frost": "Immune",
            "rot": 542,
            "poison": "Immune",
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 30,
            "slash": 20,
            "strike": 30,
            "pierce": 0
          },
          "elem": {
            "magic": 40,
            "fire": 0,
            "lightning": 40,
            "holy": 40
          },
          "status": {
            "bleed": 112,
            "frost": 252,
            "rot": 112,
            "poison": 154,
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": "Draconic Tree Sentinel",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 10,
            "slash": 35,
            "strike": 10,
            "pierce": 10
          },
          "elem": {
            "magic": 20,
            "fire": 40,
            "lightning": 40,
            "holy": 20
          },
          "status": {
            "bleed": 252,
            "frost": 252,
            "rot": 154,
            "poison": 154,
            "sleep": 154,
            "madness": "Immune"
          }
        },
        {
          "label": "Leyndell Knight",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 10,
            "slash": 35,
            "strike": 10,
            "pierce": 0
          },
          "elem": {
            "magic": 20,
            "fire": 20,
            "lightning": 40,
            "holy": 20
          },
          "status": {
            "bleed": 154,
            "frost": 154,
            "rot": 112,
            "poison": 112,
            "sleep": 112,
            "madness": "Immune"
          }
        },
        {
          "label": "Leyndell Knight's horse",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": -10,
            "strike": 0,
            "pierce": 0
          },
          "elem": {
            "magic": 0,
            "fire": 0,
            "lightning": 20,
            "holy": 20
          },
          "status": {
            "bleed": 154,
            "frost": 154,
            "rot": 112,
            "poison": 112,
            "sleep": 112,
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 16,
            "slash": 7,
            "strike": -10,
            "pierce": 30
          },
          "elem": {
            "magic": 50,
            "fire": 30,
            "lightning": 50,
            "holy": 50
          },
          "status": {
            "bleed": 252,
            "frost": 252,
            "rot": 252,
            "poison": "Immune",
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": -10,
            "strike": 0,
            "pierce": 0
          },
          "elem": {
            "magic": 0,
            "fire": 0,
            "lightning": 0,
            "holy": 40
          },
          "status": {
            "bleed": 154,
            "frost": 154,
            "rot": 154,
            "poison": 154,
            "sleep": 252,
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 35,
            "slash": 35,
            "strike": 35,
            "pierce": 35
          },
          "elem": {
            "magic": 20,
            "fire": 20,
            "lightning": 20,
            "holy": 20
          },
          "status": {
            "bleed": 252,
            "frost": "Immune",
            "rot": 252,
            "poison": 252,
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": 0,
            "strike": 0,
            "pierce": 0
          },
          "elem": {
            "magic": -10,
            "fire": -15,
            "lightning": -20,
            "holy": -10
          },
          "status": {
            "bleed": 154,
            "frost": 154,
            "rot": "Immune",
            "poison": "Immune",
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": "Godskin Apostle",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": -10,
            "strike": 10,
            "pierce": 0
          },
          "elem": {
            "magic": 20,
            "fire": 40,
            "lightning": 20,
            "holy": 40
          },
          "status": {
            "bleed": 112,
            "frost": 154,
            "rot": 154,
            "poison": 154,
            "sleep": 112,
            "madness": "Immune"
          }
        },
        {
          "label": "Godskin Noble",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": -10,
            "strike": 35,
            "pierce": 0
          },
          "elem": {
            "magic": 20,
            "fire": 40,
            "lightning": 20,
            "holy": 40
          },
          "status": {
            "bleed": 112,
            "frost": 154,
            "rot": 154,
            "poison": 154,
            "sleep": 112,
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": 0,
            "strike": 0,
            "pierce": 0
          },
          "elem": {
            "magic": 20,
            "fire": 20,
            "lightning": 20,
            "holy": 40
          },
          "status": {
            "bleed": 154,
            "frost": 154,
            "rot": 154,
            "poison": 154,
            "sleep": 154,
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": -10,
            "strike": 0,
            "pierce": 0
          },
          "elem": {
            "magic": 0,
            "fire": -20,
            "lightning": 0,
            "holy": 0
          },
          "status": {
            "bleed": 252,
            "frost": 252,
            "rot": 154,
            "poison": 154,
            "sleep": 84,
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 10,
            "slash": 35,
            "strike": 10,
            "pierce": 10
          },
          "elem": {
            "magic": 40,
            "fire": 80,
            "lightning": 40,
            "holy": 40
          },
          "status": {
            "bleed": 252,
            "frost": 542,
            "rot": 252,
            "poison": 252,
            "sleep": 112,
            "madness": "Immune"
          }
        }
      ],
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
    "data": null
  },
  {
    "slug": "lord-of-blood",
    "name": "Lord of Blood",
    "night": 2,
    "expeditions": [
      "balancers"
    ],
    "data": {
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 10,
            "slash": 10,
            "strike": 10,
            "pierce": 10
          },
          "elem": {
            "magic": 40,
            "fire": 80,
            "lightning": 40,
            "holy": 40
          },
          "status": {
            "bleed": 154,
            "frost": 252,
            "rot": 252,
            "poison": 252,
            "sleep": 542,
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": "Phase 1 (dragon)",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 20,
            "slash": 21,
            "strike": 18,
            "pierce": 2
          },
          "elem": {
            "magic": 10,
            "fire": 35,
            "lightning": -31,
            "holy": 0
          },
          "status": {
            "bleed": 252,
            "frost": 154,
            "rot": 252,
            "poison": 252,
            "sleep": "Immune",
            "madness": "Immune"
          }
        },
        {
          "label": "Phase 2 (Nameless King)",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 21,
            "slash": 22,
            "strike": 19,
            "pierce": 20
          },
          "elem": {
            "magic": 24,
            "fire": 23,
            "lightning": 83,
            "holy": -8
          },
          "status": {
            "bleed": 252,
            "frost": 252,
            "rot": 252,
            "poison": "Immune",
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 35,
            "slash": 35,
            "strike": 35,
            "pierce": 10
          },
          "elem": {
            "magic": 40,
            "fire": 40,
            "lightning": 20,
            "holy": 40
          },
          "status": {
            "bleed": 252,
            "frost": 252,
            "rot": 154,
            "poison": 154,
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 10,
            "slash": 0,
            "strike": 10,
            "pierce": 10
          },
          "elem": {
            "magic": 20,
            "fire": 20,
            "lightning": 40,
            "holy": 20
          },
          "status": {
            "bleed": 252,
            "frost": 542,
            "rot": 252,
            "poison": 252,
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 10,
            "slash": 35,
            "strike": 10,
            "pierce": 0
          },
          "elem": {
            "magic": 20,
            "fire": 20,
            "lightning": 20,
            "holy": 20
          },
          "status": {
            "bleed": 154,
            "frost": 154,
            "rot": 154,
            "poison": 154,
            "sleep": 154,
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": -10,
            "strike": 0,
            "pierce": 0
          },
          "elem": {
            "magic": 0,
            "fire": 0,
            "lightning": 0,
            "holy": 40
          },
          "status": {
            "bleed": 154,
            "frost": 154,
            "rot": 154,
            "poison": 154,
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": -10,
            "slash": 6,
            "strike": -10,
            "pierce": 8
          },
          "elem": {
            "magic": 30,
            "fire": 80,
            "lightning": 30,
            "holy": 30
          },
          "status": {
            "bleed": "Immune",
            "frost": 252,
            "rot": 154,
            "poison": 154,
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 10,
            "slash": 10,
            "strike": -40,
            "pierce": 35
          },
          "elem": {
            "magic": 20,
            "fire": 20,
            "lightning": 40,
            "holy": -40
          },
          "status": {
            "bleed": "Immune",
            "frost": "Immune",
            "rot": 154,
            "poison": "Immune",
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": "Tree Sentinel",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 10,
            "slash": 35,
            "strike": 10,
            "pierce": 10
          },
          "elem": {
            "magic": 20,
            "fire": 40,
            "lightning": 0,
            "holy": 40
          },
          "status": {
            "bleed": 252,
            "frost": 252,
            "rot": 154,
            "poison": 154,
            "sleep": 154,
            "madness": "Immune"
          }
        },
        {
          "label": "Leyndell Knight",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 10,
            "slash": 35,
            "strike": 10,
            "pierce": 0
          },
          "elem": {
            "magic": 20,
            "fire": 20,
            "lightning": 40,
            "holy": 20
          },
          "status": {
            "bleed": 154,
            "frost": 154,
            "rot": 112,
            "poison": 112,
            "sleep": 112,
            "madness": "Immune"
          }
        },
        {
          "label": "Leyndell Knight's horse",
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": -10,
            "strike": 0,
            "pierce": 0
          },
          "elem": {
            "magic": 0,
            "fire": 0,
            "lightning": 20,
            "holy": 20
          },
          "status": {
            "bleed": 154,
            "frost": 154,
            "rot": 112,
            "poison": 112,
            "sleep": 112,
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": 0,
            "strike": 0,
            "pierce": 0
          },
          "elem": {
            "magic": 20,
            "fire": -20,
            "lightning": 20,
            "holy": 40
          },
          "status": {
            "bleed": 252,
            "frost": 112,
            "rot": 252,
            "poison": 252,
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 10,
            "slash": 35,
            "strike": 0,
            "pierce": 35
          },
          "elem": {
            "magic": 20,
            "fire": 40,
            "lightning": 40,
            "holy": 40
          },
          "status": {
            "bleed": "Immune",
            "frost": "Immune",
            "rot": "Immune",
            "poison": "Immune",
            "sleep": "Immune",
            "madness": "Immune"
          }
        }
      ],
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
      "forms": [
        {
          "label": null,
          "hp": null,
          "poise": null,
          "phys": {
            "standard": 0,
            "slash": -10,
            "strike": 0,
            "pierce": 0
          },
          "elem": {
            "magic": 0,
            "fire": 0,
            "lightning": 0,
            "holy": 40
          },
          "status": {
            "bleed": 231,
            "frost": 231,
            "rot": 231,
            "poison": 308,
            "sleep": 231,
            "madness": "Immune"
          }
        }
      ],
      "source": null
    }
  }
];
