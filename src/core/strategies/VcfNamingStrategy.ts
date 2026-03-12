import { KeyNamingStrategy } from '../interfaces';

export class VcfNamingStrategy implements KeyNamingStrategy {
  private keyMap: Record<string, string> = {
    email: 'EMAIL',
    phone: 'TEL',
    address: 'ADR',
    organization: 'ORG',
    relations: 'X-RELATION',
    jobtitle: 'TITLE',
    bio: 'NOTE',
    birthday: 'BDAY',
    website: 'URL',
    googleId: 'X-GOOGLE-ID',
    formattedName: 'FN', // VCard FN property for formatted/display name
    name: 'N', // VCard N property for structured name
    department: 'ROLE', // VCard ROLE property seems appropriate for department/role
    labels: 'CATEGORIES',
    biographies: 'NOTE', // Map biographies to NOTE as well
  };

  generateKey(
    baseKey: string,
    index: number,
    _prefix: string,
    suffix?: string,
    type?: string
  ): string {
    const vcfKey = this.keyMap[baseKey] ?? baseKey.toUpperCase();

    let indexSuffix = '';
    if (type) {
      const typeStr = type.toUpperCase().replace(/[^A-Z]/g, '');
      indexSuffix = index === 0 ? `[${typeStr}]` : `[${typeStr}_${index + 1}]`;
    } else {
      // VCF format doesn't support prefixes, but needs indexed notation
      // for multiple values: EMAIL[2], EMAIL[3], etc.
      // This format is compatible with obsidian-vcf-contacts plugin
      indexSuffix = index === 0 ? '' : `[${index + 1}]`;
    }

    const fieldSuffix = suffix ? `.${suffix}` : '';
    return `${vcfKey}${indexSuffix}${fieldSuffix}`;
  }
}
