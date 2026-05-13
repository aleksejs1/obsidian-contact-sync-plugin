import { PhotoAdapter } from '../../../core/adapters/PhotoAdapter';
import { GoogleContact } from '../../../types/Contact';

describe('PhotoAdapter', () => {
  const adapter = new PhotoAdapter();

  describe('extract', () => {
    it('should return empty array if contact has no photos', () => {
      const contact: GoogleContact = { resourceName: 'people/1' };
      expect(adapter.extract(contact)).toEqual([]);
    });

    it('should return empty array if photos array is empty', () => {
      const contact: GoogleContact = { resourceName: 'people/1', photos: [] };
      expect(adapter.extract(contact)).toEqual([]);
    });

    it('should return empty array if all photos have empty URLs', () => {
      const contact: GoogleContact = {
        resourceName: 'people/1',
        photos: [{ url: '', default: false }],
      };
      expect(adapter.extract(contact)).toEqual([]);
    });

    it('should return user-uploaded photo URL (default: false)', () => {
      const contact: GoogleContact = {
        resourceName: 'people/1',
        photos: [{ url: 'https://example.com/photo.jpg', default: false }],
      };
      expect(adapter.extract(contact)).toEqual([
        { value: 'https://example.com/photo.jpg' },
      ]);
    });

    it('should fall back to Google-generated avatar if no user photo exists', () => {
      const contact: GoogleContact = {
        resourceName: 'people/1',
        photos: [{ url: 'https://lh3.googleusercontent.com/avatar.jpg', default: true }],
      };
      expect(adapter.extract(contact)).toEqual([
        { value: 'https://lh3.googleusercontent.com/avatar.jpg' },
      ]);
    });

    it('should prefer user-uploaded photo over Google-generated avatar', () => {
      const contact: GoogleContact = {
        resourceName: 'people/1',
        photos: [
          { url: 'https://lh3.googleusercontent.com/avatar.jpg', default: true },
          { url: 'https://example.com/user-photo.jpg', default: false },
        ],
      };
      expect(adapter.extract(contact)).toEqual([
        { value: 'https://example.com/user-photo.jpg' },
      ]);
    });

    it('should return only one photo even if multiple user photos exist', () => {
      const contact: GoogleContact = {
        resourceName: 'people/1',
        photos: [
          { url: 'https://example.com/photo1.jpg', default: false },
          { url: 'https://example.com/photo2.jpg', default: false },
        ],
      };
      const result = adapter.extract(contact);
      expect(result).toHaveLength(1);
      expect(result[0]?.value).toBe('https://example.com/photo1.jpg');
    });
  });
});
