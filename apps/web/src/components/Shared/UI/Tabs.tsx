// import { MotionConfig, motion } from "motion/react";
import { memo, type ReactNode } from "react";
import cn from "@/helpers/cn";

interface TabsProps {
  tabs: { name: string; type: string; suffix?: ReactNode }[];
  active: string;
  setActive: (type: string) => void;
  layoutId: string;
  className?: string;
}

const Tabs = ({ tabs, active, setActive, layoutId, className }: TabsProps) => {
  return (
    // <MotionConfig transition={{ bounce: 0, duration: 0.4, type: "spring" }}>
    <ul
      className={cn("mb-0 flex list-none flex-wrap gap-3", className)}
      // layout
    >
      {tabs.map((tab) => (
        <li
          className="relative cursor-pointer px-3 py-1.5 text-sm outline-hidden transition-colors"
          key={tab.type}
          // layout
          onClick={() => setActive(tab.type)}
          tabIndex={0}
        >
          {active === tab.type ? (
            <div
              className="absolute inset-0 rounded-lg bg-gray-300 dark:bg-gray-300/20"
              // layoutId={layoutId}
            />
          ) : null}
          <span className="relative flex items-center gap-2 text-inherit">
            {tab.name}
            {tab.suffix}
          </span>
        </li>
      ))}
    </ul>
    // </MotionConfig>
  );
};

// New Tabs components for shadcn/ui compatibility
interface NewTabsProps {
  children: ReactNode;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const NewTabs = ({
  children,
  className = "",
  value,
  onValueChange
}: NewTabsProps) => {
  return <div className={cn("w-full", className)}>{children}</div>;
};

const TabsList = ({
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
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const TabsTrigger = ({
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
  <button
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 font-medium text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

const TabsContent = ({
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
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export default memo(Tabs);
export { NewTabs as Tabs, TabsContent, TabsList, TabsTrigger };
