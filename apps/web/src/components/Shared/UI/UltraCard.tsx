import { memo, type ReactNode, useMemo, useRef, useState } from "react";
import cn from "@/helpers/cn";

type Accent =
  | "purple"
  | "blue"
  | "emerald"
  | "rose"
  | "gold"
  | "platinum"
  | "onyx";

interface UltraCardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  accent?: Accent;
  interactive?: boolean;
  ariaLabel?: string;
  actions?: ReactNode;
  badge?: ReactNode;
  intensity?: "soft" | "medium" | "hard";
  animatedBorder?: boolean;
  mode?: "default" | "luxMinimal";
  enableShine?: boolean;
}

const accentMap: Record<Accent, { ring: string; grad: string; glow: string }> =
  {
    blue: {
      glow: "bg-blue-400/25",
      grad: "from-blue-500/25 via-indigo-500/20 to-cyan-400/15",
      ring: "ring-blue-300/25"
    },
    emerald: {
      glow: "bg-emerald-400/25",
      grad: "from-emerald-400/25 via-teal-400/20 to-lime-300/10",
      ring: "ring-emerald-300/25"
    },
    gold: {
      glow: "bg-amber-300/25",
      grad: "from-amber-400/25 via-yellow-500/20 to-amber-200/10",
      ring: "ring-amber-300/25"
    },
    onyx: {
      glow: "bg-neutral-700/30",
      grad: "from-zinc-800/30 via-neutral-800/25 to-zinc-700/20",
      ring: "ring-neutral-700/40"
    },
    platinum: {
      glow: "bg-zinc-300/25",
      grad: "from-slate-200/20 via-zinc-300/15 to-slate-100/10",
      ring: "ring-zinc-200/25"
    },
    purple: {
      glow: "bg-fuchsia-400/25",
      grad: "from-fuchsia-500/25 via-violet-500/20 to-sky-400/10",
      ring: "ring-fuchsia-300/25"
    },
    rose: {
      glow: "bg-rose-400/25",
      grad: "from-rose-500/25 via-pink-500/20 to-amber-300/10",
      ring: "ring-rose-300/25"
    }
  };

const UltraCard = ({
  title,
  subtitle,
  children,
  footer,
  className = "",
  titleClassName = "",
  subtitleClassName = "",
  accent = "purple",
  interactive = true,
  ariaLabel,
  actions,
  badge,
  intensity = "medium",
  animatedBorder = true,
  mode = "default",
  enableShine = true
}: UltraCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ rotateX, rotateY }, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const styles = useMemo(
    () => ({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    }),
    [rotateX, rotateY]
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rotateX: -(py * 6), rotateY: px * 8 });
  };
  const handleMouseLeave = () => {
    if (!interactive) return;
    setTilt({ rotateX: 0, rotateY: 0 });
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!interactive || !ref.current) return;
    const touch = e.touches[0];
    const r = ref.current.getBoundingClientRect();
    const px = (touch.clientX - r.left) / r.width - 0.5;
    const py = (touch.clientY - r.top) / r.height - 0.5;
    setTilt({ rotateX: -(py * 6), rotateY: px * 8 });
  };

  const { grad, ring, glow } = accentMap[accent];

  const isLux = mode === "luxMinimal";

  return (
    <section
      aria-label={ariaLabel}
      className={cn("group relative", className)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      ref={ref}
    >
      {!isLux && (
        <div
          className={cn(
            "-inset-[1px] pointer-events-none absolute rounded-3xl",
            "bg-gradient-to-b",
            grad,
            "opacity-80 blur-md transition-opacity duration-300 group-hover:opacity-100"
          )}
        />
      )}

      {animatedBorder && !isLux && (
        <div
          className="-inset-px pointer-events-none absolute rounded-3xl p-[1.5px] [animation:ultra-rotate_6s_linear_infinite]"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(168,85,247,0.55), rgba(59,130,246,0.55), rgba(16,185,129,0.55), rgba(168,85,247,0.55))",
            maskComposite: "exclude" as any,
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor" as any
          }}
        />
      )}

      <div
        className={cn(
          "relative rounded-3xl border p-6 backdrop-blur-xl",
          "border-white/10 ring-1",
          ring,
          isLux
            ? "shadow-[0_8px_40px_-18px_rgba(0,0,0,0.6)]"
            : "shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)]",
          isLux && "bg-black/40"
        )}
        style={styles}
      >
        {/* Accent glow */}
        {!isLux && (
          <>
            <div className="-top-6 -translate-y-1/2 absolute left-8 h-12 w-12 rounded-full blur-2xl" />
            <div
              className={cn(
                "-top-6 absolute left-8 h-10 w-10 rounded-full",
                glow
              )}
            />
          </>
        )}

        {/* Noise + shine overlays */}
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" opacity="1"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>\')',
            opacity: isLux ? 0.06 : 0.12
          }}
        />
        {enableShine && !isLux && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
            <div className="-left-1/3 absolute top-0 h-full w-1/3 bg-gradient-to-r from-white/10 via-white/70 to-white/10 opacity-0 blur-md transition-opacity duration-300 group-hover:animate-[ultra-shine_1.1s_ease-out] group-hover:opacity-100" />
          </div>
        )}
        {isLux && (
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background:
                "radial-gradient(1200px 400px at 0% 0%, rgba(255,255,255,0.08), transparent 60%)"
            }}
          />
        )}

        {(badge || title || subtitle || actions) && (
          <header className="mb-5">
            {badge && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80 text-xs">
                {badge}
              </div>
            )}
            {title && (
              <h2
                className={cn(
                  "bg-gradient-to-b from-white via-white to-white/80 bg-clip-text font-extrabold text-3xl text-transparent sm:text-4xl",
                  titleClassName
                )}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className={cn(
                  "mt-1 text-sm text-white/75 sm:text-base",
                  subtitleClassName
                )}
              >
                {subtitle}
              </p>
            )}
            {actions && <div className="mt-5">{actions}</div>}
          </header>
        )}

        {children && <div className="space-y-5">{children}</div>}

        {footer && <footer className="mt-6">{footer}</footer>}
      </div>

      <style>{`
        @keyframes ultra-shine {
          0% { transform: translateX(-20%); }
          100% { transform: translateX(300%); }
        }
        @keyframes ultra-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

export default memo(UltraCard);
