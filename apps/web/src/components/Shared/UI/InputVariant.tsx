import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { forwardRef, memo, useId } from "react";
import cn from "@/helpers/cn";
import { FieldError } from "./Form";
import HelpTooltip from "./HelpTooltip";

const inputVariantStyles = cva(
  "peer w-full border-none bg-transparent outline-hidden focus:ring-0 transition-all duration-200",
  {
    defaultVariants: { size: "md", variant: "default" },
    variants: {
      size: {
        lg: "px-5 py-4 text-lg",
        md: "px-4 py-3 text-base",
        sm: "px-3 py-2 text-sm"
      },
      variant: {
        default: "text-gray-100 placeholder:text-gray-400",
        modern: "text-gray-200 placeholder:text-gray-400",
        premium: "text-white placeholder:text-gray-300"
      }
    }
  }
);

const containerVariantStyles = cva(
  "flex w-full items-center border transition-all duration-200",
  {
    defaultVariants: { size: "md", variant: "default" },
    variants: {
      size: {
        lg: "rounded-2xl",
        md: "rounded-xl",
        sm: "rounded-lg"
      },
      variant: {
        default:
          "border-gray-600 bg-gray-800 shadow-lg focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/30",
        modern:
          "border-gray-700 bg-gray-900 shadow-md focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-400/30",
        premium:
          "border-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20 shadow-lg focus-within:ring-2 focus-within:ring-purple-400/30"
      }
    }
  }
);

interface InputVariantProps
  extends Omit<ComponentProps<"input">, "prefix" | "size">,
    VariantProps<typeof inputVariantStyles>,
    VariantProps<typeof containerVariantStyles> {
  className?: string;
  error?: boolean;
  helper?: ReactNode;
  hideError?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  label?: ReactNode;
  prefix?: ReactNode | string;
}

const InputVariant = forwardRef<HTMLInputElement, InputVariantProps>(
  (
    {
      className = "",
      error,
      helper,
      hideError = false,
      iconLeft,
      iconRight,
      label,
      prefix,
      size = "md",
      variant = "default",
      type = "text",
      ...props
    },
    ref
  ) => {
    const id = useId();

    const iconStyles = [
      "text-gray-400 [&>*]:peer-focus:text-gray-300 [&>*]:h-5",
      { "!text-red-500 [&>*]:peer-focus:!text-red-500": error }
    ];

    return (
      <label className="w-full" htmlFor={id}>
        {label ? (
          <div className="mb-2 flex items-center space-x-1.5">
            <div className="font-medium text-gray-100 text-sm">{label}</div>
            <HelpTooltip>{helper}</HelpTooltip>
          </div>
        ) : null}
        <div className="flex">
          {prefix ? (
            <span
              className={cn(
                "inline-flex items-center border border-gray-600 border-r-0 bg-gray-700 px-4 text-gray-300 shadow-sm",
                size === "sm" && "rounded-l-lg py-2",
                size === "md" && "rounded-l-xl py-3",
                size === "lg" && "rounded-l-2xl py-4"
              )}
            >
              {prefix}
            </span>
          ) : null}
          <div
            className={cn(
              { "!bg-gray-500/20 opacity-50": props.disabled },
              {
                "!border-red-500 focus-within:!border-red-500 focus-within:!ring-red-500/20":
                  error
              },
              prefix ? "rounded-r-xl" : "",
              containerVariantStyles({ size, variant })
            )}
          >
            <input
              className={cn(
                { "placeholder:text-red-500": error },
                prefix ? "rounded-r-xl" : "",
                inputVariantStyles({ size, variant }),
                className
              )}
              id={id}
              ref={ref}
              type={type}
              {...props}
            />
            <span
              className={cn({ "order-first pl-3": iconLeft }, iconStyles)}
              tabIndex={-1}
            >
              {iconLeft}
            </span>
            <span
              className={cn({ "order-last pr-3": iconRight }, iconStyles)}
              tabIndex={-1}
            >
              {iconRight}
            </span>
          </div>
        </div>
        {!hideError && props.name ? <FieldError name={props.name} /> : null}
      </label>
    );
  }
);

export default memo(InputVariant);
