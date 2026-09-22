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
    const stop = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", stop, { passive: false });
    return () => document.removeEventListener("touchmove", stop);
  }, []);

  const restart = () => {
    setResult(null);
    setPaused(false);
    setRound((r) => r + 1);
  };

  const overlay = paused || !!result;

  return (
    <div className="flex h-dvh w-full items-center justify-center overflow-hidden bg-[#07100b]">
      <div
        ref={wrapRef}
        className="relative touch-none"
        style={{
          width: "min(100vw, calc(100dvh * 16 / 9))",
          height: "min(100dvh, calc(100vw * 9 / 16))",
        }}
      >
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          onMouseDown={() => gameRef.current?.wakeAudio()}
          className="pixelated block h-full w-full cursor-crosshair bg-[#4e9e3e]"
        />

        <TouchControls
          hidden={overlay}
          onStick={(x, y) => gameRef.current?.setStick(x, y)}
          onAttack={(v) => gameRef.current?.setAttack(v)}
          onSneak={(v) => gameRef.current?.setSneak(v)}
          onSkill={() => gameRef.current?.setSkill(true)}
        />

        {!overlay && (
          <button
            type="button"
            onClick={() => setPaused(true)}
            className="pbtn pixel absolute top-2 right-2 z-20 bg-[#c3c9cf] px-3 py-2 text-[8px] text-[#0a0f0a]"
          >
            PAUSE
          </button>
        )}

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
