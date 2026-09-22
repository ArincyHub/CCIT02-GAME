import { ReactNode } from "react";
import { GUIDE } from "../game/buildGuide";
import { Settings } from "../game/engine";
import ArtPreview from "./ArtPreview";
import { Panel, PixelButton, Screen } from "./ui";

function Title() {
  return (
    <div className="pixel select-none text-center leading-none">
      <div className="text-[22px] text-[#e9f5e9] sm:text-[52px]" style={{ textShadow: "4px 4px 0 #0a0f0a" }}>
        SILENT
      </div>
      <div className="mt-2 text-[22px] text-[#5cc447] sm:text-[52px]" style={{ textShadow: "4px 4px 0 #0a0f0a" }}>
        STRIKE
      </div>
    </div>
  );
}

function Ico({ children }: { children: ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="pointer-events-none shrink-0">
      {children}
    </svg>
  );
}

function MenuBtn({
  onClick,
  color = "grey",
  children,
}: {
  onClick: () => void;
  color?: "green" | "grey";
  children: ReactNode;
}) {
  return (
    <PixelButton onClick={onClick} color={color} className="flex w-full items-center justify-center gap-3">
      {children}
    </PixelButton>
  );
}

function IconOnly({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="pbtn flex h-12 w-12 items-center justify-center bg-[#c3c9cf] text-[#0a0f0a] hover:bg-[#d6dce2]"
    >
      {children}
    </button>
  );
}

export function MainMenu({ onPlay, onSettings, onSocials, onGuide, onLoadout }: {
  onPlay: () => void;
  onSettings: () => void;
  onSocials: () => void;
  onGuide: () => void;
  onLoadout: () => void;
}) {
  return (
    <Screen>
      <Title />
      <div className="mt-2 hidden items-end gap-6 sm:mt-6 sm:flex">
        <ArtPreview src="/sprites/enemy1.png" height={64} className="opacity-50" />
        <ArtPreview src="/sprites/player.png" height={88} />
        <ArtPreview src="/sprites/enemy1.png" height={64} className="opacity-50" />
      </div>
      <div className="mt-3 flex w-52 flex-col gap-2 sm:mt-8 sm:w-56 sm:gap-4">
        <MenuBtn color="green" onClick={onPlay}>
          <Ico>
            <path d="M3 2h3v12H3zM8 4h2v8H8zM12 6h2v4h-2z" />
          </Ico>
          PLAY
        </MenuBtn>
        <MenuBtn onClick={onLoadout}>
          <Ico>
            <path d="M6 2h4v3H6zM4 6h8v6H4zM5 13h2v2H5zM9 13h2v2H9z" />
          </Ico>
          LOADOUT
        </MenuBtn>
        <MenuBtn onClick={onGuide}>
          <Ico>
            <path d="M3 2h10v12H3zM5 4h6v2H5zM5 8h6v1H5zM5 10h4v1H5z" />
          </Ico>
          GUIDE
        </MenuBtn>
        <div className="mt-2 flex justify-center gap-4">
          <IconOnly onClick={onSettings} label="SETTINGS">
            <Ico>
              <path d="M6 1h4v2H6zM1 6h2v4H1zM13 6h2v4h-2zM6 13h4v2H6zM5 5h6v6H5z" />
            </Ico>
          </IconOnly>
          <IconOnly onClick={onSocials} label="SOCIALS">
            <Ico>
              <path d="M3 3h4v4H3zM9 5h4v4H9zM2 10h6v4H2zM9 11h5v3H9z" />
            </Ico>
          </IconOnly>
        </div>
      </div>
      <p className="pixel mt-3 text-[7px] leading-relaxed text-[#7fa588] sm:mt-8 sm:text-[8px]">5 FIGHTERS - LAST ONE LIVES</p>
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

export function GuideScreen({ onBack }: { onBack: () => void }) {
  return (
    <Screen>
      <Panel className="w-full max-w-lg">
        <h2 className="pixel mb-6 text-[18px] text-[#5cc447]">GUIDE</h2>
        <div className="space-y-5">
          {GUIDE.map((g) => (
            <div key={g.title}>
              <p className="pixel text-[11px] text-[#e9f5e9]">{g.title}</p>
              <p className="mt-2 font-mono text-[14px] leading-relaxed text-[#9bb89b]">{g.text}</p>
            </div>
          ))}
        </div>
        <PixelButton color="grey" className="mt-8 w-full" onClick={onBack}>
          BACK
        </PixelButton>
      </Panel>
    </Screen>
  );
}

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
