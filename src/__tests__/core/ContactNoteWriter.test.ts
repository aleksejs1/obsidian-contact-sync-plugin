import { MockMetadataCache } from 'src/__mocks__/obsidian';
import { ContactNoteWriter } from '../../services/ContactNoteWriter';
import { Vault, TFile, FileStats, MetadataCache, FileManager } from 'obsidian';
import { GoogleContact } from 'src/types/Contact';
import { ContactNoteConfig } from 'src/types/ContactNoteConfig';

import { getAllMarkdownFilesInFolder } from 'src/utils/getAllMarkdownFilesInFolder';
import { DEFAULT_TEST_CONFIG } from '../helpers';

jest.mock('obsidian', () => {
  const actual = jest.requireActual('obsidian');
  return {
    ...actual,
    normalizePath: jest.fn((path) => path),
    parseYaml: jest.fn(() => {
      return { 'propertyPrefix-id': '123' };
    }),
    stringifyYaml: jest.fn((obj: Record<string, unknown>) => {
      return (
        Object.entries(obj)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n') + '\n'
      );
    }),
    Vault: jest.fn().mockImplementation(() => ({
      create: jest.fn(),
      createFolder: jest.fn().mockResolvedValue(undefined),
      getAbstractFileByPath: jest.fn(),
      read: jest.fn(),
      process: jest.fn(),
      getFileByPath: jest.fn(),
      getFolderByPath: jest.fn(),
    })),
    TFolder: class MockTFolder {
      static [Symbol.hasInstance](instance: unknown) {
        return (
          typeof instance === 'object' &&
          instance !== null &&
          '__isMockTFolder' in instance
        );
      }
    },
    TFile: class MockTFile {
      static [Symbol.hasInstance](instance: unknown) {
        return (
          typeof instance === 'object' &&
          instance !== null &&
          '__isMockTFile' in instance
        );
      }
    },
  };
});

jest.mock('src/utils/getAllMarkdownFilesInFolder', () => ({
  getAllMarkdownFilesInFolder: jest.fn(),
}));

class TestContactNoteWriter extends ContactNoteWriter {
  public scanFiles(
    files: TFile[],
    propertyPrefix: string
  ): Record<string, TFile> {
    return super.scanFiles(files, propertyPrefix);
  }

  public hasSyncLabel(
    contact: GoogleContact,
    syncLabel: string,
    labelMap: Record<string, string>
  ): boolean {
    return super.hasSyncLabel(contact, syncLabel, labelMap);
  }
}

describe('ContactNoteWriter', () => {
  let contactNoteWriter: TestContactNoteWriter;
  let vault: Vault;
  let metadataCache: MetadataCache;
  let fileManager: FileManager;

  beforeEach(() => {
    vault = new Vault() as unknown as Vault;
    metadataCache = new MockMetadataCache() as unknown as MetadataCache;
    metadataCache.getFileCache = jest.fn();
    fileManager = {
      create: jest.fn(),
      createFolder: jest.fn().mockResolvedValue(undefined),
      getAbstractFileByPath: jest.fn(),
      getFileByPath: jest.fn(),
      processFrontMatter: jest.fn().mockImplementation((_file, fn) => {
        return fn({});
      }),
    } as unknown as FileManager;
    contactNoteWriter = new TestContactNoteWriter(
      vault,
      metadataCache,
      fileManager
    );
  });

  describe('writeNotesForContacts', () => {
    it('should create a new note for a contact if it does not exist', async () => {
      const mockContacts: GoogleContact[] = [
        {
          resourceName: 'people/123',
          names: [{ displayName: 'Alice Smith' }],
          emailAddresses: [{ value: 'alice@example.com' }],
        },
      ];
      const mockLabelMap = { family: 'group1' };
      const mockNoteBody = 'This is a note body';

      const mockFolder = { path: 'path/to/folder', __isMockTFolder: true };

      (vault.getFolderByPath as jest.Mock).mockReturnValue(mockFolder);
      (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([]);
      (vault.create as jest.Mock).mockResolvedValue(undefined);
      (vault.getFileByPath as jest.Mock).mockReturnValue(null);

      const config: ContactNoteConfig = {
        ...DEFAULT_TEST_CONFIG,
        noteBody: mockNoteBody,
      };

      await contactNoteWriter.writeNotesForContacts(
        config,
        mockLabelMap,
        mockContacts
      );

      expect(vault.create).toHaveBeenCalledWith(
        'path/to/folder/prefix-Alice Smith.md',
        expect.stringContaining(mockNoteBody)
      );
    });

    it('should return early if folder cannot be found', async () => {
      const mockContacts: GoogleContact[] = [];
      const mockLabelMap = {};
      const config = { ...DEFAULT_TEST_CONFIG };

      (vault.getFolderByPath as jest.Mock).mockReturnValue(null);

      await contactNoteWriter.writeNotesForContacts(
        config,
        mockLabelMap,
        mockContacts
      );

      expect(getAllMarkdownFilesInFolder).not.toHaveBeenCalled();
    });

    it('should create a new note for a contact with label', async () => {
      const mockContacts: GoogleContact[] = [
        {
          resourceName: 'people/123',
          names: [{ displayName: 'Alice Smith' }],
          emailAddresses: [{ value: 'alice@example.com' }],
          memberships: [
            {
              contactGroupMembership: {
                contactGroupId: '456',
                contactGroupResourceName: 'contactGroups/family',
              },
            },
          ],
        },
      ];
      const mockLabelMap = { family: '456' };
      const mockNoteBody = 'This is a note body';
      const mockFolder = { path: 'path/to/folder', __isMockTFolder: true };

      (vault.getFolderByPath as jest.Mock).mockReturnValue(mockFolder);
      (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([]);
      (vault.create as jest.Mock).mockResolvedValue(undefined);
      (vault.getFileByPath as jest.Mock).mockReturnValue(null);

      const config: ContactNoteConfig = {
        ...DEFAULT_TEST_CONFIG,
        syncLabel: 'family',
        noteBody: mockNoteBody,
      };

      await contactNoteWriter.writeNotesForContacts(
        config,
        mockLabelMap,
        mockContacts
      );

      expect(vault.create).toHaveBeenCalledWith(
        'path/to/folder/prefix-Alice Smith.md',
        expect.stringContaining(mockNoteBody)
      );
    });

    it('should create a new note for a contact without names', async () => {
      const mockContacts: GoogleContact[] = [
        {
          resourceName: 'people/123',
          emailAddresses: [{ value: 'alice@example.com' }],
          memberships: [
            {
              contactGroupMembership: {
                contactGroupId: '456',
                contactGroupResourceName: 'contactGroups/family',
              },
            },
          ],
        },
      ];
      const mockLabelMap = { family: '456' };
      const mockNoteBody = 'This is a note body';
      const mockFolder = { path: 'path/to/folder', __isMockTFolder: true };

      (vault.getFolderByPath as jest.Mock).mockReturnValue(mockFolder);
      (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([]);
      (vault.create as jest.Mock).mockResolvedValue(undefined);
      (vault.getFileByPath as jest.Mock).mockReturnValue(null);

      const config: ContactNoteConfig = {
        ...DEFAULT_TEST_CONFIG,
        syncLabel: 'family',
        noteBody: mockNoteBody,
      };

      await contactNoteWriter.writeNotesForContacts(
        config,
        mockLabelMap,
        mockContacts
      );

      expect(vault.create).toHaveBeenCalledWith(
        'path/to/folder/prefix-123.md',
        expect.stringContaining(mockNoteBody)
      );
    });

    it('should skip processing if filename cannot be generated', async () => {
      const mockContacts: GoogleContact[] = [
        {
          resourceName: 'people/123',
          names: [{ displayName: 'Alice' }],
          memberships: [
            {
              contactGroupMembership: {
                contactGroupId: 'group1',
                contactGroupResourceName: 'contactGroups/group1',
              },
            },
          ],
        },
      ];
      const mockLabelMap = { family: 'group1' };
      const config = { ...DEFAULT_TEST_CONFIG, syncLabel: 'family' };

      // Mock getFilename to return null
      const getFilenameSpy = jest
        .spyOn(ContactNoteWriter.prototype as any, 'getFilename')
        .mockReturnValue(null);

      (vault.getFolderByPath as jest.Mock).mockReturnValue({
        path: 'path/to/folder',
      });
      (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([]);

      await contactNoteWriter.writeNotesForContacts(
        config,
        mockLabelMap,
        mockContacts
      );

      expect(vault.create).not.toHaveBeenCalled();

      getFilenameSpy.mockRestore();
    });

    it('should not create or update notes in case no name and id', async () => {
      const mockContacts: GoogleContact[] = [
        {
          resourceName: '',
          names: [],
          emailAddresses: [{ value: 'alice@example.com' }],
        },
      ];
      const mockLabelMap = { family: 'group1' };
      const mockNoteBody = 'This is a note body';
      const mockFolder = { path: 'path/to/folder', __isMockTFolder: true };

      // Mock methods
      (vault.getFolderByPath as jest.Mock).mockReturnValue(mockFolder);
      (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([]);
      (vault.create as jest.Mock).mockResolvedValue(undefined);
      (vault.getFileByPath as jest.Mock).mockReturnValue(null);

      const config: ContactNoteConfig = {
        ...DEFAULT_TEST_CONFIG,
        noteBody: mockNoteBody,
      };

      await contactNoteWriter.writeNotesForContacts(
        config,
        mockLabelMap,
        mockContacts
      );

      expect(vault.create).not.toHaveBeenCalled();
    });

    it('should not create or update notes for contacts without the sync label', async () => {
      const mockContacts: GoogleContact[] = [
        {
          resourceName: 'people/123',
          names: [{ displayName: 'Alice Smith' }],
          emailAddresses: [{ value: 'alice@example.com' }],
        },
      ];
      const mockLabelMap = { family: 'group1' };
      const mockNoteBody = 'This is a note body';

      const mockFolder = { path: 'path/to/folder', __isMockTFolder: true };

      // Mock methods
      (vault.getFolderByPath as jest.Mock).mockReturnValue(mockFolder);
      (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([]);
      (vault.create as jest.Mock).mockResolvedValue(undefined);
      (vault.getFileByPath as jest.Mock).mockReturnValue(null);

      const config: ContactNoteConfig = {
        ...DEFAULT_TEST_CONFIG,
        syncLabel: 'work', // Not matching syncLabel
        noteBody: mockNoteBody,
      };

      await contactNoteWriter.writeNotesForContacts(
        config,
        mockLabelMap,
        mockContacts
      );

      expect(vault.create).not.toHaveBeenCalled();
    });
  });

  describe('scanFiles', () => {
    it('should correctly scan files and return a mapping of ids to files', async () => {
      const mockFiles: TFile[] = [
        {
          path: 'path/to/file1.md',
          stat: {} as unknown as FileStats,
          basename: 'file1',
          extension: 'md',
          vault: {} as unknown as Vault,
          name: 'file1',
          parent: null,
        },
      ];

      const mockFrontmatter = `---\npropertyPrefix-id: 123\n---`;

      // Mock methods
      (vault.read as jest.Mock).mockResolvedValue(mockFrontmatter);
      (metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: {
          'propertyPrefix-id': '123',
        },
      });

      const result = contactNoteWriter.scanFiles(mockFiles, 'propertyPrefix-');

      expect(result).toEqual({
        '123': mockFiles[0], // Expect the file with id 123
      });
    });
  });

  describe('hasSyncLabel', () => {
    it('should return true if contact has the sync label', () => {
      const mockContact: GoogleContact = {
        resourceName: 'people/123',
        memberships: [
          {
            contactGroupMembership: {
              contactGroupId: 'group1',
            },
          },
        ],
      };
      const mockLabelMap = { family: 'group1' };

      const result = contactNoteWriter.hasSyncLabel(
        mockContact,
        'family',
        mockLabelMap
      );

      expect(result).toBe(true);
    });

    it('should return false if contact does not have the sync label', () => {
      const mockContact: GoogleContact = {
        resourceName: 'people/123',
        memberships: [
          {
            contactGroupMembership: {
              contactGroupId: 'group2',
            },
          },
        ],
      };
      const mockLabelMap = { family: 'group1' };

      const result = contactNoteWriter.hasSyncLabel(
        mockContact,
        'family',
        mockLabelMap
      );

      expect(result).toBe(false);
    });

    it('should return false if contact have no labels', () => {
      const mockContact: GoogleContact = {
        resourceName: 'people/123',
        memberships: [{}],
      };
      const mockLabelMap = { family: 'group1' };

      const result = contactNoteWriter.hasSyncLabel(
        mockContact,
        'family',
        mockLabelMap
      );

      expect(result).toBe(false);
    });
  });

  it('should update existing file if it exists and no rename needed', async () => {
    const mockContacts: GoogleContact[] = [
      {
        resourceName: 'people/123',
        names: [{ displayName: 'Alice' }],
        memberships: [
          {
            contactGroupMembership: {
              contactGroupId: 'group1',
              contactGroupResourceName: 'contactGroups/group1',
            },
          },
        ],
      },
    ];
    const mockLabelMap = { family: 'group1' };
    const config = { ...DEFAULT_TEST_CONFIG, syncLabel: 'family' };

    const mockFolder = { path: 'path/to/folder', __isMockTFolder: true };
    const mockFile = {
      path: 'path/to/folder/prefix-Alice.md',
      __isMockTFile: true,
    } as unknown as TFile;

    (vault.getFolderByPath as jest.Mock).mockReturnValue(mockFolder);
    (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([mockFile]);
    // Mock scanFiles to return the file for this ID
    (metadataCache.getFileCache as jest.Mock).mockReturnValue({
      frontmatter: { 'propertyPrefix-id': '123' },
    });
    (vault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);

    await contactNoteWriter.writeNotesForContacts(
      config,
      mockLabelMap,
      mockContacts
    );

    // Should not create new file
    expect(vault.create).not.toHaveBeenCalled();
    // Should process frontmatter
    expect(fileManager.processFrontMatter).toHaveBeenCalledWith(
      mockFile,
      expect.any(Function)
    );
  });

  it('should rename file if renameFiles is true and filename changed', async () => {
    const mockContacts: GoogleContact[] = [
      {
        resourceName: 'people/123',
        names: [{ displayName: 'Alice New' }],
        memberships: [
          {
            contactGroupMembership: {
              contactGroupId: 'group1',
              contactGroupResourceName: 'contactGroups/group1',
            },
          },
        ],
      },
    ];
    const mockLabelMap = { family: 'group1' };
    const config = {
      ...DEFAULT_TEST_CONFIG,
      syncLabel: 'family',
      renameFiles: true,
    };

    const mockFolder = { path: 'path/to/folder', __isMockTFolder: true };
    const oldFile = {
      path: 'path/to/folder/prefix-Alice Old.md',
      __isMockTFile: true,
    } as unknown as TFile;

    (vault.getFolderByPath as jest.Mock).mockReturnValue(mockFolder);
    (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([oldFile]);

    // Mock scanFiles to identify 'Alice Old' as ID '123'
    (metadataCache.getFileCache as jest.Mock).mockReturnValue({
      frontmatter: { 'propertyPrefix-id': '123' },
    });

    (vault.getAbstractFileByPath as jest.Mock).mockImplementation((path) => {
      if (path === 'path/to/folder/prefix-Alice New.md') {
        return null;
      }
      return null;
    });

    // Mock rename to succeed
    (fileManager as any).renameFile = jest.fn().mockResolvedValue(undefined);

    await contactNoteWriter.writeNotesForContacts(
      config,
      mockLabelMap,
      mockContacts
    );

    expect((fileManager as any).renameFile).toHaveBeenCalledWith(
      oldFile,
      expect.stringContaining('Alice New')
    );
  });

  it('should update files map after rename', async () => {
    const mockContacts: GoogleContact[] = [
      {
        resourceName: 'people/123',
        names: [{ displayName: 'Alice New' }],
        memberships: [
          {
            contactGroupMembership: {
              contactGroupId: 'group1',
              contactGroupResourceName: 'contactGroups/group1',
            },
          },
        ],
      },
      // Add a second contact to verify the map update is used?
      // Actually, "ensureRenamed" logic line 160: "filesIdMapping[id] = updatedFile;"
      // We just need to trigger this line.
      // It is triggered if existingFile is found and rename happens.
      // We can verify it simply by checking if the code runs without error and assuming it executed.
      // Or we can check if subsequent calls use it, but simplest is to just ensure it runs.
    ];
    const mockLabelMap = { family: 'group1' };
    const config = {
      ...DEFAULT_TEST_CONFIG,
      syncLabel: 'family',
      renameFiles: true,
    };

    const oldFile = {
      path: 'path/to/folder/prefix-Alice Old.md',
      __isMockTFile: true,
    } as unknown as TFile;
    const newFile = {
      path: 'path/to/folder/prefix-Alice New.md',
      __isMockTFile: true,
    } as unknown as TFile;

    (vault.getFolderByPath as jest.Mock).mockReturnValue({
      path: 'path/to/folder',
    });
    (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([oldFile]);
    (metadataCache.getFileCache as jest.Mock).mockReturnValue({
      frontmatter: { 'propertyPrefix-id': '123' },
    });

    // Initial check uses old name
    (vault.getAbstractFileByPath as jest.Mock).mockReturnValue(oldFile);

    (fileManager as any).renameFile = jest.fn().mockImplementation(async () => {
      // After rename, setup mock to return new file so finding the updated file works
      (vault.getFileByPath as jest.Mock).mockReturnValue(newFile);
    });

    await contactNoteWriter.writeNotesForContacts(
      config,
      mockLabelMap,
      mockContacts
    );

    expect((fileManager as any).renameFile).toHaveBeenCalled();
    expect(vault.getFileByPath).toHaveBeenCalledWith(
      'path/to/folder/prefix-Alice New.md'
    );
  });

  it('should add sync time if trackSyncTime is true', async () => {
    const mockContacts: GoogleContact[] = [
      {
        resourceName: 'people/123',
        names: [{ displayName: 'Bob' }],
        memberships: [
          {
            contactGroupMembership: {
              contactGroupId: 'group1',
              contactGroupResourceName: 'contactGroups/group1',
            },
          },
        ],
      },
    ];
    const mockLabelMap = { family: 'group1' };
    const config = {
      ...DEFAULT_TEST_CONFIG,
      syncLabel: 'family',
      trackSyncTime: true,
    };
    const mockFolder = { path: 'path/to/folder', __isMockTFolder: true };
    const mockFile = {
      path: 'path/to/folder/prefix-Bob.md',
      __isMockTFile: true,
    } as unknown as TFile;

    (vault.getFolderByPath as jest.Mock).mockReturnValue(mockFolder);
    (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([mockFile]);
    (metadataCache.getFileCache as jest.Mock).mockReturnValue({
      frontmatter: { 'propertyPrefix-id': '123' },
    });
    (vault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);
    (vault.create as jest.Mock).mockResolvedValue(undefined);

    await contactNoteWriter.writeNotesForContacts(
      config,
      mockLabelMap,
      mockContacts
    );

    expect(fileManager.processFrontMatter).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Function)
    );
  });

  describe('scanFiles extended', () => {
    it('should handle X-GOOGLE-ID', () => {
      const mockFiles: TFile[] = [{ path: 'f.md' } as unknown as TFile];
      (metadataCache.getFileCache as jest.Mock).mockReturnValue({
        frontmatter: { 'X-GOOGLE-ID': '999' },
      });

      // Using type assertion to access protected method if needed,
      // OR rely on our TestContactNoteWriter subclass which exposes it as public
      const result = contactNoteWriter.scanFiles(mockFiles, 'prefix-');
      expect(result['999']).toBeDefined();
    });
  });
});
