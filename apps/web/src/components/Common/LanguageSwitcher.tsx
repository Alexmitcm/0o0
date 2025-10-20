import type { FC } from "react";
import { useTranslation } from "react-i18next";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "dropdown" | "inline";
  size?: "sm" | "md" | "lg";
  showFlags?: boolean;
  showNativeNames?: boolean;
}

const AVAILABLE_LANGUAGES: Array<{ code: string; label: string; native?: string; flag?: string }> = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "es", label: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "fr", label: "French", native: "Français", flag: "🇫🇷" }
];

const LanguageSwitcher: FC<LanguageSwitcherProps> = ({
  className = "",
  variant = "dropdown",
  size = "md",
  showFlags = false,
  showNativeNames = false
}) => {
  const { i18n } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    if (!newLang || newLang === i18n.language) return;
    i18n.changeLanguage(newLang).catch(() => {
      // swallow error; UI fallback keeps current language
      // Intentionally no console noise in production build
    });
  };

  const sizeClasses =
    size === "sm"
      ? "h-8 px-2 text-sm"
      : size === "lg"
        ? "h-11 px-3 text-base"
        : "h-10 px-3 text-sm";

  if (variant === "inline") {
    return (
      <div className={className}>
        {AVAILABLE_LANGUAGES.map((lang) => (
          <button
            aria-label={`Switch language to ${lang.label}`}
            className="mx-1 rounded-md bg-white/10 px-2 py-1 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            type="button"
          >
            {showFlags && <span className="mr-1" aria-hidden="true">{lang.flag}</span>}
            <span>{showNativeNames ? lang.native ?? lang.label : lang.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <label className={className}>
      <span className="sr-only">Select language</span>
      <select
        aria-label="Language selector"
        className={`rounded-md border border-white/20 bg-black/30 text-white ${sizeClasses} focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50`}
        onChange={handleChange}
        tabIndex={0}
        value={i18n.language}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            (e.currentTarget as HTMLSelectElement).focus();
          }
        }}
      >
        {AVAILABLE_LANGUAGES.map((lang) => (
          <option className="bg-black text-white" key={lang.code} value={lang.code}>
            {showFlags ? `${lang.flag} ` : ""}
            {showNativeNames ? lang.native ?? lang.label : lang.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSwitcher;
