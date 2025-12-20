import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export class NameAdapter implements FieldAdapter {
  extract(
    contact: GoogleContact,
    context?: Record<string, unknown>
  ): ExtractionResult[] {
    const results: ExtractionResult[] = [];
    const isVcfStrategy = context?.namingStrategy === 'VcfNamingStrategy';

    // For Default strategy: only extract displayName
    if (!isVcfStrategy) {
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

    // For VCF strategy: extract all structured name fields
    const names = contact.names || [];

    if (names.length === 0) {
      // Fall back to organization name if no name data
      if (contact.organizations?.[0]?.name) {
        results.push({ value: contact.organizations[0].name });
      }
      return results;
    }

    // Process each name entry (usually just one, but could be multiple)
    names.forEach((name, nameIndex) => {
      // Main name fields - all subfields of this name get the same index
      // Note: displayName is handled by FormattedNameAdapter for FN field

      if (name.givenName) {
        results.push({ value: name.givenName, suffix: 'GN', index: nameIndex });
      }

      if (name.middleName) {
        results.push({
          value: name.middleName,
          suffix: 'MN',
          index: nameIndex,
        });
      }

      if (name.familyName) {
        results.push({
          value: name.familyName,
          suffix: 'FN',
          index: nameIndex,
        });
      }

      if (name.honorificPrefix) {
        results.push({
          value: name.honorificPrefix,
          suffix: 'PREFIX',
          index: nameIndex,
        });
      }

      if (name.honorificSuffix) {
        results.push({
          value: name.honorificSuffix,
          suffix: 'SUFFIX',
          index: nameIndex,
        });
      }

      // Phonetic name fields
      if (name.phoneticFullName) {
        results.push({
          value: name.phoneticFullName,
          suffix: 'PHONETIC_FULL',
          index: nameIndex,
        });
      }

      if (name.phoneticGivenName) {
        results.push({
          value: name.phoneticGivenName,
          suffix: 'PHONETIC_GN',
          index: nameIndex,
        });
      }

      if (name.phoneticMiddleName) {
        results.push({
          value: name.phoneticMiddleName,
          suffix: 'PHONETIC_MN',
          index: nameIndex,
        });
      }

      if (name.phoneticFamilyName) {
        results.push({
          value: name.phoneticFamilyName,
          suffix: 'PHONETIC_FN',
          index: nameIndex,
        });
      }

      if (name.phoneticHonorificPrefix) {
        results.push({
          value: name.phoneticHonorificPrefix,
          suffix: 'PHONETIC_PREFIX',
          index: nameIndex,
        });
      }

      if (name.phoneticHonorificSuffix) {
        results.push({
          value: name.phoneticHonorificSuffix,
          suffix: 'PHONETIC_SUFFIX',
          index: nameIndex,
        });
      }
    });

    return results;
  }
}
