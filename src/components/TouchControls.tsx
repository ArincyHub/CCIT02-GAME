import { useRef, useState } from "react";

type Props = {
  hidden?: boolean;
  onStick: (x: number, y: number) => void;
  onAttack: (v: boolean) => void;
  onSneak: (v: boolean) => void;
};

export default function TouchControls({
  hidden,
  onStick,
  onAttack,
  onSneak,
}: Props) {
  if (hidden) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {/* JOYSTICK */}
      <Joystick
        onChange={onStick}
        onEnd={() => onStick(0, 0)}
      />

      {/* BUTTONS */}
      <div
        className="
          pointer-events-auto
          absolute
          right-[3vw]
          bottom-[3vw]
          flex
          flex-col
          items-center
          gap-[2vw]
          sm:right-8
          sm:bottom-8
          sm:gap-3
        "
      >
        <HoldBtn
          label="SNEAK"
          small
          onChange={onSneak}
        />

        <HoldBtn
          label="HIT"
          onChange={onAttack}
        />
      </div>
    </div>
  );
}

function Joystick({
  onChange,
  onEnd,
}: {
  onChange: (x: number, y: number) => void;
  onEnd: () => void;
}) {
  const baseRef = useRef<HTMLDivElement>(null);
  const pid = useRef<number | null>(null);

  const [knob, setKnob] = useState({
    x: 0,
    y: 0,
  });

  const go = (cx: number, cy: number) => {
    const el = baseRef.current;

    if (!el) return;

    const r = el.getBoundingClientRect();

    const mx = r.left + r.width / 2;
    const my = r.top + r.height / 2;

    let dx = cx - mx;
    let dy = cy - my;

    const max = r.width / 2 - r.width * 0.18;

    const len = Math.hypot(dx, dy) || 1;

    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }

    setKnob({
      x: dx,
      y: dy,
    });

    onChange(
      dx / max,
      dy / max
    );
  };

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();

    pid.current = e.pointerId;

    e.currentTarget.setPointerCapture(
      e.pointerId
    );

    go(
      e.clientX,
      e.clientY
    );
  };

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pid.current !== e.pointerId) return;

    e.preventDefault();

    go(
      e.clientX,
      e.clientY
    );
  };

  const up = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pid.current !== e.pointerId) return;

    pid.current = null;

    setKnob({
      x: 0,
      y: 0,
    });

    onEnd();
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className="
        pointer-events-auto
        absolute
        left-[3vw]
        bottom-[3vw]
        h-[22vw]
        w-[22vw]
        max-h-36
        max-w-36
        min-h-24
        min-w-24
        touch-none
        select-none
        sm:left-8
        sm:bottom-8
      "
      style={{
        background:
          "rgba(12,18,14,0.45)",

        border:
          "4px solid #0a0f0a",

        boxShadow:
          "4px 4px 0 #0a0f0a",

        borderRadius:
          "999px",
      }}
    >
      <div
        className="
          absolute
          left-1/2
          top-1/2
          h-[8vw]
          w-[8vw]
          max-h-14
          max-w-14
          min-h-10
          min-w-10
        "
        style={{
          transform:
            `translate(
              calc(-50% + ${knob.x}px),
              calc(-50% + ${knob.y}px)
            )`,

          background:
            "#5cc447",

          border:
            "4px solid #0a0f0a",

          borderRadius:
            "999px",
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

  const press = (
    e: React.PointerEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();

    pid.current = e.pointerId;

    e.currentTarget.setPointerCapture(
      e.pointerId
    );

    setDown(true);

    onChange(true);
  };

  const release = (
    e: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (
      pid.current !== null &&
      pid.current !== e.pointerId
    ) {
      return;
    }

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
      className={`
        pixel
        touch-none
        select-none
        text-[#0a0f0a]

        ${
          small
            ? `
              h-[12vw]
              w-[12vw]
              min-h-14
              min-w-14
              max-h-16
              max-w-16
              text-[2.5vw]
              sm:text-[8px]
            `
            : `
              h-[20vw]
              w-[20vw]
              min-h-20
              min-w-20
              max-h-28
              max-w-28
              text-[4vw]
              sm:text-[12px]
            `
        }
      `}
      style={{
        background: down
          ? "#e2564c"
          : small
          ? "#c3c9cf"
          : "#d0483f",

        border:
          "4px solid #0a0f0a",

        boxShadow: down
          ? "0 0 0 #0a0f0a"
          : "4px 4px 0 #0a0f0a",

        borderRadius:
          "999px",

        transform: down
          ? "translate(4px, 4px)"
          : "none",
      }}
    >
      {label}
    </button>
  );
}