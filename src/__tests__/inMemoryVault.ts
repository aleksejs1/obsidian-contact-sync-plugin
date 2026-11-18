import { FileManager, MetadataCache, TFile, Vault } from 'obsidian';
import { ContactNoteWriter } from 'src/services/ContactNoteWriter';

/** Minimal in-memory vault: file content and frontmatter are kept separately. */
export class InMemoryVault {
  contents = new Map<string, string>();
  frontmatters = new Map<string, Record<string, unknown>>();
  files = new Map<string, TFile>();

  create = jest.fn(async (path: string, content: string) => {
    const file = { path } as TFile;
    this.files.set(path, file);
    this.contents.set(path, content);
    this.frontmatters.set(path, {});
    return file;
  });
  createFolder = jest.fn(async () => undefined);
  getFolderByPath = jest.fn(() => ({ path: 'folder' }));
  getFileByPath = jest.fn((path: string) => this.files.get(path) ?? null);
  read = jest.fn(async (file: TFile) => this.contents.get(file.path) ?? '');
  process = jest.fn(async (file: TFile, fn: (data: string) => string) => {
    const next = fn(this.contents.get(file.path) ?? '');
    this.contents.set(file.path, next);
    return next;
  });

  addFile(path: string, content: string, frontmatter: Record<string, unknown>) {
    const file = { path } as TFile;
    this.files.set(path, file);
    this.contents.set(path, content);
    this.frontmatters.set(path, { ...frontmatter });
    return file;
  }
}

export class TestWriter extends ContactNoteWriter {
  constructor(
    vault: InMemoryVault,
    fileManager: FileManager,
    private idMapping: () => Record<string, TFile>
  ) {
    super(vault as unknown as Vault, {} as MetadataCache, fileManager);
  }
  protected override scanFiles(): Record<string, TFile> {
    return this.idMapping();
  }
}
