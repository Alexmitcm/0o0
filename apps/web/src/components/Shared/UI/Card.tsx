import { cva, type VariantProps } from "class-variance-authority";
import {
  type ElementType,
  type KeyboardEvent,
  type MouseEvent,
  memo,
  type ReactNode
} from "react";

const cardVariants = cva(
  // base look kept minimal; variant classes will boost styling
  "border-gray-600/50 bg-gray-900/95 backdrop-blur-xl ring-1 ring-white/10",
  {
    defaultVariants: {
      forceRounded: false,
      tone: "default",
      variant: "default"
    },
    variants: {
      forceRounded: {
        false: "rounded-none border-y md:rounded-2xl md:border",
        true: "rounded-2xl border"
      },
      tone: {
        default: "shadow-sm",
        glass:
          "shadow-[0_8px_30px_rgba(0,0,0,0.35)] border-white/15 bg-white/10 dark:bg-white/5 backdrop-blur-xl",
        strong:
          "shadow-[0_10px_40px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10 dark:ring-white/10 border-transparent bg-gradient-to-b from-white/80 to-white/60 dark:from-black/50 dark:to-black/40"
      },
      variant: {
        bordered: "border-2 ring-2 ring-gray-700/50",
        default: "",
        elevated:
          "shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]",
        gradient:
          "bg-gradient-to-br from-gray-800/90 via-gray-900/95 to-black/90",
        modern:
          "shadow-xl border-0 bg-gray-900/95 backdrop-blur-xl ring-1 ring-white/10",
        premium:
          "shadow-2xl border-0 bg-gradient-to-br from-purple-900/30 via-gray-900/95 to-blue-900/30 backdrop-blur-xl ring-1 ring-purple-500/20"
      }
    }
  }
);

interface CardProps extends VariantProps<typeof cardVariants> {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  [key: string]: any;
}

const Card = ({
  as: Tag = "div",
  children,
  className = "",
  forceRounded = false,
  tone,
  variant = "default",
  onClick,
  onKeyDown,
  ...rest
}: CardProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (onKeyDown) onKeyDown(event);
    if (!onClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick(event as any);
    }
  };
  return (
    <Tag
      className={cardVariants({ className, forceRounded, tone, variant })}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
};

// Card sub-components
const CardContent = ({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({
  children,
  className = "",
  ...props
}: {
  children?: ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <h3
    className={`font-semibold text-2xl leading-none tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h3>
);

const CardDescription = ({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <p className={`text-muted-foreground text-sm ${className}`} {...props}>
    {children}
  </p>
);

const CardFooter = ({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <div className={`flex items-center p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

export default memo(Card);
export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
