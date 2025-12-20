import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export class LabelAdapter implements FieldAdapter {
  extract(
    contact: GoogleContact,
    context?: Record<string, unknown>
  ): ExtractionResult[] {
    const labelMap = context?.labelMap as Record<string, string> | undefined;

    if (!contact.memberships || contact.memberships.length === 0 || !labelMap) {
      return [];
    }

    const labels: string[] = [];
    contact.memberships.forEach((m) => {
      const groupId = m.contactGroupMembership?.contactGroupId;
      if (groupId && labelMap[groupId]) {
        labels.push(labelMap[groupId]);
      }
    });

    if (labels.length > 0) {
      const isVcfStrategy = context?.namingStrategy === 'VcfNamingStrategy';
      if (isVcfStrategy) {
        // For VCF strategy, return as a comma-separated string
        return [{ value: labels.join(', ') }];
      }
      // For default strategy, return as an array of strings
      return [{ value: labels }];
    }
    return [];
  }
}
