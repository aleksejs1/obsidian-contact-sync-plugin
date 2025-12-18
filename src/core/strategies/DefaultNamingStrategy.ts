import { KeyNamingStrategy } from '../interfaces';

export class DefaultNamingStrategy implements KeyNamingStrategy {
  generateKey(baseKey: string, index: number, prefix: string): string {
    const suffix = index === 0 ? '' : `_${index + 1}`;
    return `${prefix}${baseKey}${suffix}`;
  }
}
