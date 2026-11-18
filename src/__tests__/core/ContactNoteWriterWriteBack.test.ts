import { FileManager, TFile } from 'obsidian';
import { GoogleContact } from 'src/types/Contact';
import { ContactNoteConfig } from 'src/types/ContactNoteConfig';
import {
  hashNotesText,
  readNotesBlock,
  renderNotesBlock,
} from 'src/core/notesBlock';
import { getAllMarkdownFilesInFolder } from 'src/utils/getAllMarkdownFilesInFolder';
import { DEFAULT_TEST_CONFIG } from '../helpers';
import { InMemoryVault, TestWriter } from '../inMemoryVault';

jest.mock('src/utils/getAllMarkdownFilesInFolder', () => ({
  getAllMarkdownFilesInFolder: jest.fn(),
}));

const contact = (
  notes: string | undefined,
  overrides: Partial<GoogleContact> = {}
): GoogleContact => ({
  resourceName: 'people/c1',
  etag: 'etag-1',
  metadata: { sources: [{ type: 'CONTACT', id: 'c1', etag: 'src-etag' }] },
  names: [{ displayName: 'Alice' }],
  ...(notes === undefined ? {} : { biographies: [{ value: notes }] }),
  ...overrides,
});

/** Note body with a block whose baseline is the hash of `base`. */
const note = (text: string, base?: string) =>
  `# Notes\n\n${renderNotesBlock(text, base === undefined ? undefined : hashNotesText(base))}\n`;

describe('ContactNoteWriter – notes write-back', () => {
  const path = 'folder/Alice.md';
  let vault: InMemoryVault;
  let idMapping: Record<string, TFile>;
  let writer: TestWriter;

  const config: ContactNoteConfig = {
    ...DEFAULT_TEST_CONFIG,
    folderPath: 'folder',
    prefix: '',
    propertyPrefix: '',
    trackSyncTime: false,
    noteBody: '# Notes\n',
    notesInBody: true,
    notesWriteBack: true,
  };

  const existing = (content: string) => {
    idMapping = { c1: vault.addFile(path, content, { id: 'c1' }) };
  };

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

  it('creates a block with a baseline, even for contacts without notes', async () => {
    const report = await writer.writeNotesForContacts(config, {}, [
      contact(undefined),
    ]);

    expect(readNotesBlock(vault.contents.get(path) ?? '')).toEqual({
      text: '',
      baseline: hashNotesText(''),
    });
    expect(report.pushes).toHaveLength(0);
  });

  it('adopts an existing block without baseline when it matches Google', async () => {
    existing(note('same'));

    const report = await writer.writeNotesForContacts(config, {}, [
      contact('same'),
    ]);

    expect(vault.contents.get(path)).toBe(note('same', 'same'));
    expect(report).toEqual({
      pushes: [],
      conflicts: [],
      readOnly: [],
      broken: [],
    });
  });

  it('does not touch the file when nothing changed', async () => {
    existing(note('same', 'same'));

    await writer.writeNotesForContacts(config, {}, [contact('same')]);

    expect(vault.process).not.toHaveBeenCalled();
  });

  it('pulls a Google change', async () => {
    existing(note('base', 'base'));

    const report = await writer.writeNotesForContacts(config, {}, [
      contact('from google'),
    ]);

    expect(vault.contents.get(path)).toBe(note('from google', 'from google'));
    expect(report.pushes).toHaveLength(0);
  });

  it('queues an Obsidian change for push without changing the note', async () => {
    existing(note('edited', 'base'));

    const report = await writer.writeNotesForContacts(config, {}, [
      contact('base'),
    ]);

    expect(report.pushes).toHaveLength(1);
    expect(report.pushes[0]).toMatchObject({ text: 'edited', name: 'Alice' });
    expect(vault.contents.get(path)).toBe(note('edited', 'base'));
  });

  it('reports a conflict and leaves the note untouched', async () => {
    existing(note('local', 'base'));

    const report = await writer.writeNotesForContacts(config, {}, [
      contact('remote'),
    ]);

    expect(report.conflicts).toEqual(['Alice']);
    expect(report.pushes).toHaveLength(0);
    expect(vault.process).not.toHaveBeenCalled();
  });

  it('reports read-only contacts instead of pushing', async () => {
    existing(note('edited', 'base'));

    const report = await writer.writeNotesForContacts(config, {}, [
      contact('base', { metadata: { sources: [] } }),
    ]);

    expect(report.readOnly).toEqual(['Alice']);
    expect(report.pushes).toHaveLength(0);
  });

  it('records the pushed value as the new baseline', async () => {
    existing(note('edited', 'base'));
    const report = await writer.writeNotesForContacts(config, {}, [
      contact('base'),
    ]);
    const push = report.pushes[0];
    if (!push) {
      throw new Error('expected a push');
    }

    await writer.markNotesPushed(push);

    expect(vault.contents.get(path)).toBe(note('edited', 'edited'));
  });

  it('keeps a newer edit made while the push was in flight', async () => {
    existing(note('edited', 'base'));
    const report = await writer.writeNotesForContacts(config, {}, [
      contact('base'),
    ]);
    const push = report.pushes[0];
    if (!push) {
      throw new Error('expected a push');
    }
    vault.contents.set(path, note('edited again', 'base'));

    await writer.markNotesPushed(push);

    expect(vault.contents.get(path)).toBe(note('edited again', 'base'));
  });

  it('a second sync after a push makes no changes', async () => {
    existing(note('edited', 'edited'));

    const report = await writer.writeNotesForContacts(config, {}, [
      contact('edited'),
    ]);

    expect(report).toEqual({
      pushes: [],
      conflicts: [],
      readOnly: [],
      broken: [],
    });
    expect(vault.process).not.toHaveBeenCalled();
  });
});
