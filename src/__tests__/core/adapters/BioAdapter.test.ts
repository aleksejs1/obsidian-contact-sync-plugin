import { BioAdapter } from 'src/core/adapters/BioAdapter';

describe('BioAdapter', () => {
  const adapter = new BioAdapter();
  const contact = {
    resourceName: 'people/1',
    biographies: [{ value: 'Notes' }, { value: '' }],
  };

  it('extracts non-empty biographies', () => {
    expect(adapter.extract(contact)).toEqual([{ value: 'Notes' }]);
  });

  it('returns nothing when notes are synced to the note body', () => {
    expect(adapter.extract(contact, { notesInBody: true })).toEqual([]);
  });
});
