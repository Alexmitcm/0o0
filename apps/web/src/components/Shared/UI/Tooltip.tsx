import * as RadixTooltip from "@radix-ui/react-tooltip";
import { memo, type ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  className?: string;
  content: ReactNode;
  placement?: "bottom" | "left" | "right" | "top";
  withDelay?: boolean;
}

const Tooltip = ({
  children,
  className = "",
  content,
  placement = "right",
  withDelay = false
}: TooltipProps) => {
  return (
    <RadixTooltip.Provider
      delayDuration={withDelay ? 600 : 0}
      skipDelayDuration={withDelay ? 0 : 600}
    >
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          <span className={className}>{children}</span>
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            asChild
            className="!rounded-lg !text-xs !leading-6 z-10 hidden bg-gray-700 px-3 py-0.5 text-white tracking-wide sm:block"
            side={placement}
            sideOffset={5}
          >
            <div>
              <span>{content}</span>
              <RadixTooltip.Arrow className="fill-gray-700" />
            </div>
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
};

export default memo(Tooltip);
