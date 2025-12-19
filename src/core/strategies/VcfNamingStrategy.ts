import { KeyNamingStrategy } from '../interfaces';

export class VcfNamingStrategy implements KeyNamingStrategy {
  private keyMap: Record<string, string> = {
    email: 'EMAIL',
    phone: 'TEL',
    address: 'ADR',
    organization: 'ORG',
    jobtitle: 'TITLE',
    bio: 'NOTE',
    birthday: 'BDAY',
    website: 'URL',
    uid: 'UID',
    googleId: 'X-GOOGLE-ID',
    // Default fallback (though we should map all known fields)
    name: 'FN',
    department: 'ROLE', // VCard ROLE property seems appropriate for department/role
    labels: 'CATEGORIES',
    biographies: 'NOTE', // Map biographies to NOTE as well
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateKey(baseKey: string, index: number, prefix: string): string {
    const vcfKey = this.keyMap[baseKey] || baseKey.toUpperCase();
    // VCF format doesn't support prefixes, but needs indexed notation
    // for multiple values: EMAIL[1], EMAIL[2], etc.
    // This format is compatible with obsidian-vcf-contacts plugin
    const indexSuffix = index === 0 ? '' : `[${index + 1}]`;
    return `${vcfKey}${indexSuffix}`;
  }
}
