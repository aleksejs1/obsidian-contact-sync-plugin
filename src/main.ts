import type { ContactSyncSettings } from './types/Settings';
import { ContactSyncSettingTab } from './plugin/settings';
import { DEFAULT_SETTINGS } from './config';
import { Plugin, Notice } from 'obsidian';
import { AuthManager } from './auth/AuthManager';
import { GoogleContactsService } from './services/GoogleContactsService';
import { ContactNoteWriter } from './services/ContactNoteWriter';
import { ContactNoteConfig } from './types/ContactNoteConfig';
import { ContactAuditService } from './services/ContactAuditService';
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
  auditService: ContactAuditService | null = null;

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

    this.addCommand({
      id: 'audit-contacts',
      name: 'Audit Contacts',
      callback: async () => {
        const token = await this.auth?.ensureValidToken();
        if (!token) {
          new Notice(
            t('Failed to obtain access token. Please re-authenticate.')
          );
          return;
        }
        await this.updateAuthSettings();
        await this.auditService?.auditContacts(token);
      },
    });

    this.addCommand({
      id: 'upload-contact-note',
      name: 'Upload Note to Google Contact',
      editorCallback: async (_editor, view) => {
        const file = view.file;
        if (!file) {
          return;
        }

        const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown> | undefined;
        const googleId = frontmatter?.googleId as string | undefined;

        if (!googleId) {
          new Notice(t('No Google ID found in this note.'));
          return;
        }

        const token = await this.getToken();
        if (!token) {
          return;
        }

        let content = await this.app.vault.read(file);

        // Remove frontmatter
        const frontmatterRegex = /^---\n[\s\S]*?\n---\n/;
        const match = frontmatterRegex.exec(content);
        if (match) {
          content = content.replace(match[0], '');
        }

        const success = await this.googleService?.updateContactNote(
          googleId,
          content.trim(),
          token
        );

        if (success) {
          new Notice(t('Note uploaded to Google Contact!'));
        } else {
          new Notice(t('Failed to upload note. See console for details.'));
        }
      },
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
    this.auditService = new ContactAuditService(
      this.app,
      this.googleService,
      this.settings
    );

    if (this.settings.syncOnStartup || this.shouldSyncNow()) {
      void this.syncContacts();
    }

    this.setupAutoSync();
  }

  onunload() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }
  }

  /**
   * Sets up automatic periodic syncing using setInterval based on plugin settings.
   */
  setupAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    const interval = this.settings.syncIntervalMinutes;

    if (interval > 0) {
      this.registerInterval(
        window.setInterval(
          () => {
            if (this.shouldSyncNow()) {
              void this.syncContacts();
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

    if (syncIntervalMinutes === 0) {
      return false;
    }
    if (!lastSyncTime) {
      return true;
    }

    const last = new Date(lastSyncTime).getTime();
    const now = Date.now();
    const diffMinutes = (now - last) / 1000 / 60;

    return diffMinutes >= syncIntervalMinutes;
  }

  /**
   * Performs the contact synchronization process: fetching, processing, and saving contact notes.
   */
  async syncContacts() {
    void this.updateLastSyncTime();

    const token = await this.getToken();
    if (!token) {
      return;
    }

    const labelMap = await this.getLabelMap(token);
    if (!labelMap) {
      return;
    }

    const contacts = await this.getContacts(token);
    if (!contacts) {
      return;
    }

    const config = this.getNoteConfig();
    await this.noteWriter?.writeNotesForContacts(config, labelMap, contacts);

    new Notice(t('Google contacts synced!'));
  }

  private async getToken(): Promise<string | null> {
    const token = await this.auth?.ensureValidToken();
    if (!token) {
      new Notice(t('Failed to obtain access token. Please re-authenticate.'));
      return null;
    }
    void this.updateAuthSettings();
    return token;
  }

  private async getLabelMap(
    token: string
  ): Promise<Record<string, string> | null> {
    try {
      return (await this.googleService?.fetchGoogleGroups(token)) ?? {};
    } catch (error) {
      console.error(
        'Failed to fetch Google groups',
        JSON.stringify(error, null, 2)
      );
      new Notice(
        t('Failed to fetch Google groups. Check console for details.')
      );
      return null;
    }
  }

  private async getContacts(token: string): Promise<GoogleContact[] | null> {
    try {
      return (await this.googleService?.fetchGoogleContacts(token)) ?? [];
    } catch (error) {
      console.error(
        'Failed to fetch Google contacts',
        JSON.stringify(error, null, 2)
      );
      new Notice(
        t('Failed to fetch Google contacts. Check console for details.')
      );
      return null;
    }
  }

  private getNoteConfig(): ContactNoteConfig {
    return {
      folderPath: this.settings.contactsFolder,
      prefix: this.settings.fileNamePrefix,
      propertyPrefix: this.settings.propertyNamePrefix,
      syncLabel: this.settings.syncLabel,
      noteBody: this.settings.noteTemplate || '# Notes\n',
      organizationAsLink: this.settings.organizationAsLink,
      trackSyncTime: this.settings.trackSyncTime,
      renameFiles: this.settings.renameFiles,
      namingStrategy: this.settings.namingStrategy,
      lastFirst: this.settings.lastFirst,
    };
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
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      (await this.loadData()) as Partial<ContactSyncSettings>
    );
  }

  /**
   * Saves current plugin settings to disk.
   */
  async saveSettings() {
    await this.saveData(this.settings);
  }
}
