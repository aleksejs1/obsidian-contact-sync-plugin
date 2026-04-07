import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export class UrlAdapter implements FieldAdapter {
  extract(
    contact: GoogleContact,
    context?: Record<string, unknown>
  ): ExtractionResult[] {
    if (context?.website === false) {
      return [];
    }

    const validUrls = (contact.urls ?? []).filter((item) => item.value);
    if (validUrls.length === 0) {
      return [];
    }

    return [{ value: validUrls.map((item) => item.value) }];
  }
}
