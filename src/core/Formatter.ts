import { GoogleContact } from 'src/types/Contact';

/**
 * Formatter class for transforming Google contact data into a format suitable for Obsidian frontmatter.
 */
export class Formatter {
  /**
   * Adds the name field from the contact to the frontmatter lines.
   * Falls back to organization name if no displayName is available.
   *
   * @param frontmatterLines - The object representing the frontmatter fields to update.
   * @param contact - The Google contact containing name information.
   * @param propertyPrefix - The prefix to prepend to the field name.
   */
  addNameField(
    frontmatterLines: Record<string, string>,
    contact: GoogleContact,
    propertyPrefix: string
  ) {
    // Try to get name from contact.names first
    const displayName = contact.names?.[0]?.displayName;

    if (displayName) {
      this.addContactFieldToFrontmatter(
        frontmatterLines,
        contact.names,
        'name',
        propertyPrefix,
        (item) => item.displayName
      );
    } else if (contact.organizations?.[0]?.name) {
      // Fall back to organization name if no displayName
      frontmatterLines[`${propertyPrefix}name`] = contact.organizations[0].name;
    }
  }

  /**
   * Adds the email field(s) from the contact to the frontmatter lines.
   *
   * @param frontmatterLines - The object representing the frontmatter fields to update.
   * @param contact - The Google contact containing email information.
   * @param propertyPrefix - The prefix to prepend to the field name.
   */
  addEmailField(
    frontmatterLines: Record<string, string>,
    contact: GoogleContact,
    propertyPrefix: string
  ) {
    this.addContactFieldToFrontmatter(
      frontmatterLines,
      contact.emailAddresses,
      'email',
      propertyPrefix,
      (item) => item.value
    );
  }

  /**
   * Adds the phone field(s) from the contact to the frontmatter lines.
   *
   * @param frontmatterLines - The object representing the frontmatter fields to update.
   * @param contact - The Google contact containing phone number information.
   * @param propertyPrefix - The prefix to prepend to the field name.
   */
  addPhoneField(
    frontmatterLines: Record<string, string>,
    contact: GoogleContact,
    propertyPrefix: string
  ) {
    this.addContactFieldToFrontmatter(
      frontmatterLines,
      contact.phoneNumbers,
      'phone',
      propertyPrefix,
      (item) => item.value
    );
  }

  /**
   * Adds the biography field(s) from the contact to the frontmatter lines.
   *
   * @param frontmatterLines - The object representing the frontmatter fields to update.
   * @param contact - The Google contact containing biography information.
   * @param propertyPrefix - The prefix to prepend to the field name.
   */
  addBioField(
    frontmatterLines: Record<string, string>,
    contact: GoogleContact,
    propertyPrefix: string
  ) {
    this.addContactFieldToFrontmatter(
      frontmatterLines,
      contact.biographies,
      'biographies',
      propertyPrefix,
      (item) => item.value
    );
  }

  /**
   * Adds address field(s) from the contact to the frontmatter lines.
   * Handles multiple addresses and appends a suffix to each additional field.
   *
   * @param frontmatterLines - The object representing the frontmatter fields to update.
   * @param contact - The Google contact containing address information.
   * @param propertyPrefix - The prefix to prepend to the field name.
   */
  addAddressFields(
    frontmatterLines: Record<string, string>,
    contact: GoogleContact,
    propertyPrefix: string
  ) {
    this.addContactFieldToFrontmatter(
      frontmatterLines,
      contact.addresses,
      'address',
      propertyPrefix,
      (item) => item.formattedValue
    );
  }

  /**
   * Adds organization field(s) from the contact to the frontmatter lines.
   * Handles multiple organizations and appends a suffix to each additional field.
   *
   * @param frontmatterLines - The object representing the frontmatter fields to update.
   * @param contact - The Google contact containing organization information.
   * @param propertyPrefix - The prefix to prepend to the field name.
   * @param organizationAsLink - Whether to format organization names as Obsidian links.
   * @returns void
   */
  addOrganizationFields(
    frontmatterLines: Record<string, string>,
    contact: GoogleContact,
    propertyPrefix: string,
    organizationAsLink: boolean = false
  ) {
    this.addContactFieldToFrontmatter(
      frontmatterLines,
      contact.organizations,
      'organization',
      propertyPrefix,
      (item) => item.name,
      (value: string) => {
        if (organizationAsLink) {
          return `[[${value}]]`;
        }
        return value;
      }
    );
  }

  /**
   * Adds job title field(s) from the contact to the frontmatter lines.
   * Handles multiple job titles and appends a suffix to each additional field.
   *
   * @param frontmatterLines - The object representing the frontmatter fields to update.
   * @param contact - The Google contact containing job title information.
   * @param propertyPrefix - The prefix to prepend to the field name.
   */
  addJobTitleFields(
    frontmatterLines: Record<string, string>,
    contact: GoogleContact,
    propertyPrefix: string
  ) {
    this.addContactFieldToFrontmatter(
      frontmatterLines,
      contact.organizations,
      'jobtitle',
      propertyPrefix,
      (item) => item.title
    );
  }

  /**
   * Adds department field(s) from the contact to the frontmatter lines.
   * Handles multiple departments and appends a suffix to each additional field.
   *
   * @param frontmatterLines - The object representing the frontmatter fields to update.
   * @param contact - The Google contact containing department information.
   * @param propertyPrefix - The prefix to prepend to the field name.
   */
  addDepartmentFields(
    frontmatterLines: Record<string, string>,
    contact: GoogleContact,
    propertyPrefix: string
  ) {
    this.addContactFieldToFrontmatter(
      frontmatterLines,
      contact.organizations,
      'department',
      propertyPrefix,
      (item) => item.department
    );
  }

  /**
   * Adds birthday field(s) from the contact to the frontmatter lines.
   * Handles multiple birthdays and appends a suffix to each additional field.
   *
   * @param frontmatterLines - The object representing the frontmatter fields to update.
   * @param contact - The Google contact containing birthday information.
   * @param propertyPrefix - The prefix to prepend to the field name.
   */
  addBirthdayFields(
    frontmatterLines: Record<string, string>,
    contact: GoogleContact,
    propertyPrefix: string
  ) {
    if (contact.birthdays && contact.birthdays.length > 0) {
      contact.birthdays.forEach((bday, index) => {
        const date = bday.date;
        const ending = index === 0 ? '' : `_${index + 1}`;
        if (date) {
          const birthdayStr = `${date.year ?? 'XXXX'}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
          frontmatterLines[`${propertyPrefix}birthday${ending}`] = birthdayStr;
        }
      });
    }
  }

  /**
   * Adds labels from the contact to the frontmatter lines.
   * Handles multiple labels and appends a suffix to each additional field.
   *
   * @param frontmatterLines - The object representing the frontmatter fields to update.
   * @param contact - The Google contact containing label information.
   * @param propertyPrefix - The prefix to prepend to the field name.
   * @param labelMap - A mapping of label IDs to their corresponding names.
   */
  addLabels(
    frontmatterLines: Record<string, string | string[]>,
    contact: GoogleContact,
    propertyPrefix: string,
    labelMap: Record<string, string>
  ) {
    if (contact.memberships && contact.memberships.length > 0) {
      const labels: string[] = [];
      contact.memberships.forEach((m) => {
        const groupId = m.contactGroupMembership?.contactGroupId;
        if (groupId) {
          labels.push(labelMap[groupId]);
        }
      });
      if (labels.length > 0) {
        frontmatterLines[`${propertyPrefix}labels`] = labels;
      }
    }
  }

  /**
   * Adds extracted contact field values to frontmatter with proper formatting.
   * @param frontmatter Frontmatter object to modify.
   * @param contact Contact array from which to extract values.
   * @param keyName Field key (e.g., "email", "phone").
   * @param propertyPrefix Prefix to apply to each field name in frontmatter.
   * @param valueExtractor Function to extract a string value from each item.
   */
  protected addContactFieldToFrontmatter<T extends { [key: string]: unknown }>(
    frontmatter: Record<string, string>,
    contact: T[] | undefined,
    keyName: string,
    propertyPrefix: string,
    valueExtractor: (item: T) => string | undefined,
    valueTransformet: (value: string) => string = (value) => value
  ) {
    if (!contact || contact.length === 0) return;

    contact.forEach((item, index) => {
      const rawValue = valueExtractor(item);
      const value = String(rawValue || '');
      if (value === '') return;
      const suffix = index === 0 ? '' : `_${index + 1}`;
      frontmatter[`${propertyPrefix}${keyName}${suffix}`] =
        valueTransformet(value);
    });
  }
}
