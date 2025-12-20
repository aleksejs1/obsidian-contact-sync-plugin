import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export interface OrganizationAdapterContext {
  organizationAsLink: boolean;
}

export class OrganizationAdapter implements FieldAdapter {
  extract(
    contact: GoogleContact,
    context?: Record<string, unknown>
  ): ExtractionResult[] {
    const organizationAsLink = context?.organizationAsLink as boolean;
    const isVcfStrategy =
      context?.namingStrategy === 'VCF' || context?.namingStrategy === 'VCF';

    return (contact.organizations || [])
      .map((org) => org.name)
      .filter((name) => !!name)
      .map((name) => ({
        // For VCF strategy, don't use wiki links even if organizationAsLink is true
        value: organizationAsLink && !isVcfStrategy ? `[[${name}]]` : name,
      }));
  }
}
