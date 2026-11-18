import { GoogleContact } from 'src/types/Contact';
import { htmlToText } from 'src/utils/htmlToText';

/** Opening marker of the plugin-managed notes block in the note body. */
export const NOTES_BLOCK_START = '<!-- google-contacts:notes:start -->';

/** Closing marker of the plugin-managed notes block in the note body. */
export const NOTES_BLOCK_END = '<!-- google-contacts:notes:end -->';

/**
 * Closing marker, optionally carrying the hash of the last synced value:
 * `<!-- google-contacts:notes:end sync=1a2b3c -->`. The hash is only written when write-back is on.
 */
const END_MARKER_PATTERN =
  /<!-- google-contacts:notes:end(?: sync=([0-9a-z]+))? -->/;
const ANY_MARKER_PATTERN =
  /<!-- google-contacts:notes:(?:start|end(?: sync=[0-9a-z]+)?) -->/g;

/**
 * Normalizes notes text so that values coming from Google and from the vault
 * compare equal when they differ only in line endings or surrounding whitespace.
 * Marker strings are removed so the value can never break the block boundaries.
 *
 * @param text - Raw notes text.
 * @returns Normalized text.
 */
export function normalizeNotesText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(ANY_MARKER_PATTERN, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/^\n+|\n+$/g, '');
}

/**
 * Returns the contact's Google "Notes" value as normalized plain text.
 * `TEXT_HTML` values are converted to text.
 *
 * @param contact - The Google contact.
 * @returns Normalized notes text, or an empty string if the contact has no notes.
 */
export function getContactNotesText(contact: GoogleContact): string {
  const bio = contact.biographies?.find((item) => item.value);
  if (!bio) {
    return '';
  }
  const text =
    bio.contentType === 'TEXT_HTML' ? htmlToText(bio.value) : bio.value;
  return normalizeNotesText(text);
}

/**
 * Hashes normalized notes text (53-bit cyrb53, base 36). Used only to detect changes, not for security.
 *
 * @param text - Normalized notes text.
 * @returns Short hash string.
 */
export function hashNotesText(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/**
 * Renders the managed notes block.
 *
 * @param text - Normalized notes text.
 * @param baseline - Hash of the last synced value to store in the closing marker, if any.
 * @returns The block including both markers.
 */
export function renderNotesBlock(text: string, baseline?: string): string {
  const end = baseline
    ? `<!-- google-contacts:notes:end sync=${baseline} -->`
    : NOTES_BLOCK_END;
  return text
    ? `${NOTES_BLOCK_START}\n${text}\n${end}`
    : `${NOTES_BLOCK_START}\n${end}`;
}

interface BlockRange {
  start: number;
  end: number;
  innerStart: number;
  innerEnd: number;
  baseline: string | null;
}

function findBlock(content: string): BlockRange | null {
  const start = content.indexOf(NOTES_BLOCK_START);
  if (start === -1) {
    return null;
  }
  const innerStart = start + NOTES_BLOCK_START.length;
  const match = END_MARKER_PATTERN.exec(content.slice(innerStart));
  if (!match) {
    return null;
  }
  const innerEnd = innerStart + match.index;
  return {
    start,
    end: innerEnd + match[0].length,
    innerStart,
    innerEnd,
    baseline: match[1] ?? null,
  };
}

/**
 * Whether the note has block markers that don't form exactly one complete block
 * (e.g. the closing marker was deleted). Such notes must not be touched: guessing the block
 * boundaries could overwrite or send unrelated note text.
 *
 * @param content - Full note content.
 * @returns True if the markers are broken.
 */
export function hasBrokenNotesBlock(content: string): boolean {
  const markers = content.match(ANY_MARKER_PATTERN) ?? [];
  if (markers.length === 0) {
    return false;
  }
  return (
    markers.length !== 2 ||
    markers[0] !== NOTES_BLOCK_START ||
    findBlock(content) === null
  );
}

/** Content of the managed notes block. */
export interface NotesBlock {
  /** Normalized text between the markers. */
  text: string;
  /** Hash of the value at the last successful sync, or null if not recorded. */
  baseline: string | null;
}

/**
 * Reads the managed notes block.
 *
 * @param content - Full note content.
 * @returns The block, or null if the note has no complete block.
 */
export function readNotesBlock(content: string): NotesBlock | null {
  const block = findBlock(content);
  if (!block) {
    return null;
  }
  return {
    text: normalizeNotesText(content.slice(block.innerStart, block.innerEnd)),
    baseline: block.baseline,
  };
}

/**
 * Extracts the text inside the managed notes block.
 *
 * @param content - Full note content.
 * @returns Normalized block text, or null if the note has no complete block.
 */
export function extractNotesBlock(content: string): string | null {
  return readNotesBlock(content)?.text ?? null;
}

/**
 * Writes the notes text into the managed block, leaving everything outside the block untouched.
 * If the note has no block yet, it is appended to the end of the note. An empty block is only
 * added when a baseline is given (write-back mode), so the user has a place to type notes.
 *
 * @param content - Full note content.
 * @param text - Normalized notes text.
 * @param baseline - Hash to record in the closing marker; omit to write a marker without a hash.
 * @returns Updated note content (identical to the input when nothing changed or the markers are broken).
 */
export function upsertNotesBlock(
  content: string,
  text: string,
  baseline?: string
): string {
  if (hasBrokenNotesBlock(content)) {
    return content;
  }
  const block = findBlock(content);
  if (block) {
    const current = normalizeNotesText(
      content.slice(block.innerStart, block.innerEnd)
    );
    if (current === text && block.baseline === (baseline ?? null)) {
      return content;
    }
    return (
      content.slice(0, block.start) +
      renderNotesBlock(text, baseline) +
      content.slice(block.end)
    );
  }
  if (!text && baseline === undefined) {
    return content;
  }
  return `${content}${getAppendSeparator(content)}${renderNotesBlock(text, baseline)}\n`;
}

/** Separator that leaves exactly one blank line between existing content and an appended block. */
function getAppendSeparator(content: string): string {
  if (content.length === 0 || content.endsWith('\n\n')) {
    return '';
  }
  return content.endsWith('\n') ? '\n' : '\n\n';
}

/**
 * Whether the contact's notes can be written back without losing data in Google.
 * Only "My contacts" entries can be edited ("Other contacts" are read-only in the People API).
 * Formatted (HTML) notes or several notes entries are only read: a plain-text update
 * would drop the formatting and the extra entries.
 *
 * @param contact - The Google contact.
 * @returns True if the contact's notes can be updated.
 */
export function isWritableContact(contact: GoogleContact): boolean {
  const bios = (contact.biographies ?? []).filter((b) => b.value);
  return (
    contact.resourceName.startsWith('people/') &&
    !!contact.etag &&
    (contact.metadata?.sources ?? []).some((s) => s.type === 'CONTACT') &&
    bios.length <= 1 &&
    bios.every((b) => b.contentType !== 'TEXT_HTML')
  );
}

/** What to do with a contact's notes during a two-way sync. */
export type NotesSyncAction =
  /** Both sides agree; only the recorded baseline may need refreshing. */
  | 'none'
  /** Google changed: write the Google value into the note. */
  | 'pull'
  /** The note changed: send the note value to Google. */
  | 'push'
  /** Both sides changed differently, or there is no baseline to tell: change nothing. */
  | 'conflict';

/**
 * Decides how to reconcile the note's block with the Google value using the stored baseline
 * (three-way comparison).
 *
 * @param local - The note's block, or null if the note has no block (the block is then created).
 * @param remote - Normalized Google value.
 * @returns The action to take.
 */
export function decideNotesSync(
  local: NotesBlock | null,
  remote: string
): NotesSyncAction {
  if (!local) {
    return 'pull';
  }
  if (local.text === remote) {
    return 'none';
  }
  if (local.baseline === null) {
    return 'conflict';
  }
  const localChanged = hashNotesText(local.text) !== local.baseline;
  const remoteChanged = hashNotesText(remote) !== local.baseline;
  if (localChanged && remoteChanged) {
    return 'conflict';
  }
  if (localChanged) {
    return 'push';
  }
  return 'pull';
}
