import { Translator, t } from '../../i18n/translator';

jest.mock('obsidian', () => ({
  moment: {
    locale: jest.fn(() => 'ru'),
  },
}));

describe('Translator', () => {
  let translator: Translator;

  beforeEach(() => {
    translator = new Translator();
  });

  test('returns Russian translation if available', () => {
    translator.setLanguage('ru');
    expect(translator.t('Google client ID')).toBe('ID клиента Google');
  });

  test('returns Latvian translation if available', () => {
    translator.setLanguage('lv');
    expect(translator.t('Google client ID')).toBe('Google klienta ID');
  });

  test('falls back to English if Russian key is missing', () => {
    translator.setLanguage('ru');
    expect(translator.t('Fallback to English')).toBe('Fallback to English');
  });

  test('returns key if not found in any language', () => {
    translator.setLanguage('ru');
    expect(translator.t('Unknown key')).toBe('Unknown key');
  });

  test('returns English translation if language is set to en', () => {
    translator.setLanguage('en');
    expect(translator.t('Google client ID')).toBe('Google client ID');
  });

  test('global t() function is working', () => {
    expect(t('Unknown key')).toBe('Unknown key');
  });
});
