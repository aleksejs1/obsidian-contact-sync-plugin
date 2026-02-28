import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';
import { NamingStrategy } from 'src/types/Settings';

export class PhoneAdapter implements FieldAdapter {
  extract(
    contact: GoogleContact,
    context?: Record<string, unknown>
  ): ExtractionResult[] {
    const validPhones = (contact.phoneNumbers ?? []).filter(
      (item) => item.value
    );
    if (validPhones.length === 0) {
      return [];
    }

    if (context?.namingStrategy === NamingStrategy.Array) {
      return this.extractForArrayStrategy(validPhones);
    }

    if (context?.useContactTypes === true) {
      return this.extractWithSemanticTypes(validPhones);
    }

    return validPhones.map((item) => ({ value: item.value }));
  }

  private extractForArrayStrategy(
    validPhones: { value: string; type?: string }[]
  ): ExtractionResult[] {
    const first = validPhones[0]?.value;
    const allValues = validPhones.map((item) => item.value);
    // TypeScript check: validPhones is checked for length > 0 before calling this method
    return [
      {
        value: allValues.length === 1 && first ? first : allValues,
      },
    ];
  }

  private extractWithSemanticTypes(
    validPhones: { value: string; type?: string }[]
  ): ExtractionResult[] {
    const typeCounts: Record<string, number> = {};
    const results: ExtractionResult[] = [];

    for (const item of validPhones) {
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
