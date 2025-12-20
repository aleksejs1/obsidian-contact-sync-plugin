import { KeyNamingStrategy } from '../interfaces';

export class DefaultNamingStrategy implements KeyNamingStrategy {
  generateKey(
    baseKey: string,
    index: number,
    prefix: string,

    _suffix?: string
  ): string {
    const keySuffix = index === 0 ? '' : `_${index + 1}`;
    return `${prefix}${baseKey}${keySuffix}`;
  }
}
