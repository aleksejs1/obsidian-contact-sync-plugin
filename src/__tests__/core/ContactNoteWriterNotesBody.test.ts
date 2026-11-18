import { FileManager, TFile } from 'obsidian';
import { GoogleContact } from 'src/types/Contact';
import { ContactNoteConfig } from 'src/types/ContactNoteConfig';
import { NamingStrategy } from 'src/types/Settings';
import { hashNotesText, renderNotesBlock } from 'src/core/notesBlock';

/** Block as written by one-way sync: the closing marker records the synced value. */
const synced = (text: string) => renderNotesBlock(text, hashNotesText(text));
import { getAllMarkdownFilesInFolder } from 'src/utils/getAllMarkdownFilesInFolder';
import { DEFAULT_TEST_CONFIG } from '../helpers';
import { InMemoryVault, TestWriter } from '../inMemoryVault';

jest.mock('src/utils/getAllMarkdownFilesInFolder', () => ({
  getAllMarkdownFilesInFolder: jest.fn(),
}));

const contact = (notes?: string): GoogleContact => ({
  resourceName: 'people/c1',
  names: [{ displayName: 'Alice' }],
  ...(notes === undefined ? {} : { biographies: [{ value: notes }] }),
});

describe('ContactNoteWriter – notes in body', () => {
  const path = 'folder/Alice.md';
  let vault: InMemoryVault;
  let fileManager: FileManager;
  let idMapping: Record<string, TFile>;
  let writer: TestWriter;

  const config = (overrides: Partial<ContactNoteConfig> = {}) => ({
    ...DEFAULT_TEST_CONFIG,
    folderPath: 'folder',
    prefix: '',
    propertyPrefix: '',
    trackSyncTime: false,
    noteBody: '# Notes\n',
    notesInBody: true,
    ...overrides,
  });

  beforeEach(() => {
    vault = new InMemoryVault();
    idMapping = {};
    fileManager = {
      processFrontMatter: jest.fn(
        async (file: TFile, fn: (fm: Record<string, unknown>) => void) => {
          const fm = vault.frontmatters.get(file.path) ?? {};
          fn(fm);
          vault.frontmatters.set(file.path, fm);
        }
      ),
    } as unknown as FileManager;
    writer = new TestWriter(vault, fileManager, () => idMapping);
    (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([]);
  });

  it('writes notes into the body of a new note and not into frontmatter', async () => {
    await writer.writeNotesForContacts(config(), {}, [
      contact('Hello\r\nthere'),
    ]);

    expect(vault.contents.get(path)).toBe(
      `# Notes\n\n${synced('Hello\nthere')}\n`
    );
    expect(vault.frontmatters.get(path)).not.toHaveProperty('bio');
    expect(vault.frontmatters.get(path)).toHaveProperty('id', 'c1');
  });

  it('updates only the managed block in an existing note', async () => {
    const file = vault.addFile(
      path,
      `# Notes\nmy text\n${renderNotesBlock('old')}\nmore of my text\n`,
      { id: 'c1' }
    );
    idMapping = { c1: file };

    await writer.writeNotesForContacts(config(), {}, [contact('new')]);

    expect(vault.contents.get(path)).toBe(
      `# Notes\nmy text\n${synced('new')}\nmore of my text\n`
    );
  });

  it('does not write the file when the block is unchanged', async () => {
    const file = vault.addFile(path, `${synced('same')}\n`, {
      id: 'c1',
    });
    idMapping = { c1: file };

    await writer.writeNotesForContacts(config(), {}, [contact('same')]);

    expect(vault.process).not.toHaveBeenCalled();
  });

  it('does not add a block when the contact has no notes', async () => {
    const file = vault.addFile(path, '# Notes\n', { id: 'c1' });
    idMapping = { c1: file };

    await writer.writeNotesForContacts(config(), {}, [contact()]);

    expect(vault.process).not.toHaveBeenCalled();
    expect(vault.contents.get(path)).toBe('# Notes\n');
  });

  it('removes the stale bio property written by earlier versions', async () => {
    const file = vault.addFile(path, '# Notes\n', { id: 'c1', bio: 'old' });
    idMapping = { c1: file };

    await writer.writeNotesForContacts(config(), {}, [contact('fresh')]);

    expect(vault.frontmatters.get(path)).not.toHaveProperty('bio');
  });

  it('removes the stale prefixed and VCF properties', async () => {
    const file = vault.addFile(path, '', { id: 'c1', 'p-bio': 'old' });
    idMapping = { c1: file };
    await writer.writeNotesForContacts(config({ propertyPrefix: 'p-' }), {}, [
      contact('x'),
    ]);
    expect(vault.frontmatters.get(path)).not.toHaveProperty('p-bio');

    vault.frontmatters.set(path, { 'X-GOOGLE-ID': 'c1', NOTE: 'old' });
    await writer.writeNotesForContacts(
      config({ namingStrategy: NamingStrategy.VCF }),
      {},
      [contact('x')]
    );
    expect(vault.frontmatters.get(path)).not.toHaveProperty('NOTE');
  });

  it('keeps the current behaviour when the setting is off', async () => {
    const file = vault.addFile(path, '# Notes\n', { id: 'c1' });
    idMapping = { c1: file };

    await writer.writeNotesForContacts(config({ notesInBody: false }), {}, [
      contact('Hello'),
    ]);

    expect(vault.read).not.toHaveBeenCalled();
    expect(vault.process).not.toHaveBeenCalled();
    expect(vault.contents.get(path)).toBe('# Notes\n');
    expect(vault.frontmatters.get(path)).toHaveProperty('bio', 'Hello');
  });
});
