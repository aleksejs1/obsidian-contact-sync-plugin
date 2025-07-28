import { GoogleContactsService } from '../../core/GoogleContactsService';
import { requestUrl } from 'obsidian';
import {
  URL_PEOPLE_CONNECTIONS,
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
      (requestUrl as jest.Mock).mockRejectedValue(
        new Error('API request failed')
      );

      expect(
        await googleContactsService.fetchGoogleContacts(mockToken)
      ).toEqual([]);
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
});
