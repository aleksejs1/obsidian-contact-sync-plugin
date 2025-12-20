import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export class BirthdayAdapter implements FieldAdapter {
  extract(contact: GoogleContact): ExtractionResult[] {
    if (!contact.birthdays || contact.birthdays.length === 0) {
      return [];
    }

    const results: ExtractionResult[] = [];
    contact.birthdays.forEach((bday) => {
      const date = bday.date;
      if (date) {
        const birthdayStr = `${date.year ?? 'XXXX'}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
        results.push({ value: birthdayStr });
      }
    });
    return results;
  }
}
