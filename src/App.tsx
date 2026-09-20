import { useEffect, useRef, useState } from "react";
import GameScreen from "./components/GameScreen";
import { MainMenu, SettingsScreen, SocialsScreen } from "./components/Menu";
import { Settings } from "./game/engine";
import { MenuMusic } from "./game/music";

type ScreenName = "menu" | "settings" | "socials" | "game";

const DEFAULTS: Settings = { volume: 0.7, ripples: true, difficulty: "normal" };

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem("silentstrike.settings");
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULTS;
}

function RotateScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black landscape:hidden">
      <div className="text-center text-white">
        <div className="mb-6 text-7xl">
          📱↻
        </div>

        <h1 className="text-2xl font-bold">
          ROTATE YOUR PHONE
        </h1>

        <p className="mt-3 text-gray-400">
          Please rotate your phone to landscape mode.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("menu");
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const music = useRef(new MenuMusic());

  useEffect(() => {
    try {
      localStorage.setItem(
        "silentstrike.settings",
        JSON.stringify(settings)
      );
    } catch {
      /* ignore */
    }

    music.current.setVolume(settings.volume);
  }, [settings]);

  useEffect(() => {
    const m = music.current;

    if (screen === "game") {
      m.stop();
    } else {
      m.start();
    }

    return () => {
      if (screen !== "game") {
        /* keep playing across menu pages */
      }
    };
  }, [screen]);

  useEffect(() => {
    return () => music.current.stop();
  }, []);

  return (
    <>
      {/* Show only when phone is portrait */}
      <RotateScreen />

      {screen === "game" && (
        <GameScreen
          settings={settings}
          onExit={() => setScreen("menu")}
        />
      )}

      {screen === "settings" && (
        <SettingsScreen
          settings={settings}
          setSettings={setSettings}
          onBack={() => setScreen("menu")}
        />
      )}

      {screen === "socials" && (
        <SocialsScreen
          onBack={() => setScreen("menu")}
        />
      )}

      {screen === "menu" && (
        <MainMenu
          onPlay={() => setScreen("game")}
          onSettings={() => setScreen("settings")}
          onSocials={() => setScreen("socials")}
        />
      )}
    </>
  );
}