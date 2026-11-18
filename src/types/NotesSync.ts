import { TFile } from 'obsidian';
import { GoogleContact } from './Contact';

/** A note whose notes block was edited in Obsidian and should be sent to Google. */
export interface PendingNotesPush {
  contact: GoogleContact;
  file: TFile;
  /** Normalized text to send. */
  text: string;
  /** Human-readable contact name for reports. */
  name: string;
}

/** Outcome of reconciling notes blocks during a sync with write-back enabled. */
export interface NotesSyncReport {
  /** Notes edited in Obsidian, waiting to be sent to Google. */
  pushes: PendingNotesPush[];
  /** Contacts whose notes changed on both sides; nothing was changed. */
  conflicts: string[];
  /** Contacts edited in Obsidian that Google doesn't allow to modify. */
  readOnly: string[];
  /** Notes whose block markers are broken; they were left untouched. */
  broken: string[];
}
