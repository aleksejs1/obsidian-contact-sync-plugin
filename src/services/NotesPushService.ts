import { NOTES_PUSH_CONFIRM_THRESHOLD } from 'src/config';
import { t } from 'src/i18n/translator';
import { NotesSyncReport, PendingNotesPush } from 'src/types/NotesSync';
import type { UpdateNotesResult } from 'src/services/GoogleContactsService';
import type { GoogleContact } from 'src/types/Contact';

/** Dependencies of {@link NotesPushService}, injected to keep it free of Obsidian UI. */
export interface NotesPushDeps {
  updateContactNotes(
    token: string,
    contact: GoogleContact,
    text: string
  ): Promise<UpdateNotesResult>;
  markNotesPushed(push: PendingNotesPush): Promise<void>;
  hasWriteScope(): boolean;
  /** Asks the user to confirm a large batch; resolves to true to proceed. */
  confirm(names: string[]): Promise<boolean>;
  notify(message: string): void;
}

/** Summary of a push run. */
export interface NotesPushResult {
  pushed: number;
  failed: string[];
  skipped: boolean;
}

const MAX_NAMES_IN_NOTICE = 10;

function formatNames(names: string[]): string {
  const shown = names.slice(0, MAX_NAMES_IN_NOTICE).join(', ');
  return names.length > MAX_NAMES_IN_NOTICE
    ? `${shown} (+${names.length - MAX_NAMES_IN_NOTICE})`
    : shown;
}

/**
 * Sends notes edited in Obsidian to Google Contacts and reports conflicts.
 * Requests are sent one at a time, as Google recommends for mutations of the same user.
 */
export class NotesPushService {
  constructor(private deps: NotesPushDeps) {}

  /**
   * @param token - OAuth access token.
   * @param report - Result of reconciling notes blocks during this sync.
   */
  async pushNotes(
    token: string,
    report: NotesSyncReport
  ): Promise<NotesPushResult> {
    const result: NotesPushResult = { pushed: 0, failed: [], skipped: false };
    this.reportProblems(report);

    if (report.pushes.length === 0) {
      return result;
    }
    if (!this.deps.hasWriteScope()) {
      this.deps.notify(
        t(
          'Write access to Google Contacts is not granted. Log in with Google again in the plugin settings to send notes to Google.'
        )
      );
      return { ...result, skipped: true };
    }
    const names = report.pushes.map((p) => p.name);
    if (
      report.pushes.length > NOTES_PUSH_CONFIRM_THRESHOLD &&
      !(await this.deps.confirm(names))
    ) {
      this.deps.notify(t('Sending notes to Google Contacts was cancelled.'));
      return { ...result, skipped: true };
    }

    for (const push of report.pushes) {
      const res = await this.send(token, push);
      if (res.ok) {
        await this.deps.markNotesPushed(push);
        result.pushed++;
      } else {
        console.error(
          `Failed to send notes of "${push.name}" to Google: ${res.message}`
        );
        result.failed.push(push.name);
      }
    }

    if (result.pushed > 0) {
      this.deps.notify(
        t('Notes sent to Google Contacts: {count}', { count: result.pushed })
      );
    }
    if (result.failed.length > 0) {
      this.deps.notify(
        t(
          'Failed to send notes to Google Contacts for: {names}. Check console for details.',
          { names: formatNames(result.failed) }
        )
      );
    }
    return result;
  }

  private async send(
    token: string,
    push: PendingNotesPush
  ): Promise<UpdateNotesResult> {
    try {
      return await this.deps.updateContactNotes(token, push.contact, push.text);
    } catch (error) {
      return {
        ok: false,
        status: 0,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Notifies about notes that were left untouched: conflicts, read-only contacts, broken markers.
   *
   * @param report - Result of reconciling notes blocks during this sync.
   */
  reportProblems(report: NotesSyncReport): void {
    if (report.broken.length > 0) {
      this.deps.notify(
        t(
          'The notes section markers are damaged, these notes were not changed: {names}. Restore both marker lines or delete them.',
          { names: formatNames(report.broken) }
        )
      );
    }
    if (report.conflicts.length > 0) {
      this.deps.notify(
        t(
          'Notes were changed both in Obsidian and in Google Contacts, nothing was changed for: {names}. Make the notes match on one side to resolve.',
          { names: formatNames(report.conflicts) }
        )
      );
    }
    if (report.readOnly.length > 0) {
      this.deps.notify(
        t(
          'Edits to these notes were not sent: Google Contacts only allows reading them (other contacts or formatted notes): {names}',
          { names: formatNames(report.readOnly) }
        )
      );
    }
  }
}
