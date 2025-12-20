import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

/**
 * Adapter for extracting formatted name (FN in vCard).
 * This is the full display name of the contact.
 */
export class FormattedNameAdapter implements FieldAdapter {
  extract(
    contact: GoogleContact,
    context?: Record<string, unknown>
  ): ExtractionResult[] {
    const results: ExtractionResult[] = [];
    const isVcfStrategy = context?.namingStrategy === 'VcfNamingStrategy';

    // Only extract for VCF strategy
    if (!isVcfStrategy) {
      return results;
    }

    const displayName = contact.names?.[0]?.displayName;

    if (displayName) {
      results.push({ value: displayName });
    } else if (contact.organizations?.[0]?.name) {
      // Fall back to organization name if no displayName
      results.push({ value: contact.organizations[0].name });
    }

    return results;
  }
}
