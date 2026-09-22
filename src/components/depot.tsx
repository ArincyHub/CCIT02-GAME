import { useEffect, useRef, useState } from "react";
import {
  CHARACTERS,
  isOpen,
  loadStats,
  needText,
  saveStats,
  Stats,
  WEAPONS,
} from "../game/loadout";
import { buildSprite, buildSwordSprite } from "../game/sprites";
import ArtPreview from "./ArtPreview";
import { Panel, PixelButton, Screen } from "./ui";

type Tab = "char" | "sword";

export default function LoadoutScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("char");
  const [stats, setStats] = useState<Stats>(loadStats);

  const pickChar = (id: number) => {
    if (!isOpen(CHARACTERS[id].need, stats)) return;
    const next = { ...stats, char: id };
    saveStats(next);
    setStats(next);
  };

  const pickWeapon = (id: number) => {
    if (!isOpen(WEAPONS[id].need, stats)) return;
    const next = { ...stats, weapon: id };
    saveStats(next);
    setStats(next);
  };

  return (
    <Screen>
      <Panel className="w-full max-w-xl">
        <h2 className="pixel mb-4 text-[16px] text-[#5cc447]">LOADOUT</h2>
        <p className="pixel mb-5 text-[8px] text-[#9bb89b]">
          KILLS {stats.kills} - WINS {stats.wins}
        </p>
        <div className="mb-5 flex gap-3">
          <PixelButton color={tab === "char" ? "green" : "grey"} className="flex-1 py-3 text-[9px]" onClick={() => setTab("char")}>
            CHAR
          </PixelButton>
          <PixelButton color={tab === "sword" ? "green" : "grey"} className="flex-1 py-3 text-[9px]" onClick={() => setTab("sword")}>
            SWORD
          </PixelButton>
        </div>

        {tab === "char" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CHARACTERS.map((c) => {
              const open = isOpen(c.need, stats);
              const on = stats.char === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickChar(c.id)}
                  className={`pbox flex items-center gap-3 p-3 text-left ${open ? "bg-[#1d3a28]" : "bg-[#1a1a22] opacity-70"} ${on ? "outline outline-4 outline-[#5cc447]" : ""}`}
                >
                  <MiniChar palette={c.palette} file={c.file} />
                  <div className="pixel text-[8px] leading-relaxed text-[#d6e6d6]">
                    <div>{c.name}</div>
                    <div className="mt-2 text-[#9bb89b]">{open ? (on ? "ON" : "OPEN") : needText(c.need)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {WEAPONS.map((w) => {
              const open = isOpen(w.need, stats);
              const on = stats.weapon === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => pickWeapon(w.id)}
                  className={`pbox flex items-center gap-3 p-3 text-left ${open ? "bg-[#1d3a28]" : "bg-[#1a1a22] opacity-70"} ${on ? "outline outline-4 outline-[#5cc447]" : ""}`}
                >
                  <MiniSword handle={w.handle} blade={w.blade} pommel={w.pommel} file={w.file} />
                  <div className="pixel text-[8px] leading-relaxed text-[#d6e6d6]">
                    <div>{w.name}</div>
                    <div className="mt-2 text-[#9bb89b]">{open ? (on ? "ON" : "OPEN") : needText(w.need)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <PixelButton color="grey" className="mt-6 w-full" onClick={onBack}>
          BACK
        </PixelButton>
      </Panel>
    </Screen>
  );
}

function MiniChar({ palette, file }: { palette: (typeof CHARACTERS)[0]["palette"]; file: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d");
    if (!g) return;
    const spr = buildSprite(palette).down[0];
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(spr, 0, 0, c.width, c.height);
  }, [palette]);
  return (
    <div className="relative h-14 w-12 shrink-0">
      <canvas ref={ref} width={32} height={40} className="pixelated h-14 w-12" />
      <div className="absolute inset-0">
        <ArtPreview src={file} height={56} className="h-14" />
      </div>
    </div>
  );
}

function MiniSword({
  handle,
  blade,
  pommel,
  file,
}: {
  handle: string;
  blade: string;
  pommel: string;
  file: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d");
    if (!g) return;
    const spr = buildSwordSprite({ handle, blade, pommel });
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(spr, 0, 0, c.width, c.height);
  }, [handle, blade, pommel]);
  return (
    <div className="relative h-8 w-16 shrink-0">
      <canvas ref={ref} width={48} height={18} className="pixelated h-8 w-16" />
      <div className="absolute inset-0 overflow-hidden">
        <ArtPreview src={file} height={32} />
      </div>
    </div>
  );
}
