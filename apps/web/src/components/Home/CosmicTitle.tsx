import { useMemo } from "react";

interface CosmicTitleProps {
  text?: string;
  className?: string;
}

const CosmicTitle = ({
  text = "0X Arena",
  className = ""
}: CosmicTitleProps) => {
  const letters = useMemo(() => text.split(""), [text]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute top-8 left-6 z-20 md:top-10 md:left-10 ${className}`}
      role="presentation"
    >
      <div className="flex items-center gap-[2px]">
        {letters.map((ch, i) => (
          <span
            className="relative inline-block select-none bg-gradient-to-br from-white via-white/90 to-white/70 bg-clip-text font-extrabold text-2xl text-transparent sm:text-4xl md:text-5xl"
            key={`${ch}-${i}`}
            style={{
              animationDelay: `${i * 110}ms`,
              animationDuration: "600ms",
              animationFillMode: "both",
              animationName: "cosmic-rise"
            }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes cosmic-rise {
          0% { opacity: 0; transform: translateY(10px); filter: blur(6px) saturate(0.8); }
          100% { opacity: .9; transform: translateY(0); filter: blur(0) saturate(1); }
        }
      `}</style>
    </div>
  );
};

export default CosmicTitle;
