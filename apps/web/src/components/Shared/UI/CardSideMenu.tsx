import type React from "react";
import { useCallback } from "react";
import cn from "@/helpers/cn";
import AuthButtons from "./AuthButtons";

interface MenuItem {
  key: string;
  label: string;
  href?: string;
  external?: boolean;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

interface CardSideMenuProps {
  className?: string;
  activeKey?: MenuItem["key"];
  onSelect?: (key: MenuItem["key"]) => void;
}

const Icon = ({ name }: { name: MenuItem["key"] }) => {
  const common =
    "h-5 w-5 shrink-0 text-white/80 transition group-hover:text-white";
  switch (name) {
    case "home":
      return (
        <svg
          aria-hidden="true"
          className={common}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M3 11 12 3l9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
      );
    case "explore":
      return (
        <svg
          aria-hidden="true"
          className={common}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m14.5 9.5-5 2-2 5 5-2 2-5Z" />
        </svg>
      );
    case "support":
      return (
        <svg
          aria-hidden="true"
          className={common}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M18 10a6 6 0 1 0-12 0v6h12v-6Z" />
          <path d="M13 20h-2" />
        </svg>
      );
    default:
      return null;
  }
};

const CardSideMenu: React.FC<CardSideMenuProps> = ({
  className = "",
  activeKey,
  onSelect
}) => {
  const sections: MenuSection[] = [
    {
      items: [
        { href: "/", key: "home", label: "Home" },
        { href: "/explore", key: "explore", label: "Explore" },
        { href: "/support", key: "support", label: "Support" }
      ]
    }
  ];

  const handleActivate = useCallback(
    (item: MenuItem) => {
      onSelect?.(item.key);
      if (item.href) {
        window.location.assign(item.href);
        return;
      }
      // eslint-disable-next-line no-console
      console.log("menu:", item.key);
    },
    [onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, item: MenuItem) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleActivate(item);
      }
    },
    [handleActivate]
  );

  const navBaseTokens = [
    "hidden",
    "md:flex",
    "h-[calc(100dvh-6rem)]",
    "w-[280px]",
    "flex-col",
    "select-none",
    "border-r",
    "border-white/10",
    "bg-transparent"
  ];

  const buttonTokens = [
    "group",
    "w-full",
    "rounded-md",
    "px-3",
    "py-2.5",
    "text-left",
    "text-sm",
    "font-medium",
    "text-white/80",
    "outline-none",
    "transition",
    "border-l-2",
    "border-transparent",
    "hover:bg-fuchsia-500/10",
    "hover:border-fuchsia-400/60",
    "hover:text-white",
    "focus:bg-fuchsia-500/10",
    "focus:ring-2",
    "focus:ring-fuchsia-400/50",
    "data-[active=true]:bg-fuchsia-500/15",
    "data-[active=true]:border-fuchsia-400/60",
    "data-[active=true]:text-white"
  ];

  const brandTitleTokens = ["text-sm", "font-semibold", "text-white/90"];
  const _getStartedGlowTokens = [
    "rounded-md",
    "bg-gradient-to-r",
    "from-fuchsia-500",
    "to-cyan-400",
    "px-3",
    "py-2",
    "text-sm",
    "font-medium",
    "text-black",
    "shadow-[0_8px_24px_rgba(168,85,247,0.35)]",
    "transition",
    "hover:shadow-[0_12px_28px_rgba(168,85,247,0.5)]",
    "focus:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-fuchsia-400/50"
  ];

  const _signInCtaTokens = [
    "rounded-md",
    "px-3",
    "py-2",
    "text-sm",
    "text-white/80",
    "transition",
    "hover:text-white",
    "focus:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-fuchsia-400/50"
  ];

  // removed legacy CTA tokens (using gradient glow instead)

  return (
    <nav
      aria-label="Card Menu"
      className={cn(navBaseTokens.join(" "), className)}
    >
      {/* Brand - top only */}
      <div className="flex items-center gap-3 p-3">
        <img alt="Your Game Hub" className="h-6 w-6" src="/logo.png" />
        <span className={cn(brandTitleTokens.join(" "))}>Your Game Hub</span>
      </div>
      <div className="h-px w-full bg-white/10" />

      {/* Items */}
      <div className="flex-1 overflow-auto">
        <div className="px-2 py-2">
          <ul className="flex w-full list-none flex-col items-stretch gap-1">
            {sections[0].items.map((item) => (
              <li className="w-full" key={item.key}>
                <button
                  aria-current={activeKey === item.key ? "page" : undefined}
                  aria-label={item.label}
                  className={cn(buttonTokens.join(" "))}
                  data-active={activeKey === item.key ? true : undefined}
                  onClick={() => handleActivate(item)}
                  onKeyDown={(e) => handleKeyDown(e, item)}
                  tabIndex={0}
                  type="button"
                >
                  <span className="flex items-center gap-3">
                    <Icon name={item.key} />
                    <span className="block truncate text-white/90">
                      {item.label}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-3 my-2 h-px w-auto bg-white/10" />
      {/* CTAs */}
      <div className="p-3">
        <AuthButtons variant="minimal" />
      </div>
    </nav>
  );
};

export default CardSideMenu;
