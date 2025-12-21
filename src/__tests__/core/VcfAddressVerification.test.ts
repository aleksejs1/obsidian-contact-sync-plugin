import { createDefaultFormatter } from '../../core/Formatter';
import { NamingStrategy } from '../../types/Settings';
import { GoogleContact } from '../../types/Contact';

describe('VCF Address Verification', () => {
  it('should split address fields when using VCF strategy', () => {
    const formatter = createDefaultFormatter(NamingStrategy.VCF);

    const contact: GoogleContact = {
      resourceName: 'people/test',
      addresses: [
        {
          streetAddress: 'Salaspils iela 18',
          city: 'Riga',
          country: 'Latvia',
          postalCode: 'LV-1000',
          formattedValue: 'Salaspils iela 18\nRiga\nLatvia',
          countryCode: '',
          extendedAddress: '',
          formattedType: '',
          type: '',
        },
      ],
    };

    const result = formatter.generateFrontmatter(contact, '');

    // With the fix, we expect specific keys for VCF
    // ADR.STREET, ADR.CITY, etc.
    // And NOT just ADR containing the formatted value

    // Note: The key generation logic in VcfKeyNamingStrategy produces keys like:
    // ADR.STREET (for first address) or ADR[2].STREET (for subsequent)

    expect(result['ADR.STREET']).toBe('Salaspils iela 18');
    expect(result['ADR.CITY']).toBe('Riga');
    expect(result['ADR.COUNTRY']).toBe('Latvia');
    expect(result['ADR.POSTALCODE']).not.toBeUndefined(); // AddressAdapter uses POSTALCODE suffix
  });
});
