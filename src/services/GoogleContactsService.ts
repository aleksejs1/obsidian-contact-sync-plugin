import { requestUrl } from 'obsidian';
import {
  URL_CONTACT_GROUPS,
  URL_PEOPLE_CONNECTIONS,
  PERSONAL_FIELDS,
  URL_PEOPLE_OTHER_CONTACTS,
  OTHER_CONTACTS_FIELDS,
  URL_PEOPLE_API,
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

/** Outcome of a single contact update. */
export type UpdateNotesResult =
  { ok: true } | { ok: false; status: number; message: string };

interface GoogleErrorResponse {
  error?: { message?: string; status?: string };
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
   * Replaces the Notes field (biographies) of a contact.
   * The contact's etag guards against overwriting a change made in Google after it was fetched:
   * on mismatch Google rejects the request and nothing is changed.
   *
   * @param token - OAuth access token with the `contacts` scope.
   * @param contact - The contact as fetched during this sync.
   * @param text - New plain-text notes; empty string clears the field.
   * @returns Whether the update succeeded and, if not, why.
   */
  async updateContactNotes(
    token: string,
    contact: GoogleContact,
    text: string
  ): Promise<UpdateNotesResult> {
    const res: RequestUrlResponse = await requestUrl({
      url: `${URL_PEOPLE_API}/${contact.resourceName}:updateContact?updatePersonFields=biographies`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.buildNotesUpdate(contact, text)),
      throw: false,
    });

    if (res.status >= 200 && res.status < 300) {
      return { ok: true };
    }
    return {
      ok: false,
      status: res.status,
      message: this.getErrorMessage(res),
    };
  }

  private buildNotesUpdate(
    contact: GoogleContact,
    text: string
  ): Record<string, unknown> {
    return {
      resourceName: contact.resourceName,
      etag: contact.etag,
      metadata: {
        sources: (contact.metadata?.sources ?? []).filter(
          (s) => s.type === 'CONTACT'
        ),
      },
      biographies: text ? [{ value: text, contentType: 'TEXT_PLAIN' }] : [],
    };
  }

  private getErrorMessage(res: RequestUrlResponse): string {
    const fallback = `HTTP ${res.status}`;
    try {
      const data = res.json as GoogleErrorResponse;
      return data.error?.message ?? data.error?.status ?? fallback;
    } catch {
      return fallback;
    }
  }
}
