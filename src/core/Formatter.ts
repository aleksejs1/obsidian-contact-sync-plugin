import { GoogleContact } from 'src/types/Contact';

/**
 * Formatter class for transforming Google contact data into a format suitable for Obsidian frontmatter.
 */
export class Formatter {
  /**
   * Adds the name field from the contact to the frontmatter lines.
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
    this.addContactFieldToFrontmatter(
      frontmatterLines,
      contact.names,
      'name',
      propertyPrefix,
      (item) => item.displayName
    );
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
   * Adds extracted contact field values to frontmatter with proper formatting.
   * @param frontmatter Frontmatter object to modify.
   * @param contact Contact array from which to extract values.
   * @param keyName Field key (e.g., "email", "phone").
   * @param propertyPrefix Prefix to apply to each field name in frontmatter.
   * @param valueExtractor Function to extract a string value from each item.
   */
  private addContactFieldToFrontmatter<T extends { [key: string]: unknown }>(
    frontmatter: Record<string, string>,
    contact: T[] | undefined,
    keyName: string,
    propertyPrefix: string,
    valueExtractor: (item: T) => string | undefined
  ) {
    if (!contact || contact.length === 0) return;

    contact.forEach((item, index) => {
      const rawValue = valueExtractor(item);
      const value = typeof rawValue === 'string' ? rawValue : '';
      const safeValue = value.replace(/[\\/:*?"<>|]/g, '_');
      const suffix = index === 0 ? '' : `_${index + 1}`;
      frontmatter[`${propertyPrefix}${keyName}${suffix}`] = safeValue;
    });
  }
}
