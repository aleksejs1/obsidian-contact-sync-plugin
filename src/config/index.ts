/** OAuth2 endpoints */
export const URL_OAUTH_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
export const URL_OAUTH_TOKEN = 'https://oauth2.googleapis.com/token';

/** Google People API endpoints */
const URL_PEOPLE_BASE = 'https://people.googleapis.com/v1';
export const URL_PEOPLE_CONNECTIONS = `${URL_PEOPLE_BASE}/people/me/connections`;
export const PERSONAL_FIELDS = `names,emailAddresses,phoneNumbers,birthdays,memberships,metadata,addresses,biographies,organizations`;
export const OTHER_CONTACTS_FIELDS = `names,emailAddresses,phoneNumbers`;
export const URL_CONTACT_GROUPS = `${URL_PEOPLE_BASE}/contactGroups?pageSize=1000`;

export const URL_PEOPLE_OTHER_CONTACTS = `${URL_PEOPLE_BASE}/otherContacts`;

/** OAuth2 defaults */
export const URI_OATUH_REDIRECT = 'urn:ietf:wg:oauth:2.0:oob';
export const URL_OAUTH_SCOPE =
  'https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/contacts.other.readonly';

/** External links */
export const LINK_TO_MANUAL =
  'https://scribehow.com/shared/Create_a_own_client_for_the_Obsidian_Google_Contacts_Plugin__s3EkgN37QZet_KSTej53Wg';

import { ContactSyncSettings, NamingStrategy } from '../types/Settings';

/** Plugin default settings */
export const DEFAULT_SETTINGS: ContactSyncSettings = {
  clientId: '',
  clientSecret: '',
  accessToken: '',
  refreshToken: '',
  tokenExpiresAt: 0,
  contactsFolder: 'Contacts',
  noteTemplate: '# Notes\n',
  fileNamePrefix: '',
  propertyNamePrefix: '',
  syncLabel: '',
  syncIntervalMinutes: 0,
  syncOnStartup: false,
  trackSyncTime: false,
  organizationAsLink: false,
  renameFiles: false,
  namingStrategy: NamingStrategy.Default,
  lastFirst: false,
};
