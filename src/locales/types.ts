import en from './en';
import zhTW from './zh-TW';

export type TranslationKey = keyof typeof en;
export type TranslationPath = keyof typeof en[keyof typeof en];

export type Locale = 'en' | 'zh-TW';

export interface I18nConfig {
  defaultLocale: Locale;
  fallbackLocale: Locale;
  availableLocales: readonly Locale[];
  localeNames: Record<Locale, string>;
}

export const I18N_CONFIG: I18nConfig = {
  defaultLocale: 'en',
  fallbackLocale: 'en',
  availableLocales: ['en', 'zh-TW'],
  localeNames: {
    en: 'English',
    'zh-TW': '繁體中文',
  },
};

export const translations = {
  en,
  'zh-TW': zhTW,
} as const;

// Type-safe translation function
export function getTranslation<K extends TranslationKey>(
  locale: Locale,
  key: K
): typeof en[K] {
  const localeTranslations = translations[locale];
  const fallbackTranslations = translations[I18N_CONFIG.fallbackLocale];

  return (localeTranslations?.[key] ?? fallbackTranslations?.[key] ?? key) as typeof en[K];
}

// Format translation with interpolation
export function formatTranslation(
  text: string,
  params: Record<string, string | number>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return params[key]?.toString() ?? `{{${key}}}`;
  });
}

// Get locale from URL param or localStorage
export function detectLocale(): Locale {
  // Try URL param first
  const urlParams = new URLSearchParams(window.location.search);
  const urlLocale = urlParams.get('lang') as Locale;
  if (urlLocale && I18N_CONFIG.availableLocales.includes(urlLocale)) {
    return urlLocale;
  }

  // Then try localStorage
  const storedLocale = localStorage.getItem('worldmonitor-locale') as Locale;
  if (storedLocale && I18N_CONFIG.availableLocales.includes(storedLocale)) {
    return storedLocale;
  }

  // Then try browser language
  const browserLang = navigator.language;
  if (browserLang === 'zh-TW' || browserLang === 'zh-Hant') {
    return 'zh-TW';
  }

  return I18N_CONFIG.defaultLocale;
}

export function setLocale(locale: Locale): void {
  localStorage.setItem('worldmonitor-locale', locale);
  window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale } }));
}

export class I18n {
  private static instance: I18n;
  public locale: Locale;
  private listeners: Set<(locale: Locale) => void> = new Set();

  private constructor() {
    this.locale = detectLocale();
    this.setupEventListener();
  }

  public static getInstance(): I18n {
    if (!I18n.instance) {
      I18n.instance = new I18n();
    }
    return I18n.instance;
  }

  private setupEventListener(): void {
    window.addEventListener('locale-changed', ((e: CustomEvent) => {
      this.locale = e.detail.locale;
      this.listeners.forEach(listener => listener(this.locale));
    }) as EventListener);
  }

  public setLocale(locale: Locale): void {
    if (!I18N_CONFIG.availableLocales.includes(locale)) {
      console.warn(`Locale ${locale} is not supported`);
      return;
    }
    setLocale(locale);
  }

  public getLocale(): Locale {
    return this.locale;
  }

  public onLocaleChange(callback: (locale: Locale) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Translation helper
  public t(key: string, params?: Record<string, string | number>): string {
    const parts = key.split('.');
    let result: any = translations[this.locale] ?? translations[I18N_CONFIG.fallbackLocale];

    for (const part of parts) {
      if (result?.[part]) {
        result = result[part];
      } else {
        // Try fallback locale
        result = translations[I18N_CONFIG.fallbackLocale];
        for (const p of parts) {
          if (result?.[p]) {
            result = result[p];
          } else {
            return key;
          }
        }
        return result;
      }
    }

    if (typeof result === 'string') {
      return params ? formatTranslation(result, params) : result;
    }

    return key;
  }
}

// Singleton instance
export const i18n = I18n.getInstance();
