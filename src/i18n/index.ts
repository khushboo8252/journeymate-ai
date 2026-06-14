import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { en } from "./locales/en";
import { hi } from "./locales/hi";

if (!i18n.isInitialized) {
  const isBrowser = typeof window !== "undefined";
  
  i18n.use(initReactI18next);

  if (isBrowser) {
    i18n.use(LanguageDetector);
  }

  i18n.init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    lng: "en",
    fallbackLng: "en",
    supportedLngs: ["en", "hi"],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });
}

export default i18n;