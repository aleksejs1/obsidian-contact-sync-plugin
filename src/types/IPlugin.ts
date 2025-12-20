import { Plugin } from 'obsidian';
import { ContactSyncSettings } from './Settings';
import { AuthManager } from '../auth/AuthManager';

export interface IPlugin extends Plugin {
  settings: ContactSyncSettings;
  auth: AuthManager | null;
  saveSettings(): Promise<void>;
  setupAutoSync(): void;
}
