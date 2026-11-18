import { FieldAdapter, ExtractionResult } from 'src/core/interfaces';
import { GoogleContact } from 'src/types/Contact';

export class BioAdapter implements FieldAdapter {
  extract(
    contact: GoogleContact,
    context?: Record<string, unknown>
  ): ExtractionResult[] {
    // When notes are synced to the note body, they are not duplicated in frontmatter
    if (context?.notesInBody) {
      return [];
    }
    return (contact.biographies ?? [])
      .filter((item) => item.value)
      .map((item) => ({ value: item.value }));
  }
}
