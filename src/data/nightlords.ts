// The dataset. Edit this file directly when a patch changes the numbers.
//
// Two conventions that are easy to get backwards:
//   negation  a percentage; NEGATIVE means the boss takes MORE damage
//   status    a buildup threshold; LOWER procs faster, "Immune" never does
//
// `listed` is the weakness the game and the guides name, which is what the page
// headlines. It is not always the lowest number: Adel negates every damage type
// at 0 or better and its listed answer is Poison, and Harmonia has a -10 strike
// that would otherwise outrank the Sleep 84 the fight is built around. Dreglord
// is the only one no source lists, so its entry is marked derived.
//
// On multi-form fights the headline is scored against the WORST form — fire hits
// Gnoster at -40 and Faurtis at -35, and you carry one weapon into that arena.
//
// src/search.test.ts asserts all of the above, so a bad hand-edit fails the tests.
import type { Expedition } from "../types";

export const DATA_VERSION = "v1.03.2 + DLC";

export const EXPEDITIONS: Expedition[] = [
  {
    "id": "tricephalos",
    "expedition": "Tricephalos",
    "nightlord": "Gladius, Beast of Night",
    "listed": {
      "key": "holy",
      "kind": "damage",
      "value": -35,
      "derived": false
    },
    "weaknesses": [
      "holy"
    ],
    "weaknessValue": -35,
    "fastestStatuses": [
      "sleep"
    ],
    "fastestStatusValue": 154,
    "forms": [
      {
        "label": null,
        "hp": {
          "solo": 11328,
          "duo": 22656,
          "trio": 33984
        },
        "poise": 120,
        "phys": {
          "standard": 0,
          "slash": 0,
          "strike": 0,
          "pierce": -10
        },
        "elem": {
          "magic": 0,
          "fire": 50,
          "lightning": 0,
          "holy": -35
        },
        "status": {
          "bleed": 252,
          "frost": 542,
          "rot": 252,
          "poison": 542,
          "sleep": 154,
          "madness": "Immune"
        }
      }
    ],
    "night1": [
      "Bell Bearing Hunter",
      "Demi-Human Queen & Swordmaster"
    ],
    "night2": [
      "Fell Omen",
      "Tree Sentinel & Royal Cavalrymen"
    ]
  },
  {
    "id": "gaping-jaw",
    "expedition": "Gaping Jaw",
    "nightlord": "Adel, Baron of Night",
    "listed": {
      "key": "poison",
      "kind": "status",
      "value": 154,
      "derived": false
    },
    "weaknesses": [],
    "weaknessValue": null,
    "fastestStatuses": [
      "frost",
      "poison",
      "rot",
      "sleep"
    ],
    "fastestStatusValue": 154,
    "forms": [
      {
        "label": null,
        "hp": {
          "solo": 13140,
          "duo": 26280,
          "trio": 39420
        },
        "poise": 150,
        "phys": {
          "standard": 0,
          "slash": 0,
          "strike": 0,
          "pierce": 0
        },
        "elem": {
          "magic": 0,
          "fire": 20,
          "lightning": 50,
          "holy": 0
        },
        "status": {
          "bleed": 542,
          "frost": 154,
          "rot": 154,
          "poison": 154,
          "sleep": 154,
          "madness": "Immune"
        }
      }
    ],
    "night1": [
      "Duke's Dear Freja",
      "Gaping Dragon",
      "Night's Cavalry",
      "Valiant Gargoyle",
      "Wormface"
    ],
    "night2": [
      "Ancient Dragon",
      "Crucible Knight & Golden Hippopotamus",
      "Outland Commander"
    ]
  },
  {
    "id": "sentient-pest",
    "expedition": "Sentient Pest",
    "nightlord": "Gnoster, Wisdom of Night",
    "listed": {
      "key": "fire",
      "kind": "damage",
      "value": -35,
      "derived": false
    },
    "weaknesses": [
      "fire"
    ],
    "weaknessValue": -35,
    "fastestStatuses": [
      "bleed",
      "frost",
      "rot"
    ],
    "fastestStatusValue": 154,
    "forms": [
      {
        "label": "Gnoster (Moth)",
        "hp": {
          "solo": 13027,
          "duo": 26054,
          "trio": 39081
        },
        "poise": 100,
        "phys": {
          "standard": -15,
          "slash": -25,
          "strike": -15,
          "pierce": -25
        },
        "elem": {
          "magic": 50,
          "fire": -40,
          "lightning": 10,
          "holy": 10
        },
        "status": {
          "bleed": 154,
          "frost": 154,
          "rot": 154,
          "poison": 542,
          "sleep": 542,
          "madness": "Immune"
        }
      },
      {
        "label": "Faurtis (Scorpion)",
        "hp": {
          "solo": 12234,
          "duo": 24468,
          "trio": 36702
        },
        "poise": 150,
        "phys": {
          "standard": 10,
          "slash": 20,
          "strike": -20,
          "pierce": -10
        },
        "elem": {
          "magic": 10,
          "fire": -35,
          "lightning": 10,
          "holy": 10
        },
        "status": {
          "bleed": 154,
          "frost": 154,
          "rot": 154,
          "poison": 252,
          "sleep": 154,
          "madness": "Immune"
        }
      }
    ],
    "night1": [
      "Battlefield Commander",
      "Centipede Demon",
      "Smelter Demon",
      "Tibia Mariner & Those Who Live in Death"
    ],
    "night2": [
      "Draconic Tree Sentinel & Royal Cavalrymen",
      "Great Wyrm",
      "Nox Dragonkin Soldier"
    ]
  },
  {
    "id": "augur",
    "expedition": "Augur",
    "nightlord": "Maris, Fathom of Night",
    "listed": {
      "key": "lightning",
      "kind": "damage",
      "value": -40,
      "derived": false
    },
    "weaknesses": [
      "lightning"
    ],
    "weaknessValue": -40,
    "fastestStatuses": [
      "frost",
      "rot"
    ],
    "fastestStatusValue": 252,
    "forms": [
      {
        "label": null,
        "hp": {
          "solo": 12687,
          "duo": 25374,
          "trio": 38061
        },
        "poise": 150,
        "phys": {
          "standard": 0,
          "slash": -15,
          "strike": 20,
          "pierce": 10
        },
        "elem": {
          "magic": 20,
          "fire": 50,
          "lightning": -40,
          "holy": 15
        },
        "status": {
          "bleed": "Immune",
          "frost": 252,
          "rot": 252,
          "poison": "Immune",
          "sleep": "Immune",
          "madness": "Immune"
        }
      }
    ],
    "night1": [
      "Gaping Dragon",
      "Grafted Monarch",
      "Smelter Demon",
      "Valiant Gargoyle",
      "Wormface"
    ],
    "night2": [
      "Full-Grown Fallingstar Beast",
      "Godskin Duo",
      "Tree Sentinel & Royal Cavalrymen"
    ]
  },
  {
    "id": "equilibrious-beast",
    "expedition": "Equilibrious Beast",
    "nightlord": "Libra, Creature of Night",
    "listed": {
      "key": "madness",
      "kind": "status",
      "value": 154,
      "derived": false
    },
    "weaknesses": [
      "holy"
    ],
    "weaknessValue": -35,
    "fastestStatuses": [
      "madness",
      "poison",
      "rot"
    ],
    "fastestStatusValue": 154,
    "forms": [
      {
        "label": null,
        "hp": {
          "solo": 13048,
          "duo": 26096,
          "trio": 39144
        },
        "poise": 120,
        "phys": {
          "standard": 0,
          "slash": -10,
          "strike": 0,
          "pierce": 0
        },
        "elem": {
          "magic": 20,
          "fire": -20,
          "lightning": 0,
          "holy": -35
        },
        "status": {
          "bleed": 252,
          "frost": 252,
          "rot": 154,
          "poison": 154,
          "sleep": "Immune",
          "madness": 154
        }
      }
    ],
    "night1": [
      "Battlefield Commander",
      "Centipede Demon",
      "Duke's Dear Freja",
      "Royal Revenant",
      "Tibia Mariner & Those Who Live in Death"
    ],
    "night2": [
      "Crucible Knight & Golden Hippopotamus",
      "Death Rite Bird",
      "Godskin Duo"
    ]
  },
  {
    "id": "darkdrift-knight",
    "expedition": "Darkdrift Knight",
    "nightlord": "Fulghor, Champion of Nightglow",
    "listed": {
      "key": "lightning",
      "kind": "damage",
      "value": -20,
      "derived": false
    },
    "weaknesses": [
      "lightning"
    ],
    "weaknessValue": -20,
    "fastestStatuses": [
      "bleed",
      "frost",
      "poison",
      "rot",
      "sleep"
    ],
    "fastestStatusValue": 154,
    "forms": [
      {
        "label": null,
        "hp": {
          "solo": 11894,
          "duo": 23788,
          "trio": 35682
        },
        "poise": 155,
        "phys": {
          "standard": 0,
          "slash": 0,
          "strike": 0,
          "pierce": 0
        },
        "elem": {
          "magic": 0,
          "fire": 0,
          "lightning": -20,
          "holy": 30
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
    "night1": [
      "Centipede Demon",
      "Gaping Dragon",
      "Night's Cavalry",
      "Royal Revenant",
      "Wormface"
    ],
    "night2": [
      "Nameless King",
      "Nox Dragonkin Soldier",
      "Outland Commander"
    ]
  },
  {
    "id": "fissure-in-the-fog",
    "expedition": "Fissure in the Fog",
    "nightlord": "Caligo, Miasma of Night",
    "listed": {
      "key": "fire",
      "kind": "damage",
      "value": -35,
      "derived": false
    },
    "weaknesses": [
      "fire"
    ],
    "weaknessValue": -35,
    "fastestStatuses": [
      "bleed",
      "poison",
      "rot"
    ],
    "fastestStatusValue": 252,
    "forms": [
      {
        "label": null,
        "hp": {
          "solo": 12007,
          "duo": 24014,
          "trio": 36021
        },
        "poise": 160,
        "phys": {
          "standard": 0,
          "slash": 15,
          "strike": -15,
          "pierce": 10
        },
        "elem": {
          "magic": 20,
          "fire": -35,
          "lightning": 20,
          "holy": 20
        },
        "status": {
          "bleed": 252,
          "frost": 542,
          "rot": 252,
          "poison": 252,
          "sleep": 542,
          "madness": "Immune"
        }
      }
    ],
    "night1": [
      "Duke's Dear Freja",
      "Grafted Monarch",
      "Smelter Demon",
      "Tibia Mariner & Those Who Live in Death",
      "Ulcerated Tree Spirit"
    ],
    "night2": [
      "Dancer of the Boreal Valley",
      "Draconic Tree Sentinel & Royal Cavalrymen",
      "Godskin Duo"
    ]
  },
  {
    "id": "night-aspect",
    "expedition": "Night Aspect",
    "nightlord": "Heolstor, the Nightlord",
    "listed": {
      "key": "holy",
      "kind": "damage",
      "value": -20,
      "derived": false
    },
    "weaknesses": [
      "holy"
    ],
    "weaknessValue": -20,
    "fastestStatuses": [
      "rot"
    ],
    "fastestStatusValue": 252,
    "forms": [
      {
        "label": "Phase 1",
        "hp": {
          "solo": 4984,
          "duo": 9968,
          "trio": 14952
        },
        "poise": 130,
        "phys": {
          "standard": 0,
          "slash": -15,
          "strike": 10,
          "pierce": -10
        },
        "elem": {
          "magic": 0,
          "fire": -20,
          "lightning": 0,
          "holy": -35
        },
        "status": {
          "bleed": "Immune",
          "frost": "Immune",
          "rot": 252,
          "poison": "Immune",
          "sleep": 542,
          "madness": "Immune"
        }
      },
      {
        "label": "Phase 2",
        "hp": {
          "solo": 11214,
          "duo": 22428,
          "trio": 33642
        },
        "poise": 130,
        "phys": {
          "standard": 0,
          "slash": 10,
          "strike": -10,
          "pierce": -15
        },
        "elem": {
          "magic": 0,
          "fire": 0,
          "lightning": -20,
          "holy": -20
        },
        "status": {
          "bleed": "Immune",
          "frost": "Immune",
          "rot": 252,
          "poison": "Immune",
          "sleep": 542,
          "madness": "Immune"
        }
      }
    ],
    "night1": [
      "Battlefield Commander",
      "Bell Bearing Hunter",
      "Centipede Demon",
      "Demi-Human Queen & Swordmaster",
      "Gaping Dragon",
      "Grafted Monarch",
      "Night's Cavalry",
      "Royal Revenant",
      "Smelter Demon",
      "Valiant Gargoyle"
    ],
    "night2": [
      "Ancient Dragon",
      "Crucible Knight & Golden Hippopotamus",
      "Dancer of the Boreal Valley",
      "Fell Omen",
      "Full-Grown Fallingstar Beast",
      "Great Wyrm",
      "Nameless King",
      "Nox Dragonkin Soldier"
    ]
  },
  {
    "id": "balancers",
    "expedition": "Balancers",
    "nightlord": "Weapon-Bequeathed Harmonia",
    "listed": {
      "key": "sleep",
      "kind": "status",
      "value": 84,
      "derived": false
    },
    "weaknesses": [
      "strike"
    ],
    "weaknessValue": -10,
    "fastestStatuses": [
      "sleep"
    ],
    "fastestStatusValue": 84,
    "forms": [
      {
        "label": null,
        "hp": null,
        "poise": 75,
        "phys": {
          "standard": 0,
          "slash": 8,
          "strike": -10,
          "pierce": 0
        },
        "elem": {
          "magic": 0,
          "fire": 8,
          "lightning": 10,
          "holy": 30
        },
        "status": {
          "bleed": 252,
          "frost": 252,
          "rot": 252,
          "poison": 252,
          "sleep": 84,
          "madness": "Immune"
        }
      }
    ],
    "night1": [
      "Curseblade & Divine Beast Warrior",
      "Demon in Pain & Demon from Below"
    ],
    "night2": [
      "Demon Prince",
      "Lord of Blood"
    ]
  },
  {
    "id": "dreglord",
    "expedition": "Dreglord",
    "nightlord": "Traitorous Straghess",
    "listed": {
      "key": "holy",
      "kind": "damage",
      "value": -25,
      "derived": true
    },
    "weaknesses": [
      "holy"
    ],
    "weaknessValue": -25,
    "fastestStatuses": [
      "bleed",
      "frost",
      "sleep"
    ],
    "fastestStatusValue": 252,
    "forms": [
      {
        "label": null,
        "hp": {
          "solo": 11554,
          "duo": 23108,
          "trio": 34662
        },
        "poise": 150,
        "phys": {
          "standard": 0,
          "slash": -10,
          "strike": 0,
          "pierce": -10
        },
        "elem": {
          "magic": 0,
          "fire": -20,
          "lightning": 10,
          "holy": -25
        },
        "status": {
          "bleed": 252,
          "frost": 252,
          "rot": 542,
          "poison": 542,
          "sleep": 252,
          "madness": "Immune"
        }
      }
    ],
    "night1": [
      "Death Knight",
      "Great Red Bear"
    ],
    "night2": [
      "Divine Beast Dancing Lion",
      "Knight Artorias"
    ]
  }
];
