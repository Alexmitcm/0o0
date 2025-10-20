import { useEffect, useMemo, useRef, useState } from "react";

interface SpaceTitleProps {
  text?: string;
  className?: string;
}

const SpaceTitle = ({ text = "0X Arena", className = "" }: SpaceTitleProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const letters = useMemo(() => text.split(""), [text]);

  return (
    <div
      aria-hidden="true"
      className={
        "pointer-events-none absolute inset-x-0 top-20 z-20 flex justify-center" +
        (className ? ` ${className}` : "")
      }
      ref={containerRef}
      role="presentation"
    >
      <div className="inline-flex items-center gap-0.5">
        {letters.map((ch, i) => (
          <span
            className="relative inline-block select-none"
            key={`${ch}-${i}`}
            style={{
              animationDelay: `${i * 90}ms`,
              animationDuration: "900ms",
              animationFillMode: "both",
              animationName: mounted ? "space-letter-in" : "none"
            }}
          >
            <span className="relative z-10 font-extrabold text-4xl text-white tracking-wide drop-shadow-[0_0_8px_rgba(147,197,253,0.8)] sm:text-6xl">
              {ch === " " ? "\u00A0" : ch}
            </span>
            <span
              className="-z-0 absolute inset-0 blur-xl"
              style={{
                background:
                  "radial-gradient( circle at 50% 50%, rgba(56,189,248,0.7), rgba(168,85,247,0.25) 45%, transparent 60% )"
              }}
            />
          </span>
        ))}
      </div>

      <style>{`
        @keyframes space-letter-in {
          0% {
            opacity: 0;
            transform: translate3d(0, 10px, 0) scale(0.92) rotateX(35deg);
            text-shadow: 0 0 0 rgba(255,255,255,0);
          }
          60% {
            opacity: 1;
            transform: translate3d(0, -2px, 0) scale(1.05) rotateX(0deg);
            text-shadow: 0 0 20px rgba(147,197,253,0.6), 0 0 40px rgba(99,102,241,0.4);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            text-shadow: 0 0 10px rgba(168,85,247,0.6), 0 0 24px rgba(56,189,248,0.35);
          }
        }
      `}</style>
    </div>
  );
};

export default SpaceTitle;
