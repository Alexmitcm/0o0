import { useMemo } from "react";

interface StellarTitleProps {
  text?: string;
  position?: "bottom-center" | "top-center" | "top-right";
}

const positions: Record<string, string> = {
  "bottom-center": "bottom-20 left-1/2 -translate-x-1/2",
  "top-center": "top-24 left-1/2 -translate-x-1/2",
  "top-right": "top-24 right-10"
};

const StellarTitle = ({
  text = "0X Arena",
  position = "bottom-center"
}: StellarTitleProps) => {
  const letters = useMemo(() => text.split(""), [text]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 ${positions[position]} select-none`}
      role="presentation"
    >
      <div className="flex items-center gap-0.5">
        {letters.map((ch, i) => (
          <span
            className="relative inline-block overflow-visible font-bold text-4xl text-white/85 drop-shadow-[0_0_4px_rgba(0,0,0,0.3)] sm:text-5xl"
            key={`${ch}-${i}`}
            style={{
              animationDelay: `${i * 120}ms`,
              animationDuration: "600ms",
              animationFillMode: "both",
              animationName: "stellar-in"
            }}
          >
            {ch === " " ? "\u00A0" : ch}
            <span
              className="-z-10 absolute inset-0 opacity-40 blur-md"
              style={{
                background:
                  "radial-gradient( circle at 50% 50%, rgba(56,189,248,0.35), rgba(168,85,247,0.15) 30%, transparent 55% )"
              }}
            />
            <span
              className="-inset-x-1 pointer-events-none absolute inset-y-1 block opacity-0"
              style={{
                animationDelay: `${i * 120 + 350}ms`,
                animationDuration: "900ms",
                animationFillMode: "both",
                animationName: "stellar-glint"
              }}
            />
          </span>
        ))}
      </div>

      <style>{`
        @keyframes stellar-in {
          0% { opacity: 0; transform: translateY(6px) scale(0.98); filter: blur(2px); }
          100% { opacity: 0.85; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes stellar-glint {
          0% { opacity: 0; background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.6) 45%, transparent 60%); transform: translateX(-120%); }
          30% { opacity: .55; }
          100% { opacity: 0; transform: translateX(140%); }
        }
      `}</style>
    </div>
  );
};

export default StellarTitle;
