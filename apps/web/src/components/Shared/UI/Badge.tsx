import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { forwardRef, memo } from "react";
import cn from "@/helpers/cn";

const badgeVariants = cva("rounded-md border text-white text-xs shadow-xs", {
  defaultVariants: { size: "sm", variant: "primary" },
  variants: {
    size: { sm: "px-2" },
    variant: {
      destructive: "border-red-200 bg-red-100 text-red-900",
      outline: "border-gray-300 bg-transparent text-gray-700",
      primary: "border-black bg-black",
      secondary: "border-gray-200 bg-gray-100 text-gray-900"
    }
  }
});

interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  children?: ReactNode;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ children, className, variant, size, ...rest }, ref) => {
    return (
      <span
        className={cn(badgeVariants({ size, variant }), className)}
        ref={ref}
        {...rest}
      >
        {children}
      </span>
    );
  }
);

export default memo(Badge);
export { Badge };
