import { memo, type ReactNode } from "react";
import cn from "@/helpers/cn";

interface LabelProps {
  children: ReactNode;
  className?: string;
  htmlFor?: string;
  [key: string]: any;
}

const Label = ({ children, className = "", htmlFor, ...props }: LabelProps) => {
  return (
    <label
      className={cn(
        "font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      htmlFor={htmlFor}
      {...props}
    >
      {children}
    </label>
  );
};

export default memo(Label);
export { Label };
