import type React from "react";
import cn from "@/helpers/cn";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  showNeonTopBorder?: boolean;
  minHeightClass?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  showNeonTopBorder = false,
  minHeightClass = "min-h-[420px] sm:min-h-[520px]"
}) => {
  const baseTokens = [
    "relative",
    "w-[94%]",
    "sm:w-[92%]",
    "md:w-[90%]",
    "max-w-[1200px]",
    minHeightClass,
    "overflow-hidden",
    "rounded-xl",
    "md:rounded-2xl",
    "border",
    "border-white/10",
    "bg-white/[0.03]",
    "backdrop-blur-sm",
    "ring-1",
    "ring-white/5",
    "shadow-[0_6px_28px_rgba(0,0,0,0.35)]",
    "md:shadow-[0_8px_40px_rgba(0,0,0,0.35)]",
    "transition-shadow",
    "hover:shadow-[0_10px_50px_rgba(168,85,247,0.12)]"
  ];

  return (
    <div className={cn(baseTokens.join(" "), className)}>
      {showNeonTopBorder ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400/70 via-violet-400/60 to-cyan-400/70" />
      ) : null}
      {children}
    </div>
  );
};

export default GlassCard;
