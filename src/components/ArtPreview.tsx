import { useEffect, useRef } from "react";
import { loadArt } from "../game/sprites";

type Props = { src: string; height?: number; className?: string };

export default function ArtPreview({ src, height = 72, className = "" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadArt(src, (c) => {
      const canvas = ref.current;
      if (!canvas) return;
      const h = height;
      const w = Math.max(8, Math.round(h * (c.width / c.height)));
      canvas.width = w;
      canvas.height = h;
      const g = canvas.getContext("2d");
      if (!g) return;
      g.imageSmoothingEnabled = false;
      g.clearRect(0, 0, w, h);
      g.drawImage(c, 0, 0, w, h);
    });
  }, [src, height]);

  return <canvas ref={ref} className={`pixelated ${className}`} />;
}
