import { GoogleContact } from '../types/Contact';

export interface ExtractionResult {
  value: string | string[];
}

export interface FieldAdapter {
  extract(
    contact: GoogleContact,
    context?: Record<string, unknown>
  ): ExtractionResult[];
}

export interface KeyNamingStrategy {
  generateKey(baseKey: string, index: number, prefix: string): string;
}
