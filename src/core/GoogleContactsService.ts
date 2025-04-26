import { requestUrl } from 'obsidian';
import { URL_CONTACT_GROUPS, URL_PEOPLE_API } from '../config';
import type { GoogleContact, GoogleContactGroup } from '../types/Contact';

/**
 * Core service responsible for interacting with Google Contacts and Contact Groups APIs.
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
    const res = await requestUrl({
      url: URL_PEOPLE_API,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json;
    return data.connections || [];
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

    const data = await groupResponse.json;
    if (!Array.isArray(data.contactGroups)) {
      return {};
    }
    const contactGroups: GoogleContactGroup[] = data.contactGroups || [];

    const labelMap: Record<string, string> = {};
    (contactGroups || []).forEach((group) => {
      if (group.name && group.resourceName) {
        labelMap[group.name.toLowerCase()] = group.resourceName.replace(
          'contactGroups/',
          ''
        );
      }
    });
    return labelMap || [];
  }
}
