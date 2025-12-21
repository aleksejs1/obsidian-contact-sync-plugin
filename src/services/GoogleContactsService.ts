import { requestUrl } from 'obsidian';
import {
  URL_CONTACT_GROUPS,
  URL_PEOPLE_CONNECTIONS,
  URL_PEOPLE_BASE,
  PERSONAL_FIELDS,
  URL_PEOPLE_OTHER_CONTACTS,
  OTHER_CONTACTS_FIELDS,
} from '../config';
import type { GoogleContact, GoogleContactGroup } from '../types/Contact';
import { RequestUrlResponse } from 'obsidian';

interface PeopleConnectionsResponse {
  connections?: GoogleContact[] | undefined;
  nextPageToken?: string | undefined;
}

interface OtherContactsResponse {
  otherContacts?: GoogleContact[] | undefined;
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
    const [connections, otherContacts] = await Promise.all([
      this.fetchConnections(token),
      this.fetchOtherContacts(token),
    ]);
    return [...connections, ...otherContacts];
  }

  /**
   * Fetches the list of Google contacts (people/me/connections) using the provided access token.
   * @param token OAuth access token.
   * @returns An array of Google contact objects.
   */
  private async fetchConnections(token: string): Promise<GoogleContact[]> {
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
   * Fetches the list of "Other contacts" using the provided access token.
   * @param token OAuth access token.
   * @returns An array of Google contact objects from "Other contacts".
   */
  private async fetchOtherContacts(token: string): Promise<GoogleContact[]> {
    let allContacts: GoogleContact[] = [];
    let nextPageToken: string | undefined = undefined;
    let data: OtherContactsResponse = {
      otherContacts: [],
      nextPageToken: undefined,
    };

    do {
      const url = `${URL_PEOPLE_OTHER_CONTACTS}?readMask=${OTHER_CONTACTS_FIELDS}&pageSize=1000${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;

      try {
        const res: RequestUrlResponse = await requestUrl({
          url,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        data = (await res.json) as OtherContactsResponse;
      } catch (error) {
        console.error(
          'Failed to fetch Other contacts',
          JSON.stringify(error, null, 2)
        );
        data = {
          otherContacts: [],
          nextPageToken: undefined,
        };
      }
      allContacts = allContacts.concat(data.otherContacts ?? []);
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

  /**
   * Fetches a single contact by resource name.
   * @param resourceName Resource name of the contact.
   * @param token OAuth access token.
   * @returns The Google contact object.
   */
  async fetchContact(
    resourceName: string,
    token: string
  ): Promise<GoogleContact | null> {
    const url = `${URL_PEOPLE_BASE}/${resourceName}?personFields=${PERSONAL_FIELDS}`;

    try {
      const res: RequestUrlResponse = await requestUrl({
        url,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return (await res.json) as GoogleContact;
    } catch (error) {
      console.error(
        'Failed to fetch contact',
        JSON.stringify(error, null, 2)
      );
      return null;
    }
  }

  /**
   * Updates the contact note (userDefined field) for a given contact.
   * @param resourceName Resource name of the contact.
   * @param noteContent Content of the note to upload.
   * @param token OAuth access token.
   * @returns True if successful, false otherwise.
   */
  async updateContactNote(
    resourceName: string,
    noteContent: string,
    token: string
  ): Promise<boolean> {
    const contact = await this.fetchContact(resourceName, token);
    if (!contact) {
      console.warn(`Contact ${resourceName} not found.`);
      return false;
    }

    // Check if we can write to this contact.
    // "Other contacts" usually have constraints, but checking metadata sources is more robust.
    // READ_SOURCE_TYPE_PROFILE and READ_SOURCE_TYPE_DOMAIN_CONTACT are usually read-only.
    // READ_SOURCE_TYPE_CONTACT is what we want.
    const isContact = contact.metadata?.sources.some(
      (s) => s.type === 'CONTACT'
    );
    if (!isContact) {
      console.warn(
        `Contact ${resourceName} is not a valid contact for updates (source type constraint).`
      );
      return false;
    }

    // Construct request body
    const body = {
      etag: contact.etag,
      userDefined: [
        {
          key: 'obsidian-note',
          value: noteContent,
        },
      ],
    };

    // We need to preserve existing userDefined fields if any, but replace logic is simpler for now:
    // The requirement says "upload data to fields under userDefined... key obsidian-note".
    // If we want to preserve others, we should merge.
    if (contact.userDefined) {
      const otherFields = contact.userDefined.filter(
        (ud) => ud.key !== 'obsidian-note'
      );
      body.userDefined = [...otherFields, ...body.userDefined];
    }

    const url = `${URL_PEOPLE_BASE}/${resourceName}:updateContact?updatePersonFields=userDefined`;

    try {
      await requestUrl({
        url,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      return true;
    } catch (error) {
      console.error(
        'Failed to update contact note',
        JSON.stringify(error, null, 2)
      );
      return false;
    }
  }
}
