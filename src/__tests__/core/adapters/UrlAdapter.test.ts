import { UrlAdapter } from '../../../core/adapters/UrlAdapter';
import { GoogleContact } from '../../../types/Contact';

describe('UrlAdapter', () => {
  const adapter = new UrlAdapter();

  describe('extract', () => {
    it('should extract URLs as array', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        urls: [
          { value: 'https://twitter.com/user' },
          { value: 'https://github.com/user' },
        ],
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([
        { value: ['https://twitter.com/user', 'https://github.com/user'] },
      ]);
    });

    it('should return empty array if no URLs', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([]);
    });

    it('should return empty array if URLs is empty array', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        urls: [],
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([]);
    });

    it('should filter out URLs with empty values', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        urls: [
          { value: 'https://valid.com' },
          { value: '' },
          { value: 'https://another.com' },
        ],
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([
        { value: ['https://valid.com', 'https://another.com'] },
      ]);
    });

    it('should return empty array if all URLs have empty values', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        urls: [{ value: '' }, { value: '' }],
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([]);
    });

    it('should include type if present but type is ignored in Option A', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        urls: [
          { value: 'https://twitter.com/user', type: 'twitter' },
          { value: 'https://github.com/user', type: 'github' },
        ],
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([
        { value: ['https://twitter.com/user', 'https://github.com/user'] },
      ]);
    });
  });

  describe('with website context', () => {
    it('should return empty array when website context is false', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        urls: [{ value: 'https://example.com' }],
      };
      const context = { website: false };
      const result = adapter.extract(contact, context);
      expect(result).toEqual([]);
    });

    it('should extract URLs when website context is true', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        urls: [{ value: 'https://example.com' }],
      };
      const context = { website: true };
      const result = adapter.extract(contact, context);
      expect(result).toEqual([{ value: ['https://example.com'] }]);
    });

    it('should extract URLs when website context is undefined (default)', () => {
      const contact: GoogleContact = {
        resourceName: 'people/123',
        urls: [{ value: 'https://example.com' }],
      };
      const result = adapter.extract(contact);
      expect(result).toEqual([{ value: ['https://example.com'] }]);
    });
  });
});
