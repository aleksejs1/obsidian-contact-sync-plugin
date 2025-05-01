import { getAllMarkdownFilesInFolder } from '../../utils/getAllMarkdownFilesInFolder';
import { TFile, TFolder } from 'obsidian';

describe('getAllMarkdownFilesInFolder', () => {
  class MockTFolder {
    children: (MockTFile | MockTFolder)[] = [];
    __isMockTFolder = true;
  }

  class MockTFile {
    extension: string;
    __isMockTFile = true;
    constructor(extension: string) {
      this.extension = extension;
    }
  }

  const isTFolder = (obj: MockTFolder): obj is MockTFolder =>
    obj && obj.__isMockTFolder;
  const isTFile = (obj: MockTFile): obj is MockTFile =>
    obj && obj.__isMockTFile;

  beforeAll(() => {
    Object.defineProperty(TFolder, Symbol.hasInstance, {
      value: isTFolder,
    });

    Object.defineProperty(TFile, Symbol.hasInstance, {
      value: isTFile,
    });
  });

  it('should return empty array if folder has no children', () => {
    const folder = new MockTFolder();
    if (!(folder instanceof TFolder)) {
      throw new Error('folder is not an instance of TFolder');
    }

    const result = getAllMarkdownFilesInFolder(folder);

    expect(result).toEqual([]);
  });

  it('should return only markdown files in the folder', () => {
    const folder = new MockTFolder();
    if (!(folder instanceof TFolder)) {
      throw new Error('folder is not an instance of TFolder');
    }

    const mdFile = new MockTFile('md');
    const txtFile = new MockTFile('txt');

    folder.children.push(mdFile, txtFile);

    const result = getAllMarkdownFilesInFolder(folder);

    expect(result).toEqual([mdFile]);
  });

  it('should recursively find markdown files in nested folders', () => {
    const root = new MockTFolder();
    if (!(root instanceof TFolder)) {
      throw new Error('folder is not an instance of TFolder');
    }

    const nested = new MockTFolder();
    const mdFile = new MockTFile('md');

    nested.children.push(mdFile);
    root.children.push(nested);

    const result = getAllMarkdownFilesInFolder(root);
    expect(result).toEqual([mdFile]);
  });

  it('should handle deeply nested folder structures', () => {
    const root = new MockTFolder();
    if (!(root instanceof TFolder)) {
      throw new Error('folder is not an instance of TFolder');
    }

    const level1 = new MockTFolder();
    const level2 = new MockTFolder();
    const level3 = new MockTFolder();
    const mdFile = new MockTFile('md');

    level3.children.push(mdFile);
    level2.children.push(level3);
    level1.children.push(level2);
    root.children.push(level1);

    const result = getAllMarkdownFilesInFolder(root);

    expect(result).toEqual([mdFile]);
  });
});
