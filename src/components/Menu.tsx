import { Settings } from "../game/engine";
import ArtPreview from "./ArtPreview";
import { Panel, PixelButton, Screen } from "./ui";

function Title() {
  return (
    <div className="pixel select-none text-center leading-none">
      <div className="text-[34px] text-[#e9f5e9] sm:text-[52px]" style={{ textShadow: "5px 5px 0 #0a0f0a" }}>
        SILENT
      </div>
      <div className="mt-3 text-[34px] text-[#5cc447] sm:text-[52px]" style={{ textShadow: "5px 5px 0 #0a0f0a" }}>
        STRIKE
      </div>
    </div>
  );
}

export function MainMenu({ onPlay, onSettings, onSocials }: {
  onPlay: () => void;
  onSettings: () => void;
  onSocials: () => void;
}) {
  return (
    <Screen>
      <Title />
      <div className="mt-6 flex items-end gap-6">
        <ArtPreview src="/sprites/enemy1.png" height={64} className="opacity-50" />
        <ArtPreview src="/sprites/player.png" height={88} />
        <ArtPreview src="/sprites/enemy1.png" height={64} className="opacity-50" />
      </div>
      <div className="mt-8 flex w-56 flex-col gap-4">
        <PixelButton onClick={onPlay}>PLAY</PixelButton>
        <PixelButton color="grey" onClick={onSettings}>
          SETTINGS
        </PixelButton>
        <PixelButton color="grey" onClick={onSocials}>
          SOCIALS
        </PixelButton>
      </div>
      <p className="pixel mt-8 text-[8px] leading-relaxed text-[#7fa588]">5 FIGHTERS - LAST ONE LIVES</p>
    </Screen>
  );
}

export function SettingsScreen({ settings, setSettings, onBack }: {
  settings: Settings;
  setSettings: (s: Settings) => void;
  onBack: () => void;
}) {
  const diffs: Settings["difficulty"][] = ["easy", "normal", "hard"];
  return (
    <Screen>
      <Panel className="w-full max-w-md">
        <h2 className="pixel mb-6 text-[16px] text-[#5cc447]">SETTINGS</h2>

        <div className="mb-6">
          <div className="pixel mb-3 flex justify-between text-[9px] text-[#d6e6d6]">
            <span>VOLUME</span>
            <span>{Math.round(settings.volume * 100)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.volume * 100)}
            onChange={(e) => setSettings({ ...settings, volume: Number(e.target.value) / 100 })}
            className="w-full"
          />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <span className="pixel text-[9px] text-[#d6e6d6]">SOUND RINGS</span>
          <PixelButton
            color={settings.ripples ? "green" : "grey"}
            className="px-4 py-3"
            onClick={() => setSettings({ ...settings, ripples: !settings.ripples })}
          >
            {settings.ripples ? "ON" : "OFF"}
          </PixelButton>
        </div>

        <div className="mb-8">
          <div className="pixel mb-3 text-[9px] text-[#d6e6d6]">ENEMIES</div>
          <div className="flex gap-3">
            {diffs.map((d) => (
              <PixelButton
                key={d}
                color={settings.difficulty === d ? "green" : "grey"}
                className="flex-1 px-2 py-3 text-[9px]"
                onClick={() => setSettings({ ...settings, difficulty: d })}
              >
                {d.toUpperCase()}
              </PixelButton>
            ))}
          </div>
        </div>

        <PixelButton color="grey" className="w-full" onClick={onBack}>
          BACK
        </PixelButton>
      </Panel>
    </Screen>
  );
}

const LINKS = [
  { name: "DISCORD", url: "https://discord.com" },
  { name: "YOUTUBE", url: "https://youtube.com" },
  { name: "ROBLOX", url: "https://roblox.com" },
];

export function SocialsScreen({ onBack }: { onBack: () => void }) {
  return (
    <Screen>
      <Panel className="w-full max-w-md">
        <h2 className="pixel mb-6 text-[16px] text-[#5cc447]">SOCIALS</h2>
        <div className="mb-8 flex flex-col gap-4">
          {LINKS.map((l) => (
            <a
              key={l.name}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="pbtn pixel block bg-[#1d3a28] px-5 py-4 text-[10px] text-[#d6e6d6] hover:bg-[#25492f]"
            >
              {l.name}
            </a>
          ))}
        </div>
        <PixelButton color="grey" className="w-full" onClick={onBack}>
          BACK
        </PixelButton>
      </Panel>
    </Screen>
  );
}
