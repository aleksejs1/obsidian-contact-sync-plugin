import { Formatter } from '../../core/Formatter';
import { GoogleContact } from '../../types/Contact';

class TestableFormatter extends Formatter {
  public testAddContactFieldToFrontmatter =
    this.addContactFieldToFrontmatter.bind(this);
}

describe('Formatter', () => {
  const formatter = new TestableFormatter();

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
  };

  const mockContactTwoDates: GoogleContact = {
    resourceName: 'people/123',
    names: [{ displayName: 'Alice Smith' }],
    emailAddresses: [{ value: 'alice@example.com' }],
    phoneNumbers: [{ value: '+1234567890' }],
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

  const frontmatter: Record<string, string> = {};
  const prefix = 'gc_';

  it('adds name field', () => {
    formatter['addNameField'](frontmatter, mockContact, prefix);
    expect(frontmatter).toHaveProperty('gc_name', 'Alice Smith');
  });

  it('adds email field', () => {
    formatter['addEmailField'](frontmatter, mockContact, prefix);
    expect(frontmatter).toHaveProperty('gc_email', 'alice@example.com');
  });

  it('adds phone field', () => {
    formatter['addPhoneField'](frontmatter, mockContact, prefix);
    expect(frontmatter).toHaveProperty('gc_phone', '+1234567890');
  });

  it('adds birthday field', () => {
    formatter['addBirthdayFields'](frontmatter, mockContact, prefix);
    expect(frontmatter).toHaveProperty('gc_birthday', '1990-05-15');
  });

  it('adds birthday field', () => {
    formatter['addBirthdayFields'](frontmatter, mockContactTwoDates, prefix);
    expect(frontmatter).toHaveProperty('gc_birthday', '1990-05-15');
    expect(frontmatter).toHaveProperty('gc_birthday_2', 'XXXX-06-16');
  });

  it('adds single field to frontmatter correctly', () => {
    const frontmatter: Record<string, string> = {};
    const mockContact = [{ value: 'alice@example.com' }];

    formatter.testAddContactFieldToFrontmatter(
      frontmatter,
      mockContact,
      'email',
      'gc_',
      (item) => item.value
    );

    expect(frontmatter).toEqual({
      gc_email: 'alice@example.com',
    });
  });

  it('adds multiple fields with suffixes when needed', () => {
    const frontmatter: Record<string, string> = {};
    const mockContact = [
      { value: 'primary@example.com' },
      { value: 'secondary@example.com' },
    ];

    formatter.testAddContactFieldToFrontmatter(
      frontmatter,
      mockContact,
      'email',
      'gc_',
      (item) => item.value
    );

    expect(frontmatter).toEqual({
      gc_email: 'primary@example.com',
      gc_email_2: 'secondary@example.com',
    });
  });

  it('does nothing if contact is undefined or empty', () => {
    const frontmatter1: Record<string, string> = {};
    const frontmatter2: Record<string, string> = {};

    formatter.testAddContactFieldToFrontmatter(
      frontmatter1,
      undefined,
      'email',
      'gc_',
      () => undefined
    );

    formatter.testAddContactFieldToFrontmatter(
      frontmatter2,
      [],
      'email',
      'gc_',
      () => undefined
    );

    expect(frontmatter1).toEqual({});
    expect(frontmatter2).toEqual({});
  });
});
