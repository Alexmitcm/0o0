import { memo, type ReactNode } from "react";
import cn from "@/helpers/cn";

interface SwitchProps {
  checked?: boolean;
  children?: ReactNode;
  className?: string;
  onCheckedChange?: (checked: boolean) => void;
  [key: string]: any;
}

const Switch = ({
  checked = false,
  className = "",
  onCheckedChange,
  ...props
}: SwitchProps) => {
  return (
    <button
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input",
        className
      )}
      onClick={() => onCheckedChange?.(!checked)}
      type="button"
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
};

export default memo(Switch);
export { Switch };
