import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export class NameAdapter implements FieldAdapter {
  extract(contact: GoogleContact): ExtractionResult[] {
    const results: ExtractionResult[] = [];

    // Try to get name from contact.names first
    const displayName = contact.names?.[0]?.displayName;

    if (displayName) {
      contact.names?.forEach((item) => {
        if (item.displayName) {
          results.push({ value: item.displayName });
        }
      });
    } else if (contact.organizations?.[0]?.name) {
      // Fall back to organization name if no displayName
      results.push({ value: contact.organizations[0].name });
    }

    return results;
  }
}
