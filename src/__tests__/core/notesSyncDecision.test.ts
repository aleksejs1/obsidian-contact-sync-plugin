import {
  NOTES_BLOCK_START,
  decideNotesSync,
  hashNotesText,
  isWritableContact,
  readNotesBlock,
  renderNotesBlock,
  upsertNotesBlock,
} from 'src/core/notesBlock';

const block = (text: string, baselineOf?: string) => ({
  text,
  baseline: baselineOf === undefined ? null : hashNotesText(baselineOf),
});

describe('decideNotesSync', () => {
  it('pulls when the note has no block yet', () => {
    expect(decideNotesSync(null, 'remote')).toBe('pull');
    expect(decideNotesSync(null, '')).toBe('pull');
  });

  it('does nothing when both sides agree', () => {
    expect(decideNotesSync(block('same', 'old'), 'same')).toBe('none');
    expect(decideNotesSync(block('same'), 'same')).toBe('none');
  });

  it('pulls when only Google changed', () => {
    expect(decideNotesSync(block('base', 'base'), 'new in google')).toBe(
      'pull'
    );
  });

  it('pushes when only the note changed', () => {
    expect(decideNotesSync(block('edited', 'base'), 'base')).toBe('push');
  });

  it('pushes an emptied block (clearing notes is an edit)', () => {
    expect(decideNotesSync(block('', 'base'), 'base')).toBe('push');
  });

  it('reports a conflict when both sides changed differently', () => {
    expect(decideNotesSync(block('local', 'base'), 'remote')).toBe('conflict');
  });

  it('reports a conflict when there is no baseline and the sides differ', () => {
    expect(decideNotesSync(block('local'), 'remote')).toBe('conflict');
  });
});

describe('baseline in the closing marker', () => {
  it('round-trips the baseline', () => {
    const content = `x\n${renderNotesBlock('text', 'abc123')}\n`;
    expect(readNotesBlock(content)).toEqual({
      text: 'text',
      baseline: 'abc123',
    });
  });

  it('reads blocks without a baseline', () => {
    expect(readNotesBlock(renderNotesBlock('text'))).toEqual({
      text: 'text',
      baseline: null,
    });
  });

  it('updates only the baseline when the text is the same', () => {
    const before = `a\n${renderNotesBlock('t', 'old')}\nb`;
    expect(upsertNotesBlock(before, 't', 'new')).toBe(
      `a\n${renderNotesBlock('t', 'new')}\nb`
    );
  });

  it('removes the baseline when write-back is off', () => {
    const before = renderNotesBlock('t', 'old');
    expect(upsertNotesBlock(before, 't')).toBe(renderNotesBlock('t'));
  });

  it('creates an empty block in write-back mode', () => {
    expect(upsertNotesBlock('# Notes\n', '', hashNotesText(''))).toBe(
      `# Notes\n\n${renderNotesBlock('', hashNotesText(''))}\n`
    );
  });

  it('never lets a marker with a baseline leak into the text', () => {
    const content = `${NOTES_BLOCK_START}\nkeep <!-- google-contacts:notes:end sync=zz --> tail`;
    expect(readNotesBlock(content)?.text).toBe('keep');
  });
});

describe('hashNotesText', () => {
  it('is stable and distinguishes values', () => {
    expect(hashNotesText('a')).toBe(hashNotesText('a'));
    expect(hashNotesText('a')).not.toBe(hashNotesText('b'));
    expect(hashNotesText('')).toMatch(/^[0-9a-z]+$/);
  });
});

describe('isWritableContact', () => {
  const sources = [{ type: 'CONTACT', id: '1', etag: 'e' }];

  it('accepts "My contacts" entries with an etag and a CONTACT source', () => {
    expect(
      isWritableContact({
        resourceName: 'people/c1',
        etag: 'x',
        metadata: { sources },
      })
    ).toBe(true);
  });

  it('rejects other contacts, missing etag or missing CONTACT source', () => {
    expect(
      isWritableContact({
        resourceName: 'otherContacts/c1',
        etag: 'x',
        metadata: { sources },
      })
    ).toBe(false);
    expect(
      isWritableContact({ resourceName: 'people/c1', metadata: { sources } })
    ).toBe(false);
    expect(
      isWritableContact({
        resourceName: 'people/c1',
        etag: 'x',
        metadata: { sources: [{ type: 'PROFILE', id: '1' }] },
      })
    ).toBe(false);
  });
});
