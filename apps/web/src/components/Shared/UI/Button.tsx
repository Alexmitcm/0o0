import { cva, type VariantProps } from "class-variance-authority";
// import { AnimatePresence, motion } from "motion/react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef, memo } from "react";
import { Spinner } from "@/components/Shared/UI";
import cn from "@/helpers/cn";

const buttonVariants = cva(
  "rounded-full font-bold inline-flex items-center justify-center relative overflow-hidden",
  {
    compoundVariants: [
      // Non-outline Primary
      {
        class: cn(
          // Neon primary
          "text-white hover:text-white active:text-white",
          "bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600",
          "bg-[length:200%_200%] [animation:neonGradient_8s_linear_infinite]",
          "shadow-[0_0_20px_rgba(168,85,247,0.45)]",
          "border border-fuchsia-400/30",
          "dark:text-gray-950 dark:hover:text-gray-900 dark:active:text-gray-600",
          "dark:bg-white dark:hover:bg-gray-200 dark:active:bg-gray-200",
          "dark:border-white dark:hover:border-gray-100 dark:active:border-gray-200"
        ),
        outline: false,
        variant: "primary"
      },
      // Outline Primary
      {
        class: cn(
          // Neon outline
          "text-white",
          "border border-fuchsia-400/40 hover:border-cyan-400/50",
          "shadow-[inset_0_0_20px_rgba(59,130,246,0.25)]",
          "dark:text-white dark:active:text-gray-700",
          "dark:border-gray-700 dark:hover:border-gray-600"
        ),
        outline: true,
        variant: "primary"
      },
      // Variant: outline (support usage like variant="outline")
      {
        class: cn(
          "text-white",
          "border border-fuchsia-400/40 hover:border-cyan-400/50",
          "bg-transparent",
          "shadow-[inset_0_0_20px_rgba(59,130,246,0.25)]",
          "dark:text-white dark:active:text-gray-700",
          "dark:border-gray-700 dark:hover:border-gray-600"
        ),
        outline: false,
        variant: "outline"
      },
      {
        class: cn(
          "text-gray-950 active:text-gray-500",
          "border border-gray-300 hover:border-gray-400",
          "bg-transparent",
          "dark:text-white dark:active:text-gray-700",
          "dark:border-gray-700 dark:hover:border-gray-600"
        ),
        outline: true,
        variant: "outline"
      }
    ],
    defaultVariants: {
      outline: false,
      size: "md",
      variant: "primary"
    },
    variants: {
      outline: { false: "", true: "" },
      size: { lg: "px-6 py-2", md: "px-5 py-1.5", sm: "px-3 py-1 text-sm" },
      variant: {
        default: "bg-gray-900 text-white hover:bg-gray-800",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
        outline:
          "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50",
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300"
      }
    }
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  tooltip?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      disabled,
      icon,
      outline,
      size,
      variant,
      loading,
      ariaLabel,
      ariaDescribedBy,
      tooltip,
      ...rest
    },
    ref
  ) => {
    return (
      <>
        <button
          aria-describedby={ariaDescribedBy}
          aria-disabled={disabled || loading}
          aria-label={
            ariaLabel || (typeof children === "string" ? children : undefined)
          }
          className={buttonVariants({ className, outline, size, variant })}
          disabled={disabled || loading}
          ref={ref}
          title={tooltip}
          type={rest.type}
          {...rest}
        >
          {/* <AnimatePresence mode="wait"> */}
          <div
            // animate={loading ? "loading" : "idle"}
            className="flex items-center gap-x-1.5"
            // initial="idle"
            // key="content"
            // transition={{ bounce: 0, duration: 0.2, type: "spring" }}
            // variants={{
            //   idle: { opacity: 1, y: 0 },
            //   loading: { opacity: 0, y: -20 }
            // }}
          >
            {icon}
            {children}
          </div>
          {loading && (
            <div
              // animate={{ opacity: 1, y: 0 }}
              className="absolute flex items-center justify-center"
              // exit={{ opacity: 0, y: 20 }}
              // initial={{ opacity: 0, y: 20 }}
              // key="spinner"
              // transition={{ bounce: 0, duration: 0.2, type: "spring" }}
            >
              <Spinner size="xs" />
            </div>
          )}
          {/* </AnimatePresence> */}
        </button>
        <style>{`
          @keyframes neonGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </>
    );
  }
);

export default memo(Button);
export { Button };
