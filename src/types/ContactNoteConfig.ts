import { NamingStrategy } from './Settings';

export interface ContactNoteConfig {
  folderPath: string;
  prefix: string;
  propertyPrefix: string;
  syncLabel: string;
  noteBody: string;
  organizationAsLink: boolean;
  relationsAsLink: boolean;
  trackSyncTime: boolean;
  renameFiles: boolean;
  namingStrategy: NamingStrategy;
  lastFirst: boolean;
}
