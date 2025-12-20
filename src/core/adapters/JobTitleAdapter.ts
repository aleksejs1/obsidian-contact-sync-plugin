import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export class JobTitleAdapter implements FieldAdapter {
  extract(contact: GoogleContact): ExtractionResult[] {
    return (contact.organizations ?? [])
      .filter((item) => item.title)
      .map((item) => ({ value: item.title }));
  }
}
