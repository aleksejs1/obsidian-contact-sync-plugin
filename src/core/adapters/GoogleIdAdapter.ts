import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export class GoogleIdAdapter implements FieldAdapter {
  extract(contact: GoogleContact): ExtractionResult[] {
    if (!contact.resourceName) {
      return [];
    }

    // resourceName is like "people/c1234567890"
    // We want the ID part "c1234567890"
    const id = contact.resourceName.split('/').pop();

    if (id) {
      return [{ value: id }];
    }

    return [];
  }
}
