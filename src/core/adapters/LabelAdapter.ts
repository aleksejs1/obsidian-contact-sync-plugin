import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export interface LabelAdapterContext {
  labelMap: Record<string, string>;
}

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
      // Formatter expects value to be string or string[].
      // However, extraction result is array of results.
      // The original code put all labels into a single field 'labels' which was an array of strings.
      // My interface says `value: string | string[]`.
      // So I can return one ExtractionResult where value is string[].
      return [{ value: labels }];
    }
    return [];
  }
}
