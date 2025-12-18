import { GoogleContact } from 'src/types/Contact';
import { FieldAdapter, KeyNamingStrategy } from './interfaces';
import { DefaultNamingStrategy } from './strategies/DefaultNamingStrategy';
import { NameAdapter } from './adapters/NameAdapter';
import { EmailAdapter } from './adapters/EmailAdapter';
import { PhoneAdapter } from './adapters/PhoneAdapter';
import { BioAdapter } from './adapters/BioAdapter';
import { AddressAdapter } from './adapters/AddressAdapter';
import { OrganizationAdapter } from './adapters/OrganizationAdapter';
import { JobTitleAdapter } from './adapters/JobTitleAdapter';
import { DepartmentAdapter } from './adapters/DepartmentAdapter';
import { BirthdayAdapter } from './adapters/BirthdayAdapter';
import { LabelAdapter } from './adapters/LabelAdapter';

/**
 * Formatter class responsible for coordinating field extraction and key generation.
 */
export class Formatter {
  constructor(
    private adapters: Record<string, FieldAdapter>,
    private strategy: KeyNamingStrategy
  ) {}

  /**
   * Generates a frontmatter object from a Google Contact.
   *
   * @param contact The contact to process.
   * @param propertyPrefix The prefix for all keys.
   * @param context Optional context identifying how to format specific fields (e.g. labelMap, organizationAsLink).
   */
  generateFrontmatter(
    contact: GoogleContact,
    propertyPrefix: string,
    context?: Record<string, unknown>
  ): Record<string, string | string[]> {
    const frontmatter: Record<string, string | string[]> = {};

    for (const [fieldId, adapter] of Object.entries(this.adapters)) {
      const results = adapter.extract(contact, context);

      results.forEach((result, index) => {
        const key = this.strategy.generateKey(fieldId, index, propertyPrefix);

        if (Object.prototype.hasOwnProperty.call(frontmatter, key)) {
          const existing = frontmatter[key];
          if (Array.isArray(existing)) {
            // Flatten if new value is array? Or just push?
            // Usually ExtractionResult.value is string or string array.
            // If we have an array of values, we probably want to append.
            if (Array.isArray(result.value)) {
              frontmatter[key] = [...existing, ...result.value];
            } else {
              frontmatter[key] = [...existing, result.value];
            }
          } else {
            // Convert single existing value to array
            if (Array.isArray(result.value)) {
              frontmatter[key] = [existing as string, ...result.value];
            } else {
              frontmatter[key] = [existing as string, result.value];
            }
          }
        } else {
          frontmatter[key] = result.value;
        }
      });
    }

    return frontmatter;
  }
}

/**
 * Factory to create a formatter with default Obsidian-style adapters.
 */
import { VcfNamingStrategy } from './strategies/VcfNamingStrategy';
import { UidAdapter } from './adapters/UidAdapter';
import { GoogleIdAdapter } from './adapters/GoogleIdAdapter';
import { NamingStrategy } from 'src/types/Settings';

/**
 * Factory to create a formatter with default Obsidian-style adapters.
 */
export function createDefaultFormatter(
  strategyType: NamingStrategy = NamingStrategy.Default
): Formatter {
  let strategy: KeyNamingStrategy;

  if (strategyType === NamingStrategy.VCF) {
    strategy = new VcfNamingStrategy();
  } else {
    strategy = new DefaultNamingStrategy();
  }

  const adapters: Record<string, FieldAdapter> = {
    name: new NameAdapter(),
    email: new EmailAdapter(),
    phone: new PhoneAdapter(),
    address: new AddressAdapter(),
    biographies: new BioAdapter(),
    organization: new OrganizationAdapter(),
    jobtitle: new JobTitleAdapter(),
    department: new DepartmentAdapter(),
    birthday: new BirthdayAdapter(),
    labels: new LabelAdapter(),
  };

  if (strategyType === NamingStrategy.VCF) {
    adapters.uid = new UidAdapter();
    adapters.googleId = new GoogleIdAdapter();
  }

  return new Formatter(adapters, strategy);
}
