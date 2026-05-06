import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import aboutEn from "./resources/en/about.json";
import combustiblesEn from "./resources/en/combustibles.json";
import commonEn from "./resources/en/common.json";
import healthEn from "./resources/en/health.json";
import homeEn from "./resources/en/home.json";
import rolesEn from "./resources/en/roles.json";
import usersEn from "./resources/en/users.json";
import aboutEs from "./resources/es/about.json";
import combustiblesEs from "./resources/es/combustibles.json";
import commonEs from "./resources/es/common.json";
import healthEs from "./resources/es/health.json";
import homeEs from "./resources/es/home.json";
import rolesEs from "./resources/es/roles.json";
import usersEs from "./resources/es/users.json";

export const supportedLanguages = ["es", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultNamespace = "common";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        common: commonEs,
        users: usersEs,
        roles: rolesEs,
        health: healthEs,
        home: homeEs,
        about: aboutEs,
        combustibles: combustiblesEs
      },
      en: {
        common: commonEn,
        users: usersEn,
        roles: rolesEn,
        health: healthEn,
        home: homeEn,
        about: aboutEn,
        combustibles: combustiblesEn
      }
    },
    fallbackLng: "es",
    supportedLngs: [...supportedLanguages],
    ns: ["common", "users", "roles", "health", "home", "about", "combustibles"],
    defaultNS: defaultNamespace,
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "molins.language"
    },
    returnNull: false
  });

export default i18n;
