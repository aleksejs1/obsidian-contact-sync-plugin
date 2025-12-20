import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export class NameAdapter implements FieldAdapter {
  extract(
    contact: GoogleContact,
    context?: Record<string, unknown>
  ): ExtractionResult[] {
    const isVcfStrategy = context?.namingStrategy === 'VcfNamingStrategy';

    if (isVcfStrategy) {
      return this.extractVcf(contact);
    }

    return this.extractDefault(contact);
  }

  private extractDefault(contact: GoogleContact): ExtractionResult[] {
    const results: ExtractionResult[] = [];
    const names = contact.names ?? [];

    if (names.length > 0) {
      names.forEach((item) => {
        if (item.displayName) {
          results.push({ value: item.displayName });
        }
      });
    } else if (contact.organizations?.[0]?.name) {
      results.push({ value: contact.organizations[0].name });
    }

    return results;
  }

  private extractVcf(contact: GoogleContact): ExtractionResult[] {
    const results: ExtractionResult[] = [];
    const names = contact.names ?? [];

    if (names.length === 0) {
      if (contact.organizations?.[0]?.name) {
        results.push({ value: contact.organizations[0].name });
      }
      return results;
    }

    names.forEach((name, nameIndex) => {
      this.addNameFields(results, name, nameIndex);
      this.addPhoneticFields(results, name, nameIndex);
    });

    return results;
  }

  private addNameFields(
    results: ExtractionResult[],
    name: NonNullable<GoogleContact['names']>[number],
    index: number
  ): void {
    const fields: Record<string, string> = {
      givenName: 'GN',
      middleName: 'MN',
      familyName: 'FN',
      honorificPrefix: 'PREFIX',
      honorificSuffix: 'SUFFIX',
    };

    for (const [prop, suffix] of Object.entries(fields)) {
      const value = (name as Record<string, unknown>)[prop];
      if (typeof value === 'string') {
        results.push({ value, suffix, index });
      }
    }
  }

  private addPhoneticFields(
    results: ExtractionResult[],
    name: NonNullable<GoogleContact['names']>[number],
    index: number
  ): void {
    const fields: Record<string, string> = {
      phoneticFullName: 'PHONETIC_FULL',
      phoneticGivenName: 'PHONETIC_GN',
      phoneticMiddleName: 'PHONETIC_MN',
      phoneticFamilyName: 'PHONETIC_FN',
      phoneticHonorificPrefix: 'PHONETIC_PREFIX',
      phoneticHonorificSuffix: 'PHONETIC_SUFFIX',
    };

    for (const [prop, suffix] of Object.entries(fields)) {
      const value = (name as Record<string, unknown>)[prop];
      if (typeof value === 'string') {
        results.push({ value, suffix, index });
      }
    }
  }
}
