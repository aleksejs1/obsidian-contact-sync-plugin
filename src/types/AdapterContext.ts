import { ContactNoteConfig } from './ContactNoteConfig';

/**
 * Context provided to field adapters during extraction.
 * Extends the main configuration with derived data like label maps.
 */
export interface AdapterContext extends ContactNoteConfig {
  /**
   * Mapping of IDs to Label Names (inverted label map).
   */
  labelMap: Record<string, string>;
}
