import { GoogleContactsService } from '../../services/GoogleContactsService';
import { requestUrl } from 'obsidian';
import {
  URL_PEOPLE_CONNECTIONS,
  URL_PEOPLE_BASE,
  PERSONAL_FIELDS,
  URL_CONTACT_GROUPS,
} from '../../config';
import type { GoogleContact, GoogleContactGroup } from '../../types/Contact';

jest.mock('obsidian', () => ({
  requestUrl: jest.fn().mockResolvedValue({
    json: Promise.resolve({
      connections: jest.fn(),
    }),
  }),
}));

describe('GoogleContactsService', () => {
  let googleContactsService: GoogleContactsService;
  const mockToken = 'mock-access-token';

  beforeEach(() => {
    googleContactsService = new GoogleContactsService();
  });

  describe('fetchGoogleContacts', () => {
    it('should fetch Google contacts successfully', async () => {
      const mockContacts: GoogleContact[] = [
        {
          resourceName: 'people/123',
          etag: 'etag-123',
          names: [{ displayName: 'Alice Smith' }],
          emailAddresses: [{ value: 'alice@example.com' }],
        },
        {
          resourceName: 'people/456',
          etag: 'etag-456',
          names: [{ displayName: 'Bob Johnson' }],
          emailAddresses: [{ value: 'bob@example.com' }],
        },
      ];

      (requestUrl as jest.Mock).mockResolvedValue({
        json: Promise.resolve({
          connections: mockContacts,
        }),
      });

      const result = await googleContactsService.fetchGoogleContacts(mockToken);

      expect(requestUrl).toHaveBeenCalledWith({
        url: `${URL_PEOPLE_CONNECTIONS}?personFields=${PERSONAL_FIELDS}&pageSize=1000`,
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
      expect(result).toEqual(mockContacts);
    });

    it('should return an empty array if no contacts are found', async () => {
      (requestUrl as jest.Mock).mockResolvedValue({
        json: [],
      });

      const result = await googleContactsService.fetchGoogleContacts(mockToken);

      expect(result).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => { });
      (requestUrl as jest.Mock).mockRejectedValue(
        new Error('API request failed')
      );

      expect(
        await googleContactsService.fetchGoogleContacts(mockToken)
      ).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('fetchGoogleGroups', () => {
    it('should fetch Google groups successfully', async () => {
      const mockGroups: GoogleContactGroup[] = [
        { name: 'Family', resourceName: 'contactGroups/group1' },
        { name: 'Work', resourceName: 'contactGroups/group2' },
      ];

      (requestUrl as jest.Mock).mockResolvedValue({
        json: { contactGroups: mockGroups },
      });

      const result = await googleContactsService.fetchGoogleGroups(mockToken);

      expect(requestUrl).toHaveBeenCalledWith({
        url: URL_CONTACT_GROUPS,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
      expect(result).toEqual({
        family: 'group1',
        work: 'group2',
      });
    });

    it('should return an empty object if no groups are found', async () => {
      (requestUrl as jest.Mock).mockResolvedValue({
        json: { contactGroups: [] },
      });

      const result = await googleContactsService.fetchGoogleGroups(mockToken);

      expect(result).toEqual({});
    });

    it('should handle missing contactGroups field gracefully', async () => {
      (requestUrl as jest.Mock).mockResolvedValue({
        json: {},
      });

      const result = await googleContactsService.fetchGoogleGroups(mockToken);

      expect(result).toEqual({});
    });

    it('should handle API errors gracefully', async () => {
      (requestUrl as jest.Mock).mockRejectedValue(
        new Error('API request failed')
      );

      await expect(
        googleContactsService.fetchGoogleGroups(mockToken)
      ).rejects.toThrow('API request failed');
    });

    it('should return an empty object when no contactGroups are provided', async () => {
      const mockData = {
        contactGroups: [],
      };

      (requestUrl as jest.Mock).mockResolvedValue({
        json: Promise.resolve(mockData),
      });

      const result = await googleContactsService.fetchGoogleGroups('someToken');

      expect(result).toEqual({});
    });

    it('should map group names to their resource names', async () => {
      const mockData = {
        contactGroups: [
          {
            name: 'Family',
            resourceName: 'contactGroups/group1',
          },
          {
            name: 'Friends',
            resourceName: 'contactGroups/group2',
          },
        ],
      };

      (requestUrl as jest.Mock).mockResolvedValue({
        json: Promise.resolve(mockData),
      });

      const result = await googleContactsService.fetchGoogleGroups('someToken');

      const expectedLabelMap = {
        family: 'group1',
        friends: 'group2',
      };

      expect(result).toEqual(expectedLabelMap);
    });

    it('should remove "contactGroups/" from resourceName', async () => {
      const mockData = {
        contactGroups: [
          {
            name: 'Work',
            resourceName: 'contactGroups/workGroup',
          },
        ],
      };

      (requestUrl as jest.Mock).mockResolvedValue({
        json: Promise.resolve(mockData),
      });

      const result = await googleContactsService.fetchGoogleGroups('someToken');

      const expectedLabelMap = {
        work: 'workGroup',
      };

      expect(result).toEqual(expectedLabelMap);
    });

    it('should not add group to labelMap if name or resourceName is missing', async () => {
      const mockData = {
        contactGroups: [
          {
            name: 'Team',
            resourceName: 'contactGroups/teamGroup',
          },
          {
            name: '', // invalid name
            resourceName: 'contactGroups/invalidGroup',
          },
          {
            name: 'Other', // valid name
            resourceName: '', // invalid resourceName
          },
        ],
      };

      (requestUrl as jest.Mock).mockResolvedValue({
        json: Promise.resolve(mockData),
      });

      const result = await googleContactsService.fetchGoogleGroups('someToken');

      const expectedLabelMap = {
        team: 'teamGroup',
      };

      expect(result).toEqual(expectedLabelMap);
    });
  });

  describe('fetchContact', () => {
    it('should fetch a single contact successfully', async () => {
      const mockContact: GoogleContact = {
        resourceName: 'people/123',
        etag: 'etag-123',
        names: [{ displayName: 'Alice Smith' }],
        emailAddresses: [{ value: 'alice@example.com' }],
      };

      (requestUrl as jest.Mock).mockResolvedValue({
        json: mockContact,
      });

      const result = await googleContactsService.fetchContact(
        'people/123',
        mockToken
      );

      expect(requestUrl).toHaveBeenCalledWith({
        url: `${URL_PEOPLE_BASE}/people/123?personFields=${PERSONAL_FIELDS}`,
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
      expect(result).toEqual(mockContact);
    });

    it('should return null if contact is not found', async () => {
      (requestUrl as jest.Mock).mockRejectedValue(new Error('Not Found'));

      const result = await googleContactsService.fetchContact(
        'people/unknown',
        mockToken
      );

      expect(result).toBeNull();
    });
  });

  describe('updateContactNote', () => {
    it('should update contact note successfully', async () => {
      const mockContact: GoogleContact = {
        resourceName: 'people/123',
        etag: 'etag-123',
        metadata: {
          sources: [{ type: 'CONTACT', id: 'source1' }],
        },
      };

      // Mock fetchContact response
      (requestUrl as jest.Mock).mockImplementation((params) => {
        if (params.url.includes('/people/123?')) {
          return Promise.resolve({ json: mockContact });
        }
        if (params.method === 'PATCH') {
          return Promise.resolve({ json: { ...mockContact } });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const result = await googleContactsService.updateContactNote(
        'people/123',
        'New Note Content',
        mockToken
      );

      expect(result).toBe(true);
      expect(requestUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${URL_PEOPLE_BASE}/people/123:updateContact?updatePersonFields=userDefined`,
          method: 'PATCH',
          body: JSON.stringify({
            etag: 'etag-123',
            userDefined: [
              {
                key: 'obsidian-note',
                value: 'New Note Content',
              },
            ],
          }),
        })
      );
    });

    it('should return false if contact is read-only (no CONTACT source)', async () => {
      const mockContact: GoogleContact = {
        resourceName: 'people/123',
        etag: 'etag-123',
        metadata: {
          sources: [{ type: 'OTHER_CONTACT', id: 'source1' }],
        },
      };

      (requestUrl as jest.Mock).mockResolvedValue({ json: mockContact });

      const result = await googleContactsService.updateContactNote(
        'people/123',
        'Note',
        mockToken
      );

      expect(result).toBe(false);
    });

    it('should return false if fetchContact fails', async () => {
      (requestUrl as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

      const result = await googleContactsService.updateContactNote(
        'people/123',
        'Note',
        mockToken
      );

      expect(result).toBe(false);
    });
  });
});
