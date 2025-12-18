import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export class DepartmentAdapter implements FieldAdapter {
  extract(contact: GoogleContact): ExtractionResult[] {
    return (contact.organizations || [])
      .filter((item) => item.department)
      .map((item) => ({ value: item.department }));
  }
}
