import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';
import { NamingStrategy } from 'src/types/Settings';

export class EmailAdapter implements FieldAdapter {
  extract(
    contact: GoogleContact,
    context?: Record<string, unknown>
  ): ExtractionResult[] {
    const validEmails = (contact.emailAddresses ?? []).filter(
      (item) => item.value
    );
    if (validEmails.length === 0) {
      return [];
    }

    if (context?.namingStrategy === NamingStrategy.Array) {
      return this.extractForArrayStrategy(validEmails);
    }

    if (context?.useContactTypes === true) {
      return this.extractWithSemanticTypes(validEmails);
    }

    return validEmails.map((item) => ({ value: item.value }));
  }

  private extractForArrayStrategy(
    validEmails: { value: string; type?: string }[]
  ): ExtractionResult[] {
    const first = validEmails[0]?.value;
    const allValues = validEmails.map((item) => item.value);
    // TypeScript check: validEmails is checked for length > 0 before calling this method
    return [
      {
        value: allValues.length === 1 && first ? first : allValues,
      },
    ];
  }

  private extractWithSemanticTypes(
    validEmails: { value: string; type?: string }[]
  ): ExtractionResult[] {
    const typeCounts: Record<string, number> = {};
    const results: ExtractionResult[] = [];

    for (const item of validEmails) {
      const typeStr = item.type ?? 'other';
      // Normalize type name: remove spaces, lowercase
      const normalizedType = typeStr.toLowerCase().replace(/[^a-z0-9]/g, '');

      const currentCount = typeCounts[normalizedType] ?? 0;
      typeCounts[normalizedType] = currentCount + 1;

      results.push({
        value: item.value,
        type: normalizedType,
        index: currentCount,
      });
    }

    return results;
  }
}
