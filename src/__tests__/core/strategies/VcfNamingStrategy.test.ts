import { VcfNamingStrategy } from '../../../core/strategies/VcfNamingStrategy';

describe('VcfNamingStrategy', () => {
  const strategy = new VcfNamingStrategy();
  const prefix = 'v_';

  it('maps known fields to VCF keys', () => {
    expect(strategy.generateKey('email', 0, prefix)).toBe('v_EMAIL');
    expect(strategy.generateKey('phone', 0, prefix)).toBe('v_TEL');
    expect(strategy.generateKey('address', 0, prefix)).toBe('v_ADR');
    expect(strategy.generateKey('uid', 0, prefix)).toBe('v_UID');
    expect(strategy.generateKey('googleId', 0, prefix)).toBe('v_X-GOOGLE-ID');
  });

  it('handles indexed keys with suffixes', () => {
    expect(strategy.generateKey('email', 1, prefix)).toBe('v_EMAIL_2');
    expect(strategy.generateKey('phone', 2, prefix)).toBe('v_TEL_3');
  });

  it('falls back to uppercase base key for unknown fields', () => {
    expect(strategy.generateKey('unknownField', 0, prefix)).toBe(
      'v_UNKNOWNFIELD'
    );
  });

  it('handles empty prefix', () => {
    expect(strategy.generateKey('email', 0, '')).toBe('EMAIL');
  });
});
