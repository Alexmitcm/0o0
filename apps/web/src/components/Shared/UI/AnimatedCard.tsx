import type { ReactNode } from "react";
import cn from "@/helpers/cn";
import Card from "./Card";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "default" | "elevated" | "modern" | "premium";
}

const AnimatedCard = ({
  children,
  className = "",
  delay = 0,
  variant = "modern"
}: AnimatedCardProps) => {
  // Map delay values to CSS classes
  const getDelayClass = (delayMs: number) => {
    if (delayMs <= 0) return "animated-card-delay-0";
    if (delayMs <= 50) return "animated-card-delay-50";
    if (delayMs <= 100) return "animated-card-delay-100";
    if (delayMs <= 150) return "animated-card-delay-150";
    if (delayMs <= 200) return "animated-card-delay-200";
    if (delayMs <= 250) return "animated-card-delay-250";
    if (delayMs <= 300) return "animated-card-delay-300";
    if (delayMs <= 350) return "animated-card-delay-350";
    if (delayMs <= 400) return "animated-card-delay-400";
    if (delayMs <= 450) return "animated-card-delay-450";
    return "animated-card-delay-500";
  };

  return (
    <div
      className={cn(
        "animated-card transition-all duration-300 hover:scale-105 hover:shadow-2xl",
        getDelayClass(delay),
        className
      )}
    >
      <Card
        className={cn(
          "transition-all duration-300 hover:shadow-2xl",
          className
        )}
        forceRounded
        variant={variant}
      >
        {children}
      </Card>
    </div>
  );
};

export default AnimatedCard;
