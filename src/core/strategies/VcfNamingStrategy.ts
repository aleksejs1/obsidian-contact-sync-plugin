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
    suffix?: string
  ): string {
    const vcfKey = this.keyMap[baseKey] ?? baseKey.toUpperCase();
    // VCF format doesn't support prefixes, but needs indexed notation
    // for multiple values: EMAIL[2], EMAIL[3], etc.
    // This format is compatible with obsidian-vcf-contacts plugin
    const indexSuffix = index === 0 ? '' : `[${index + 1}]`;
    const fieldSuffix = suffix ? `.${suffix}` : '';
    return `${vcfKey}${indexSuffix}${fieldSuffix}`;
  }
}
