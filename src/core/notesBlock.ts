import { GoogleContact } from 'src/types/Contact';
import { htmlToText } from 'src/utils/htmlToText';

/** Opening marker of the plugin-managed notes block in the note body. */
export const NOTES_BLOCK_START = '<!-- google-contacts:notes:start -->';

/** Closing marker of the plugin-managed notes block in the note body. */
export const NOTES_BLOCK_END = '<!-- google-contacts:notes:end -->';

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
    .split(NOTES_BLOCK_START)
    .join('')
    .split(NOTES_BLOCK_END)
    .join('')
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
 * Renders the managed notes block.
 *
 * @param text - Normalized notes text.
 * @returns The block including both markers.
 */
export function renderNotesBlock(text: string): string {
  return text
    ? `${NOTES_BLOCK_START}\n${text}\n${NOTES_BLOCK_END}`
    : `${NOTES_BLOCK_START}\n${NOTES_BLOCK_END}`;
}

interface BlockRange {
  start: number;
  end: number;
  innerStart: number;
  innerEnd: number;
}

function findBlock(content: string): BlockRange | null {
  const start = content.indexOf(NOTES_BLOCK_START);
  if (start === -1) {
    return null;
  }
  const innerStart = start + NOTES_BLOCK_START.length;
  const innerEnd = content.indexOf(NOTES_BLOCK_END, innerStart);
  if (innerEnd === -1) {
    return null;
  }
  return {
    start,
    end: innerEnd + NOTES_BLOCK_END.length,
    innerStart,
    innerEnd,
  };
}

/**
 * Extracts the text inside the managed notes block.
 *
 * @param content - Full note content.
 * @returns Normalized block text, or null if the note has no complete block.
 */
export function extractNotesBlock(content: string): string | null {
  const block = findBlock(content);
  if (!block) {
    return null;
  }
  return normalizeNotesText(content.slice(block.innerStart, block.innerEnd));
}

/**
 * Writes the notes text into the managed block, leaving everything outside the block untouched.
 * If the note has no block yet, it is appended to the end of the note; when the text is empty,
 * no block is added to a note that doesn't have one.
 *
 * @param content - Full note content.
 * @param text - Normalized notes text.
 * @returns Updated note content (identical to the input when nothing changed).
 */
export function upsertNotesBlock(content: string, text: string): string {
  const block = findBlock(content);
  if (block) {
    if (extractNotesBlock(content) === text) {
      return content;
    }
    return (
      content.slice(0, block.start) +
      renderNotesBlock(text) +
      content.slice(block.end)
    );
  }
  if (!text) {
    return content;
  }
  let separator = '';
  if (content.length > 0) {
    if (content.endsWith('\n\n')) {
      separator = '';
    } else if (content.endsWith('\n')) {
      separator = '\n';
    } else {
      separator = '\n\n';
    }
  }
  return `${content}${separator}${renderNotesBlock(text)}\n`;
}
