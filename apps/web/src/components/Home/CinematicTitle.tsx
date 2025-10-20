import { useEffect, useRef } from "react";

interface CinematicTitleProps {
  text?: string;
  className?: string;
}

// Cinematic canvas animation: nebula trail draws each letter, space dust, subtle parallax
const CinematicTitle = ({
  text = "0X Arena",
  className = ""
}: CinematicTitleProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true })!;

    let raf = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = Math.max(
      400,
      Math.floor(window.innerHeight * 0.5)
    ));

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = Math.max(
        400,
        Math.floor(window.innerHeight * 0.5)
      );
      buildPath();
    };

    window.addEventListener("resize", onResize);

    // Particles
    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      hue: number;
    };
    const dust: P[] = [];
    const spawnDust = (x: number, y: number, speed = 1) => {
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = (Math.random() * 0.6 + 0.4) * speed;
        dust.push({
          hue: 220 + Math.random() * 80,
          life: 1,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          x,
          y
        });
      }
    };

    // Build path for letters using canvas measure — we draw along a baseline
    const letters = text.split("");
    const glyphs: { ch: string; w: number }[] = [];
    const buildPath = () => {
      ctx.save();
      ctx.font = `${Math.min(96, Math.floor(width / 10))}px Sofia Pro, sans-serif`;
      glyphs.length = 0;
      for (const ch of letters) {
        const w =
          ch === " "
            ? ctx.measureText(" ").width * 0.8
            : ctx.measureText(ch).width;
        glyphs.push({ ch, w });
      }
      ctx.restore();
    };
    buildPath();

    // Timeline
    let t = 0;
    const letterDelay = 420; // ms per letter
    const reveal = (ms: number) => Math.min(1, Math.max(0, ms / letterDelay));

    const draw = (_ms: number) => {
      raf = requestAnimationFrame(draw);
      if (!startedRef.current) startedRef.current = true;
      t += 16.6667;

      // Transparent fade (does NOT darken background)
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.08)"; // erase a bit each frame
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Star dust update
      for (let i = dust.length - 1; i >= 0; i--) {
        const p = dust[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life *= 0.97;
        if (p.life < 0.03) dust.splice(i, 1);
        else {
          ctx.beginPath();
          ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${p.life})`;
          ctx.arc(p.x, p.y, 1.8 * p.life, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw letters along baseline center
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const fontSize = Math.min(96, Math.floor(width / 10));
      ctx.font = `700 ${fontSize}px Sofia Pro, sans-serif`;

      const totalWidth = glyphs.reduce((s, g) => s + g.w, 0);
      let cursor = -totalWidth / 2;
      for (let i = 0; i < glyphs.length; i++) {
        const g = glyphs[i];
        const elapsed = Math.max(0, t - i * letterDelay);
        const k = reveal(elapsed);

        if (k > 0) {
          // Trail (reduced for sharpness)
          const trail = Math.floor(10 * k);
          for (let j = 0; j < trail; j++) {
            const decay = (trail - j) / trail;
            ctx.save();
            ctx.translate(cursor + g.w * (j / trail), 0);
            ctx.rotate((1 - k) * 0.35 * decay);
            ctx.globalCompositeOperation = "lighter";
            ctx.fillStyle = `rgba(99,102,241,${0.05 * decay})`;
            ctx.fillText(g.ch, 0, 0);
            ctx.restore();
          }

          // Main glyph
          ctx.save();
          ctx.translate(cursor, 0);
          ctx.shadowBlur = 12;
          ctx.shadowColor = "rgba(56,189,248,0.7)";
          ctx.fillStyle = "#eaf2ff";
          ctx.globalCompositeOperation = "lighter";
          ctx.fillText(g.ch, 0, 0);
          ctx.restore();

          // Spawn dust once per letter when it lands
          if (Math.abs(elapsed - letterDelay) < 18)
            spawnDust(width / 2 + cursor + g.w / 2, height / 2, 1.2);
        }

        cursor += g.w;
      }
      ctx.restore();
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [text]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 top-24 z-20 ${className}`}
      role="presentation"
    >
      <canvas
        className="mx-auto block h-[50vh] w-full max-w-5xl"
        ref={canvasRef}
      />
    </div>
  );
};

export default CinematicTitle;
