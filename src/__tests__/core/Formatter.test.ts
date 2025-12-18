import { createDefaultFormatter } from '../../core/Formatter';
import { GoogleContact } from '../../types/Contact';

describe('Formatter', () => {
  const formatter = createDefaultFormatter();
  const prefix = 'gc_';

  const mockContact: GoogleContact = {
    resourceName: 'people/123',
    names: [{ displayName: 'Alice Smith' }],
    emailAddresses: [{ value: 'alice@example.com' }],
    phoneNumbers: [{ value: '+1234567890' }, { value: '' }],
    birthdays: [
      {
        date: {
          year: 1990,
          month: 5,
          day: 15,
        },
      },
    ],
    organizations: [
      {
        name: 'Tech Corp',
        title: 'Developer',
        department: 'Engineering',
      },
    ],
    addresses: [
      {
        formattedValue: '123 Main St',
        city: 'City',
        country: 'Country',
        countryCode: 'CC',
        extendedAddress: '',
        formattedType: '',
        postalCode: '12345',
        streetAddress: '123 Main St',
        type: 'home',
      },
    ],
  };

  const mockContactMultiple: GoogleContact = {
    resourceName: 'people/123',
    names: [{ displayName: 'Alice Smith' }],
    emailAddresses: [
      { value: 'primary@example.com' },
      { value: 'secondary@example.com' },
    ],
    birthdays: [
      {
        date: {
          year: 1990,
          month: 5,
          day: 15,
        },
      },
      {
        date: {
          month: 6,
          day: 16,
        },
      },
    ],
  };

  it('generates frontmatter correctly for single values', () => {
    const result = formatter.generateFrontmatter(mockContact, prefix);

    expect(result).toMatchObject({
      [`${prefix}name`]: 'Alice Smith',
      [`${prefix}email`]: 'alice@example.com',
      [`${prefix}phone`]: '+1234567890',
      [`${prefix}birthday`]: '1990-05-15',
      [`${prefix}organization`]: 'Tech Corp',
      [`${prefix}jobtitle`]: 'Developer',
      [`${prefix}department`]: 'Engineering',
      [`${prefix}address`]: '123 Main St',
    });
  });

  it('generates frontmatter correctly for multiple values with suffixes', () => {
    const result = formatter.generateFrontmatter(mockContactMultiple, prefix);

    expect(result).toMatchObject({
      [`${prefix}email`]: 'primary@example.com',
      [`${prefix}email_2`]: 'secondary@example.com',
      [`${prefix}birthday`]: '1990-05-15',
      [`${prefix}birthday_2`]: 'XXXX-06-16',
    });
  });

  it('handles empty contact fields gracefully', () => {
    const emptyContact: GoogleContact = { resourceName: 'people/empty' };
    const result = formatter.generateFrontmatter(emptyContact, prefix);
    expect(result).toEqual({});
  });

  it('handles organization as link', () => {
    const result = formatter.generateFrontmatter(mockContact, prefix, {
      organizationAsLink: true,
    });
    expect(result).toMatchObject({
      [`${prefix}organization`]: '[[Tech Corp]]',
    });
  });

  it('handles labels correctly', () => {
    const contactWithLabels: GoogleContact = {
      resourceName: 'people/lbl',
      memberships: [
        { contactGroupMembership: { contactGroupId: 'group1' } },
        { contactGroupMembership: { contactGroupId: 'group2' } },
      ],
    };
    const labelMap = { group1: 'Friends', group2: 'Family' };

    const result = formatter.generateFrontmatter(contactWithLabels, prefix, {
      labelMap,
    });

    expect(result).toMatchObject({
      [`${prefix}labels`]: ['Friends', 'Family'],
    });
  });

  it('falls back to organization name if display name is missing', () => {
    const contactNoName: GoogleContact = {
      resourceName: 'people/noname',
      organizations: [
        { name: 'Acme Corp', title: 'CEO', department: 'Management' },
      ],
    };

    const result = formatter.generateFrontmatter(contactNoName, prefix);

    expect(result).toMatchObject({
      [`${prefix}name`]: 'Acme Corp',
    });
  });
});
