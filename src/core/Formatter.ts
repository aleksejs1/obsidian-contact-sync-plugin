import { GoogleContact } from 'src/types/Contact';
import { FieldAdapter, KeyNamingStrategy } from './interfaces';
import { DefaultNamingStrategy } from './strategies/DefaultNamingStrategy';
import { NameAdapter } from './adapters/NameAdapter';
import { FormattedNameAdapter } from './adapters/FormattedNameAdapter';
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
class Formatter {
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

    // Add strategy name to context so adapters can conditionally extract fields
    const strategyContext = {
      ...context,
      namingStrategy: this.strategy.constructor.name,
    };

    for (const [fieldId, adapter] of Object.entries(this.adapters)) {
      const results = adapter.extract(contact, strategyContext);

      results.forEach((result, arrayIndex) => {
        // Use result.index if present (for grouping subfields),
        // otherwise use array index
        const index = result.index ?? arrayIndex;
        const key = this.strategy.generateKey(
          fieldId,
          index,
          propertyPrefix,
          result.suffix
        );
        frontmatter[key] = result.value;
      });
    }

    return frontmatter;
  }
}

/**
 * Factory to create a formatter with default Obsidian-style adapters.
 */
import { VcfNamingStrategy } from './strategies/VcfNamingStrategy';
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
    birthday: new BirthdayAdapter(),
    bio: new BioAdapter(),
    organization: new OrganizationAdapter(),
    jobtitle: new JobTitleAdapter(),
    department: new DepartmentAdapter(),
    labels: new LabelAdapter(),
  };

  if (strategyType === NamingStrategy.VCF) {
    adapters.googleId = new GoogleIdAdapter();
    adapters.formattedName = new FormattedNameAdapter();
  } else {
    // For Default strategy, use 'id' as the key
    adapters.id = new GoogleIdAdapter();
  }

  return new Formatter(adapters, strategy);
}
