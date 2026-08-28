// Recommended relic loadouts per Nightfarer, transcribed once from the community
// spreadsheet. Edit this file directly.
//
// Conventions that are easy to get backwards:
//   effect    the canonical title from data/effects.ts, never the spreadsheet's
//             own wording. It is the lookup key, and builds.test.ts fails if it
//             does not name a real relic effect.
//   as        what to show instead, when the spreadsheet says something the
//             canonical title does not. "Improved [Spell School] Sorcery" is the
//             effect; "Improved Carian Sword Sorcery" is the recommendation, and
//             dropping it would throw away the build advice.
//   curses    drawbacks the deep effect drags along, canonical titles again. One
//             deep effect can carry two.
//   label     either a relic's name or, when two slots share a number, the name
//             of the variant. Same syntax in the sheet, told apart by the clash.
//
// A slot holds three lines, or four when the sheet offered a choice with "|".
import type { CharacterBuilds } from "../types";

export const BUILDS: CharacterBuilds[] = [
  {
    slug: "wylder",
    name: "Wylder",
    builds: [
      {
        name: "Greatsword",
        relics: [
          { n: 1, lines: [
            { effect: "[Wylder] +1 additional character skill use" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
            { effect: "Improved Poise & Damage Negation When Knocked Back by Damage" },
          ] },
          { n: 2, lines: [
            { effect: "[Wylder] Art activation spreads fire in the area" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
          ] },
          { n: 3, lines: [
            { effect: "[Wylder] Art gauge is greatly filled when ability is activated" },
            { effect: "Improved Attack Power with 3 [Weapon Type] Equipped", as: "Improved Attack Power with +3 Greatswords Equipped" },
            { effect: "Defeating enemies fills more of the Art gauge" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Wylder] Character Skill inflicts Blood Loss" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 2, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
        ],
      },
      {
        name: "Fist",
        relics: [
          { n: 1, lines: [
            { effect: "[Wylder] +1 additional character skill use" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
            { effect: "Improved Poise & Damage Negation When Knocked Back by Damage" },
          ] },
          { n: 2, lines: [
            { effect: "[Wylder] Art activation spreads fire in the area" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
          ] },
          { n: 3, lines: [
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover Fists" },
            { effect: "Improved Attack Power with 3 [Weapon Type] Equipped", as: "Improved Attack Power with +3 Fists Equipped" },
            { effect: "Defeating enemies fills more of the Art gauge" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Wylder] Character Skill inflicts Blood Loss" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 2, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
        ],
      },
      {
        name: "Will of Balance",
        relics: [
          { n: 1, lines: [
            { effect: "[Wylder] +1 additional character skill use" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to Hoarfrost Stomp at start of expedition" },
          ] },
          { n: 2, label: "The Will of the Balancers", lines: [
            { effect: "Improved Melee Attack Power" },
            { effect: "Improved Skill Attack Power" },
            { effect: "Continuous FP Recovery" },
          ] },
          { n: 3, label: "The Will of Balance", lines: [
            { effect: "Improved Melee Attack Power" },
            { effect: "Improved Skill Attack Power" },
            { effect: "Occasionally Nullify Attacks When Damage Negation is Lowered" },
          ] },
        ],
        deep: [
          { n: 1, label: "With Dormant Power", lines: [
            { effect: "[Wylder] Character Skill inflicts Blood Loss" },
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover [Fists, Great Spears, Reapers]" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
          ] },
          { n: 1, label: "Without Dormant Power", lines: [
            { effect: "[Wylder] Character Skill inflicts Blood Loss" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence", "Reduced Strength and Intelligence"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 2, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence", "Reduced Strength and Intelligence"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence", "Reduced Strength and Intelligence"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
        ],
      },
    ],
  },
  {
    slug: "guardian",
    name: "Guardian",
    builds: [
      {
        name: "Shield Poking",
        relics: [
          { n: 1, lines: [
            { effect: "[Guardian] Slowly restores nearby allies HP while Art is active" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
            { effect: "Improved Poise & Damage Negation When Knocked Back by Damage" },
          ] },
          { n: 2, lines: [
            { effect: "[Guardian] Successful guards send out shockwaves while ability is active" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
          ] },
          { n: 3, lines: [
            { effect: "[Guardian] Increased skill duration" },
            { effect: "Art gauge charged from successful guarding", as: "Successful guarding fills more of the Art gauge" },
            { effect: "HP Restoration upon Thrusting Counterattack" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Guardian] Character Skill Boosts Damage Negation of Nearby Allies" },
            { effect: "HP Restoration upon Thrusting Counterattack +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Improved [Element] Damage Negation +1/2", as: "Improved [Affinity/Magic/Fire/Lightning/Holy] Damage Negation +2", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4" },
          ] },
          { n: 2, lines: [
            { effect: "[Guardian] Improved Strength and Dexterity, Reduced Vigor" },
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover Thrusting Swords" },
            { effect: "Improved [Element] Damage Negation +1/2", as: "Improved [Affinity/Magic/Fire/Lightning/Holy] Damage Negation +2", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4" },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Art gauge charged from successful guarding +1", as: "Successful guarding fills more of the Art gauge +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Improved [Element] Damage Negation +1/2", as: "Improved [Affinity/Magic/Fire/Lightning/Holy] Damage Negation +2", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4" },
          ] },
        ],
      },
      {
        name: "Guard Counter",
        relics: [
          { n: 1, lines: [
            { effect: "[Guardian] Slowly restores nearby allies HP while Art is active" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
            { effect: "Improved Poise & Damage Negation When Knocked Back by Damage" },
          ] },
          { n: 2, lines: [
            { effect: "[Guardian] Successful guards send out shockwaves while ability is active" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
          ] },
          { n: 3, lines: [
            { effect: "[Guardian] Increased skill duration" },
            { effect: "Art gauge charged from successful guarding", as: "Successful guarding fills more of the Art gauge" },
            { effect: "Guard counter is given a boost based on current HP" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Guardian] Character Skill Boosts Damage Negation of Nearby Allies" },
            { effect: "Improved Guard Counters +1/2", as: "Improved Guard Counters +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 2, lines: [
            { effect: "[Guardian] Improved Strength and Dexterity, Reduced Vigor" },
            { effect: "Improved Guard Counters +1/2", as: "Improved Guard Counters +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["More Damage Taken After Evasion"] },
            { effect: "Improved Guard Counters +1/2", as: "Improved Guard Counters +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
        ],
      },
      {
        name: "Greatshield",
        relics: [
          { n: 1, lines: [
            { effect: "[Guardian] Slowly restores nearby allies HP while Art is active" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
            { effect: "Improved Poise & Damage Negation When Knocked Back by Damage" },
          ] },
          { n: 2, lines: [
            { effect: "[Guardian] Successful guards send out shockwaves while ability is active" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
          ] },
          { n: 3, lines: [
            { effect: "[Guardian] Increased skill duration" },
            { effect: "Art gauge charged from successful guarding", as: "Successful guarding fills more of the Art gauge" },
            { effect: "HP Recovery From Successful Guarding" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Guardian] Character Skill Boosts Damage Negation of Nearby Allies" },
            { effect: "Max HP Up with 3+ Small/Medium/Greatshields Equipped", as: "Max HP Up with 3+ Greatshields Equipped" },
            { effect: "Improved [Element] Damage Negation +1/2", as: "Improved [Affinity/Magic/Fire/Lightning/Holy] Damage Negation +2", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4" },
          ] },
          { n: 2, lines: [
            { effect: "[Guardian] Improved Strength and Dexterity, Reduced Vigor" },
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover Greatshields" },
            { effect: "Improved [Element] Damage Negation +1/2", as: "Improved [Affinity/Magic/Fire/Lightning/Holy] Damage Negation +2", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4" },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Art gauge charged from successful guarding +1", as: "Successful guarding fills more of the Art gauge +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Improved [Element] Damage Negation +1/2", as: "Improved [Affinity/Magic/Fire/Lightning/Holy] Damage Negation +2", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4" },
          ] },
        ],
      },
      {
        name: "Will of Balance",
        relics: [
          { n: 1, lines: [
            { effect: "[Guardian] Successful guards send out shockwaves while ability is active" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to Hoarfrost Stomp at start of expedition" },
          ] },
          { n: 2, label: "The Will of the Balancers", lines: [
            { effect: "Improved Melee Attack Power" },
            { effect: "Improved Skill Attack Power" },
            { effect: "Continuous FP Recovery" },
          ] },
          { n: 3, label: "The Will of Balance", lines: [
            { effect: "Improved Melee Attack Power" },
            { effect: "Improved Skill Attack Power" },
            { effect: "Occasionally Nullify Attacks When Damage Negation is Lowered" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "HP Restoration upon Thrusting Counterattack +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
          ] },
          { n: 2, lines: [
            { effect: "[Guardian] Improved Strength and Dexterity, Reduced Vigor" },
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover Great Spears" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Art gauge charged from successful guarding +1", as: "Successful guarding fills more of the Art gauge +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
          ] },
        ],
      },
    ],
  },
  {
    slug: "ironeye",
    name: "Ironeye",
    builds: [
      {
        name: "Frost and Poison",
        relics: [
          { n: 1, lines: [
            { effect: "[Ironeye] +1 additional character skill use" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
          ] },
          { n: 2, lines: [
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Defeating enemies fills more of the Art gauge" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to Rain of Arrows at start of expedition" },
          ] },
          { n: 3, lines: [
            { effect: "Starting armament inflicts [Status]", as: "Starting armament inflicts frost" },
            { effect: "Attack power up when facing frostbite/poison/rot afflicted enemy", as: "Attack power up when facing frost-afflicted enemy" },
            { effect: "Attack power up when facing frostbite/poison/rot afflicted enemy", as: "Attack power up when facing poison-afflicted enemy" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Ironeye] Character Skill Inflicts Heavy Poison Damage on Poisoned Enemies" },
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Reduced Strength and Faith"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 2, lines: [
            { effect: "Attack power up when facing poison/scarlet rot/frostbite-afflicted enemy +1/2", as: "Attack power up when facing poison-afflicted enemy +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Attack power up when facing poison/scarlet rot/frostbite-afflicted enemy +1/2", as: "Attack power up when facing frost-afflicted enemy +2", curses: ["Reduced Strength and Faith"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 3, lines: [
            { effect: "Attack power up when facing poison/scarlet rot/frostbite-afflicted enemy +1/2", as: "Attack power up when facing frost-afflicted enemy +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Attack power up when facing poison/scarlet rot/frostbite-afflicted enemy +1/2", as: "Attack power up when facing poison-afflicted enemy +1", curses: ["Reduced Strength and Faith"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
        ],
      },
      {
        name: "Katana",
        relics: [
          { n: 1, lines: [
            { effect: "[Ironeye] +1 additional character skill use" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
          ] },
          { n: 2, lines: [
            { effect: "[Ironeye] Art Charge Activation Adds Poison Effect" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Defeating enemies fills more of the Art gauge" },
          ] },
          { n: 3, lines: [
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover Katanas" },
            { effect: "Improved Attack Power with 3 [Weapon Type] Equipped", as: "Improved Attack Power with +3 Katanas Equipped" },
            { effect: "Improved Poise & Damage Negation When Knocked Back by Damage" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Ironeye] Character Skill Inflicts Heavy Poison Damage on Poisoned Enemies" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Strength and Faith"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 2, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Strength and Faith"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Strength and Faith"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
        ],
      },
    ],
  },
  {
    slug: "duchess",
    name: "Duchess",
    builds: [
      {
        name: "Carian Sword Sorcery",
        relics: [
          { n: 1, lines: [
            { effect: "[Duchess] Improved Character Skill Attack Power" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved Carian Sword Sorcery" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
          ] },
          { n: 2, lines: [
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved Carian Sword Sorcery" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Max FP increased for each Sorcerer's Rise unlocked" },
          ] },
          { n: 3, label: "With Character Relic", lines: [
            { effect: "[Duchess] Defeating enemies while Art is active ups attack power" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved Carian Sword Sorcery" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to [Blood Blade, Hoarfrost Stomp] at start of expedition" },
          ] },
          { n: 3, label: "Without Character Relic", lines: [
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved Carian Sword Sorcery" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to [Blood Blade, Hoarfrost Stomp] at start of expedition" },
            { effect: "Magic/Fire/Lightning/Holy Attack Up +0/1/2", as: "Magic Attack Power Up +2" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Duchess] Use Character Skill for Brief Invulnerability" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved Carian Sword Sorcery" },
            { effect: "Magic/Fire/Lightning/Holy Attack Up +3/4", as: "Magic Attack Power Up +4", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 2, lines: [
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover Staves" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved Carian Sword Sorcery" },
            { effect: "Magic/Fire/Lightning/Holy Attack Up +3/4", as: "Magic Attack Power Up +4", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 3, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved Carian Sword Sorcery" },
            { effect: "Magic/Fire/Lightning/Holy Attack Up +3/4", as: "Magic Attack Power Up +4", curses: ["Reduced Strength and Faith"] },
          ] },
        ],
      },
      {
        name: "Incantation",
        relics: [
          { n: 1, lines: [
            { effect: "[Duchess] Improved Character Skill Attack Power" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Dragon Cult/Frenzied Flame/Fundamentalist/Giants' Flame/Godslayer] Incantations" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
          ] },
          { n: 2, lines: [
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Dragon Cult/Frenzied Flame/Fundamentalist/Giants' Flame/Godslayer] Incantations" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Max FP increased for each Sorcerer's Rise unlocked" },
          ] },
          { n: 3, lines: [
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover Seals" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Dragon Cult/Frenzied Flame/Fundamentalist/Giants' Flame/Godslayer] Incantations" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to [Blood Blade, Hoarfrost Stomp] at start of expedition" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Duchess] Use Character Skill for Brief Invulnerability" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Dragon Cult/Frenzied Flame/Fundamentalist/Giants' Flame/Godslayer] Incantations" },
            { effect: "Improved Sorceries/Incantations +0/1/2", as: "Improved Incantations +2", curses: ["Reduced Strength and Intelligence"] },
          ] },
          { n: 2, lines: [
            { effect: "[Duchess] Improved Mind and Faith, Reduced Intelligence" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Dragon Cult/Frenzied Flame/Fundamentalist/Giants' Flame/Godslayer] Incantations" },
            { effect: "Improved Sorceries/Incantations +0/1/2", as: "Improved Incantations +2", curses: ["Reduced Strength and Intelligence"] },
          ] },
          { n: 3, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Dragon Cult/Frenzied Flame/Fundamentalist/Giants' Flame/Godslayer] Incantations" },
            { effect: "Improved Sorceries/Incantations +0/1/2", as: "Improved Incantations +2", curses: ["Reduced Strength and Intelligence"] },
          ] },
        ],
      },
      {
        name: "Dagger",
        relics: [
          { n: 1, lines: [
            { effect: "[Duchess] Improved Character Skill Attack Power" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to [Bloodblade/Chilling Mist, Hoarfrost Stomp] at start of expedition" },
          ] },
          { n: 2, lines: [
            { effect: "[Duchess] Successive dagger attack reprises event upon nearby enemies" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
            { effect: "Starting armament inflicts [Status]", as: "Starting armament inflicts [frost/blood loss]" },
          ] },
          { n: 3, lines: [
            { effect: "Improved Attack Power with 3 [Weapon Type] Equipped", as: "Improved Attack Power with +3 Daggers Equipped" },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
            { effect: "Improved Poise & Damage Negation When Knocked Back by Damage" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Duchess] Use Character Skill for Brief Invulnerability" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 2, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
        ],
      },
      {
        name: "Fist",
        relics: [
          { n: 1, lines: [
            { effect: "[Duchess] Improved Character Skill Attack Power" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
          ] },
          { n: 2, lines: [
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
            { effect: "Defeating enemies fills more of the Art gauge" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to [Blood Blade, Hoarfrost Stomp] at start of expedition" },
          ] },
          { n: 3, lines: [
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover Fists" },
            { effect: "Improved Attack Power with 3 [Weapon Type] Equipped", as: "Improved Attack Power with +3 Fists Equipped" },
            { effect: "Improved Poise & Damage Negation When Knocked Back by Damage" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Duchess] Use Character Skill for Brief Invulnerability" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 2, lines: [
            { effect: "[Duchess] Improved Vigor and Strength, Reduced Mind" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
        ],
      },
      {
        name: "Will of Balance",
        relics: [
          { n: 1, lines: [
            { effect: "[Duchess] Improved Character Skill Attack Power" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to [Bloodblade, Hoarfrost Stomp] at start of expedition" },
          ] },
          { n: 2, label: "The Will of the Balancers", lines: [
            { effect: "Improved Melee Attack Power" },
            { effect: "Improved Skill Attack Power" },
            { effect: "Continuous FP Recovery" },
          ] },
          { n: 3, label: "The Will of Balance", lines: [
            { effect: "Improved Melee Attack Power" },
            { effect: "Improved Skill Attack Power" },
            { effect: "Occasionally Nullify Attacks When Damage Negation is Lowered" },
          ] },
        ],
        deep: [
          { n: 1, label: "With Dormant Power", lines: [
            { effect: "[Duchess] Use Character Skill for Brief Invulnerability" },
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover Reapers" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Strength and Faith"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
          ] },
          { n: 1, label: "Without Dormant Power", lines: [
            { effect: "[Duchess] Use Character Skill for Brief Invulnerability" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 2, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
        ],
      },
    ],
  },
  {
    slug: "recluse",
    name: "Recluse",
    builds: [
      {
        name: "Sorcery",
        relics: [
          { n: 1, lines: [
            { effect: "[Recluse] Suffer blood loss and increase attack power upon Art activation" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Carian Sword/Glintblade/Invisibility] Sorcery" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
          ] },
          { n: 2, lines: [
            { effect: "[Recluse] Activating Ultimate Art raises Max HP" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Carian Sword/Glintblade/Invisibility] Sorcery" },
            { effect: "Attack power up after defeating a Night Invader" },
          ] },
          { n: 3, lines: [
            { effect: "[Recluse] Collecting affinity residue activates Terra Magica" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Carian Sword/Glintblade/Invisibility] Sorcery" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's incantation to [Carian Greatsword, Magic Glintblade, Night Shard] at start of expedition" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Recluse] Improved Intelligence and Faith, Reduced Mind" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Carian Sword/Glintblade/Invisibility] Sorcery" },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 2, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Reduced Strength and Faith"] },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Carian Sword/Glintblade/Invisibility] Sorcery" },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 3, lines: [
            { effect: "Max FP Up with 3+ Staves/Sacred Seals Equipped", as: "Max FP Up with 3+ Staves Equipped" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Carian Sword/Glintblade/Invisibility] Sorcery" },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
        ],
      },
      {
        name: "Incantation",
        relics: [
          { n: 1, lines: [
            { effect: "[Recluse] Suffer blood loss and increase attack power upon Art activation" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Dragon Cult/Frenzied Flame/Fundamentalist/Giants' Flame/Godslayer] Incantations" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
          ] },
          { n: 2, lines: [
            { effect: "[Recluse] Activating Ultimate Art raises Max HP" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Dragon Cult/Frenzied Flame/Fundamentalist/Giants' Flame/Godslayer] Incantations" },
            { effect: "Attack power up after defeating a Night Invader" },
          ] },
          { n: 3, lines: [
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover Seals" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Dragon Cult/Frenzied Flame/Fundamentalist/Giants' Flame/Godslayer] Incantations" },
            { effect: "Max FP increased for each Sorcerer's Rise unlocked" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Recluse] Improved Intelligence and Faith, Reduced Mind" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Dragon Cult/Frenzied Flame/Fundamentalist/Giants' Flame/Godslayer] Incantations" },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 2, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Reduced Strength and Intelligence"] },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Dragon Cult/Frenzied Flame/Fundamentalist/Giants' Flame/Godslayer] Incantations" },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 3, lines: [
            { effect: "Max FP Up with 3+ Staves/Sacred Seals Equipped", as: "Max FP Up with 3+ Seals Equipped" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Dragon Cult/Frenzied Flame/Fundamentalist/Giants' Flame/Godslayer] Incantations" },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
        ],
      },
    ],
  },
  {
    slug: "raider",
    name: "Raider",
    builds: [
      {
        name: "Heavy Weapon",
        relics: [
          { n: 1, lines: [
            { effect: "[Raider] Damage taken while using Character Skill improves attack power and stamina" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
            { effect: "Defeating enemies fills more of the Art gauge" },
          ] },
          { n: 2, lines: [
            { effect: "[Raider] Duration of Ultimate Art extended" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
          ] },
          { n: 3, label: "With Dormant Power", lines: [
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover [Colossal Weapons/Greataxes/Great Hammers]" },
            { effect: "Improved Attack Power with 3 [Weapon Type] Equipped", as: "Improved Attack Power with +3 [Colossal Weapons/Greataxes/Great Hammers] Equipped" },
            { effect: "Improved Poise & Damage Negation When Knocked Back by Damage" },
          ] },
          { n: 3, label: "Without Dormant Power using Collector Signboard Relic", lines: [
            { effect: "Taking attacks improves attack power" },
            { effect: "Improved Poise & Damage Negation When Knocked Back by Damage" },
            { effect: "Physical Attack Up +0/1/2", as: "Physical Attack Up +2" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Raider] Hit With Character Skill to Reduce Enemy Attack Power" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Dexterity and Intelligence"] },
          ] },
          { n: 2, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Dexterity and Intelligence"] },
          ] },
          { n: 3, lines: [
            { effect: "Max HP increased for each great enemy defeated at a Great Church" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Dexterity and Intelligence"] },
          ] },
        ],
      },
      {
        name: "Fist",
        relics: [
          { n: 1, lines: [
            { effect: "[Raider] Damage taken while using Character Skill improves attack power and stamina" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
            { effect: "Defeating enemies fills more of the Art gauge" },
          ] },
          { n: 2, lines: [
            { effect: "[Raider] Duration of Ultimate Art extended" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
          ] },
          { n: 3, lines: [
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover Fists" },
            { effect: "Improved Attack Power with 3 [Weapon Type] Equipped", as: "Improved Attack Power with +3 Fists Equipped" },
            { effect: "Improved Poise & Damage Negation When Knocked Back by Damage" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Raider] Hit With Character Skill to Reduce Enemy Attack Power" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 2, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 3, lines: [
            { effect: "[Raider] Improved Arcane, Reduced Vigor" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
        ],
      },
      {
        name: "Will of Balance",
        relics: [
          { n: 1, lines: [
            { effect: "[Raider] Damage taken while using Character Skill improves attack power and stamina" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to Hoarfrost Stomp at start of expedition" },
          ] },
          { n: 2, label: "The Will of the Balancers", lines: [
            { effect: "Improved Melee Attack Power" },
            { effect: "Improved Skill Attack Power" },
            { effect: "Continuous FP Recovery" },
          ] },
          { n: 3, label: "The Will of Balance", lines: [
            { effect: "Improved Melee Attack Power" },
            { effect: "Improved Skill Attack Power" },
            { effect: "Occasionally Nullify Attacks When Damage Negation is Lowered" },
          ] },
        ],
        deep: [
          { n: 1, label: "With Dormant Power", lines: [
            { effect: "[Raider] Hit With Character Skill to Reduce Enemy Attack Power" },
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover [Fists, Great Spears]" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
          ] },
          { n: 1, label: "Without Dormant Power", lines: [
            { effect: "[Raider] Hit With Character Skill to Reduce Enemy Attack Power" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Dexterity and Intelligence"] },
          ] },
          { n: 2, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Dexterity and Intelligence"] },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Dexterity and Intelligence"] },
          ] },
        ],
      },
    ],
  },
  {
    slug: "executor",
    name: "Executor",
    builds: [
      {
        name: "Bleed and Frost",
        relics: [
          { n: 1, lines: [
            { effect: "[Executor] Character Skill Boosts Attack but Lowers Damage Negation While Attacking" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
            { effect: "Improved Poise & Damage Negation When Knocked Back by Damage" },
          ] },
          { n: 2, lines: [
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to [Blood Blade, Seppuku] at start of expedition" },
          ] },
          { n: 3, lines: [
            { effect: "Improved Attack Power with 3 [Weapon Type] Equipped", as: "Improved Attack Power with +3 Katanas Equipped" },
            { effect: "Defeating enemies fills more of the Art gauge" },
            { effect: "Starting armament inflicts [Status]", as: "Starting armament inflicts frost" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "Attack power up when facing poison/scarlet rot/frostbite-afflicted enemy +1/2", as: "Attack power up when facing frostbite-afflicted enemy +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 2, lines: [
            { effect: "Attack power up when facing poison/scarlet rot/frostbite-afflicted enemy +1/2", as: "Attack power up when facing frost-afflicted enemy +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
        ],
      },
      {
        name: "Triple Status Effects",
        relics: [
          { n: 1, lines: [
            { effect: "[Executor] Character Skill Boosts Attack but Lowers Damage Negation While Attacking" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
            { effect: "Improved Poise & Damage Negation When Knocked Back by Damage" },
          ] },
          { n: 2, lines: [
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to [Chilling Mist/Poison Mist] at start of expedition" },
          ] },
          { n: 3, lines: [
            { effect: "Improved Attack Power with 3 [Weapon Type] Equipped", as: "Improved Attack Power with +3 Katanas Equipped" },
            { effect: "Defeating enemies fills more of the Art gauge" },
            { effect: "Starting armament inflicts [Status]", as: "Starting armament inflicts [poison/frost]" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "Attack power up when facing poison/scarlet rot/frostbite-afflicted enemy +1/2", as: "Attack power up when facing frostbite-afflicted enemy +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 2, lines: [
            { effect: "Attack power up when facing poison/scarlet rot/frostbite-afflicted enemy +1/2", as: "Attack power up when facing poison-afflicted enemy +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
        ],
      },
      {
        name: "Will of Balance",
        relics: [
          { n: 1, lines: [
            { effect: "[Executor] Character Skill Boosts Attack but Lowers Damage Negation While Attacking" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to [Bloodblade, Hoarfrost Stomp] at start of expedition" },
          ] },
          { n: 2, label: "The Will of the Balancers", lines: [
            { effect: "Improved Melee Attack Power" },
            { effect: "Improved Skill Attack Power" },
            { effect: "Continuous FP Recovery" },
          ] },
          { n: 3, label: "The Will of Balance", lines: [
            { effect: "Improved Melee Attack Power" },
            { effect: "Improved Skill Attack Power" },
            { effect: "Occasionally Nullify Attacks When Damage Negation is Lowered" },
          ] },
        ],
        deep: [
          { n: 1, label: "With Dormant Power", lines: [
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover Reapers" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 1, label: "Without Dormant Power", lines: [
            { effect: "Defeating enemies fills more of the Art gauge" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 2, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
        ],
      },
    ],
  },
  {
    slug: "revenant",
    name: "Revenant",
    builds: [
      {
        name: "Bestial / Giants' Flame / Dragon Cult Incantations",
        relics: [
          { n: 1, lines: [
            { effect: "[Revenant] Strengthens family and allies when Ultimate Art is activated" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Bestial/Giants' Flame/Dragon Cult] Incantations" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
          ] },
          { n: 2, lines: [
            { effect: "[Revenant] Trigger ghostflame explosion during Ultimate Art activation" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Bestial/Giants' Flame/Dragon Cult] Incantations" },
            { effect: "Attack power up after defeating a Night Invader" },
          ] },
          { n: 3, lines: [
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Bestial/Giants' Flame/Dragon Cult] Incantations" },
            { effect: "Max FP increased for each Sorcerer's Rise unlocked" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's incantation to [Beast Claw/O, Flame!/Lightning Spear] at start of expedition" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "Defeating enemies fills more of the Art gauge" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Bestial/Giants' Flame/Dragon Cult] Incantations" },
            { effect: "Physical Attack Up +3/4", as: "[Physical/Fire/Lightning] Power Up +4", curses: ["Reduced Strength and Intelligence"] },
          ] },
          { n: 2, lines: [
            { effect: "Max FP Up with 3+ Staves/Sacred Seals Equipped", as: "Max FP Up with 3+ Sacred Seals Equipped" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Bestial/Giants' Flame/Dragon Cult] Incantations" },
            { effect: "Physical Attack Up +3/4", as: "[Physical/Fire/Lightning] Power Up +4", curses: ["Reduced Strength and Intelligence"] },
          ] },
          { n: 3, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Bestial/Giants' Flame/Dragon Cult] Incantations" },
            { effect: "Physical Attack Up +3/4", as: "[Physical/Fire/Lightning] Power Up +4", curses: ["Reduced Strength and Intelligence"] },
          ] },
        ],
      },
      {
        name: "Frenzied Flame / Fundamentalist / Godslayer Incantations",
        relics: [
          { n: 1, lines: [
            { effect: "[Revenant] Strengthens family and allies when Ultimate Art is activated" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Frenzied Flame/Fundamentalist/Godslayer] Incantations" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
          ] },
          { n: 2, lines: [
            { effect: "[Revenant] Trigger ghostflame explosion during Ultimate Art activation" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Frenzied Flame/Fundamentalist/Godslayer] Incantations" },
            { effect: "Attack power up after defeating a Night Invader" },
          ] },
          { n: 3, lines: [
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Frenzied Flame/Fundamentalist/Godslayer] Incantations" },
            { effect: "Max FP increased for each Sorcerer's Rise unlocked" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's incantation to Beast Claw at start of expedition" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "Defeating enemies fills more of the Art gauge" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Frenzied Flame/Fundamentalist/Godslayer] Incantations" },
            { effect: "Improved Sorceries/Incantations +0/1/2", as: "Improved Incantations +2", curses: ["Reduced Strength and Intelligence"] },
          ] },
          { n: 2, lines: [
            { effect: "Max FP Up with 3+ Staves/Sacred Seals Equipped", as: "Max FP Up with 3+ Sacred Seals Equipped" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Frenzied Flame/Fundamentalist/Godslayer] Incantations" },
            { effect: "Improved Sorceries/Incantations +0/1/2", as: "Improved Incantations +2", curses: ["Reduced Strength and Intelligence"] },
          ] },
          { n: 3, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved [Frenzied Flame/Fundamentalist/Godslayer] Incantations" },
            { effect: "Improved Sorceries/Incantations +0/1/2", as: "Improved Incantations +2", curses: ["Reduced Strength and Intelligence"] },
          ] },
        ],
      },
      {
        name: "Dragon Communion Incantations",
        relics: [
          { n: 1, lines: [
            { effect: "[Revenant] Strengthens family and allies when Ultimate Art is activated" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved Dragon Communion Incantations" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
          ] },
          { n: 2, lines: [
            { effect: "[Revenant] Trigger ghostflame explosion during Ultimate Art activation" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved Dragon Communion Incantations" },
            { effect: "Attack power up after defeating a Night Invader" },
          ] },
          { n: 3, lines: [
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved Dragon Communion Incantations" },
            { effect: "Max FP increased for each Sorcerer's Rise unlocked" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's incantation to Dragonfire at start of expedition" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "Defeating enemies fills more of the Art gauge" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved Dragon Communion Incantations" },
            { effect: "Improved Sorceries/Incantations +0/1/2", as: "Improved Incantations +2", curses: ["Reduced Strength and Intelligence"] },
          ] },
          { n: 2, lines: [
            { effect: "Max FP Up with 3+ Staves/Sacred Seals Equipped", as: "Max FP Up with 3+ Sacred Seals Equipped" },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved Dragon Communion Incantations" },
            { effect: "Improved Sorceries/Incantations +0/1/2", as: "Improved Incantations +2", curses: ["Reduced Strength and Intelligence"] },
          ] },
          { n: 3, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved [Spell School] Sorcery/Incantation", as: "Improved Dragon Communion Incantations" },
            { effect: "Improved Sorceries/Incantations +0/1/2", as: "Improved Incantations +2", curses: ["Reduced Strength and Intelligence"] },
          ] },
        ],
      },
    ],
  },
  {
    slug: "scholar",
    name: "Scholar",
    builds: [
      {
        name: "Thrusting Sword",
        relics: [
          { n: 1, lines: [
            { effect: "[Scholar] Continuous damage inflicted on targets threaded by Ultimate Art" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
            { effect: "Improved Poise & Damage Negation When Knocked Back by Damage" },
          ] },
          { n: 2, label: "Multiplayer", lines: [
            { effect: "[Scholar] Allies targeted by Character Skill gain boosted attack" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Small pouch in possession at start of expedition" },
          ] },
          { n: 2, label: "Single-player", lines: [
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
            { effect: "Small pouch in possession at start of expedition" },
          ] },
          { n: 3, label: "Multiplayer", lines: [
            { effect: "Improved Attack Power with 3 [Weapon Type] Equipped", as: "Improved Attack Power with +3 Thrusting Swords Equipped" },
            { effect: "Item confer effect to all nearby allies" },
            { effect: "Small pouch in possession at start of expedition" },
          ] },
          { n: 3, label: "Single-player", lines: [
            { effect: "Improved Attack Power with 3 [Weapon Type] Equipped", as: "Improved Attack Power with +3 Thrusting Swords Equipped" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to [Blood Blade, Hoarfrost Stomp] at start of expedition" },
            { effect: "Small pouch in possession at start of expedition" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Scholar] Improved Endurance and Dexterity, Reduced Intelligence and Arcane" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 2, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
        ],
      },
      {
        name: "Throwing Pots",
        relics: [
          { n: 1, lines: [
            { effect: "[Scholar] Continuous damage inflicted on targets threaded by Ultimate Art" },
            { effect: "Improved Throwing Pot/Knife/Stone/Perfuming Arts Damage", as: "Improved Throwing Pot Damage" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
          ] },
          { n: 2, label: "Multiplayer", lines: [
            { effect: "[Scholar] Allies targeted by Character Skill gain boosted attack" },
            { effect: "Improved Throwing Pot/Knife/Stone/Perfuming Arts Damage", as: "Improved Throwing Pot Damage" },
            { effect: "Item confer effect to all nearby allies" },
          ] },
          { n: 2, label: "Single-Player", lines: [
            { effect: "Improved Throwing Pot/Knife/Stone/Perfuming Arts Damage", as: "Improved Throwing Pot Damage" },
            { effect: "Defeating enemies fills more of the Art gauge" },
            { effect: "Starting armament inflicts [Status]", as: "Starting armament inflicts [frost/blood loss]" },
          ] },
          { n: 3, lines: [
            { effect: "Improved Throwing Pot/Knife/Stone/Perfuming Arts Damage", as: "Improved Throwing Pot Damage" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to [Blood Blade/Hoarfrost Stomp] at start of expedition" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "Improved [Consumable] Damage +1/2", as: "Improved Throwing Pot Damage +1" },
            { effect: "Small pouch in possession at start of expedition" },
            { effect: "Magic/Fire/Lightning/Holy Attack Up +3/4", as: "Fire Attack Up +4", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 2, lines: [
            { effect: "Improved [Consumable] Damage +1/2", as: "Improved Throwing Pot Damage +1" },
            { effect: "Small pouch in possession at start of expedition" },
            { effect: "Magic/Fire/Lightning/Holy Attack Up +3/4", as: "Fire Attack Up +4", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 3, lines: [
            { effect: "Improved [Consumable] Damage +1/2", as: "Improved Throwing Pot Damage +1" },
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Magic/Fire/Lightning/Holy Attack Up +3/4", as: "Fire Attack Up +4", curses: ["Reduced Strength and Faith"] },
          ] },
        ],
      },
      {
        name: "Will of Balance",
        relics: [
          { n: 1, lines: [
            { effect: "[Scholar] Continuous damage inflicted on targets threaded by Ultimate Art" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to [Bloodblade, Hoarfrost Stomp] at start of expedition" },
          ] },
          { n: 2, label: "The Will of the Balancers", lines: [
            { effect: "Improved Melee Attack Power" },
            { effect: "Improved Skill Attack Power" },
            { effect: "Continuous FP Recovery" },
          ] },
          { n: 3, label: "The Will of Balance", lines: [
            { effect: "Improved Melee Attack Power" },
            { effect: "Improved Skill Attack Power" },
            { effect: "Occasionally Nullify Attacks When Damage Negation is Lowered" },
          ] },
        ],
        deep: [
          { n: 1, label: "With Dormant Power", lines: [
            { effect: "[Scholar] Improved Endurance and Dexterity, Reduced Intelligence and Arcane" },
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover Reapers" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Strength and Faith"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
          ] },
          { n: 1, label: "Without Dormant Power", lines: [
            { effect: "[Scholar] Improved Endurance and Dexterity, Reduced Intelligence and Arcane" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 2, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Strength and Faith"] },
          ] },
        ],
      },
    ],
  },
  {
    slug: "undertaker",
    name: "Undertaker",
    builds: [
      {
        name: "Hammer",
        relics: [
          { n: 1, lines: [
            { effect: "[Undertaker] Attack power increases by landing the final blow of a chain attack" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
            { effect: "Improved Poise & Damage Negation When Knocked Back by Damage" },
          ] },
          { n: 2, lines: [
            { effect: "[Undertaker] Physical attacks boosted while assist effect from incantation is active for self" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
          ] },
          { n: 3, lines: [
            { effect: "[Undertaker] Activating Ultimate Art increases attack power" },
            { effect: "Improved Attack Power with 3 [Weapon Type] Equipped", as: "Improved Attack Power with +3 Hammers Equipped" },
            { effect: "Defeating enemies fills more of the Art gauge" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Undertaker] Executing Art readies Character Skill" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 2, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 3, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
        ],
      },
      {
        name: "Fist",
        relics: [
          { n: 1, lines: [
            { effect: "[Undertaker] Attack power increases by landing the final blow of a chain attack" },
            { effect: "Attack power permanently increased for each evergaol prisoner defeated" },
            { effect: "Improved Poise & Damage Negation When Knocked Back by Damage" },
          ] },
          { n: 2, lines: [
            { effect: "[Undertaker] Physical attacks boosted while assist effect from incantation is active for self" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Stamina Recovery upon Landing Attacks +0/+1", as: "Stamina Recovery upon Landing Attacks" },
          ] },
          { n: 3, lines: [
            { effect: "[Undertaker] Activating Ultimate Art increases attack power" },
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover Fists" },
            { effect: "Improved Attack Power with 3 [Weapon Type] Equipped", as: "Improved Attack Power with +3 Fists Equipped" },
          ] },
        ],
        deep: [
          { n: 1, lines: [
            { effect: "[Undertaker] Executing Art readies Character Skill" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 2, lines: [
            { effect: "[Undertaker] Improved Dexterity, Reduced Vigor and Faith" },
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 3, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence"] },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
        ],
      },
      {
        name: "Will of Balance",
        relics: [
          { n: 1, lines: [
            { effect: "[Undertaker] Activating Ultimate Art increases attack power" },
            { effect: "Attack power up after defeating a Night Invader" },
            { effect: "Change compatible armament skill to [xxx] at start of expedition", as: "Changes compatible armament's skill to Hoarfrost Stomp at start of expedition" },
          ] },
          { n: 2, label: "The Will of the Balancers", lines: [
            { effect: "Improved Melee Attack Power" },
            { effect: "Improved Skill Attack Power" },
            { effect: "Continuous FP Recovery" },
          ] },
          { n: 3, label: "The Will of Balance", lines: [
            { effect: "Improved Melee Attack Power" },
            { effect: "Improved Skill Attack Power" },
            { effect: "Occasionally Nullify Attacks When Damage Negation is Lowered" },
          ] },
        ],
        deep: [
          { n: 1, label: "With Dormant Power", lines: [
            { effect: "[Undertaker] Executing Art readies Character Skill" },
            { effect: "Dormant Power Helps Discover [Weapon Class]", as: "Dormant Power Helps Discover [Fists, Great Spears, Reapers]" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Damage Negation for Flask Usages"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
          ] },
          { n: 1, label: "Without Dormant Power", lines: [
            { effect: "[Undertaker] Executing Art readies Character Skill" },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence", "Reduced Strength and Intelligence"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 2, lines: [
            { effect: "Defeating enemies fills more of the Art gauge +1", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence", "Reduced Strength and Intelligence"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
          { n: 3, lines: [
            { effect: "Partial HP Restoration upon Post-Damage Attacks +1/2", as: "Partial HP Restoration upon Post-Damage Attacks +2", curses: ["Taking Damage Causes [Status] Buildup"] },
            { effect: "Physical Attack Up +3/4", as: "Physical Attack Up +4", curses: ["Reduced Dexterity and Intelligence", "Reduced Strength and Intelligence"] },
            { effect: "Improved Affinity Attack Power +0/1/2", as: "Improved Affinity Attack Power +2" },
            { effect: "Increased Maximum HP", curses: ["Reduced Damage Negation for Flask Usages"] },
          ] },
        ],
      },
    ],
  },
];
