// Pixel characters are drawn from small text maps as a fallback.
// Your art lives in public/sprites/  (player.png, enemy1.png, sword.png)
// Black pixels in those files are treated as transparent.

export type Palette = {
  outline: string;
  hair: string;
  skin: string;
  eyes: string;
  body: string;
  shirt: string;
  accent: string;
  pants: string;
};

export const PLAYER_PAL: Palette = {
  outline: "#0c0c12",
  hair: "#a86b3c",
  skin: "#eab991",
  eyes: "#0c0c12",
  body: "#1a1a22",
  shirt: "#f0f0f0",
  accent: "#d0342c",
  pants: "#24242e",
};

export const ENEMY_PALS: Palette[] = [
  {
    outline: "#0c0c12",
    hair: "#15151c",
    skin: "#eab991",
    eyes: "#0c0c12",
    body: "#6b7f9a",
    shirt: "#93a9c2",
    accent: "#3f6fd8",
    pants: "#3f6fd8",
  },
  {
    outline: "#0c0c12",
    hair: "#2b1d12",
    skin: "#d4a074",
    eyes: "#0c0c12",
    body: "#7a5f8f",
    shirt: "#b39ac4",
    accent: "#4a3c78",
    pants: "#4a3c78",
  },
  {
    outline: "#0c0c12",
    hair: "#15151c",
    skin: "#b98055",
    eyes: "#0c0c12",
    body: "#8f5b4a",
    shirt: "#c99280",
    accent: "#5a3a2e",
    pants: "#5a3a2e",
  },
  {
    outline: "#0c0c12",
    hair: "#5c5c66",
    skin: "#eab991",
    eyes: "#0c0c12",
    body: "#4d7a5a",
    shirt: "#8fc49c",
    accent: "#2f4a38",
    pants: "#2f4a38",
  },
];

export const ENEMY_TINTS = ["#ffffff", "#b070e0", "#70c070", "#d0a040"];

const HEAD_BODY = [
  "....KKKKKKKK....",
  "....KHHHHHHK....",
  "....KHHHHHHK....",
  "....KHSSSSHK....",
  "....KHESSEHK....",
  "....KHSSSSHK....",
  "....KSSSSSSK....",
  "....KKSSSSKK....",
  "..KBBBBBBBBBBK..",
  "..KBBBWWWWBBBK..",
  "..KBBBWRRWBBBK..",
  "..KBBBBRRBBBBK..",
  "..KBBBBRRBBBBK..",
  "..KBBBBBBBBBBK..",
];

const LEGS_STAND = [
  "..KPPPPKKPPPPK..",
  "..KPPPPKKPPPPK..",
  "..KPPPPKKPPPPK..",
  "..KKKKK..KKKKK..",
];

const LEGS_WALK = [
  "..KPPPPKKPPPPK..",
  "..KPPPPKKPPPPK..",
  ".KPPPPK..KPPPPK.",
  ".KKKKKK..KKKKKK.",
];

function colorFor(ch: string, pal: Palette): string | null {
  switch (ch) {
    case "K":
      return pal.outline;
    case "H":
      return pal.hair;
    case "S":
      return pal.skin;
    case "E":
      return pal.eyes;
    case "B":
      return pal.body;
    case "W":
      return pal.shirt;
    case "R":
      return pal.accent;
    case "P":
      return pal.pants;
    default:
      return null;
  }
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function drawRows(rows: string[], pal: Palette): HTMLCanvasElement {
  const c = makeCanvas(rows[0].length, rows.length);
  const g = c.getContext("2d")!;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = colorFor(row[x], pal);
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
  });
  return c;
}

function backRows(rows: string[]): string[] {
  return rows.map((r) =>
    r
      .split("")
      .map((ch) => {
        if (ch === "S" || ch === "E") return "H";
        if (ch === "W" || ch === "R") return "B";
        return ch;
      })
      .join(""),
  );
}

function silhouette(src: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const c = makeCanvas(src.width, src.height);
  const g = c.getContext("2d")!;
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

export type CharSprite = {
  down: HTMLCanvasElement[];
  up: HTMLCanvasElement[];
  flash: HTMLCanvasElement;
  ghost: HTMLCanvasElement;
};

export function buildSprite(pal: Palette): CharSprite {
  const down0 = drawRows([...HEAD_BODY, ...LEGS_STAND], pal);
  const down1 = drawRows([...HEAD_BODY, ...LEGS_WALK], pal);
  const backBase = backRows(HEAD_BODY);
  const up0 = drawRows([...backBase, ...LEGS_STAND], pal);
  const up1 = drawRows([...backBase, ...LEGS_WALK], pal);
  return {
    down: [down0, down1],
    up: [up0, up1],
    flash: silhouette(down0, "#ffffff"),
    ghost: silhouette(down0, "#2a2a33"),
  };
}

// Purple handle, cyan blade, yellow pommel - matches the sword art you sent.
export function buildSwordSprite(): HTMLCanvasElement {
  const c = makeCanvas(36, 14);
  const g = c.getContext("2d")!;

  const px = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };

  // outline
  px(0, 3, 35, 8, "#0c0c12");
  // pommel
  px(1, 4, 4, 6, "#e8b43c");
  px(2, 5, 2, 4, "#ffe680");
  // purple handle
  px(5, 4, 9, 6, "#6a2f9e");
  px(5, 4, 9, 2, "#8d55c8");
  px(5, 8, 9, 2, "#4a1d78");
  // cyan wrap on handle
  px(7, 4, 2, 6, "#6ed3e6");
  px(11, 4, 1, 6, "#6ed3e6");
  // guard
  px(14, 2, 4, 10, "#5ecfe0");
  px(15, 3, 2, 8, "#c4f6ff");
  // blade
  px(18, 4, 15, 6, "#7ad7e8");
  px(18, 4, 15, 2, "#d8fbff");
  px(18, 8, 15, 2, "#3aa8c0");
  // gold gleam
  px(24, 6, 4, 2, "#f0c040");
  // tip spark
  px(33, 5, 2, 4, "#fff6a8");
  px(35, 6, 1, 2, "#ffe680");
  return c;
}

export function tintCanvas(src: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const c = makeCanvas(src.width, src.height);
  const g = c.getContext("2d")!;
  g.drawImage(src, 0, 0);
  if (color === "#ffffff") return c;
  g.globalCompositeOperation = "source-atop";
  g.globalAlpha = 0.38;
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

export function loadArt(url: string, onLoad: (img: HTMLCanvasElement) => void) {
  const img = new Image();
  img.onload = () => {
    const src = makeCanvas(img.width, img.height);
    const g = src.getContext("2d")!;
    g.drawImage(img, 0, 0);
    const data = g.getImageData(0, 0, src.width, src.height);
    const d = data.data;
    let minX = src.width;
    let minY = src.height;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const i = (y * src.width + x) * 4;
        const mag = d[i] > 150 && d[i + 2] > 120 && d[i + 1] < 120 && d[i] > d[i + 1] + 40;
        if (mag) {
          d[i + 3] = 0;
        }
        if (d[i + 3] > 12) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    g.putImageData(data, 0, 0);
    if (maxX <= minX || maxY <= minY) {
      onLoad(src);
      return;
    }
    const pad = 2;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(src.width - 1, maxX + pad);
    maxY = Math.min(src.height - 1, maxY + pad);
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    const out = makeCanvas(w, h);
    out.getContext("2d")!.drawImage(src, minX, minY, w, h, 0, 0, w, h);
    onLoad(out);
  };
  img.onerror = () => {
    /* keep the drawn fallback */
  };
  img.src = url;
}

export const SPRITE_W = 22;
export const SPRITE_H = 26;
