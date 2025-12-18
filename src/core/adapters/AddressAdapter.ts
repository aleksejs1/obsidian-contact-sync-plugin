import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export class AddressAdapter implements FieldAdapter {
  extract(contact: GoogleContact): ExtractionResult[] {
    return (contact.addresses || [])
      .filter((item) => item.formattedValue)
      .map((item) => ({ value: item.formattedValue }));
  }
}
