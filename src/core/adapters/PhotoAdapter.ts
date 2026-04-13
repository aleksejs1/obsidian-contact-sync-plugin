import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export class PhotoAdapter implements FieldAdapter {
  extract(
    contact: GoogleContact,
    context?: Record<string, unknown>
  ): ExtractionResult[] {
    if (!context?.photoProperty) {
      return [];
    }

    const primaryPhoto = (contact.photos ?? []).find((p) => p.url);
    if (!primaryPhoto?.url) {
      return [];
    }

    return [{ value: primaryPhoto.url }];
  }
}
