import { MockMetadataCache } from 'src/__mocks__/obsidian';
import { ContactNoteWriter } from '../../services/ContactNoteWriter';
import { FileManager, MetadataCache, Vault } from 'obsidian';
import { GoogleContact } from 'src/types/Contact';
import { ContactNoteConfig } from 'src/types/ContactNoteConfig';
import { NamingStrategy } from 'src/types/Settings';
import { getAllMarkdownFilesInFolder } from 'src/utils/getAllMarkdownFilesInFolder';

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

describe('ContactNoteWriterUpdate', () => {
  let contactNoteWriter: ContactNoteWriter;
  let vault: Vault;
  let metadataCache: MetadataCache;
  let fileManager: FileManager;

  beforeEach(() => {
    vault = new Vault() as unknown as Vault;
    // metadataCache = new MetadataCache();
    metadataCache = new MockMetadataCache() as unknown as MetadataCache;
    fileManager = {
      create: jest.fn(),
      createFolder: jest.fn(),
      getAbstractFileByPath: jest.fn(),
      getFileByPath: jest.fn(),
      process: jest.fn(),
      processFrontMatter: jest.fn(),
    } as unknown as FileManager;
    contactNoteWriter = new ContactNoteWriter(
      vault,
      metadataCache,
      fileManager
    );
  });

  describe('writeNotesForContacts', () => {
    it('should update an existing note for a contact if it already exists', async () => {
      const mockContacts: GoogleContact[] = [
        {
          resourceName: 'people/123',
          names: [{ displayName: 'Alice Smith' }],
          emailAddresses: [{ value: 'alice@example.com' }],
        } as GoogleContact,
      ];
      const mockLabelMap = { family: 'group1' };
      const mockNoteBody = 'This is a note body';

      const mockFile = {
        path: 'path/to/folder/prefix-Alice Smith.md',
        __isMockTFolder: true,
      }; // Existing file mock
      const mockExistingContent =
        '---\npropertyPrefix-id: 123\n---\nBody content';

      // Mock methods
      (vault.getFileByPath as jest.Mock).mockReturnValue(mockFile);
      (vault.getFolderByPath as jest.Mock).mockReturnValue(mockFile);
      (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([mockFile]);
      (vault.read as jest.Mock).mockResolvedValue(mockExistingContent);

      const config: ContactNoteConfig = {
        folderPath: 'path/to/folder',
        prefix: 'prefix-',
        propertyPrefix: 'propertyPrefix-',
        syncLabel: '',
        noteBody: mockNoteBody,
        organizationAsLink: false,
        relationsAsLink: false,
        trackSyncTime: true,
        renameFiles: false,
        namingStrategy: NamingStrategy.Default,
        lastFirst: false,
      };

      await contactNoteWriter.writeNotesForContacts(
        config,
        mockLabelMap,
        mockContacts
      );

      expect(fileManager.processFrontMatter).toHaveBeenCalledTimes(1);
    });

    it('should update an existing note without id, begins with ---, but not yaml', async () => {
      const mockContacts: GoogleContact[] = [
        {
          resourceName: 'people/123',
          names: [{ displayName: 'Alice Smith' }],
          emailAddresses: [{ value: 'alice@example.com' }],
        } as GoogleContact,
      ];
      const mockLabelMap = { family: 'group1' };
      const mockNoteBody = 'This is a note body';

      const mockFolder = { path: 'path/to/folder', __isMockTFolder: true };
      const mockFile = {
        path: 'path/to/folder/prefix-Alice Smith.md',
        __isMockTFile: true,
      }; // Existing file mock
      const mockExistingContent = '---\nBody content';

      // Mock methods
      (vault.getFileByPath as jest.Mock).mockReturnValue(mockFile);
      (vault.getFolderByPath as jest.Mock).mockReturnValue(mockFolder);
      (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([mockFile]);
      (vault.read as jest.Mock).mockResolvedValue(mockExistingContent);

      const config: ContactNoteConfig = {
        folderPath: 'path/to/folder',
        prefix: 'prefix-',
        propertyPrefix: 'propertyPrefix-',
        syncLabel: '',
        noteBody: mockNoteBody,
        organizationAsLink: false,
        relationsAsLink: false,
        trackSyncTime: true,
        renameFiles: false,
        namingStrategy: NamingStrategy.Default,
        lastFirst: false,
      };

      await contactNoteWriter.writeNotesForContacts(
        config,
        mockLabelMap,
        mockContacts
      );

      expect(fileManager.processFrontMatter).toHaveBeenCalledTimes(1);
    });
  });
});
