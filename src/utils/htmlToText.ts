const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/**
 * Decodes the HTML entities that commonly appear in Google Contacts notes.
 * Unknown named entities are left untouched.
 */
function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (match, entity: string) => {
      if (entity.startsWith('#')) {
        const isHex = entity[1] === 'x' || entity[1] === 'X';
        const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
        return Number.isNaN(code) || code > 0x10ffff
          ? match
          : String.fromCodePoint(code);
      }
      return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
    }
  );
}

/**
 * Converts a simple HTML fragment (as stored in `TEXT_HTML` biographies) to plain text.
 * Line breaks and block elements become newlines; all other tags are removed.
 *
 * @param html - The HTML fragment.
 * @returns Plain text with normalized line breaks.
 */
export function htmlToText(html: string): string {
  const text = html
    .replace(/\r\n?/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])\s*>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '');
  return decodeEntities(text)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
