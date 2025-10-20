import { memo, type ReactNode } from "react";
import cn from "@/helpers/cn";

interface DialogProps {
  children: ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  [key: string]: any;
}

const Dialog = ({
  children,
  className = "",
  open,
  onOpenChange,
  ...props
}: DialogProps) => {
  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50",
        className
      )}
      onClick={() => onOpenChange?.(false)}
      {...props}
    >
      {children}
    </div>
  );
};

const DialogTrigger = ({
  children,
  asChild = false,
  ...props
}: {
  children: ReactNode;
  asChild?: boolean;
  [key: string]: any;
}) => {
  if (asChild) {
    return children;
  }
  return <button {...props}>{children}</button>;
};

const DialogContent = ({
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
      "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
      className
    )}
    onClick={(e) => e.stopPropagation()}
    {...props}
  >
    {children}
  </div>
);

const DialogHeader = ({
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
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const DialogTitle = ({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <h2
    className={cn(
      "font-semibold text-lg leading-none tracking-tight",
      className
    )}
    {...props}
  >
    {children}
  </h2>
);

const DialogDescription = ({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <p className={cn("text-muted-foreground text-sm", className)} {...props}>
    {children}
  </p>
);

export default memo(Dialog);
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
};
