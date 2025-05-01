import { ContactNoteWriter } from '../../core/ContactNoteWriter';
import { Vault, TFile, FileStats } from 'obsidian';
import { GoogleContact } from 'src/types/Contact';
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

describe('ContactNoteWriter', () => {
  let contactNoteWriter: ContactNoteWriter;
  let vault: Vault;

  beforeEach(() => {
    vault = new Vault() as unknown as Vault;
    contactNoteWriter = new ContactNoteWriter(vault);
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

      (vault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFolder);
      (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([]);
      (vault.create as jest.Mock).mockResolvedValue(undefined);
      (vault.getFileByPath as jest.Mock).mockResolvedValue(null);

      await contactNoteWriter.writeNotesForContacts(
        'prefix-',
        'propertyPrefix-',
        '',
        mockLabelMap,
        mockContacts,
        'path/to/folder',
        mockNoteBody
      );

      expect(vault.create).toHaveBeenCalledWith(
        'path/to/folder/prefix-Alice Smith.md',
        expect.stringContaining('---')
      );
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

      (vault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFolder);
      (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([]);
      (vault.create as jest.Mock).mockResolvedValue(undefined);
      (vault.getFileByPath as jest.Mock).mockResolvedValue(null);

      await contactNoteWriter.writeNotesForContacts(
        'prefix-',
        'propertyPrefix-',
        'family',
        mockLabelMap,
        mockContacts,
        'path/to/folder',
        mockNoteBody
      );

      expect(vault.create).toHaveBeenCalledWith(
        'path/to/folder/prefix-Alice Smith.md',
        expect.stringContaining('---')
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

      (vault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFolder);
      (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([]);
      (vault.create as jest.Mock).mockResolvedValue(undefined);
      (vault.getFileByPath as jest.Mock).mockResolvedValue(null);

      await contactNoteWriter.writeNotesForContacts(
        'prefix-',
        'propertyPrefix-',
        'family',
        mockLabelMap,
        mockContacts,
        'path/to/folder',
        mockNoteBody
      );

      expect(vault.create).toHaveBeenCalledWith(
        'path/to/folder/prefix-123.md',
        expect.stringContaining('---')
      );
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
      (vault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFolder);
      (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([]);
      (vault.create as jest.Mock).mockResolvedValue(undefined);
      (vault.getFileByPath as jest.Mock).mockResolvedValue(null);

      await contactNoteWriter.writeNotesForContacts(
        'prefix-',
        'propertyPrefix-',
        '',
        mockLabelMap,
        mockContacts,
        'path/to/folder',
        mockNoteBody
      );

      expect(vault.create).not.toHaveBeenCalled();
    });

    /* Code was refactored to use vault.process instead of vault.modify.
     * @TODO: Refactor the test to use vault.process instead of vault.modify
     */
    // it('should update an existing note for a contact if it already exists', async () => {
    //   const mockContacts: GoogleContact[] = [
    //     {
    //       resourceName: 'people/123',
    //       names: [{ displayName: 'Alice Smith' }],
    //       emailAddresses: [{ value: 'alice@example.com' }],
    //     } as GoogleContact,
    //   ];
    //   const mockLabelMap = { family: 'group1' };
    //   const mockNoteBody = 'This is a note body';

    //   const mockFile = {
    //     path: 'path/to/folder/prefix-Alice Smith.md',
    //     __isMockTFolder: true,
    //   }; // Existing file mock
    //   const mockExistingContent =
    //     '---\npropertyPrefix-id: 123\n---\nBody content';

    //   // Mock methods
    //   (vault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);
    //   (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([mockFile]);
    //   (vault.read as jest.Mock).mockResolvedValue(mockExistingContent);
    //   (vault.process as jest.Mock).mockResolvedValue(undefined);
    //   const transformFn = jest.fn().mockImplementation(() => {});

    //   await contactNoteWriter.writeNotesForContacts(
    //     'prefix-',
    //     'propertyPrefix-',
    //     '',
    //     mockLabelMap,
    //     mockContacts,
    //     'path/to/folder',
    //     mockNoteBody
    //   );

    //   expect(vault.process).toHaveBeenCalledWith(
    //     mockFile,
    //     // expect.stringContaining('propertyPrefix-synced')
    //     contactNoteWriter.modifyNote
    //   );
    // });

    /* Code was refactored to use vault.process instead of vault.modify.
     * @TODO: Refactor the test to use vault.process instead of vault.modify
     */
    // it('should update an existing note without id', async () => {
    //   const mockContacts: GoogleContact[] = [
    //     {
    //       resourceName: 'people/123',
    //       names: [{ displayName: 'Alice Smith' }],
    //       emailAddresses: [{ value: 'alice@example.com' }],
    //     } as GoogleContact,
    //   ];
    //   const mockLabelMap = { family: 'group1' };
    //   const mockNoteBody = 'This is a note body';

    //   const mockFolder = { path: 'path/to/folder', __isMockTFolder: true };
    //   const mockFile = {
    //     path: 'path/to/folder/prefix-Alice Smith.md',
    //     __isMockTFile: true,
    //   }; // Existing file mock
    //   const mockExistingContent = 'Body content';

    //   // Mock methods
    //   (vault.getAbstractFileByPath as jest.Mock)
    //     .mockReturnValueOnce(mockFolder)
    //     .mockReturnValueOnce(mockFile);
    //   (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([mockFile]);
    //   (vault.read as jest.Mock).mockResolvedValue(mockExistingContent);
    //   (vault.process as jest.Mock).mockResolvedValue(undefined);

    //   await contactNoteWriter.writeNotesForContacts(
    //     'prefix-',
    //     'propertyPrefix-',
    //     '',
    //     mockLabelMap,
    //     mockContacts,
    //     'path/to/folder',
    //     mockNoteBody
    //   );

    //   expect(vault.process).toHaveBeenCalledWith(
    //     mockFile,
    //     expect.stringContaining('propertyPrefix-synced')
    //   );
    // });

    /* Code was refactored to use vault.process instead of vault.modify.
     * @TODO: Refactor the test to use vault.process instead of vault.modify
     */
    // it('should update an existing note without id, begins with ---, but not yaml', async () => {
    //   const mockContacts: GoogleContact[] = [
    //     {
    //       resourceName: 'people/123',
    //       names: [{ displayName: 'Alice Smith' }],
    //       emailAddresses: [{ value: 'alice@example.com' }],
    //     } as GoogleContact,
    //   ];
    //   const mockLabelMap = { family: 'group1' };
    //   const mockNoteBody = 'This is a note body';

    //   const mockFolder = { path: 'path/to/folder', __isMockTFolder: true };
    //   const mockFile = {
    //     path: 'path/to/folder/prefix-Alice Smith.md',
    //     __isMockTFile: true,
    //   }; // Existing file mock
    //   const mockExistingContent = '---\nBody content';

    //   // Mock methods
    //   (vault.getAbstractFileByPath as jest.Mock)
    //     .mockReturnValueOnce(mockFolder)
    //     .mockReturnValueOnce(mockFile);
    //   (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([mockFile]);
    //   (vault.read as jest.Mock).mockResolvedValue(mockExistingContent);
    //   (vault.process as jest.Mock).mockResolvedValue(undefined);

    //   await contactNoteWriter.writeNotesForContacts(
    //     'prefix-',
    //     'propertyPrefix-',
    //     '',
    //     mockLabelMap,
    //     mockContacts,
    //     'path/to/folder',
    //     mockNoteBody
    //   );

    //   expect(vault.process).toHaveBeenCalledWith(
    //     mockFile,
    //     expect.stringContaining('propertyPrefix-synced')
    //   );
    // });

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
      (vault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFolder);
      (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([]);
      (vault.create as jest.Mock).mockResolvedValue(undefined);
      (vault.getFileByPath as jest.Mock).mockResolvedValue(null);

      await contactNoteWriter.writeNotesForContacts(
        'prefix-',
        'propertyPrefix-',
        'work', // Not matching syncLabel
        mockLabelMap,
        mockContacts,
        'path/to/folder',
        mockNoteBody
      );

      expect(vault.create).not.toHaveBeenCalled();
    });

    it('should not create or update notes in case of wrong folder', async () => {
      const mockContacts: GoogleContact[] = [
        {
          resourceName: 'people/123',
          names: [{ displayName: 'Alice Smith' }],
          emailAddresses: [{ value: 'alice@example.com' }],
        },
      ];
      const mockLabelMap = { family: 'group1' };
      const mockNoteBody = 'This is a note body';

      const mockFolder = {};

      // Mock methods
      (vault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFolder);
      (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([]);
      (vault.create as jest.Mock).mockResolvedValue(undefined);
      (vault.getFileByPath as jest.Mock).mockResolvedValue(null);

      await contactNoteWriter.writeNotesForContacts(
        'prefix-',
        'propertyPrefix-',
        '',
        mockLabelMap,
        mockContacts,
        'path/to/folder',
        mockNoteBody
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

      const result = await contactNoteWriter['scanFiles'](
        mockFiles,
        'propertyPrefix-'
      );

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

      const result = contactNoteWriter['hasSyncLabel'](
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

      const result = contactNoteWriter['hasSyncLabel'](
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

      const result = contactNoteWriter['hasSyncLabel'](
        mockContact,
        'family',
        mockLabelMap
      );

      expect(result).toBe(false);
    });
  });
});
