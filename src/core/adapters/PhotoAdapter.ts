import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';
import { NamingStrategy } from 'src/types/Settings';

export class PhotoAdapter implements FieldAdapter {
  extract(
    contact: GoogleContact,
    context?: Record<string, unknown>
  ): ExtractionResult[] {
    const photos = (contact.photos ?? []).filter((p) => p.url);

    if (photos.length === 0) {
      return [];
    }

    // Sort to put default photo first
    const sortedPhotos = [...photos].sort(
      (a, b) => (b.default ? 1 : 0) - (a.default ? 1 : 0)
    );

    if (context?.namingStrategy === NamingStrategy.Array) {
      const allUrls = sortedPhotos.map((p) => p.url);
      const first = allUrls[0];
      return [
        {
          value: allUrls.length === 1 && first !== undefined ? first : allUrls,
        },
      ];
    }

    return sortedPhotos.map((p) => ({ value: p.url }));
  }
}
