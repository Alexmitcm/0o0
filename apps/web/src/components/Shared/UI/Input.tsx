import {
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";
import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";
import { forwardRef, useState } from "react";
import cn from "@/helpers/cn";
import {
  sanitizeInput,
  validateEmail,
  validateInputLength
} from "@/helpers/security";

const inputVariants = cva(
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  {
    defaultVariants: {
      size: "md",
      variant: "default"
    },
    variants: {
      size: {
        lg: "px-4 py-3 text-lg",
        md: "px-4 py-2 text-base",
        sm: "px-3 py-1.5 text-sm"
      },
      variant: {
        default: "",
        error: "border-red-500 focus:ring-red-500",
        success: "border-green-500 focus:ring-green-500"
      }
    }
  }
);

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: string | React.ReactNode;
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search";
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  };
  sanitize?: boolean;
  onValidationChange?: (isValid: boolean, error?: string) => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size,
      variant,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      iconLeft,
      iconRight,
      type = "text",
      validation,
      sanitize = true,
      onValidationChange,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [internalError, setInternalError] = useState<string>("");
    const [internalValue, setInternalValue] = useState(props.value || "");

    const validateInput = (value: string): string | null => {
      if (!validation) return null;

      const trimmedValue = value.trim();

      // Required validation
      if (validation.required && !trimmedValue) {
        return "This field is required";
      }

      // Length validation
      if (
        validation.minLength &&
        !validateInputLength(trimmedValue, validation.minLength)
      ) {
        return `Must be at least ${validation.minLength} characters long`;
      }

      if (
        validation.maxLength &&
        !validateInputLength(trimmedValue, 0, validation.maxLength)
      ) {
        return `Must be no more than ${validation.maxLength} characters long`;
      }

      // Pattern validation
      if (
        validation.pattern &&
        trimmedValue &&
        !validation.pattern.test(trimmedValue)
      ) {
        return "Invalid format";
      }

      // Type-specific validation
      if (type === "email" && trimmedValue && !validateEmail(trimmedValue)) {
        return "Please enter a valid email address";
      }

      // Custom validation
      if (validation.custom) {
        const customError = validation.custom(trimmedValue);
        if (customError) return customError;
      }

      return null;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      // Sanitize input if enabled
      if (sanitize) {
        value = sanitizeInput(value);
      }

      // Validate input
      const validationError = validateInput(value);
      setInternalError(validationError || "");

      // Update internal value
      setInternalValue(value);

      // Notify parent of validation state
      if (onValidationChange) {
        onValidationChange(!validationError, validationError || undefined);
      }

      // Call original onChange if provided
      if (onChange) {
        onChange({
          ...e,
          target: {
            ...e.target,
            value
          }
        });
      }
    };

    const inputType = type === "password" && showPassword ? "text" : type;
    const hasError = Boolean(error || internalError);
    const finalVariant = hasError ? "error" : variant;
    const finalError = error || internalError;

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const inputId =
      props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            className="mb-1 block font-medium text-gray-700 text-sm dark:text-gray-300"
            htmlFor={inputId}
          >
            {label}
            {validation?.required && (
              <span aria-label="required" className="ml-1 text-red-500">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {(leftIcon || iconLeft) && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <div className="h-5 w-5 text-gray-400 dark:text-gray-500">
                {iconLeft || leftIcon}
              </div>
            </div>
          )}

          <input
            aria-describedby={
              finalError
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            aria-invalid={hasError}
            className={cn(
              inputVariants({ className, size, variant: finalVariant }),
              (leftIcon || iconLeft) && "pl-10",
              (rightIcon || iconRight || type === "password") && "pr-10"
            )}
            id={inputId}
            onChange={handleChange}
            ref={ref}
            type={inputType}
            value={internalValue}
            {...props}
          />

          {type === "password" && (
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={togglePasswordVisibility}
              type="button"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
              )}
            </button>
          )}

          {(rightIcon || iconRight) && type !== "password" && !hasError && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <div className="h-5 w-5 text-gray-400 dark:text-gray-500">
                {iconRight || rightIcon}
              </div>
            </div>
          )}

          {hasError && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>

        {finalError && (
          <p
            aria-live="polite"
            className="mt-1 text-red-600 text-sm dark:text-red-400"
            id={`${inputId}-error`}
            role="alert"
          >
            {finalError}
          </p>
        )}

        {helperText && !finalError && (
          <p
            className="mt-1 text-gray-500 text-sm dark:text-gray-400"
            id={`${inputId}-helper`}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
export { Input };
