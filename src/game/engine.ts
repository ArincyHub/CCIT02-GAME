import { Sfx, SoundKind } from "./audio";
import { drawText, textWidth } from "./font";
import {
  buildSprite,
  buildSwordSprite,
  CharSprite,
  ENEMY_PALS,
  ENEMY_TINTS,
  loadArt,
  PLAYER_PAL,
  SPRITE_H,
  SPRITE_W,
  tintCanvas,
} from "./sprites";

export type Difficulty = "easy" | "normal" | "hard";
export type Settings = { volume: number; ripples: boolean; difficulty: Difficulty };
export type Result = { win: boolean; kills: number; time: number };

export const VIEW_W = 320;
export const VIEW_H = 180;

// ============================================================
// TWEAK THESE
// ------------------------------------------------------------
// Invisible time (seconds)     -> HIDDEN_TIME
// Visible time (seconds)       -> VISIBLE_TIME
// How far a swing can hit      -> HIT_RANGE
// How big the sword is drawn   -> SWORD_SIZE
// How long a swing lasts       -> SWING_TIME
// Map size                     -> WORLD_W / WORLD_H
// ============================================================
export const HIDDEN_TIME = 10;
export const VISIBLE_TIME = 3;
export const HIT_RANGE = 42;
export const SWORD_SIZE = 34;
export const SWING_TIME = 0.42;
export const WORLD_W = 480;
export const WORLD_H = 320;

const BODY_R = 6;

type Obstacle = { x: number; y: number; w: number; h: number; kind: "bush" | "rock" | "wall" };

type Fighter = {
  id: number;
  player: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  speed: number;
  sneak: boolean;
  cooldown: number;
  swing: number;
  swung: boolean;
  walkT: number;
  stepT: number;
  flash: number;
  reveal: number;
  kills: number;
  sprite: CharSprite;
  art: HTMLCanvasElement | null;
  think: number;
  wander: { x: number; y: number } | null;
  known: { x: number; y: number; t: number } | null;
  hearing: number;
  sight: number;
  nerve: number;
};

type Ripple = { x: number; y: number; r: number; max: number; color: string };
type Corpse = { x: number; y: number; sprite: CharSprite };

function rnd(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SOUND_RANGE: Record<SoundKind, number> = {
  step: 110,
  swing: 155,
  hit: 200,
  death: 240,
  reveal: 999,
  hide: 999,
  hurt: 999,
};

const DIFF = {
  easy: { speed: 42, hearing: 90, sight: 120, aggro: 0.8 },
  normal: { speed: 50, hearing: 115, sight: 140, aggro: 1 },
  hard: { speed: 58, hearing: 140, sight: 165, aggro: 1.25 },
};

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private settings: Settings;
  private onEnd: (r: Result) => void;
  private onPause: () => void;

  private sfx = new Sfx();
  private bg: HTMLCanvasElement;
  private obstacles: Obstacle[] = [];
  private fighters: Fighter[] = [];
  private corpses: Corpse[] = [];
  private ripples: Ripple[] = [];
  private swordSpr: HTMLCanvasElement;
  private swordArt: HTMLCanvasElement | null = null;

  private keys = new Set<string>();
  private mouse = { x: VIEW_W / 2, y: VIEW_H / 2, down: false };
  stickX = 0;
  stickY = 0;
  attackBtn = false;
  sneakBtn = false;
  private padStickX = 0;
  private padStickY = 0;
  private padAttack = false;
  private padSneak = false;
  private prevStart = false;

  private raf = 0;
  private last = 0;
  private running = false;
  private paused = false;
  private over = false;

  private time = 0;
  private phase: "hidden" | "visible" = "visible";
  private phaseLeft = VISIBLE_TIME;
  private flashScreen = 0;
  private shake = 0;
  private camX = 0;
  private camY = 0;

  constructor(
    canvas: HTMLCanvasElement,
    opts: { settings: Settings; onEnd: (r: Result) => void; onPause: () => void },
  ) {
    this.canvas = canvas;
    this.canvas.width = VIEW_W;
    this.canvas.height = VIEW_H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.settings = opts.settings;
    this.onEnd = opts.onEnd;
    this.onPause = opts.onPause;
    this.sfx.setVolume(opts.settings.volume);
    this.swordSpr = buildSwordSprite();
    loadArt("/sprites/sword.png", (c) => {
      this.swordArt = c;
    });

    this.bg = this.buildWorld();
    this.spawnFighters();
  }

  // ---------- setup ----------

  private buildWorld(): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = WORLD_W;
    c.height = WORLD_H;
    const g = c.getContext("2d")!;
    const rand = mulberry32(42);

    g.fillStyle = "#4e9e3e";
    g.fillRect(0, 0, WORLD_W, WORLD_H);

    for (let y = 0; y < WORLD_H; y += 16) {
      for (let x = 0; x < WORLD_W; x += 16) {
        if (((x / 16 + y / 16) | 0) % 2 === 0) {
          g.fillStyle = "#4a9739";
          g.fillRect(x, y, 16, 16);
        }
      }
    }

    // grass tufts
    for (let i = 0; i < 700; i++) {
      const x = Math.floor(rand() * WORLD_W);
      const y = Math.floor(rand() * WORLD_H);
      g.fillStyle = rand() > 0.5 ? "#3f8a32" : "#5cae48";
      g.fillRect(x, y, 2, 1);
      g.fillRect(x + 1, y - 1, 1, 1);
    }

    // grass patches (visual only)
    const patches = [
      { x: 40, y: 100, w: 36, h: 20 },
      { x: 200, y: 40, w: 40, h: 18 },
      { x: 390, y: 90, w: 36, h: 20 },
      { x: 60, y: 210, w: 32, h: 16 },
      { x: 340, y: 210, w: 36, h: 18 },
      { x: 220, y: 270, w: 44, h: 16 },
    ];
    for (const p of patches) {
      g.fillStyle = "#57b046";
      g.fillRect(p.x, p.y, p.w, p.h);
      g.fillStyle = "#3f8a32";
      for (let i = 0; i < 14; i++) {
        g.fillRect(p.x + 2 + Math.floor(rand() * (p.w - 4)), p.y + 2 + Math.floor(rand() * (p.h - 4)), 2, 2);
      }
    }

    // stone border walls
    const b = 12;
    this.drawWall(g, 0, 0, WORLD_W, b, rand);
    this.drawWall(g, 0, WORLD_H - b, WORLD_W, b, rand);
    this.drawWall(g, 0, 0, b, WORLD_H, rand);
    this.drawWall(g, WORLD_W - b, 0, b, WORLD_H, rand);

    const spots: Obstacle[] = [
      { x: 90, y: 78, w: 72, h: 12, kind: "wall" },
      { x: 318, y: 78, w: 72, h: 12, kind: "wall" },
      { x: 78, y: 130, w: 12, h: 64, kind: "wall" },
      { x: 390, y: 130, w: 12, h: 64, kind: "wall" },
      { x: 200, y: 196, w: 80, h: 12, kind: "wall" },
      { x: 110, y: 250, w: 64, h: 12, kind: "wall" },
      { x: 306, y: 250, w: 64, h: 12, kind: "wall" },
      { x: 160, y: 40, w: 28, h: 20, kind: "bush" },
      { x: 292, y: 40, w: 28, h: 20, kind: "bush" },
      { x: 160, y: 278, w: 28, h: 20, kind: "bush" },
      { x: 292, y: 278, w: 28, h: 20, kind: "bush" },
      { x: 230, y: 108, w: 24, h: 18, kind: "bush" },
      { x: 170, y: 158, w: 16, h: 12, kind: "rock" },
      { x: 300, y: 148, w: 16, h: 12, kind: "rock" },
      { x: 240, y: 268, w: 16, h: 12, kind: "rock" },
      { x: 48, y: 168, w: 14, h: 12, kind: "rock" },
      { x: 418, y: 168, w: 14, h: 12, kind: "rock" },
    ];
    this.obstacles = spots;

    for (const o of spots) {
      if (o.kind === "wall") this.drawWall(g, o.x, o.y, o.w, o.h, rand);
      else if (o.kind === "bush") this.drawBush(g, o, rand);
      else this.drawRock(g, o);
    }
    return c;
  }

  private drawWall(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    rand: () => number,
  ) {
    g.fillStyle = "#0c0c12";
    g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle = "#8a8f98";
    g.fillRect(x, y, w, h);
    g.fillStyle = "#6d727c";
    for (let yy = y; yy < y + h; yy += 6) {
      g.fillRect(x, yy, w, 1);
    }
    for (let yy = y; yy < y + h; yy += 6) {
      const off = ((yy / 6) | 0) % 2 === 0 ? 0 : 5;
      for (let xx = x + off; xx < x + w; xx += 10) {
        g.fillRect(xx, yy, 1, 6);
      }
    }
    g.fillStyle = "#b4b8c0";
    g.fillRect(x, y, w, 1);
    g.fillStyle = "#4e535c";
    g.fillRect(x, y + h - 1, w, 1);
    void rand;
  }

  private drawBush(g: CanvasRenderingContext2D, o: Obstacle, rand: () => number) {
    g.fillStyle = "#0c0c12";
    g.fillRect(o.x - 1, o.y - 1, o.w + 2, o.h + 2);
    g.fillStyle = "#2f6f2a";
    g.fillRect(o.x, o.y, o.w, o.h);
    g.fillStyle = "#3d8a34";
    g.fillRect(o.x + 2, o.y + 2, o.w - 4, o.h - 8);
    g.fillStyle = "#54a844";
    for (let i = 0; i < 8; i++) {
      g.fillRect(o.x + 3 + Math.floor(rand() * (o.w - 6)), o.y + 3 + Math.floor(rand() * (o.h - 8)), 2, 2);
    }
  }

  private drawRock(g: CanvasRenderingContext2D, o: Obstacle) {
    g.fillStyle = "#0c0c12";
    g.fillRect(o.x - 1, o.y - 1, o.w + 2, o.h + 2);
    g.fillStyle = "#8b9099";
    g.fillRect(o.x, o.y, o.w, o.h);
    g.fillStyle = "#6a6f78";
    g.fillRect(o.x, o.y + o.h - 4, o.w, 4);
    g.fillStyle = "#a8adb6";
    g.fillRect(o.x + 2, o.y + 2, 5, 3);
  }

  private makeFighter(id: number, player: boolean, x: number, y: number): Fighter {
    const d = DIFF[this.settings.difficulty];
    const sprite = buildSprite(player ? PLAYER_PAL : ENEMY_PALS[(id - 1) % ENEMY_PALS.length]);
    const f: Fighter = {
      id,
      player,
      x,
      y,
      vx: 0,
      vy: 0,
      dir: Math.PI / 2,
      hp: player ? 4 : 3,
      maxHp: player ? 4 : 3,
      alive: true,
      speed: player ? 58 : d.speed + rnd(-3, 3),
      sneak: false,
      cooldown: 0,
      swing: 0,
      swung: false,
      walkT: 0,
      stepT: 0,
      flash: 0,
      reveal: 0,
      kills: 0,
      sprite,
      art: null,
      think: 0,
      wander: null,
      known: null,
      hearing: d.hearing,
      sight: d.sight,
      nerve: d.aggro,
    };
    const url = player ? "/sprites/player.png" : "/sprites/enemy1.png";
    loadArt(url, (c) => {
      f.art = player || id === 1 ? c : tintCanvas(c, ENEMY_TINTS[id % ENEMY_TINTS.length]);
    });
    return f;
  }

  private spawnFighters() {
    this.fighters = [this.makeFighter(0, true, WORLD_W / 2, WORLD_H / 2 + 8)];
    const spots = [
      { x: 40, y: 44 },
      { x: WORLD_W - 40, y: 44 },
      { x: 40, y: WORLD_H - 36 },
      { x: WORLD_W - 40, y: WORLD_H - 36 },
    ];
    spots.forEach((s, i) => this.fighters.push(this.makeFighter(i + 1, false, s.x, s.y)));
  }

  // ---------- lifecycle ----------

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    this.sfx.close();
  }

  setPaused(p: boolean) {
    this.paused = p;
    this.keys.clear();
    this.stickX = 0;
    this.stickY = 0;
    this.attackBtn = false;
    if (!p) this.last = performance.now();
  }

  setSettings(s: Settings) {
    this.settings = s;
    this.sfx.setVolume(s.volume);
  }

  wakeAudio() {
    this.sfx.ensure();
  }

  setStick(x: number, y: number) {
    this.stickX = clamp(x, -1, 1);
    this.stickY = clamp(y, -1, 1);
  }

  setAttack(v: boolean) {
    this.attackBtn = v;
    if (v) this.sfx.ensure();
  }

  setSneak(v: boolean) {
    this.sneakBtn = v;
  }

  // ---------- input ----------

  private onKeyDown = (e: KeyboardEvent) => {
    this.sfx.ensure();
    if (e.key === "Escape") {
      this.onPause();
      return;
    }
    if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
    this.keys.add(e.key.toLowerCase());
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  private onMouseMove = (e: MouseEvent) => {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - r.left) / r.width) * VIEW_W;
    this.mouse.y = ((e.clientY - r.top) / r.height) * VIEW_H;
  };

  private onMouseDown = () => {
    this.sfx.ensure();
    this.mouse.down = true;
  };

  private onMouseUp = () => {
    this.mouse.down = false;
  };

  private pollGamepad() {
    const pads = typeof navigator !== "undefined" && navigator.getGamepads ? navigator.getGamepads() : [];
    let gx = 0;
    let gy = 0;
    let attack = false;
    let sneak = false;
    let start = false;
    for (const pad of pads) {
      if (!pad) continue;
      const ax = pad.axes[0] ?? 0;
      const ay = pad.axes[1] ?? 0;
      if (Math.abs(ax) > Math.abs(gx)) gx = ax;
      if (Math.abs(ay) > Math.abs(gy)) gy = ay;
      const btn = (i: number) => !!pad.buttons[i]?.pressed;
      if (btn(0) || btn(2) || btn(5) || btn(7)) attack = true;
      if (btn(1) || btn(4) || btn(6)) sneak = true;
      if (btn(9) || btn(8)) start = true;
    }
    const dead = 0.22;
    if (Math.hypot(gx, gy) > dead) {
      this.padStickX = gx;
      this.padStickY = gy;
    } else {
      this.padStickX = 0;
      this.padStickY = 0;
    }
    this.padAttack = attack;
    this.padSneak = sneak;
    if (start && !this.prevStart) this.onPause();
    this.prevStart = start;
  }

  // ---------- loop ----------

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.paused && !this.over) this.update(dt);
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.pollGamepad();
    this.time += dt;
    this.flashScreen = Math.max(0, this.flashScreen - dt * 4);
    this.shake = Math.max(0, this.shake - dt * 12);

    this.phaseLeft -= dt;
    if (this.phaseLeft <= 0) {
      if (this.phase === "visible") {
        this.phase = "hidden";
        this.phaseLeft = HIDDEN_TIME;
        this.sfx.play("hide", 0.9, 0);
      } else {
        this.phase = "visible";
        this.phaseLeft = VISIBLE_TIME;
        this.flashScreen = 1;
        this.sfx.play("reveal", 0.9, 0);
      }
    }

    const player = this.fighters[0];
    if (player.alive) this.controlPlayer(player, dt);

    for (const f of this.fighters) {
      if (!f.alive) continue;
      if (!f.player) this.thinkAi(f, dt);
      this.moveFighter(f, dt);
      this.updateSwing(f, dt);
      f.flash = Math.max(0, f.flash - dt);
      f.reveal = Math.max(0, f.reveal - dt);
      if (f.cooldown > 0) f.cooldown -= dt;
    }

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.r += dt * 90;
      if (r.r > r.max) this.ripples.splice(i, 1);
    }
  }

  private controlPlayer(p: Fighter, dt: number) {
    const k = this.keys;
    let dx = this.stickX + this.padStickX;
    let dy = this.stickY + this.padStickY;
    if (k.has("a") || k.has("arrowleft")) dx -= 1;
    if (k.has("d") || k.has("arrowright")) dx += 1;
    if (k.has("w") || k.has("arrowup")) dy -= 1;
    if (k.has("s") || k.has("arrowdown")) dy += 1;
    const len = Math.hypot(dx, dy);
    p.sneak = k.has("shift") || this.sneakBtn || this.padSneak;
    const sp = p.speed * (p.sneak ? 0.5 : 1);
    if (len > 0.18) {
      p.vx = (dx / len) * sp;
      p.vy = (dy / len) * sp;
      p.dir = Math.atan2(dy, dx);
    } else {
      p.vx = 0;
      p.vy = 0;
      const mwx = this.camX + this.mouse.x;
      const mwy = this.camY + this.mouse.y;
      p.dir = Math.atan2(mwy - p.y, mwx - p.x);
    }

    if (this.mouse.down || k.has(" ") || this.attackBtn || this.padAttack) this.attack(p);
    void dt;
  }

  private thinkAi(f: Fighter, dt: number) {
    f.think -= dt;

    if (this.phase === "visible" && f.think <= 0) {
      f.think = 0.2;
      let best: Fighter | null = null;
      let bestD = f.sight;
      for (const o of this.fighters) {
        if (o === f || !o.alive) continue;
        const d = Math.hypot(o.x - f.x, o.y - f.y);
        if (d < bestD) {
          bestD = d;
          best = o;
        }
      }
      if (best) f.known = { x: best.x, y: best.y, t: this.time };
    }

    const memory = f.known && this.time - f.known.t < 5 ? f.known : null;
    let tx: number;
    let ty: number;
    let chasing = false;

    if (memory) {
      tx = memory.x;
      ty = memory.y;
      chasing = true;
    } else {
      if (!f.wander || Math.hypot(f.wander.x - f.x, f.wander.y - f.y) < 14) {
        f.wander = {
          x: clamp(f.x + rnd(-140, 140), 30, WORLD_W - 30),
          y: clamp(f.y + rnd(-140, 140), 30, WORLD_H - 30),
        };
      }
      tx = f.wander.x;
      ty = f.wander.y;
    }

    const dx = tx - f.x;
    const dy = ty - f.y;
    const dist = Math.hypot(dx, dy) || 1;
    f.dir = Math.atan2(dy, dx);
    f.sneak = !chasing;
    const sp = f.speed * (chasing ? 1 : 0.55);

    if (chasing && dist < HIT_RANGE - 6) {
      f.vx = 0;
      f.vy = 0;
      this.attack(f);
    } else {
      f.vx = (dx / dist) * sp;
      f.vy = (dy / dist) * sp;
      if (chasing && dist < HIT_RANGE + 14 && Math.random() < 0.35 * f.nerve * dt * 10) this.attack(f);
    }
  }

  private moveFighter(f: Fighter, dt: number) {
    const moving = Math.abs(f.vx) + Math.abs(f.vy) > 1;
    if (moving) {
      f.walkT += dt * (f.sneak ? 4 : 8);
      f.stepT -= dt;
      if (f.stepT <= 0) {
        f.stepT = f.sneak ? 0.55 : 0.34;
        this.emitSound("step", f, f.sneak ? 0.45 : 1);
      }
    } else {
      f.walkT = 0;
    }

    let nx = f.x + f.vx * dt;
    let ny = f.y + f.vy * dt;
    nx = clamp(nx, 18, WORLD_W - 18);
    ny = clamp(ny, 24, WORLD_H - 16);

    for (const o of this.obstacles) {
      const cx = clamp(nx, o.x, o.x + o.w);
      const cy = clamp(ny, o.y, o.y + o.h);
      const ddx = nx - cx;
      const ddy = ny - cy;
      const d = Math.hypot(ddx, ddy);
      if (d < BODY_R) {
        if (d === 0) {
          ny = o.y - BODY_R;
        } else {
          nx = cx + (ddx / d) * BODY_R;
          ny = cy + (ddy / d) * BODY_R;
        }
      }
    }

    for (const o of this.fighters) {
      if (o === f || !o.alive) continue;
      const ddx = nx - o.x;
      const ddy = ny - o.y;
      const d = Math.hypot(ddx, ddy);
      if (d > 0 && d < 9) {
        nx = o.x + (ddx / d) * 9;
        ny = o.y + (ddy / d) * 9;
      }
    }

    f.x = nx;
    f.y = ny;
  }

  private attack(f: Fighter) {
    if (f.cooldown > 0 || f.swing > 0) return;
    f.swing = SWING_TIME;
    f.swung = false;
    f.cooldown = 0.62;
    this.emitSound("swing", f, 1);
  }

  private updateSwing(f: Fighter, dt: number) {
    if (f.swing <= 0) return;
    f.swing -= dt;
    if (!f.swung && f.swing <= SWING_TIME * 0.45) {
      f.swung = true;
      for (const o of this.fighters) {
        if (o === f || !o.alive) continue;
        const dx = o.x - f.x;
        const dy = o.y - f.y;
        const d = Math.hypot(dx, dy);
        if (d > HIT_RANGE + BODY_R) continue;
        let diff = Math.atan2(dy, dx) - f.dir;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) < 1.25) this.damage(o, f);
      }
    }
    if (f.swing < 0) f.swing = 0;
  }

  private damage(target: Fighter, from: Fighter) {
    target.hp -= 1;
    target.flash = 0.22;
    target.reveal = 0.55;
    const a = Math.atan2(target.y - from.y, target.x - from.x);
    target.x = clamp(target.x + Math.cos(a) * 9, 18, WORLD_W - 18);
    target.y = clamp(target.y + Math.sin(a) * 9, 24, WORLD_H - 16);
    this.emitSound("hit", target, 1);
    if (target.player) {
      this.shake = 1;
      this.sfx.play("hurt", 0.8, 0);
      from.reveal = Math.max(from.reveal, 0.5);
      if (this.settings.ripples) {
        this.ripples.push({ x: from.x, y: from.y, r: 3, max: 34, color: "#ff7070" });
      }
    }
    if (target.hp <= 0) this.kill(target, from);
  }

  private kill(target: Fighter, from: Fighter) {
    target.alive = false;
    from.kills += 1;
    this.corpses.push({ x: target.x, y: target.y, sprite: target.sprite });
    this.emitSound("death", target, 1);
    const alive = this.fighters.filter((f) => f.alive);
    const player = this.fighters[0];
    if (!player.alive) this.finish(false);
    else if (alive.length === 1) this.finish(true);
  }

  private finish(win: boolean) {
    if (this.over) return;
    this.over = true;
    const player = this.fighters[0];
    this.onEnd({ win, kills: player.kills, time: Math.floor(this.time) });
  }

  // ---------- sound ----------

  private emitSound(kind: SoundKind, source: Fighter, strength: number) {
    const range = SOUND_RANGE[kind] * strength;
    const player = this.fighters[0];

    if (source.player) {
      this.sfx.play(kind, 0.55 * strength, 0);
    } else {
      const d = Math.hypot(source.x - player.x, source.y - player.y);
      if (d < range) {
        const vol = Math.pow(1 - d / range, 1.5);
        const pan = clamp((source.x - player.x) / 140, -1, 1);
        this.sfx.play(kind, vol, pan);
        if (this.settings.ripples) {
          this.ripples.push({
            x: source.x,
            y: source.y,
            r: 3,
            max: 10 + 26 * vol,
            color: kind === "step" ? "#ffffff" : kind === "swing" ? "#7ad7e8" : "#ff7070",
          });
        }
      }
    }

    for (const f of this.fighters) {
      if (f === source || !f.alive || f.player) continue;
      const d = Math.hypot(source.x - f.x, source.y - f.y);
      if (d < Math.min(range, f.hearing * strength)) {
        const miss = 6 + (d / 100) * 14;
        f.known = {
          x: source.x + rnd(-miss, miss),
          y: source.y + rnd(-miss, miss),
          t: this.time,
        };
      }
    }
  }

  // ---------- render ----------

  private render() {
    const ctx = this.ctx;
    const player = this.fighters[0];
    ctx.imageSmoothingEnabled = false;

    let camX = clamp(player.x - VIEW_W / 2, 0, WORLD_W - VIEW_W);
    let camY = clamp(player.y - VIEW_H / 2, 0, WORLD_H - VIEW_H);
    if (this.shake > 0) {
      camX += rnd(-2, 2) * this.shake;
      camY += rnd(-2, 2) * this.shake;
    }
    this.camX = Math.round(camX);
    this.camY = Math.round(camY);

    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.drawImage(this.bg, this.camX, this.camY, VIEW_W, VIEW_H, 0, 0, VIEW_W, VIEW_H);

    for (const c of this.corpses) {
      const cx = Math.round(c.x - this.camX);
      const cy = Math.round(c.y - this.camY);
      ctx.fillStyle = "rgba(120,20,20,0.5)";
      ctx.fillRect(cx - 7, cy - 2, 14, 4);
      ctx.globalAlpha = 0.8;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(c.sprite.ghost, -SPRITE_W / 2, -SPRITE_H / 2, SPRITE_W, SPRITE_H);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    const order = this.fighters.filter((f) => f.alive).sort((a, b) => a.y - b.y);
    for (const f of order) this.drawFighter(f);

    for (const r of this.ripples) {
      const a = clamp(1 - r.r / r.max, 0, 1) * 0.55;
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(Math.round(r.x - this.camX), Math.round(r.y - this.camY), r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (this.phase === "hidden") {
      ctx.fillStyle = "rgba(10,16,30,0.3)";
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (this.flashScreen > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashScreen * 0.5})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    this.drawHud();
  }

  private drawFighter(f: Fighter) {
    const ctx = this.ctx;
    const visible = f.player || this.phase === "visible" || f.reveal > 0;
    if (!visible) return;

    const sx = Math.round(f.x - this.camX - SPRITE_W / 2);
    const sy = Math.round(f.y - this.camY - SPRITE_H + 4);

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(sx + 4, sy + SPRITE_H - 2, SPRITE_W - 8, 2);

    const ghostMode = f.player && this.phase === "hidden";
    ctx.globalAlpha = ghostMode ? 0.45 : 1;

    const flip = Math.cos(f.dir) < -0.15;
    const drawBody = (img: CanvasImageSource, iw: number, ih: number) => {
      if (flip) {
        ctx.save();
        ctx.translate(sx + SPRITE_W, sy);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, iw, ih, 0, 0, SPRITE_W, SPRITE_H);
        ctx.restore();
      } else {
        ctx.drawImage(img, 0, 0, iw, ih, sx, sy, SPRITE_W, SPRITE_H);
      }
    };

    if (f.art) {
      drawBody(f.art, f.art.width, f.art.height);
    } else {
      const up = Math.sin(f.dir) < -0.4;
      const frames = up ? f.sprite.up : f.sprite.down;
      const moving = Math.abs(f.vx) + Math.abs(f.vy) > 1;
      const frame = moving && Math.floor(f.walkT) % 2 === 1 ? frames[1] : frames[0];
      drawBody(frame, frame.width, frame.height);
    }

    if (f.flash > 0) {
      ctx.globalAlpha = 0.85;
      ctx.drawImage(f.sprite.flash, sx, sy, SPRITE_W, SPRITE_H);
    }
    ctx.globalAlpha = 1;

    this.drawSword(f, ghostMode ? 0.45 : 1);

    if (!f.player && (this.phase === "visible" || f.reveal > 0)) {
      for (let i = 0; i < f.hp; i++) {
        ctx.fillStyle = "#0c0c12";
        ctx.fillRect(sx + 2 + i * 4, sy - 4, 3, 3);
        ctx.fillStyle = "#e04b4b";
        ctx.fillRect(sx + 2 + i * 4, sy - 4, 2, 2);
      }
    }
  }

  private swordAngle(f: Fighter) {
    let angle = f.dir + 0.55;
    if (f.swing > 0) {
      const p = 1 - f.swing / SWING_TIME;
      angle = f.dir - 1.35 + p * 2.7;
    }
    return angle;
  }

  private blitSword(hx: number, hy: number, angle: number, alpha: number, scale: number) {
    const ctx = this.ctx;
    const spr = this.swordArt ?? this.swordSpr;
    const w = SWORD_SIZE * scale;
    const h = w * (spr.height / spr.width);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.translate(hx, hy);
    ctx.rotate(angle + (this.swordArt ? -0.7 : 0));
    ctx.drawImage(spr, 2, -h / 2, w, h);
    ctx.restore();
  }

  private drawSword(f: Fighter, alpha = 1) {
    const ctx = this.ctx;
    const angle = this.swordAngle(f);
    const hx = f.x - this.camX + Math.cos(f.dir) * 4;
    const hy = f.y - this.camY - 6 + Math.sin(f.dir) * 2;

    if (f.swing > 0) {
      const p = 1 - f.swing / SWING_TIME;
      for (let i = 1; i <= 5; i++) {
        const t = p - i * 0.08;
        if (t < 0) continue;
        const a = f.dir - 1.35 + t * 2.7;
        this.blitSword(hx, hy, a, alpha * (0.18 + 0.08 * (5 - i)), 0.92);
      }
      ctx.save();
      ctx.globalAlpha = alpha * 0.55;
      ctx.strokeStyle = "#c4f6ff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hx, hy, SWORD_SIZE * 0.9, angle - 0.95, angle);
      ctx.stroke();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(hx, hy, SWORD_SIZE * 0.9, angle - 0.95, angle);
      ctx.stroke();
      ctx.restore();
    }

    this.blitSword(hx, hy, angle, alpha, 1);
  }

  private drawHud() {
    const ctx = this.ctx;
    const player = this.fighters[0];

    for (let i = 0; i < player.maxHp; i++) {
      const x = 6 + i * 9;
      const y = 6;
      const on = i < player.hp;
      ctx.fillStyle = "#0c0c12";
      ctx.fillRect(x - 1, y - 1, 9, 8);
      ctx.fillStyle = on ? "#e04b4b" : "#3a3a46";
      ctx.fillRect(x, y, 7, 5);
      ctx.fillRect(x + 1, y + 5, 5, 1);
      ctx.fillRect(x + 2, y + 6, 3, 1);
      ctx.fillStyle = on ? "#ff8a8a" : "#4a4a58";
      ctx.fillRect(x + 1, y + 1, 2, 1);
    }

    const total = this.phase === "hidden" ? HIDDEN_TIME : VISIBLE_TIME;
    const pct = clamp(this.phaseLeft / total, 0, 1);
    const bw = 96;
    const bx = Math.round(VIEW_W / 2 - bw / 2);
    ctx.fillStyle = "#0c0c12";
    ctx.fillRect(bx - 2, 4, bw + 4, 9);
    ctx.fillStyle = "#23262e";
    ctx.fillRect(bx, 6, bw, 5);
    ctx.fillStyle = this.phase === "hidden" ? "#5aa9ff" : "#6ddf5a";
    ctx.fillRect(bx, 6, Math.round(bw * pct), 5);

    const label = `${this.phase === "hidden" ? "Player will be hidden in" : "Player will be invinsible in"} ${Math.ceil(this.phaseLeft)}`;
    drawText(ctx, label, Math.round(VIEW_W / 2 - textWidth(label) / 2), 16, "#e8f2e8", 1);

    const alive = this.fighters.filter((f) => f.alive).length;
    const at = `ALIVE ${alive}`;
    drawText(ctx, at, VIEW_W - 6 - textWidth(at), 7, "#e8f2e8", 1);

    if (player.sneak && player.alive) {
      drawText(ctx, "SNEAK", 6, VIEW_H - 11, "#a8e39a", 1);
    }
  }
}
