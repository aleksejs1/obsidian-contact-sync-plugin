/**
 * Configuration options for Google contacts synchronization.
 */
export interface ContactSyncSettings {
  /** OAuth client ID from Google Developer Console */
  clientId: string;

  /** OAuth client secret from Google Developer Console */
  clientSecret: string;

  /** OAuth access token used to authorize API requests */
  accessToken: string;

  /** OAuth refresh token to obtain a new access token */
  refreshToken: string;

  /** Timestamp (in ms) when the access token will expire */
  tokenExpiresAt: number;

  /** Path to the folder where contact notes will be stored */
  contactsFolder: string;

  /** Template content for each contact note */
  noteTemplate: string;

  /** Prefix used in contact note filenames */
  fileNamePrefix: string;

  /** Prefix used for frontmatter keys in contact notes */
  propertyNamePrefix: string;

  /** Name of the contact group to sync from Google contacts */
  syncLabel: string;

  /** Interval (in minutes) for auto-sync */
  syncIntervalMinutes: number;

  /** ISO timestamp string of the last sync (optional) */
  lastSyncTime?: string;

  /** Whether to trigger sync automatically when Obsidian starts */
  syncOnStartup: boolean;
}
