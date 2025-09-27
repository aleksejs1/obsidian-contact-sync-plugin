import type { ContactSyncSettings } from './types/Settings';
import { ContactSyncSettingTab } from './plugin/settings';
import { DEFAULT_SETTINGS } from './config';
import { Plugin, Notice } from 'obsidian';
import { AuthManager } from './auth/AuthManager';
import { GoogleContactsService } from './core/GoogleContactsService';
import { ContactNoteWriter } from './core/ContactNoteWriter';
import { ContactNoteConfig } from './types/ContactNoteConfig';
import { t } from './i18n/translator';
import type { GoogleContact } from './types/Contact';

/**
 * Obsidian plugin for synchronizing contacts from Google contacts into markdown notes.
 */
export default class GoogleContactsSyncPlugin extends Plugin {
  /** Plugin settings loaded from user config */
  settings: ContactSyncSettings = DEFAULT_SETTINGS;

  /** Manages OAuth token exchange and refresh */
  auth: AuthManager | null = null;

  /**
   * Service layer handling communication with the Google contacts API.
   * Used to fetch contacts and groups, separate from Obsidian-specific logic.
   */
  googleService: GoogleContactsService | null = null;

  /** Handles writing contact notes to the vault */
  noteWriter: ContactNoteWriter | null = null;

  /** ID of the interval used for periodic sync */
  private syncIntervalId: number | null = null;

  /**
   * Called when the plugin is loaded by Obsidian.
   */
  async onload() {
    this.addCommand({
      id: 'sync',
      name: 'Sync',
      callback: () => this.syncContacts(),
    });

    await this.loadSettings();
    this.auth = new AuthManager(this.settings);
    this.addSettingTab(new ContactSyncSettingTab(this.app, this));
    this.googleService = new GoogleContactsService();
    this.noteWriter = new ContactNoteWriter(
      this.app.vault,
      this.app.metadataCache,
      this.app.fileManager
    );

    if (this.settings.syncOnStartup || this.shouldSyncNow()) {
      this.syncContacts();
    }

    this.setupAutoSync();
  }

  async onunload() {
    if (this.syncIntervalId) clearInterval(this.syncIntervalId);
  }

  /**
   * Sets up automatic periodic syncing using setInterval based on plugin settings.
   */
  setupAutoSync() {
    if (this.syncIntervalId) clearInterval(this.syncIntervalId);

    const interval = this.settings.syncIntervalMinutes;

    if (interval > 0) {
      this.registerInterval(
        window.setInterval(
          () => {
            if (this.shouldSyncNow()) {
              this.syncContacts();
            }
          },
          interval * 60 * 1000
        )
      );
    }
  }

  /**
   * Determines whether syncing should be triggered based on the last sync time and interval.
   * @returns True if sync should be triggered now, false otherwise.
   */
  shouldSyncNow(): boolean {
    const { lastSyncTime, syncIntervalMinutes } = this.settings;

    if (syncIntervalMinutes === 0) return false;
    if (!lastSyncTime) return true;

    const last = new Date(lastSyncTime).getTime();
    const now = Date.now();
    const diffMinutes = (now - last) / 1000 / 60;

    return diffMinutes >= syncIntervalMinutes;
  }

  /**
   * Performs the contact synchronization process: fetching, processing, and saving contact notes.
   */
  async syncContacts() {
    this.updateLastSyncTime();

    const token = await this.auth?.ensureValidToken();
    if (!token) {
      new Notice(t('Failed to obtain access token. Please re-authenticate.'));
      return;
    }
    this.updateAuthSettings();

    let labelMap: Record<string, string> = {};
    try {
      labelMap = (await this.googleService?.fetchGoogleGroups(token)) || {};
    } catch (error) {
      console.error(
        'Failed to fetch Google groups',
        JSON.stringify(error, null, 2)
      );
      new Notice(
        t('Failed to fetch Google groups. Check console for details.')
      );
      return;
    }

    let contacts: GoogleContact[] = [];
    try {
      contacts = (await this.googleService?.fetchGoogleContacts(token)) || [];
    } catch (error) {
      console.error(
        'Failed to fetch Google contacts',
        JSON.stringify(error, null, 2)
      );
      new Notice(
        t('Failed to fetch Google contacts. Check console for details.')
      );
      return;
    }

    const config: ContactNoteConfig = {
      folderPath: this.settings.contactsFolder,
      prefix: this.settings.fileNamePrefix || '',
      propertyPrefix: this.settings.propertyNamePrefix || '',
      syncLabel: this.settings.syncLabel,
      noteBody: this.settings.noteTemplate || '# Notes\n',
      organizationAsLink: this.settings.organizationAsLink,
      trackSyncTime: this.settings.trackSyncTime,
    };

    await this.noteWriter?.writeNotesForContacts(config, labelMap, contacts);

    new Notice(t('Google contacts synced!'));
  }

  /**
   * Updates the last synchronization timestamp and saves the updated plugin settings.
   * This should be called after a successful sync to persist the last sync time.
   */
  async updateLastSyncTime(): Promise<void> {
    this.settings.lastSyncTime = new Date().toISOString();
    await this.saveSettings();
  }

  /**
   * Updates the plugin settings with the latest authentication tokens from the AuthManager
   * and persists them to the plugin storage.
   */
  async updateAuthSettings(): Promise<void> {
    Object.assign(this.settings, this.auth?.getSettingsUpdate());
    await this.saveSettings();
  }

  /**
   * Loads plugin settings from disk, applying defaults as needed.
   */
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  /**
   * Saves current plugin settings to disk.
   */
  async saveSettings() {
    await this.saveData(this.settings);
  }
}
