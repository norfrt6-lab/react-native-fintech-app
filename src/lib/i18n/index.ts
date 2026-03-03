import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';

const resources = {
  en: { translation: en },
  ja: { translation: ja },
  zh: { translation: zh },
};

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';
const supportedLanguage = Object.keys(resources).includes(deviceLanguage)
  ? deviceLanguage
  : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: supportedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;
