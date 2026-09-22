// ============================================================
// ITEMS  -  loot that spawns on the map at random (not at round start)
// LOOT_COUNT       = max items on the map at once
// LOOT_START_DELAY = seconds before the FIRST item
// LOOT_SPAWN_GAP   = seconds between each extra spawn
// LOOT_REFRESH     = seconds to wait after the map is empty, then spawn again
// ------------------------------------------------------------
// 5 ITEMS:
//   bomb    - explode around you, 1.5 hearts to nearby enemies
//   reveal  - see enemies for 10 seconds
//   heal    - +2 hearts
//   speed   - run faster for 8 seconds
//   shield  - block the next hit
//
// PUT YOUR IMAGES IN:
//   public/sprites/items/bomb.png
//   public/sprites/items/reveal.png
//   public/sprites/items/heal.png
//   public/sprites/items/speed.png
//   public/sprites/items/shield.png
// Magenta background gets cut out.
// ============================================================

export type ItemId = "bomb" | "reveal" | "heal" | "speed" | "shield";

export type ItemDef = {
  id: ItemId;
  name: string;
  file: string;
  color: string;
};

export const ITEMS: ItemDef[] = [
  { id: "bomb", name: "BOMB", file: "/sprites/items/bomb.png", color: "#d0483f" },
  { id: "reveal", name: "SIGHT", file: "/sprites/items/reveal.png", color: "#5aa9ff" },
  { id: "heal", name: "HEAL", file: "/sprites/items/heal.png", color: "#e04b4b" },
  { id: "speed", name: "SPEED", file: "/sprites/items/speed.png", color: "#f0c040" },
  { id: "shield", name: "SHIELD", file: "/sprites/items/shield.png", color: "#7ad7e8" },
];

export const LOOT_COUNT = 5;
export const LOOT_START_DELAY = 4;
export const LOOT_SPAWN_GAP = 4 ;
export const LOOT_REFRESH = 8;
export const BOMB_RANGE = 52;
export const BOMB_DMG = 1.5;
export const REVEAL_TIME = 10;
export const SPEED_TIME = 8;
export const HEAL_AMT = 2;

export function randomItem(): ItemId {
  return ITEMS[Math.floor(Math.random() * ITEMS.length)].id;
}

export function itemById(id: ItemId) {
  return ITEMS.find((i) => i.id === id)!;
}

export function drawItemIcon(id: ItemId, size = 12): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d")!;
  const def = itemById(id);
  g.fillStyle = "#0c0c12";
  g.fillRect(0, 0, size, size);
  g.fillStyle = def.color;
  g.fillRect(1, 1, size - 2, size - 2);
  g.fillStyle = "#0c0c12";
  // tiny mark so they look different
  if (id === "bomb") {
    g.fillRect(size / 2 - 1, 2, 2, 3);
    g.fillStyle = "#ffe680";
    g.fillRect(size / 2, 1, 2, 2);
  } else if (id === "reveal") {
    g.fillRect(2, size / 2 - 1, size - 4, 2);
    g.fillStyle = "#ffffff";
    g.fillRect(size / 2 - 1, size / 2 - 1, 2, 2);
  } else if (id === "heal") {
    g.fillRect(size / 2 - 1, 3, 2, size - 6);
    g.fillRect(3, size / 2 - 1, size - 6, 2);
  } else if (id === "speed") {
    g.fillRect(3, 3, 2, size - 6);
    g.fillRect(6, 3, 2, size - 6);
  } else {
    g.fillRect(3, 3, size - 6, size - 6);
    g.fillStyle = def.color;
    g.fillRect(5, 5, size - 10, size - 10);
  }
  return c;
}
