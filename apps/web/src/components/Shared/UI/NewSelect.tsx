import { memo, type ReactNode } from "react";
import cn from "@/helpers/cn";

interface NewSelectProps {
  children?: ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
  value?: string;
  onChange?: (value: any) => void;
  options?: any[];
  [key: string]: any;
}

const NewSelect = ({
  children,
  className = "",
  onValueChange,
  onChange,
  value,
  options,
  ...props
}: NewSelectProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    onValueChange?.(newValue);
    onChange?.(newValue);
  };

  if (options) {
    return (
      <select
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onChange={handleChange}
        value={value}
        {...props}
      >
        {options.map((option, index) => (
          <option disabled={option.disabled} key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className={cn("relative", className)} {...props}>
      {children}
    </div>
  );
};

const NewSelectContent = ({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <div
    className={cn(
      "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const NewSelectItem = ({
  children,
  value,
  className = "",
  ...props
}: {
  children: ReactNode;
  value: string;
  className?: string;
  [key: string]: any;
}) => (
  <div
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const NewSelectTrigger = ({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <div
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const NewSelectValue = ({
  placeholder,
  className = "",
  ...props
}: {
  placeholder?: string;
  className?: string;
  [key: string]: any;
}) => (
  <span className={cn("text-muted-foreground", className)} {...props}>
    {placeholder}
  </span>
);

export default memo(NewSelect);
export {
  NewSelect as Select,
  NewSelectContent as SelectContent,
  NewSelectItem as SelectItem,
  NewSelectTrigger as SelectTrigger,
  NewSelectValue as SelectValue
};
