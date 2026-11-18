import { FileManager, TFile } from 'obsidian';
import {
  NOTES_BLOCK_END,
  NOTES_BLOCK_START,
  hasBrokenNotesBlock,
  hashNotesText,
  isWritableContact,
  readNotesBlock,
  renderNotesBlock,
  upsertNotesBlock,
} from 'src/core/notesBlock';
import { t } from 'src/i18n/translator';
import { GoogleContact } from 'src/types/Contact';
import { ContactNoteConfig } from 'src/types/ContactNoteConfig';
import { getAllMarkdownFilesInFolder } from 'src/utils/getAllMarkdownFilesInFolder';
import { DEFAULT_TEST_CONFIG } from '../helpers';
import { InMemoryVault, TestWriter } from '../inMemoryVault';

jest.mock('src/utils/getAllMarkdownFilesInFolder', () => ({
  getAllMarkdownFilesInFolder: jest.fn(),
}));

describe('hasBrokenNotesBlock', () => {
  it('is false without markers or with one complete block', () => {
    expect(hasBrokenNotesBlock('# Notes\n')).toBe(false);
    expect(hasBrokenNotesBlock(`x\n${renderNotesBlock('a', 'h1')}\n`)).toBe(
      false
    );
  });

  it('detects a missing closing marker', () => {
    expect(hasBrokenNotesBlock(`${NOTES_BLOCK_START}\nnotes\nmy text`)).toBe(
      true
    );
  });

  it('detects a missing opening marker', () => {
    expect(hasBrokenNotesBlock(`notes\n${NOTES_BLOCK_END}`)).toBe(true);
  });

  it('detects markers in the wrong order or duplicated', () => {
    expect(
      hasBrokenNotesBlock(`${NOTES_BLOCK_END}\n${NOTES_BLOCK_START}`)
    ).toBe(true);
    expect(
      hasBrokenNotesBlock(`${renderNotesBlock('a')}\n${renderNotesBlock('b')}`)
    ).toBe(true);
  });

  it('upsert leaves a note with broken markers untouched', () => {
    const content = `${NOTES_BLOCK_START}\nold\nmy own text\n`;
    expect(upsertNotesBlock(content, 'new', 'h')).toBe(content);
  });
});

describe('isWritableContact with formatted or multiple notes', () => {
  const base: GoogleContact = {
    resourceName: 'people/c1',
    etag: 'e',
    metadata: { sources: [{ type: 'CONTACT', id: 'c1' }] },
  };

  it('rejects HTML notes', () => {
    expect(
      isWritableContact({
        ...base,
        biographies: [{ value: '<b>x</b>', contentType: 'TEXT_HTML' }],
      })
    ).toBe(false);
  });

  it('rejects several notes entries', () => {
    expect(
      isWritableContact({
        ...base,
        biographies: [{ value: 'a' }, { value: 'b' }],
      })
    ).toBe(false);
  });

  it('accepts a single plain-text note', () => {
    expect(
      isWritableContact({
        ...base,
        biographies: [{ value: 'a', contentType: 'TEXT_PLAIN' }],
      })
    ).toBe(true);
  });
});

describe('t() placeholders', () => {
  it('substitutes values literally', () => {
    expect(
      t('Notes sent to Google Contacts: {count}', { count: '$& $1' })
    ).toBe('Notes sent to Google Contacts: $& $1');
  });

  it('keeps unknown placeholders', () => {
    expect(t('Notes sent to Google Contacts: {count}', {})).toBe(
      'Notes sent to Google Contacts: {count}'
    );
  });
});

describe('ContactNoteWriter review fixes', () => {
  const path = 'folder/Alice.md';
  let vault: InMemoryVault;
  let writer: TestWriter;
  let idMapping: Record<string, TFile>;

  const config = (writeBack: boolean): ContactNoteConfig => ({
    ...DEFAULT_TEST_CONFIG,
    folderPath: 'folder',
    prefix: '',
    propertyPrefix: '',
    trackSyncTime: false,
    noteBody: '# Notes\n',
    notesInBody: true,
    notesWriteBack: writeBack,
  });

  const contact = (notes: string): GoogleContact => ({
    resourceName: 'people/c1',
    etag: 'e',
    metadata: { sources: [{ type: 'CONTACT', id: 'c1' }] },
    names: [{ displayName: 'Alice' }],
    biographies: [{ value: notes }],
  });

  beforeEach(() => {
    vault = new InMemoryVault();
    idMapping = {};
    const fileManager = {
      processFrontMatter: jest.fn(
        async (file: TFile, fn: (fm: Record<string, unknown>) => void) => {
          fn(vault.frontmatters.get(file.path) ?? {});
        }
      ),
    } as unknown as FileManager;
    writer = new TestWriter(vault, fileManager, () => idMapping);
    (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([]);
  });

  const existing = (content: string) => {
    idMapping = { c1: vault.addFile(path, content, { id: 'c1' }) };
  };

  it.each([true, false])(
    'reports and skips a note with a deleted closing marker (write-back %s)',
    async (writeBack) => {
      const content = `# Notes\n${NOTES_BLOCK_START}\nold notes\nmy own text\n`;
      existing(content);

      const report = await writer.writeNotesForContacts(config(writeBack), {}, [
        contact('remote'),
      ]);

      expect(report.broken).toEqual(['Alice']);
      expect(report.pushes).toHaveLength(0);
      expect(vault.contents.get(path)).toBe(content);
    }
  );

  it('keeps the baseline in one-way mode instead of rewriting the note', async () => {
    const content = `# Notes\n\n${renderNotesBlock('same', hashNotesText('same'))}\n`;
    existing(content);

    await writer.writeNotesForContacts(config(false), {}, [contact('same')]);

    expect(vault.process).not.toHaveBeenCalled();
  });

  it('records the pulled value as the baseline in one-way mode', async () => {
    existing(`${renderNotesBlock('old', 'h1')}\n`);

    await writer.writeNotesForContacts(config(false), {}, [contact('new')]);

    expect(readNotesBlock(vault.contents.get(path) ?? '')).toEqual({
      text: 'new',
      baseline: hashNotesText('new'),
    });
  });

  it('does not overwrite an edit made between reading and writing', async () => {
    existing(`${renderNotesBlock('base', hashNotesText('base'))}\n`);
    const edited = `${renderNotesBlock('typed meanwhile', hashNotesText('base'))}\n`;
    vault.read.mockImplementationOnce(async () => {
      const before = vault.contents.get(path) ?? '';
      vault.contents.set(path, edited);
      return before;
    });

    await writer.writeNotesForContacts(config(true), {}, [
      contact('from google'),
    ]);

    expect(vault.contents.get(path)).toBe(edited);
  });
});

describe('enabling write-back after one-way sync', () => {
  it('pushes an edit made while notes were synced one-way', async () => {
    const vault = new InMemoryVault();
    const path = 'folder/Alice.md';
    const file = vault.addFile(path, '', { id: 'c1' });
    const fileManager = {
      processFrontMatter: jest.fn(
        async (f: TFile, fn: (fm: Record<string, unknown>) => void) => {
          fn(vault.frontmatters.get(f.path) ?? {});
        }
      ),
    } as unknown as FileManager;
    const writer = new TestWriter(vault, fileManager, () => ({ c1: file }));
    (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([]);
    const google: GoogleContact = {
      resourceName: 'people/c1',
      etag: 'e',
      metadata: { sources: [{ type: 'CONTACT', id: 'c1' }] },
      names: [{ displayName: 'Alice' }],
      biographies: [{ value: 'from google' }],
    };
    const cfg: ContactNoteConfig = {
      ...DEFAULT_TEST_CONFIG,
      folderPath: 'folder',
      prefix: '',
      propertyPrefix: '',
      trackSyncTime: false,
      notesInBody: true,
      notesWriteBack: false,
    };

    // One-way sync writes the block, then the user edits it
    await writer.writeNotesForContacts(cfg, {}, [google]);
    const written = vault.contents.get(path) ?? '';
    vault.contents.set(
      path,
      written.replace('from google', 'edited in obsidian')
    );

    const report = await writer.writeNotesForContacts(
      { ...cfg, notesWriteBack: true },
      {},
      [google]
    );

    expect(report.conflicts).toEqual([]);
    expect(report.pushes.map((p) => p.text)).toEqual(['edited in obsidian']);
  });
});
