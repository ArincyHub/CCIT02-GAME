import { useEffect, useRef, useState } from "react";
import GameScreen from "./components/GameScreen";
import LoadoutScreen from "./components/Loadout";
import { GuideScreen, MainMenu, SettingsScreen, SocialsScreen } from "./components/Menu";
import { Settings } from "./game/engine";
import { MenuMusic } from "./game/music";

type ScreenName = "menu" | "settings" | "socials" | "guide" | "loadout" | "game";

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

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("menu");
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const music = useRef(new MenuMusic());

  useEffect(() => {
    try {
      localStorage.setItem("silentstrike.settings", JSON.stringify(settings));
    } catch {
      /* ignore */
    }
    music.current.setVolume(settings.volume);
  }, [settings]);

  useEffect(() => {
    const m = music.current;
    if (screen === "game") m.stop();
    else m.start();
  }, [screen]);

  useEffect(() => {
    return () => music.current.stop();
  }, []);

  if (screen === "game") {
    return <GameScreen settings={settings} onExit={() => setScreen("menu")} />;
  }

  if (screen === "settings") {
    return (
      <SettingsScreen settings={settings} setSettings={setSettings} onBack={() => setScreen("menu")} />
    );
  }

  if (screen === "socials") {
    return <SocialsScreen onBack={() => setScreen("menu")} />;
  }

  if (screen === "guide") {
    return <GuideScreen onBack={() => setScreen("menu")} />;
  }

  if (screen === "loadout") {
    return <LoadoutScreen onBack={() => setScreen("menu")} />;
  }

  return (
    <MainMenu
      onPlay={() => setScreen("game")}
      onSettings={() => setScreen("settings")}
      onSocials={() => setScreen("socials")}
      onGuide={() => setScreen("guide")}
      onLoadout={() => setScreen("loadout")}
    />
  );
}
