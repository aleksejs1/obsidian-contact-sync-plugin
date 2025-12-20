import { GoogleIdAdapter } from '../../../core/adapters/GoogleIdAdapter';
import { GoogleContact } from '../../../types/Contact';

describe('IdAdapters', () => {
  describe('GoogleIdAdapter', () => {
    const adapter = new GoogleIdAdapter();

    it('extracts ID from resourceName', () => {
      const contact: GoogleContact = { resourceName: 'people/c12345' };
      const results = adapter.extract(contact);
      expect(results).toHaveLength(1);
      expect(results[0]!.value).toBe('c12345');
    });

    it('returns empty array if resourceName is missing', () => {
      const contact: GoogleContact = { resourceName: '' };
      const results = adapter.extract(contact);
      expect(results).toEqual([]);
    });
  });
});
