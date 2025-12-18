import { ContactAuditService } from '../core/ContactAuditService';
import { App, TFolder, TFile } from 'obsidian'; // Mock these
import { GoogleContactsService } from '../core/GoogleContactsService';
import { ContactSyncSettings } from '../types/Settings';
import { getAllMarkdownFilesInFolder } from '../utils/getAllMarkdownFilesInFolder';

// Mock Obsidian classes removed unused mockFile function

// Mock the module
jest.mock('../utils/getAllMarkdownFilesInFolder');

describe('ContactAuditService', () => {
  let app: App;
  let googleService: GoogleContactsService;
  let settings: ContactSyncSettings;
  let service: ContactAuditService;
  let mockVault: Record<string, jest.Mock>;
  let mockMetadataCache: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset getAllMarkdownFilesInFolder mock
    (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([]);

    mockVault = {
      getFolderByPath: jest.fn(),
      getAbstractFileByPath: jest.fn(),
      modify: jest.fn(),
      create: jest.fn(),
    };
    mockMetadataCache = {
      getFileCache: jest.fn(),
    };
    app = {
      vault: mockVault,
      metadataCache: mockMetadataCache,
      workspace: {
        getLeaf: jest.fn().mockReturnValue({ openFile: jest.fn() }),
      },
    } as unknown as App;

    googleService = {
      fetchGoogleGroups: jest.fn(),
      fetchGoogleContacts: jest.fn(),
    } as unknown as GoogleContactsService;

    settings = {
      contactsFolder: 'Contacts',
      syncLabel: 'My Contacts',
      accessToken: 'valid-token',
    } as unknown as ContactSyncSettings;

    // Default valid mocks
    (googleService.fetchGoogleGroups as jest.Mock).mockResolvedValue({
      'My Contacts': 'group/1',
    });
    (googleService.fetchGoogleContacts as jest.Mock).mockResolvedValue([]);

    // Mock TFolder return
    mockVault.getAbstractFileByPath.mockImplementation((path: string) => {
      if (path === 'Contacts') return new TFolder(); // Using mocked TFolder
      return null;
    });

    service = new ContactAuditService(app, googleService, settings);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle missing contacts folder', async () => {
    mockVault.getAbstractFileByPath.mockReturnValue(null);
    await service.auditContacts('token');
    // valid, implies it returned early without throwing
    expect(mockVault.create).not.toHaveBeenCalled();
  });

  it('should handle fetchGoogleGroups failure', async () => {
    (googleService.fetchGoogleGroups as jest.Mock).mockRejectedValue(
      new Error('Fail')
    );
    await service.auditContacts('token');
    expect(mockVault.create).not.toHaveBeenCalled();
  });

  it('should handle fetchGoogleContacts failure', async () => {
    (googleService.fetchGoogleContacts as jest.Mock).mockRejectedValue(
      new Error('Fail')
    );
    await service.auditContacts('token');
    expect(mockVault.create).not.toHaveBeenCalled();
  });

  it('should identify orphaned contacts correctly', async () => {
    // 1. Google Data
    // Contact "A" exists and has label
    const contactA = {
      resourceName: 'people/contactA',
      memberships: [{ contactGroupMembership: { contactGroupId: 'group/1' } }],
    };
    (googleService.fetchGoogleContacts as jest.Mock).mockResolvedValue([
      contactA,
    ]);

    // 2. Local Files
    // File A matches contact A
    const fileA = { basename: 'A', path: 'Contacts/A.md' } as TFile;
    // File B is orphaned (ID not in Google)
    const fileB = { basename: 'B', path: 'Contacts/B.md' } as TFile;
    // File C has no ID (skipped)
    const fileC = { basename: 'C', path: 'Contacts/C.md' } as TFile;

    // Mock getAllMarkdownFilesInFolder return
    (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([
      fileA,
      fileB,
      fileC,
    ]);

    // Mock metadata
    mockMetadataCache.getFileCache.mockImplementation((file: TFile) => {
      if (file === fileA) return { frontmatter: { id: 'contactA' } };
      if (file === fileB) return { frontmatter: { id: 'contactB' } };
      return {};
    });

    await service.auditContacts('token');

    // Check report generation
    expect(mockVault.create).toHaveBeenCalledWith(
      expect.stringContaining('Report'),
      expect.stringContaining('Found 1 orphaned') // Only B is orphan
    );
    expect(mockVault.create).toHaveBeenCalledWith(
      expect.stringContaining('Report'),
      expect.stringContaining('B.md')
    );
  });

  it('should report no orphans when all align', async () => {
    // Google: Contact A
    (googleService.fetchGoogleContacts as jest.Mock).mockResolvedValue([
      {
        resourceName: 'people/contactA',
        memberships: [
          { contactGroupMembership: { contactGroupId: 'group/1' } },
        ],
      },
    ]);

    // Local: File A
    const fileA = { basename: 'A', path: 'Contacts/A.md' } as TFile;

    (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([fileA]);

    mockMetadataCache.getFileCache.mockReturnValue({
      frontmatter: { id: 'contactA' },
    });

    await service.auditContacts('token');

    expect(mockVault.create).toHaveBeenCalledWith(
      expect.stringContaining('Report'),
      expect.stringContaining('No orphaned contacts found')
    );
  });

  it('should filter contacts by sync label correctly', async () => {
    // Google: Contact A (wrong label), Contact B (correct label)
    const contactA = {
      resourceName: 'people/contactA',
      memberships: [
        { contactGroupMembership: { contactGroupId: 'group/wrong' } },
      ],
    };
    const contactB = {
      resourceName: 'people/contactB',
      memberships: [{ contactGroupMembership: { contactGroupId: 'group/1' } }], // Correct
    };
    (googleService.fetchGoogleContacts as jest.Mock).mockResolvedValue([
      contactA,
      contactB,
    ]);

    // Local: File A (should be orphan because Google contact A is filtered out)
    // Local: File B (matches)
    const fileA = { basename: 'A', path: 'Contacts/A.md' } as TFile;
    const fileB = { basename: 'B', path: 'Contacts/B.md' } as TFile;

    (getAllMarkdownFilesInFolder as jest.Mock).mockReturnValue([fileA, fileB]);

    mockMetadataCache.getFileCache.mockImplementation((file: TFile) => {
      if (file === fileA) return { frontmatter: { id: 'contactA' } };
      if (file === fileB) return { frontmatter: { id: 'contactB' } };
      return {};
    });

    await service.auditContacts('token');

    expect(mockVault.create).toHaveBeenCalledWith(
      expect.stringContaining('Report'),
      expect.stringContaining('Found 1 orphaned')
    );
    // Expect A to be in report because its counterpart in Google didn't have the label
    expect(mockVault.create).toHaveBeenCalledWith(
      expect.stringContaining('Report'),
      expect.stringContaining('A.md')
    );
  });
});
