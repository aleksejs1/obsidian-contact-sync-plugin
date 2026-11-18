import { getLanguage } from 'obsidian';
import { ru, en, lv } from './translations';

/**
 * Translator handles language selection and translation fallback.
 */
export class Translator {
  private language: string;

  constructor(language = 'en') {
    this.language = language;
  }

  /**
   * Sets the active language (e.g. 'ru' or 'en').
   */
  setLanguage(language: string) {
    this.language = language;
  }

  /**
   * Translates a key using the selected language.
   * Falls back to English if key is missing.
   * Returns the key itself if translation is not found at all.
   *
   * @param key - The translation key.
   * @returns The translated string.
   */
  t(key: string): string {
    const dict = this.language === 'ru' ? ru : this.language === 'lv' ? lv : en;

    if (key in dict) {
      return dict[key as keyof typeof dict];
    }

    if (key in en) {
      return en[key as keyof typeof en];
    }

    return key;
  }
}

// Singleton-like instance for general use
const translator = new Translator(getLanguage()); // Default to the current Obsidian language

/**
 * Global translation function.
 *
 * @param key - The translation key.
 * @param params - Values for `{name}` placeholders in the translated string.
 * @returns The translated string.
 */
export function t(
  key: string,
  params?: Record<string, string | number>
): string {
  const text = translator.t(key);
  if (!params) {
    return text;
  }
  // A replacer function keeps `$&`-style sequences in values literal
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}
