import { ContactNoteConfig } from 'src/types/ContactNoteConfig';
import { NamingStrategy } from 'src/types/Settings';

export const DEFAULT_TEST_CONFIG: ContactNoteConfig = {
  prefix: 'prefix-',
  propertyPrefix: 'propertyPrefix-',
  syncLabel: '',
  folderPath: 'path/to/folder',
  noteBody: 'This is a note body',
  organizationAsLink: false,
  relationsAsLink: false,
  trackSyncTime: true,
  renameFiles: false,
  namingStrategy: NamingStrategy.Default,
  lastFirst: false,
};
