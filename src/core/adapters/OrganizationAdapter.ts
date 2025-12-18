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
    const asLink = Boolean(context?.organizationAsLink);

    return (contact.organizations || [])
      .filter((item) => item.name)
      .map((item) => {
        const value = asLink ? `[[${item.name}]]` : item.name;
        return { value };
      });
  }
}
