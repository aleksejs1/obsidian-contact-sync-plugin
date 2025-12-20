import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export class EmailAdapter implements FieldAdapter {
  extract(contact: GoogleContact): ExtractionResult[] {
    return (contact.emailAddresses ?? [])
      .filter((item) => item.value)
      .map((item) => ({ value: item.value }));
  }
}
