import { GoogleContact } from '../types/Contact';

export interface ExtractionResult {
  value: string | string[];
  suffix?: string; // Optional suffix for subfield naming (e.g., "STREET", "CITY")
  index?: number; // Optional index override for grouping (e.g., all subfields of address 0)
  type?: string; // Optional type for semantic naming (e.g., "work", "home")
}

export interface FieldAdapter {
  extract(
    contact: GoogleContact,
    context?: Record<string, unknown>
  ): ExtractionResult[];
}

export interface KeyNamingStrategy {
  generateKey(
    baseKey: string,
    index: number,
    prefix: string,
    suffix?: string,
    type?: string
  ): string;
}
