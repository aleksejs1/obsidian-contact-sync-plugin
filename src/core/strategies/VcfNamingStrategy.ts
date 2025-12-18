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
  };

  generateKey(baseKey: string, index: number, prefix: string): string {
    const vcfKey = this.keyMap[baseKey] || baseKey.toUpperCase();

    // VCard usually doesn't index keys like keys_1, keys_2, but rather repeats the property.
    // However, Obsidian frontmatter requires unique keys or array values.
    // Our adapters return arrays of values, and the Formatter normally iterates them
    // and calls generateKey for each.
    // If we want VCF-like frontmatter, we might want:
    // EMAIL: val1
    // EMAIL_2: val2
    // or keep it simple.

    // The current DefaultNamingStrategy adds _2, _3 etc.
    // VCF strategy should probably do the same to be valid YAML/Frontmatter.

    const suffix = index === 0 ? '' : `_${index + 1}`;

    // VCF properties don't usually have prefixes in the property name itself,
    // but the user might configure a prefix for the plugin.
    // We will respect the prefix setting.
    return `${prefix}${vcfKey}${suffix}`;
  }
}
