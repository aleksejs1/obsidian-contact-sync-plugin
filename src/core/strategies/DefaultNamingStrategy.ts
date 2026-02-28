import { KeyNamingStrategy } from '../interfaces';

export class DefaultNamingStrategy implements KeyNamingStrategy {
  generateKey(
    baseKey: string,
    index: number,
    prefix: string,
    _suffix?: string,
    type?: string
  ): string {
    const typeLabel = type ? `_${type}` : '';
    const indexStr = index === 0 ? '' : `_${index + 1}`;
    return `${prefix}${baseKey}${typeLabel}${indexStr}`;
  }
}
