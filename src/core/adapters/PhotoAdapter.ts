import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export class PhotoAdapter implements FieldAdapter {
  extract(contact: GoogleContact): ExtractionResult[] {
    const photos = contact.photos ?? [];
    if (photos.length === 0) {
      return [];
    }

    // Prefer user-uploaded photos (default: false) over Google-generated avatars (default: true)
    const userPhoto = photos.find((p) => p.url && !p.default);
    const photoUrl = userPhoto?.url ?? photos.find((p) => p.url)?.url;

    if (!photoUrl) {
      return [];
    }

    return [{ value: photoUrl }];
  }
}
