import { ReactNode } from "react";

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  color?: "green" | "grey" | "red";
  className?: string;
};

const COLORS: Record<string, string> = {
  green: "bg-[#4fae3d] hover:bg-[#5cc447] text-[#0a0f0a]",
  grey: "bg-[#c3c9cf] hover:bg-[#d6dce2] text-[#0a0f0a]",
  red: "bg-[#d0483f] hover:bg-[#e2564c] text-[#0a0f0a]",
};

export function PixelButton({ children, onClick, color = "green", className = "" }: BtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pbtn pixel px-4 py-3 text-[10px] leading-none sm:px-6 sm:py-4 sm:text-[11px] ${COLORS[color]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`pbox bg-[#12231a] p-6 ${className}`}>{children}</div>;
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0e1a12]">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(#1c3324 1px, transparent 1px), linear-gradient(90deg, #1c3324 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(80,200,90,0.16),transparent_60%)]" />
      <div className="relative flex h-full flex-col items-center justify-center overflow-hidden p-3 sm:p-6">{children}</div>
    </div>
  );
}
