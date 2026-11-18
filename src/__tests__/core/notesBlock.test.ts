import {
  NOTES_BLOCK_END,
  NOTES_BLOCK_START,
  extractNotesBlock,
  getContactNotesText,
  normalizeNotesText,
  renderNotesBlock,
  upsertNotesBlock,
} from 'src/core/notesBlock';

const block = (text: string) => renderNotesBlock(text);

describe('normalizeNotesText', () => {
  it('normalizes line endings and trailing whitespace', () => {
    expect(normalizeNotesText('\r\nline 1  \r\nline 2\t\r\n\r\n')).toBe(
      'line 1\nline 2'
    );
  });

  it('keeps inner blank lines and leading indentation', () => {
    expect(normalizeNotesText('a\n\n  - b')).toBe('a\n\n  - b');
  });

  it('strips block markers from the value', () => {
    expect(
      normalizeNotesText(`a ${NOTES_BLOCK_END} b ${NOTES_BLOCK_START}`)
    ).toBe('a  b');
  });
});

describe('getContactNotesText', () => {
  it('returns empty string when contact has no notes', () => {
    expect(getContactNotesText({ resourceName: 'people/1' })).toBe('');
    expect(
      getContactNotesText({
        resourceName: 'people/1',
        biographies: [{ value: '' }],
      })
    ).toBe('');
  });

  it('returns plain text notes normalized', () => {
    expect(
      getContactNotesText({
        resourceName: 'people/1',
        biographies: [
          { value: 'Met at a conference\r\n', contentType: 'TEXT_PLAIN' },
        ],
      })
    ).toBe('Met at a conference');
  });

  it('converts HTML notes to text', () => {
    expect(
      getContactNotesText({
        resourceName: 'people/1',
        biographies: [{ value: 'a<br>b &amp; c', contentType: 'TEXT_HTML' }],
      })
    ).toBe('a\nb & c');
  });
});

describe('extractNotesBlock', () => {
  it('returns null when there is no block', () => {
    expect(extractNotesBlock('# Notes\n')).toBeNull();
  });

  it('returns null when the end marker is missing', () => {
    expect(extractNotesBlock(`${NOTES_BLOCK_START}\ntext`)).toBeNull();
  });

  it('returns the block text', () => {
    expect(extractNotesBlock(`before\n${block('hello\nworld')}\nafter`)).toBe(
      'hello\nworld'
    );
  });

  it('returns empty string for an empty block', () => {
    expect(extractNotesBlock(block(''))).toBe('');
  });
});

describe('upsertNotesBlock', () => {
  const frontmatter = '---\nid: 1\n---\n';

  it('appends the block after the existing body', () => {
    expect(upsertNotesBlock(`${frontmatter}# Notes\n`, 'hello')).toBe(
      `${frontmatter}# Notes\n\n${block('hello')}\n`
    );
  });

  it('adds a separator when content does not end with a newline', () => {
    expect(upsertNotesBlock('text', 'hello')).toBe(
      `text\n\n${block('hello')}\n`
    );
  });

  it('does not add an extra blank line after a blank line', () => {
    expect(upsertNotesBlock('text\n\n', 'hello')).toBe(
      `text\n\n${block('hello')}\n`
    );
  });

  it('writes only the block into an empty note', () => {
    expect(upsertNotesBlock('', 'hello')).toBe(`${block('hello')}\n`);
  });

  it('does not add a block when there are no notes', () => {
    const content = `${frontmatter}# Notes\n`;
    expect(upsertNotesBlock(content, '')).toBe(content);
  });

  it('replaces only the block and keeps user content around it', () => {
    const content = `${frontmatter}# Notes\nmine\n${block('old')}\nalso mine\n`;
    expect(upsertNotesBlock(content, 'new\ntext')).toBe(
      `${frontmatter}# Notes\nmine\n${block('new\ntext')}\nalso mine\n`
    );
  });

  it('empties an existing block when notes were removed in Google', () => {
    const content = `x\n${block('old')}\n`;
    expect(upsertNotesBlock(content, '')).toBe(`x\n${block('')}\n`);
  });

  it('returns the same content when the block is unchanged', () => {
    const content = `x\n${NOTES_BLOCK_START}\r\nsame  \r\n${NOTES_BLOCK_END}\r\n`;
    expect(upsertNotesBlock(content, 'same')).toBe(content);
  });

  it('is idempotent', () => {
    const once = upsertNotesBlock(`${frontmatter}# Notes\n`, 'hello');
    expect(upsertNotesBlock(once, 'hello')).toBe(once);
  });
});
