import { VcfNamingStrategy } from '../../../core/strategies/VcfNamingStrategy';

describe('VcfNamingStrategy', () => {
  const strategy = new VcfNamingStrategy();
  const prefix = 'v_';

  it('maps known fields to VCF keys without prefix', () => {
    expect(strategy.generateKey('email', 0, prefix)).toBe('EMAIL');
    expect(strategy.generateKey('phone', 0, prefix)).toBe('TEL');
    expect(strategy.generateKey('address', 0, prefix)).toBe('ADR');
    expect(strategy.generateKey('googleId', 0, prefix)).toBe('X-GOOGLE-ID');
  });

  it('uses [index] notation for multiple values', () => {
    expect(strategy.generateKey('email', 1, prefix)).toBe('EMAIL[2]');
    expect(strategy.generateKey('phone', 2, prefix)).toBe('TEL[3]');
  });

  it('falls back to uppercase base key for unknown fields', () => {
    expect(strategy.generateKey('unknownField', 0, prefix)).toBe(
      'UNKNOWNFIELD'
    );
  });

  it('ignores prefix parameter', () => {
    expect(strategy.generateKey('email', 0, '')).toBe('EMAIL');
    expect(strategy.generateKey('email', 0, 'v_')).toBe('EMAIL');
  });
});
