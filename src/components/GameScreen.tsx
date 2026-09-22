import { useEffect, useRef, useState } from "react";
import { Game, Result, Settings, VIEW_H, VIEW_W } from "../game/engine";
import { addMatch, loadStats } from "../game/loadout";
import TouchControls from "./TouchControls";
import { PixelButton } from "./ui";

type Props = { settings: Settings; onExit: () => void };

export default function GameScreen({ settings, onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stats = loadStats();
    const game = new Game(canvas, {
      settings,
      charId: stats.char,
      weaponId: stats.weapon,
      onEnd: (r) => {
        addMatch(r.kills, r.win);
        setResult(r);
      },
      onPause: () => setPaused((p) => !p),
    });
    gameRef.current = game;
    game.start();
    game.wakeAudio();
    return () => {
      game.stop();
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  useEffect(() => {
    gameRef.current?.setSettings(settings);
  }, [settings]);

  useEffect(() => {
    gameRef.current?.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fn = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("touchmove", fn, { passive: false });
    return () => el.removeEventListener("touchmove", fn);
  }, []);

  const restart = () => {
    setResult(null);
    setPaused(false);
    setRound((r) => r + 1);
  };

  const overlay = paused || !!result;

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#07100b] p-3">
      <div ref={wrapRef} className="relative w-full max-w-[960px] touch-none">
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          onMouseDown={() => gameRef.current?.wakeAudio()}
          className="pixelated block w-full cursor-crosshair border-4 border-[#0a0f0a] bg-[#4e9e3e]"
          style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
        />

        <TouchControls
          hidden={overlay}
          onStick={(x, y) => gameRef.current?.setStick(x, y)}
          onAttack={(v) => gameRef.current?.setAttack(v)}
          onSneak={(v) => gameRef.current?.setSneak(v)}
          onSkill={() => gameRef.current?.setSkill(true)}
        />

        {paused && !result && (
          <Overlay>
            <h2 className="pixel mb-6 text-[18px] text-[#e9f5e9]">PAUSED</h2>
            <div className="flex flex-col gap-3">
              <PixelButton onClick={() => setPaused(false)}>RESUME</PixelButton>
              <PixelButton color="grey" onClick={onExit}>
                MENU
              </PixelButton>
            </div>
          </Overlay>
        )}

        {result && (
          <Overlay>
            <h2
              className="pixel mb-4 text-[20px]"
              style={{ color: result.win ? "#5cc447" : "#e2564c" }}
            >
              {result.win ? "YOU WIN" : "YOU DIED"}
            </h2>
            <p className="pixel mb-6 text-[9px] text-[#c2d6c2]">
              KILLS {result.kills} - TIME {result.time}
            </p>
            <div className="flex flex-col gap-3">
              <PixelButton onClick={restart}>AGAIN</PixelButton>
              <PixelButton color="grey" onClick={onExit}>
                MENU
              </PixelButton>
            </div>
          </Overlay>
        )}
      </div>

      <div className="mt-3 flex w-full max-w-[960px] items-center justify-between gap-3">
        <p className="pixel text-[7px] leading-relaxed text-[#6f8f78] sm:text-[8px]">
          WASD MOVE - HIT SWING - E / SKILL ITEM
        </p>
        <PixelButton color="grey" className="px-4 py-3 text-[9px]" onClick={() => setPaused(true)}>
          PAUSE
        </PixelButton>
      </div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[rgba(7,16,11,0.82)]">
      {children}
    </div>
  );
}
