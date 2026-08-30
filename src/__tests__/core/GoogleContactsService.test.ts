import { GoogleContactsService } from '../../services/GoogleContactsService';
import { requestUrl } from 'obsidian';
import {
  URL_PEOPLE_CONNECTIONS,
  PERSONAL_FIELDS,
  URL_CONTACT_GROUPS,
  URL_CONTACT_GROUPS_BATCH,
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
          names: [{ displayName: 'Alice Smith' }],
          emailAddresses: [{ value: 'alice@example.com' }],
        },
        {
          resourceName: 'people/456',
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
        .mockImplementation(() => {});
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
      (requestUrl as jest.Mock).mockResolvedValue({
        json: Promise.resolve({ contactGroups: [] }),
      });

      const result = await googleContactsService.fetchGoogleGroups('someToken');

      expect(result).toEqual({});
    });

    it('should map group names to their resource names', async () => {
      (requestUrl as jest.Mock).mockResolvedValue({
        json: Promise.resolve({
          contactGroups: [
            { name: 'Family', resourceName: 'contactGroups/group1' },
            { name: 'Friends', resourceName: 'contactGroups/group2' },
          ],
        }),
      });

      const result = await googleContactsService.fetchGoogleGroups('someToken');

      expect(result).toEqual({ family: 'group1', friends: 'group2' });
    });

    it('should remove "contactGroups/" from resourceName', async () => {
      (requestUrl as jest.Mock).mockResolvedValue({
        json: Promise.resolve({
          contactGroups: [{ name: 'Work', resourceName: 'contactGroups/workGroup' }],
        }),
      });

      const result = await googleContactsService.fetchGoogleGroups('someToken');

      expect(result).toEqual({ work: 'workGroup' });
    });

    it('should lowercase group names as keys', async () => {
      (requestUrl as jest.Mock).mockResolvedValue({
        json: Promise.resolve({
          contactGroups: [{ name: 'MyLabel', resourceName: 'contactGroups/abc' }],
        }),
      });

      const result = await googleContactsService.fetchGoogleGroups(mockToken);
      expect(result).toEqual({ mylabel: 'abc' });
    });

    it('should not add group to labelMap if name or resourceName is missing', async () => {
      (requestUrl as jest.Mock).mockResolvedValue({
        json: Promise.resolve({
          contactGroups: [
            { name: 'Team', resourceName: 'contactGroups/teamGroup' },
            { name: '', resourceName: 'contactGroups/invalidGroup' },
            { name: 'Other', resourceName: '' },
          ],
        }),
      });

      const result = await googleContactsService.fetchGoogleGroups('someToken');

      expect(result).toEqual({ team: 'teamGroup' });
    });
  });

  describe('batchGetGroups', () => {
    it('should return empty object for empty input', async () => {
      const result = await googleContactsService.batchGetGroups(mockToken, []);
      expect(result).toEqual({});
      expect(requestUrl).not.toHaveBeenCalled();
    });

    it('should fetch and map groups by ID', async () => {
      (requestUrl as jest.Mock).mockResolvedValue({
        json: Promise.resolve({
          responses: [
            { contactGroup: { name: 'Friends', resourceName: 'contactGroups/abc123' } },
            { contactGroup: { name: 'Family', resourceName: 'contactGroups/def456' } },
          ],
        }),
      });

      const result = await googleContactsService.batchGetGroups(mockToken, ['abc123', 'def456']);

      expect(requestUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining(URL_CONTACT_GROUPS_BATCH),
          method: 'GET',
        })
      );
      expect(result).toEqual({ friends: 'abc123', family: 'def456' });
    });

    it('should skip responses without contactGroup', async () => {
      (requestUrl as jest.Mock).mockResolvedValue({
        json: Promise.resolve({
          responses: [
            { requestedResourceName: 'contactGroups/deleted', contactGroup: undefined },
            { contactGroup: { name: 'Work', resourceName: 'contactGroups/work1' } },
          ],
        }),
      });

      const result = await googleContactsService.batchGetGroups(mockToken, ['deleted', 'work1']);
      expect(result).toEqual({ work: 'work1' });
    });

    it('should return empty object on API error', async () => {
      (requestUrl as jest.Mock).mockRejectedValue(new Error('Network error'));
      const result = await googleContactsService.batchGetGroups(mockToken, ['abc123']);
      expect(result).toEqual({});
    });
  });
});
