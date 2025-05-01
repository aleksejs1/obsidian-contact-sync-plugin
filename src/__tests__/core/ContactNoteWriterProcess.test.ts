import { ContactNoteWriter } from '../../core/ContactNoteWriter';
import { Vault } from 'obsidian';
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

describe('ContactNoteWriterUpdate', () => {
  let contactNoteWriter: ContactNoteWriter;
  let vault: Vault;

  beforeEach(() => {
    vault = new Vault() as unknown as Vault;
    contactNoteWriter = new ContactNoteWriter(vault);
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
      (vault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);
      (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([mockFile]);
      (vault.read as jest.Mock).mockResolvedValue(mockExistingContent);
      (vault.process as jest.Mock).mockResolvedValue(undefined);

      await contactNoteWriter.writeNotesForContacts(
        'prefix-',
        'propertyPrefix-',
        '',
        mockLabelMap,
        mockContacts,
        'path/to/folder',
        mockNoteBody
      );

      expect(vault.process).toHaveBeenCalledTimes(1);
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
      (vault.getAbstractFileByPath as jest.Mock)
        .mockReturnValueOnce(mockFolder)
        .mockReturnValueOnce(mockFile);
      (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([mockFile]);
      (vault.read as jest.Mock).mockResolvedValue(mockExistingContent);
      (vault.process as jest.Mock).mockResolvedValue(undefined);

      await contactNoteWriter.writeNotesForContacts(
        'prefix-',
        'propertyPrefix-',
        '',
        mockLabelMap,
        mockContacts,
        'path/to/folder',
        mockNoteBody
      );

      expect(vault.process).toHaveBeenCalledTimes(1);
    });

    it('should add block with yaml', async () => {
      expect(
        contactNoteWriter.updateFrontmatterWithContactData('test', { aa: 'bb' })
      ).toBe('---\naa: bb\n---\n\ntest');
    });

    it('should update block with yaml', async () => {
      expect(
        contactNoteWriter.updateFrontmatterWithContactData(
          '---\naa: bb\n---\n\ntest',
          { cc: 'dd' }
        )
      ).toBe('---\npropertyPrefix-id: 123\ncc: dd\n---\n\ntest');
    });

    it('should update block with separator', async () => {
      expect(
        contactNoteWriter.updateFrontmatterWithContactData('---\ntest', {
          aa: 'bb',
        })
      ).toBe('---\naa: bb\n---\n\n---\ntest');
    });

    it('should update existed yaml', async () => {
      expect(
        contactNoteWriter.updateFrontmatterWithContactData(
          '---\npropertyPrefix-id: 1\n---\n\ntest',
          { 'propertyPrefix-id': '123' }
        )
      ).toBe('---\npropertyPrefix-id: 123\n---\n\ntest');
    });
  });
});
