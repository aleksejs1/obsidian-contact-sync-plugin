import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export class BioAdapter implements FieldAdapter {
  extract(contact: GoogleContact): ExtractionResult[] {
    return (contact.biographies ?? [])
      .filter((item) => item.value)
      .map((item) => ({ value: item.value }));
  }
}
