import { requestUrl } from 'obsidian';
import {
  URL_CONTACT_GROUPS,
  URL_PEOPLE_CONNECTIONS,
  PERSONAL_FIELDS,
} from '../config';
import type { GoogleContact, GoogleContactGroup } from '../types/Contact';
import { RequestUrlResponse } from 'obsidian';

interface PeopleConnectionsResponse {
  connections?: GoogleContact[] | undefined;
  nextPageToken?: string | undefined;
}

interface ContactGroupsResponse {
  contactGroups?: GoogleContactGroup[];
}

/**
 * Core service responsible for interacting with Google contacts and Contact Groups APIs.
 *
 * Encapsulates logic for fetching, processing, and transforming Google contact data.
 * Designed to be used by higher-level plugin components to separate external API concerns
 * from application and Obsidian-specific logic.
 */
export class GoogleContactsService {
  //   constructor(private token: string) {}

  /**
   * Fetches the list of Google contacts using the provided access token.
   * @param token OAuth access token.
   * @returns An array of Google contact objects.
   */
  async fetchGoogleContacts(token: string): Promise<GoogleContact[]> {
    let allContacts: GoogleContact[] = [];
    let nextPageToken: string | undefined = undefined;
    let data: PeopleConnectionsResponse = {
      connections: [],
      nextPageToken: undefined,
    };

    do {
      const url = `${URL_PEOPLE_CONNECTIONS}?personFields=${PERSONAL_FIELDS}&pageSize=1000${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;

      try {
        const res: RequestUrlResponse = await requestUrl({
          url,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        data = (await res.json) as PeopleConnectionsResponse;
      } catch (error) {
        console.error(
          'Failed to fetch Google contacts',
          JSON.stringify(error, null, 2)
        );
        data = {
          connections: [],
          nextPageToken: undefined,
        };
      }
      allContacts = allContacts.concat(data.connections ?? []);
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    return allContacts;
  }

  /**
   * Fetches contact groups and returns a mapping of lowercase group name → group ID.
   * @param token OAuth access token.
   * @returns Record mapping lowercase group names to their resource IDs.
   */
  async fetchGoogleGroups(token: string): Promise<Record<string, string>> {
    const groupResponse = await requestUrl({
      url: URL_CONTACT_GROUPS,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = (await groupResponse.json) as ContactGroupsResponse;
    if (!Array.isArray(data.contactGroups)) {
      return {};
    }
    const contactGroups: GoogleContactGroup[] = data.contactGroups;

    const labelMap: Record<string, string> = {};
    contactGroups.forEach((group) => {
      if (group.name && group.resourceName) {
        labelMap[group.name.toLowerCase()] = group.resourceName.replace(
          'contactGroups/',
          ''
        );
      }
    });
    return labelMap;
  }
}
