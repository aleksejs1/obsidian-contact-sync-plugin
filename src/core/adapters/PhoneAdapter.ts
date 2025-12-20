import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export class PhoneAdapter implements FieldAdapter {
  extract(contact: GoogleContact): ExtractionResult[] {
    return (contact.phoneNumbers ?? [])
      .filter((item) => item.value)
      .map((item) => ({ value: item.value }));
  }
}
