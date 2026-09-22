// ============================================================
// LOADOUT  -  characters + weapons + unlocks
// ------------------------------------------------------------
// CHANGE UNLOCKS HERE (kills / wins needed)
// CHANGE NAMES HERE
// PUT YOUR IMAGES IN:
//   public/sprites/chars/char1.png ... char5.png
//   public/sprites/weapons/weapon1.png ... weapon5.png
// Magenta (#FF00FF) background gets cut out.
// If a file is missing the game uses the built in pixel look.
// ============================================================

import { Palette, PLAYER_PAL } from "./sprites";

export type Need = { kills: number; wins: number };

export type CharacterDef = {
  id: number;
  name: string;
  file: string;
  palette: Palette;
  need: Need;
};

export type WeaponDef = {
  id: number;
  name: string;
  file: string;
  need: Need;
  range: number;
  handle: string;
  blade: string;
  pommel: string;
};

export type Stats = {
  kills: number;
  wins: number;
  char: number;
  weapon: number;
};

const KEY = "silentstrike.stats";

export const CHARACTERS: CharacterDef[] = [
  {
    id: 0,
    name: "SUIT",
    file: "/sprites/chars/char1.png",
    palette: PLAYER_PAL,
    need: { kills: 0, wins: 0 },
  },
  {
    id: 1,
    name: "BLUE",
    file: "/sprites/chars/char2.png",
    palette: { ...PLAYER_PAL, hair: "#15151c", body: "#5d7694", accent: "#3f6fd8", pants: "#3f6fd8" },
    need: { kills: 5, wins: 0 },
  },
  {
    id: 2,
    name: "CRIMSON",
    file: "/sprites/chars/char3.png",
    palette: { ...PLAYER_PAL, hair: "#3a1a12", body: "#7a2a28", accent: "#e04b4b", pants: "#4a1c1c" },
    need: { kills: 15, wins: 0 },
  },
  {
    id: 3,
    name: "MOSS",
    file: "/sprites/chars/char4.png",
    palette: { ...PLAYER_PAL, hair: "#2b1d12", body: "#3d6a38", accent: "#6ddf5a", pants: "#2f4a38" },
    need: { kills: 25, wins: 0 },
  },
  {
    id: 4,
    name: "GOLD",
    file: "/sprites/chars/char5.png",
    palette: { ...PLAYER_PAL, hair: "#e8b43c", body: "#c9a227", accent: "#fff0a8", pants: "#6a5420" },
    need: { kills: 40, wins: 1 },
  },
];

export const WEAPONS: WeaponDef[] = [
  {
    id: 0,
    name: "CYAN",
    file: "/sprites/weapons/weapon1.png",
    need: { kills: 0, wins: 0 },
    range: 42,
    handle: "#6a2f9e",
    blade: "#7ad7e8",
    pommel: "#e8b43c",
  },
  {
    id: 1,
    name: "CRIMSON",
    file: "/sprites/weapons/weapon2.png",
    need: { kills: 10, wins: 0 },
    range: 46,
    handle: "#5a2018",
    blade: "#e04b4b",
    pommel: "#f0c040",
  },
  {
    id: 2,
    name: "JADE",
    file: "/sprites/weapons/weapon3.png",
    need: { kills: 20, wins: 0 },
    range: 48,
    handle: "#2f4a38",
    blade: "#6ddf5a",
    pommel: "#c9a227",
  },
  {
    id: 3,
    name: "GOLD",
    file: "/sprites/weapons/weapon4.png",
    need: { kills: 0, wins: 3 },
    range: 50,
    handle: "#6a5420",
    blade: "#f0c040",
    pommel: "#fff0a8",
  },
  {
    id: 4,
    name: "VOID",
    file: "/sprites/weapons/weapon5.png",
    need: { kills: 50, wins: 0 },
    range: 54,
    handle: "#1a1a22",
    blade: "#d0d4e0",
    pommel: "#8d55c8",
  },
];

const DEFAULTS: Stats = { kills: 0, wins: 0, char: 0, weapon: 0 };

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULTS };
}

export function saveStats(s: Stats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function addMatch(kills: number, win: boolean) {
  const s = loadStats();
  s.kills += kills;
  if (win) s.wins += 1;
  saveStats(s);
}

export function isOpen(need: Need, stats: Stats) {
  return stats.kills >= need.kills && stats.wins >= need.wins;
}

export function needText(need: Need) {
  if (need.kills <= 0 && need.wins <= 0) return "FREE";
  const bits: string[] = [];
  if (need.kills > 0) bits.push(`KILL ${need.kills}`);
  if (need.wins > 0) bits.push(`WIN ${need.wins}`);
  return bits.join(" + ");
}
