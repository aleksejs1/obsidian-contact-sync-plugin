import { getLanguage } from 'obsidian';
import { ru, en, lv } from './translations';

/**
 * Translator handles language selection and translation fallback.
 */
export class Translator {
  private language: string;

  constructor(language: string = 'en') {
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
export const translator = new Translator(getLanguage()); // Default to the current Obsidian language

/**
 * Global translation function.
 *
 * @param key - The translation key.
 * @returns The translated string.
 */
export function t(key: string): string {
  return translator.t(key);
}
