import { useEffect, useRef, useState } from "react";
import { Game, Result, Settings, VIEW_H, VIEW_W } from "../game/engine";
import TouchControls from "./TouchControls";
import { PixelButton } from "./ui";

type Props = {
  settings: Settings;
  onExit: () => void;
};

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

    const game = new Game(canvas, {
      settings,
      onEnd: (r) => setResult(r),
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

    const fn = (e: TouchEvent) => {
      e.preventDefault();
    };

    el.addEventListener("touchmove", fn, {
      passive: false,
    });

    return () => {
      el.removeEventListener("touchmove", fn);
    };
  }, []);

  const restart = () => {
    setResult(null);
    setPaused(false);
    setRound((r) => r + 1);
  };

  const overlay = paused || !!result;

  return (
    <div
      className="
        relative
        flex
        min-h-screen
        min-h-[100dvh]
        w-full
        items-center
        justify-center
        overflow-hidden
        bg-[#07100b]
        p-0
        sm:p-3
      "
    >
      {/* GAME */}
      <div
        ref={wrapRef}
        className="
          relative
          w-full
          max-w-[960px]
          touch-none
          select-none
          overflow-hidden

          landscape:max-w-none
          landscape:w-[min(100vw,177.7778vh)]
        "
      >
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          onPointerDown={() => gameRef.current?.wakeAudio()}
          className="
            pixelated
            block
            w-full
            cursor-crosshair
            border-0
            bg-[#4e9e3e]

            sm:border-4
            sm:border-[#0a0f0a]
          "
          style={{
            aspectRatio: `${VIEW_W} / ${VIEW_H}`,
          }}
        />

        {/* TOUCH CONTROLS */}
        <TouchControls
          hidden={overlay}
          onStick={(x, y) =>
            gameRef.current?.setStick(x, y)
          }
          onAttack={(v) =>
            gameRef.current?.setAttack(v)
          }
          onSneak={(v) =>
            gameRef.current?.setSneak(v)
          }
        />

        {/* PAUSE / RESULT OVERLAY */}
        {paused && !result && (
          <Overlay>
            <h2 className="pixel mb-6 text-[18px] text-[#e9f5e9]">
              PAUSED
            </h2>

            <div className="flex flex-col gap-3">
              <PixelButton
                onClick={() => setPaused(false)}
              >
                RESUME
              </PixelButton>

              <PixelButton
                color="grey"
                onClick={onExit}
              >
                MENU
              </PixelButton>
            </div>
          </Overlay>
        )}

        {result && (
          <Overlay>
            <h2
              className="pixel mb-4 text-[20px]"
              style={{
                color: result.win
                  ? "#5cc447"
                  : "#e2564c",
              }}
            >
              {result.win
                ? "YOU WIN"
                : "YOU DIED"}
            </h2>

            <p className="pixel mb-6 text-[9px] text-[#c2d6c2]">
              KILLS {result.kills} - TIME{" "}
              {result.time}
            </p>

            <div className="flex flex-col gap-3">
              <PixelButton onClick={restart}>
                AGAIN
              </PixelButton>

              <PixelButton
                color="grey"
                onClick={onExit}
              >
                MENU
              </PixelButton>
            </div>
          </Overlay>
        )}
      </div>

      {/* DESKTOP PAUSE BUTTON */}
      <div
        className="
          absolute
          bottom-3
          right-3
          hidden

          sm:block
        "
      >
        <PixelButton
          color="grey"
          className="px-4 py-3 text-[9px]"
          onClick={() => setPaused(true)}
        >
          PAUSE
        </PixelButton>
      </div>

      {/* MOBILE PAUSE BUTTON */}
      <div
        className="
          absolute
          right-3
          bottom-3
          z-30

          sm:hidden
        "
      >
        <PixelButton
          color="grey"
          className="px-4 py-3 text-[8px]"
          onClick={() => setPaused(true)}
        >
          PAUSE
        </PixelButton>
      </div>
    </div>
  );
}

function Overlay({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        absolute
        inset-0
        z-20
        flex
        flex-col
        items-center
        justify-center
        bg-[rgba(7,16,11,0.82)]
      "
    >
      {children}
    </div>
  );
}