import type React from "react";
import { useCallback } from "react";
import cn from "@/helpers/cn";

interface MenuItem {
  key: string;
  label: string;
  href?: string;
}

interface LeftDockMenuProps {
  className?: string;
}

const LeftDockMenu: React.FC<LeftDockMenuProps> = ({ className = "" }) => {
  const items: MenuItem[] = [
    { key: "home", label: "Home" },
    { key: "explore", label: "Explore" },
    { key: "tournaments", label: "Tournaments" },
    { key: "nodes", label: "Nodes" },
    { key: "marketplace", label: "Marketplace" },
    { key: "docs", label: "Docs" },
    { key: "about", label: "About" },
    { key: "contact", label: "Contact" }
  ];

  const handleActivate = useCallback((item: MenuItem) => {
    if (item.href) {
      window.location.assign(item.href);
      return;
    }
    // Placeholder: later we can route or open sections
    // eslint-disable-next-line no-console
    console.log("menu:", item.key);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, item: MenuItem) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleActivate(item);
      }
    },
    [handleActivate]
  );

  // Sorted Tailwind tokens via array to satisfy class-ordering and maintain readability
  const navTokens = [
    "backdrop-blur-md",
    "bg-black/30",
    "border-r",
    "border-white/10",
    "fixed",
    "h-screen",
    "hidden",
    "left-0",
    "md:flex",
    "select-none",
    "top-0",
    "w-16",
    "z-30"
  ];

  const buttonTokens = [
    "group",
    "w-full",
    "rounded-md",
    "px-2",
    "py-2",
    "text-left",
    "text-xs",
    "font-medium",
    "text-white/80",
    "outline-none",
    "transition",
    "hover:bg-white/10",
    "focus:bg-white/10",
    "focus:ring-2",
    "focus:ring-fuchsia-400/50"
  ];

  return (
    <nav aria-label="Primary" className={cn(navTokens.join(" "), className)}>
      <ul className="flex w-full flex-col items-stretch gap-1 p-2">
        {items.map((item) => (
          <li className="w-full" key={item.key}>
            <button
              aria-label={item.label}
              className={cn(buttonTokens.join(" "))}
              onClick={() => handleActivate(item)}
              onKeyDown={(e) => handleKeyDown(e, item)}
              tabIndex={0}
              type="button"
            >
              <span className="block truncate">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default LeftDockMenu;
