import { AddressAdapter } from '../../../core/adapters/AddressAdapter';
import { NameAdapter } from '../../../core/adapters/NameAdapter';
import { EmailAdapter } from '../../../core/adapters/EmailAdapter';
import { PhoneAdapter } from '../../../core/adapters/PhoneAdapter';
import { BirthdayAdapter } from '../../../core/adapters/BirthdayAdapter';
import { GoogleIdAdapter } from '../../../core/adapters/GoogleIdAdapter';
import { GoogleContact } from '../../../types/Contact';
import { NamingStrategy } from '../../../types/Settings';

describe('Adapters', () => {
  describe('EmailAdapter', () => {
    const adapter = new EmailAdapter();

    it('should extract email addresses', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        emailAddresses: [
          { value: 'test@example.com' },
          { value: 'other@example.com' },
        ],
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([
        { value: 'test@example.com' },
        { value: 'other@example.com' },
      ]);
    });

    it('should return empty array if no emails', () => {
      const contact: GoogleContact = { resourceName: 'people/123' };
      const result = adapter.extract(contact);
      expect(result).toEqual([]);
    });
  });

  describe('PhoneAdapter', () => {
    const adapter = new PhoneAdapter();

    it('should extract phone numbers', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        phoneNumbers: [{ value: '+123456789' }],
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([{ value: '+123456789' }]);
    });
  });

  describe('AddressAdapter', () => {
    const adapter = new AddressAdapter();

    it('should extract formatted address by default', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        addresses: [
          {
            formattedValue: '123 Main St',
            city: '',
            country: '',
            countryCode: '',
            extendedAddress: '',
            formattedType: '',
            postalCode: '',
            streetAddress: '',
            type: '',
          },
        ],
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([{ value: '123 Main St' }]);
    });

    it('should extract structured address fields for VCF strategy', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        addresses: [
          {
            streetAddress: '123 Main St',
            city: 'Anytown',
            country: 'USA',
            postalCode: '12345',
            formattedType: 'Home',
            formattedValue: '',
            countryCode: '',
            extendedAddress: '',
            type: '',
          },
        ],
      };
      const context = { namingStrategy: NamingStrategy.VCF };
      const result = adapter.extract(contact, context);

      expect(result).toEqual([
        { value: '123 Main St', suffix: 'STREET', index: 0 },
        { value: 'Anytown', suffix: 'CITY', index: 0 },
        { value: 'USA', suffix: 'COUNTRY', index: 0 },
        { value: '12345', suffix: 'POSTALCODE', index: 0 },
        { value: 'Home', suffix: 'TYPE', index: 0 },
      ]);
    });
  });

  describe('NameAdapter', () => {
    const adapter = new NameAdapter();

    it('should extract display name by default', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        names: [{ displayName: 'John Doe' }],
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([{ value: 'John Doe' }]);
    });

    it('should fallback to org name if no name', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        names: [],
        organizations: [{ name: 'Acme Corp', title: '', department: '' }],
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([{ value: 'Acme Corp' }]);
    });

    it('should extract structured names for VCF strategy', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        names: [
          {
            givenName: 'John',
            familyName: 'Doe',
          },
        ],
      };
      const context = { namingStrategy: NamingStrategy.VCF };
      const result = adapter.extract(contact, context);

      expect(result).toContainEqual(
        expect.objectContaining({ value: 'John', suffix: 'GN' })
      );
      expect(result).toContainEqual(
        expect.objectContaining({ value: 'Doe', suffix: 'FN' })
      );
    });
  });

  describe('BirthdayAdapter', () => {
    const adapter = new BirthdayAdapter();

    it('should extract birthday with year', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
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
      const result = adapter.extract(contact);
      expect(result).toEqual([{ value: '1990-05-15' }]);
    });

    it('should extract birthday without year', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        birthdays: [
          {
            date: {
              month: 12,
              day: 25,
            },
          },
        ],
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([{ value: 'XXXX-12-25' }]);
    });

    it('should return empty if no birthday', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        birthdays: [],
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([]);
    });
  });

  describe('GoogleIdAdapter', () => {
    const adapter = new GoogleIdAdapter();

    it('should extract ID from resourceName', () => {
      const contact: GoogleContact = {
        resourceName: 'people/1234567890',
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([{ value: '1234567890' }]);
    });

    it('should return empty if resourceName is empty', () => {
      const contact: GoogleContact = {
        resourceName: '',
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([]);
    });

    it('should handle resourceName without slash', () => {
      const contact: GoogleContact = {
        resourceName: '12345',
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([{ value: '12345' }]);
    });

    it('should return empty if resourceName ends with slash and no ID', () => {
      const contact: GoogleContact = {
        resourceName: 'people/',
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([]);
    });
  });
});
