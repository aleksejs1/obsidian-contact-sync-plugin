/** OAuth2 endpoints */
export const URL_OAUTH_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
export const URL_OAUTH_TOKEN = 'https://oauth2.googleapis.com/token';

/** Google People API endpoints */
export const URL_PEOPLE_BASE = 'https://people.googleapis.com/v1';
export const URL_PEOPLE_CONNECTIONS = `${URL_PEOPLE_BASE}/people/me/connections`;
export const PERSONAL_FIELDS = `names,emailAddresses,phoneNumbers,birthdays,memberships,metadata,addresses,biographies,organizations`;
export const URL_PEOPLE_API = `${URL_PEOPLE_CONNECTIONS}?personFields=names,emailAddresses,phoneNumbers,birthdays,memberships,metadata,addresses,biographies,organizations&pageSize=1000`;
export const URL_CONTACT_GROUPS = `${URL_PEOPLE_BASE}/contactGroups`;

/** OAuth2 defaults */
export const URI_OATUH_REDIRECT = 'urn:ietf:wg:oauth:2.0:oob';
export const URL_OAUTH_SCOPE =
  'https://www.googleapis.com/auth/contacts.readonly';

/** External links */
export const LINK_TO_MANUAL =
  'https://github.com/YukiGasai/obsidian-google-calendar/blob/1.10.16/documentation/content/Install.pdf';

/** Plugin default settings */
export const DEFAULT_SETTINGS = {
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
};
