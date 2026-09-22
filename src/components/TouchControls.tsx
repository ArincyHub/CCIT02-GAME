import { useRef, useState } from "react";

type Props = {
  hidden?: boolean;
  onStick: (x: number, y: number) => void;
  onAttack: (v: boolean) => void;
  onSneak: (v: boolean) => void;
  onSkill: () => void;
};

export default function TouchControls({ hidden, onStick, onAttack, onSneak, onSkill }: Props) {
  if (hidden) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <Joystick onChange={onStick} onEnd={() => onStick(0, 0)} />
      <div className="pointer-events-auto absolute right-2 bottom-2 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6 sm:gap-3">
        <HoldBtn label="SNEAK" small onChange={onSneak} />
        <div className="flex items-end gap-3">
          <HoldBtn label="SKILL" small onChange={(v) => { if (v) onSkill(); }} />
          <HoldBtn label="HIT" onChange={onAttack} />
        </div>
      </div>
    </div>
  );
}

function Joystick({ onChange, onEnd }: { onChange: (x: number, y: number) => void; onEnd: () => void }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const pid = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const go = (cx: number, cy: number) => {
    const el = baseRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = r.left + r.width / 2;
    const my = r.top + r.height / 2;
    let dx = cx - mx;
    let dy = cy - my;
    const max = r.width / 2 - 22;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    setKnob({ x: dx, y: dy });
    onChange(dx / max, dy / max);
  };

  const down = (e: React.PointerEvent) => {
    pid.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    go(e.clientX, e.clientY);
  };
  const move = (e: React.PointerEvent) => {
    if (pid.current !== e.pointerId) return;
    go(e.clientX, e.clientY);
  };
  const up = (e: React.PointerEvent) => {
    if (pid.current !== e.pointerId) return;
    pid.current = null;
    setKnob({ x: 0, y: 0 });
    onEnd();
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className="pointer-events-auto absolute left-2 bottom-2 h-24 w-24 touch-none select-none sm:left-6 sm:bottom-6 sm:h-32 sm:w-32"
      style={{
        background: "rgba(12,18,14,0.45)",
        border: "4px solid #0a0f0a",
        boxShadow: "4px 4px 0 #0a0f0a",
        borderRadius: "999px",
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 h-9 w-9 sm:h-12 sm:w-12"
        style={{
          transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
          background: "#5cc447",
          border: "4px solid #0a0f0a",
          borderRadius: "999px",
        }}
      />
    </div>
  );
}

function HoldBtn({
  label,
  onChange,
  small,
}: {
  label: string;
  onChange: (v: boolean) => void;
  small?: boolean;
}) {
  const pid = useRef<number | null>(null);
  const [down, setDown] = useState(false);

  const press = (e: React.PointerEvent) => {
    e.preventDefault();
    pid.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDown(true);
    onChange(true);
  };
  const release = (e: React.PointerEvent) => {
    if (pid.current !== null && pid.current !== e.pointerId) return;
    pid.current = null;
    setDown(false);
    onChange(false);
  };

  return (
    <button
      type="button"
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      className={`pixel touch-none select-none text-[#0a0f0a] ${
        small ? "h-11 w-11 text-[7px] sm:h-14 sm:w-14" : "h-16 w-16 text-[10px] sm:h-24 sm:w-24"
      }`}
      style={{
        background: down ? "#e2564c" : small ? "#c3c9cf" : "#d0483f",
        border: "4px solid #0a0f0a",
        boxShadow: down ? "0 0 0 #0a0f0a" : "4px 4px 0 #0a0f0a",
        borderRadius: "999px",
        transform: down ? "translate(4px, 4px)" : "none",
      }}
    >
      {label}
    </button>
  );
}
