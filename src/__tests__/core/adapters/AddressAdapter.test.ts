import { AddressAdapter } from '../../../core/adapters/AddressAdapter';
import { GoogleContact } from '../../../types/Contact';
import { NamingStrategy } from '../../../types/Settings';

describe('AddressAdapter', () => {
  const adapter = new AddressAdapter();

  const createAddress = (
    overrides: Partial<NonNullable<GoogleContact['addresses']>[number]>
  ): NonNullable<GoogleContact['addresses']>[number] => ({
    city: '',
    country: '',
    countryCode: '',
    extendedAddress: '',
    formattedType: '',
    formattedValue: '',
    postalCode: '',
    streetAddress: '',
    type: '',
    ...overrides,
  });

  const mockContact: GoogleContact = {
    resourceName: 'people/p1',
    addresses: [
      createAddress({
        streetAddress: '123 Main St',
        city: 'Springfield',
        country: 'USA',
        postalCode: '12345',
        extendedAddress: 'Apt 4B',
        formattedType: 'Home',
        formattedValue: '123 Main St\nSpringfield, USA 12345',
      }),
      createAddress({
        streetAddress: '456 Office Rd',
        city: 'Worktown',
        country: 'UK',
        postalCode: 'AB1 2CD',
        formattedType: 'Work',
        formattedValue: '456 Office Rd\nWorktown, UK AB1 2CD',
      }),
    ],
  };

  describe('Default Strategy', () => {
    it('extracts formattedValue for all addresses', () => {
      const results = adapter.extract(mockContact);
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        value: '123 Main St\nSpringfield, USA 12345',
      });
      expect(results[1]).toEqual({
        value: '456 Office Rd\nWorktown, UK AB1 2CD',
      });
    });

    it('returns empty array if no addresses', () => {
      expect(adapter.extract({ resourceName: 'p2' })).toEqual([]);
    });

    it('filters out addresses without formattedValue', () => {
      const contact: GoogleContact = {
        resourceName: 'p3',
        addresses: [createAddress({ streetAddress: 'No Formatted Value' })],
      };
      expect(adapter.extract(contact)).toEqual([]);
    });
  });

  describe('VCF Strategy', () => {
    const contextWithVcf = { namingStrategy: NamingStrategy.VCF };
    const contextWithVcfString = { namingStrategy: 'VCF' };

    it('extracts all subfields for a single address', () => {
      const singleAddrContact: GoogleContact = {
        resourceName: 'p1',
        addresses: [mockContact.addresses![0]],
      };
      const results = adapter.extract(singleAddrContact, contextWithVcf);

      expect(results).toEqual(
        expect.arrayContaining([
          { value: '123 Main St', suffix: 'STREET', index: 0 },
          { value: 'Springfield', suffix: 'CITY', index: 0 },
          { value: 'USA', suffix: 'COUNTRY', index: 0 },
          { value: '12345', suffix: 'POSTALCODE', index: 0 },
          { value: 'Apt 4B', suffix: 'EXTENDED', index: 0 },
          { value: 'Home', suffix: 'TYPE', index: 0 },
        ])
      );
      expect(results).toHaveLength(6);
    });

    it('assigns correct index for multiple addresses', () => {
      const results = adapter.extract(mockContact, contextWithVcfString);

      // Address index 0
      const addr0 = results.filter((r) => r.index === 0);
      expect(addr0.length).toBeGreaterThan(0);
      expect(addr0.every((r) => r.index === 0)).toBe(true);

      // Address index 1
      const addr1 = results.filter((r) => r.index === 1);
      expect(addr1.length).toBeGreaterThan(0);
      expect(addr1.every((r) => r.index === 1)).toBe(true);
      expect(addr1.find((r) => r.suffix === 'CITY')?.value).toBe('Worktown');
    });

    it('only extracts present subfields', () => {
      const partialContact: GoogleContact = {
        resourceName: 'p4',
        addresses: [
          createAddress({
            city: 'Minimal City',
            formattedType: 'Other',
          }),
        ],
      };
      const results = adapter.extract(partialContact, contextWithVcf);

      expect(results).toEqual([
        { value: 'Minimal City', suffix: 'CITY', index: 0 },
        { value: 'Other', suffix: 'TYPE', index: 0 },
      ]);
    });

    it('returns empty array if no addresses', () => {
      expect(adapter.extract({ resourceName: 'p5' }, contextWithVcf)).toEqual(
        []
      );
    });
  });
});
