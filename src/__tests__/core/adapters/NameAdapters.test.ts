import { FormattedNameAdapter } from '../../../core/adapters/FormattedNameAdapter';
import { NameAdapter } from '../../../core/adapters/NameAdapter';
import { GoogleContact } from '../../../types/Contact';

describe('Name Adapters', () => {
  describe('FormattedNameAdapter', () => {
    const adapter = new FormattedNameAdapter();

    describe('VCF Strategy', () => {
      const vcfContext = { namingStrategy: 'VCF' };

      it('extracts displayName for VCF strategy', () => {
        const contact: GoogleContact = {
          resourceName: 'people/123',
          names: [{ displayName: 'John Smith' }],
        };
        const results = adapter.extract(contact, vcfContext);
        expect(results).toHaveLength(1);
        expect(results[0]!.value).toBe('John Smith');
      });

      it('falls back to organization name when displayName is missing', () => {
        const contact: GoogleContact = {
          resourceName: 'people/123',
          organizations: [{ name: 'Acme Corp', title: '', department: '' }],
        };
        const results = adapter.extract(contact, vcfContext);
        expect(results).toHaveLength(1);
        expect(results[0]!.value).toBe('Acme Corp');
      });

      it('returns empty array when no displayName or organization', () => {
        const contact: GoogleContact = {
          resourceName: 'people/123',
        };
        const results = adapter.extract(contact, vcfContext);
        expect(results).toEqual([]);
      });
    });

    describe('Default Strategy', () => {
      const defaultContext = { namingStrategy: 'DefaultNamingStrategy' };

      it('returns empty array for default strategy', () => {
        const contact: GoogleContact = {
          resourceName: 'people/123',
          names: [{ displayName: 'John Smith' }],
        };
        const results = adapter.extract(contact, defaultContext);
        expect(results).toEqual([]);
      });

      it('returns empty array when no context provided', () => {
        const contact: GoogleContact = {
          resourceName: 'people/123',
          names: [{ displayName: 'John Smith' }],
        };
        const results = adapter.extract(contact);
        expect(results).toEqual([]);
      });
    });
  });

  describe('NameAdapter', () => {
    const adapter = new NameAdapter();

    describe('Default Strategy', () => {
      const defaultContext = { namingStrategy: 'DefaultNamingStrategy' };

      it('extracts displayName for default strategy', () => {
        const contact: GoogleContact = {
          resourceName: 'people/123',
          names: [{ displayName: 'John Smith' }],
        };
        const results = adapter.extract(contact, defaultContext);
        expect(results).toHaveLength(1);
        expect(results[0]!.value).toBe('John Smith');
      });

      it('extracts multiple displayNames', () => {
        const contact: GoogleContact = {
          resourceName: 'people/123',
          names: [{ displayName: 'John Smith' }, { displayName: 'Jane Doe' }],
        };
        const results = adapter.extract(contact, defaultContext);
        expect(results).toHaveLength(2);
        expect(results[0]!.value).toBe('John Smith');
        expect(results[1]!.value).toBe('Jane Doe');
      });

      it('falls back to organization name when displayName is missing', () => {
        const contact: GoogleContact = {
          resourceName: 'people/123',
          organizations: [{ name: 'Acme Corp', title: '', department: '' }],
        };
        const results = adapter.extract(contact, defaultContext);
        expect(results).toHaveLength(1);
        expect(results[0]!.value).toBe('Acme Corp');
      });

      it('returns empty array when no displayName or organization', () => {
        const contact: GoogleContact = {
          resourceName: 'people/123',
        };
        const results = adapter.extract(contact, defaultContext);
        expect(results).toEqual([]);
      });
    });

    describe('VCF Strategy', () => {
      const vcfContext = { namingStrategy: 'VCF' };

      it('extracts all structured name fields', () => {
        const contact: GoogleContact = {
          resourceName: 'people/123',
          names: [
            {
              displayName: 'Dr. John Michael Smith Jr.',
              givenName: 'John',
              middleName: 'Michael',
              familyName: 'Smith',
              honorificPrefix: 'Dr.',
              honorificSuffix: 'Jr.',
            },
          ],
        };
        const results = adapter.extract(contact, vcfContext);

        expect(results).toHaveLength(5);
        expect(results.find((r) => r.suffix === 'GN')?.value).toBe('John');
        expect(results.find((r) => r.suffix === 'MN')?.value).toBe('Michael');
        expect(results.find((r) => r.suffix === 'FN')?.value).toBe('Smith');
        expect(results.find((r) => r.suffix === 'PREFIX')?.value).toBe('Dr.');
        expect(results.find((r) => r.suffix === 'SUFFIX')?.value).toBe('Jr.');
      });

      it('all subfields have the same index', () => {
        const contact: GoogleContact = {
          resourceName: 'people/123',
          names: [
            {
              givenName: 'John',
              middleName: 'Michael',
              familyName: 'Smith',
            },
          ],
        };
        const results = adapter.extract(contact, vcfContext);

        expect(results).toHaveLength(3);
        expect(results.every((r) => r.index === 0)).toBe(true);
      });

      it('extracts phonetic name fields', () => {
        const contact: GoogleContact = {
          resourceName: 'people/123',
          names: [
            {
              phoneticFullName: 'Jon Sumisu',
              phoneticGivenName: 'Jon',
              phoneticMiddleName: 'Maikeru',
              phoneticFamilyName: 'Sumisu',
              phoneticHonorificPrefix: 'Dokutaa',
              phoneticHonorificSuffix: 'Junia',
            },
          ],
        };
        const results = adapter.extract(contact, vcfContext);

        expect(results).toHaveLength(6);
        expect(results.find((r) => r.suffix === 'PHONETIC_FULL')?.value).toBe(
          'Jon Sumisu'
        );
        expect(results.find((r) => r.suffix === 'PHONETIC_GN')?.value).toBe(
          'Jon'
        );
        expect(results.find((r) => r.suffix === 'PHONETIC_MN')?.value).toBe(
          'Maikeru'
        );
        expect(results.find((r) => r.suffix === 'PHONETIC_FN')?.value).toBe(
          'Sumisu'
        );
        expect(results.find((r) => r.suffix === 'PHONETIC_PREFIX')?.value).toBe(
          'Dokutaa'
        );
        expect(results.find((r) => r.suffix === 'PHONETIC_SUFFIX')?.value).toBe(
          'Junia'
        );
      });

      it('handles multiple names with different indices', () => {
        const contact: GoogleContact = {
          resourceName: 'people/123',
          names: [
            {
              givenName: 'John',
              familyName: 'Smith',
            },
            {
              givenName: 'Jane',
              familyName: 'Doe',
            },
          ],
        };
        const results = adapter.extract(contact, vcfContext);

        expect(results).toHaveLength(4);

        const firstNameResults = results.filter((r) => r.index === 0);
        expect(firstNameResults).toHaveLength(2);
        expect(firstNameResults.find((r) => r.suffix === 'GN')?.value).toBe(
          'John'
        );
        expect(firstNameResults.find((r) => r.suffix === 'FN')?.value).toBe(
          'Smith'
        );

        const secondNameResults = results.filter((r) => r.index === 1);
        expect(secondNameResults).toHaveLength(2);
        expect(secondNameResults.find((r) => r.suffix === 'GN')?.value).toBe(
          'Jane'
        );
        expect(secondNameResults.find((r) => r.suffix === 'FN')?.value).toBe(
          'Doe'
        );
      });

      it('handles partial name data', () => {
        const contact: GoogleContact = {
          resourceName: 'people/123',
          names: [
            {
              givenName: 'John',
              // Only given name, no family name or other fields
            },
          ],
        };
        const results = adapter.extract(contact, vcfContext);

        expect(results).toHaveLength(1);
        expect(results[0]!.suffix).toBe('GN');
        expect(results[0]!.value).toBe('John');
      });

      it('falls back to organization name when no names', () => {
        const contact: GoogleContact = {
          resourceName: 'people/123',
          organizations: [{ name: 'Acme Corp', title: '', department: '' }],
        };
        const results = adapter.extract(contact, vcfContext);

        expect(results).toHaveLength(1);
        expect(results[0]!.value).toBe('Acme Corp');
      });

      it('returns empty array when no names or organizations', () => {
        const contact: GoogleContact = {
          resourceName: 'people/123',
        };
        const results = adapter.extract(contact, vcfContext);

        expect(results).toEqual([]);
      });
    });
  });
});
