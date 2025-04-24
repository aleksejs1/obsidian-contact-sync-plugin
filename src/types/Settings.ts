export interface ContactSyncSettings {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: number;
  contactsFolder: string;
  noteTemplate: string;
  fileNamePrefix: string;
  propertyNamePrefix: string;
  syncLabel: string;
  syncIntervalMinutes: number;
  lastSyncTime?: string;
  syncOnStartup: boolean;
}
