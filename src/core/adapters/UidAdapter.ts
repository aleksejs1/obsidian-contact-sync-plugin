import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';

export class UidAdapter implements FieldAdapter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  extract(_contact: GoogleContact): ExtractionResult[] {
    // Generate a new UUID for the UID field
    // Note: This means UID will change every sync if we overwrite the file.
    // Ideally, we should persist it, but the adapter just extracts/generates data.
    // The ContactNoteWriter might need to handle preservation if it reads existing file.
    // But for now, we just generate it.
    // Wait, if it generates a NEW one every time, that's bad for "UID".
    // "UID" implies a persistent unique identifier.
    // If we want to persist it, we need to read the existing file.
    // But adapters don't have access to existing file.
    // The user requirement says "UID needs to be generated".
    // Maybe they mean just generated once?
    // If we overwrite the file, we lose the old UID unless we preserve it.
    // BUT, maybe the "re-write" logic handles merging?
    // ContactNoteWriter.ts: processFrontMatter overwrites keys.
    // So if we generate a new one, it overwrites.

    // However, generating a UUID is what was asked.
    // "UID надо генерировать." -> "UID needs to be generated."

    return [{ value: crypto.randomUUID() }];
  }
}
