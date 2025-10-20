import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import ar from "./locales/ar.json";
import de from "./locales/de.json";
// Import translation files
import en from "./locales/en.json";
import zh from "./locales/zh.json";

const resources = {
  ar: { translation: ar },
  de: { translation: de },
  en: { translation: en },
  zh: { translation: zh }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: process.env.NODE_ENV === "development",

    detection: {
      caches: ["localStorage"],
      order: ["localStorage", "navigator", "htmlTag"]
    },
    fallbackLng: "en",

    interpolation: {
      escapeValue: false // React already does escaping
    },

    // RTL language support
    lng: localStorage.getItem("i18nextLng") || "en",

    react: {
      useSuspense: false
    },
    resources
  });

// Helper function to get text direction
export const getTextDirection = (language: string): "ltr" | "rtl" => {
  const rtlLanguages = ["ar", "fa", "he", "ur"];
  return rtlLanguages.includes(language) ? "rtl" : "ltr";
};

// Helper function to format numbers based on locale
export const formatNumber = (number: number, locale: string): string => {
  return new Intl.NumberFormat(locale).format(number);
};

// Helper function to format dates based on locale
export const formatDate = (
  date: Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric"
  };

  return new Intl.DateTimeFormat(locale, options || defaultOptions).format(
    date
  );
};

// Helper function to format currency based on locale
export const formatCurrency = (
  amount: number,
  locale: string,
  currency = "USD"
): string => {
  return new Intl.NumberFormat(locale, {
    currency,
    style: "currency"
  }).format(amount);
};

export default i18n;
