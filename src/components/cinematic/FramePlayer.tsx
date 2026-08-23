import { useEffect, useRef, useState, type RefObject } from "react";

interface FramePlayerProps {
  frames: string[];
  progressRef: RefObject<number>;
}

export default function FramePlayer({ frames, progressRef }: FramePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Preload all frames
  useEffect(() => {
    let cancelled = false;
    const images: HTMLImageElement[] = [];

    Promise.all(
      frames.map(
        (src, i) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              images[i] = img;
              resolve();
            };
            img.onerror = () => resolve(); // skip broken frames
            img.src = src;
          })
      )
    ).then(() => {
      if (!cancelled) {
        imagesRef.current = images;
        setLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [frames]);

  // Draw loop -- requestAnimationFrame, reads progressRef
  useEffect(() => {
    if (!loaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    let lastFrame = -1;

    const FRAMES_END = 0.8; // frames complete at 80% of scroll; 80–100% holds last frame
    const draw = () => {
      const progress = progressRef.current ?? 0;
      const framesProgress = Math.min(progress / FRAMES_END, 1);
      const frameIndex = Math.min(
        Math.floor(framesProgress * imagesRef.current.length),
        imagesRef.current.length - 1
      );

      if (frameIndex !== lastFrame && imagesRef.current[frameIndex]) {
        const img = imagesRef.current[frameIndex];
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        lastFrame = frameIndex;
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [loaded, progressRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  );
}
