import { useEffect } from "react";

// Shows TURN PHONE when a touch device is in portrait.
// Try to lock landscape after the first tap (not all browsers allow it).

export default function RotateGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lock = () => {
      const orient = screen.orientation as ScreenOrientation & { lock?: (m: string) => Promise<void> };
      if (orient?.lock) void orient.lock("landscape").catch(() => {});
    };
    window.addEventListener("pointerdown", lock);
    return () => window.removeEventListener("pointerdown", lock);
  }, []);

  return (
    <>
      {children}
      <div className="rotate-gate pixel">
        <div className="mb-4 text-[28px] leading-none text-[#5cc447]">TURN</div>
        <div className="text-[28px] leading-none text-[#e9f5e9]">PHONE</div>
        <p className="mt-6 max-w-[220px] text-center text-[10px] leading-relaxed text-[#9bb89b]">
          This game needs landscape
        </p>
      </div>
    </>
  );
}
