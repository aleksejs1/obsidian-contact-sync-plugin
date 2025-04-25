import type { ContactSyncSettings } from './types/Settings';
import type { GoogleContact, GoogleContactGroup } from './types/Contact';
import { ContactSyncSettingTab } from './settings';
import { URL_PEOPLE_API, URL_CONTACT_GROUPS, DEFAULT_SETTINGS } from './config';
import {
  Plugin,
  TFile,
  TFolder,
  normalizePath,
  Notice,
  parseYaml,
  stringifyYaml,
  requestUrl,
} from 'obsidian';
import { AuthManager } from './AuthManager';

/**
 * Obsidian plugin for synchronizing contacts from Google Contacts into markdown notes.
 */
export default class GoogleContactsSyncPlugin extends Plugin {
  /** Plugin settings loaded from user config */
  settings: ContactSyncSettings = DEFAULT_SETTINGS;

  /** Manages OAuth token exchange and refresh */
  auth: AuthManager | null = null;

  /** ID of the interval used for periodic sync */
  private syncIntervalId: number | null = null;

  /**
   * Called when the plugin is loaded by Obsidian.
   */
  async onload() {
    this.addCommand({
      id: 'sync-google-contacts',
      name: 'Sync Google Contacts',
      callback: () => this.syncContacts(),
    });

    await this.loadSettings();
    this.auth = new AuthManager(this.settings);
    this.addSettingTab(new ContactSyncSettingTab(this.app, this));

    if (this.settings.syncOnStartup || this.shouldSyncNow()) {
      this.syncContacts();
    }

    this.setupAutoSync();
  }

  /**
   * Sets up automatic periodic syncing using setInterval based on plugin settings.
   */
  setupAutoSync() {
    if (this.syncIntervalId) clearInterval(this.syncIntervalId);

    const interval = this.settings.syncIntervalMinutes;

    if (interval > 0) {
      this.syncIntervalId = window.setInterval(
        () => {
          if (this.shouldSyncNow()) {
            this.syncContacts();
          }
        },
        interval * 60 * 1000
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
    this.settings.lastSyncTime = new Date().toISOString();
    await this.saveSettings();

    if (!this.auth) return;
    const token = await this.auth.ensureValidToken();
    Object.assign(this.settings, this.auth.getSettingsUpdate());
    await this.saveSettings();

    const prefix = this.settings.fileNamePrefix || '';
    const propertyPrefix = this.settings.propertyNamePrefix || '';
    const syncLabel = this.settings.syncLabel;
    const labelMap = await this.fetchGoogleGroups(token);
    const contacts = await this.fetchGoogleContacts(token);
    const folderPath = this.settings.contactsFolder;

    await this.app.vault
      .createFolder(normalizePath(folderPath))
      .catch(() => {});

    for (const contact of contacts) {
      if (syncLabel !== '') {
        const hasObsidianLabel = (contact.memberships || []).some(
          (m) =>
            m.contactGroupMembership?.contactGroupId === labelMap[syncLabel]
        );

        if (!hasObsidianLabel) continue;
      }

      const id = contact.resourceName?.split('/').pop();
      const syncedAt = new Date().toISOString();

      const frontmatterLines: Record<string, string> = {
        [`${propertyPrefix}id`]: String(id ?? ''),
        [`${propertyPrefix}synced`]: String(syncedAt ?? ''),
      };

      this.addContactFieldToFrontmatter(
        frontmatterLines,
        contact.names,
        'name',
        propertyPrefix,
        (item) => item.displayName
      );
      this.addContactFieldToFrontmatter(
        frontmatterLines,
        contact.emailAddresses,
        'email',
        propertyPrefix,
        (item) => item.value
      );
      this.addContactFieldToFrontmatter(
        frontmatterLines,
        contact.phoneNumbers,
        'phone',
        propertyPrefix,
        (item) => item.value
      );

      if (contact.birthdays && contact.birthdays.length > 0) {
        contact.birthdays.forEach((bday, index) => {
          const date = bday.date;
          const ending = index === 0 ? '' : `_${index + 1}`;
          if (date) {
            const birthdayStr = `${date.year ?? 'XXXX'}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
            frontmatterLines[`${propertyPrefix}birthday${ending}`] =
              birthdayStr;
          }
        });
      }

      const yaml = stringifyYaml(frontmatterLines);
      const frontmatter = `---\n${yaml}---`;

      const name = contact.names?.[0]?.displayName || 'Unnamed';

      let existingFile: TFile | null = null;

      const folder = this.app.vault.getAbstractFileByPath(folderPath);
      if (!(folder instanceof TFolder)) return null;

      const files = this.getAllMarkdownFilesInFolder(folder);

      for (const file of files) {
        const content = await this.app.vault.read(file);
        const match = content.match(/^---\n([\s\S]+?)\n---/);
        if (match && match[1].includes(`id: ${id}`)) {
          existingFile = file;
          break;
        }
      }

      if (existingFile) {
        const content = await this.app.vault.read(existingFile);
        const updatedContent = this.updateFrontmatterWithContactData(
          content,
          frontmatterLines
        );
        await this.app.vault.modify(existingFile, updatedContent);
      } else {
        const safeName = name.replace(/[\\/:*?"<>|]/g, '_');
        const filename = normalizePath(`${folderPath}/${prefix}${safeName}.md`);
        const noteBody = this.settings.noteTemplate?.trim() || '# Notes\n';
        const initialText = `${frontmatter}\n\n${noteBody}`;
        await this.app.vault.create(filename, initialText);
      }
    }

    new Notice('Google Contacts synced!');
  }

  /**
   * Recursively retrieves all markdown files in the specified folder.
   * @param folder The root folder to search within.
   * @returns An array of markdown files.
   */
  getAllMarkdownFilesInFolder(folder: TFolder): TFile[] {
    let files: TFile[] = [];

    for (const child of folder.children) {
      if (child instanceof TFolder) {
        files = files.concat(this.getAllMarkdownFilesInFolder(child));
      } else if (child instanceof TFile && child.extension === 'md') {
        files.push(child);
      }
    }

    return files;
  }

  /**
   * Adds extracted contact field values to frontmatter with proper formatting.
   * @param frontmatter Frontmatter object to modify.
   * @param contact Contact array from which to extract values.
   * @param keyName Field key (e.g., "email", "phone").
   * @param propertyPrefix Prefix to apply to each field name in frontmatter.
   * @param valueExtractor Function to extract a string value from each item.
   */
  addContactFieldToFrontmatter<T extends { [key: string]: unknown }>(
    frontmatter: Record<string, string>,
    contact: T[] | undefined,
    keyName: string,
    propertyPrefix: string,
    valueExtractor: (item: T) => string | undefined
  ) {
    if (!contact || contact.length === 0) return;

    contact.forEach((item, index) => {
      const rawValue = valueExtractor(item);
      const value = typeof rawValue === 'string' ? rawValue : '';
      const safeValue = value.replace(/[\\/:*?"<>|]/g, '_');
      const suffix = index === 0 ? '' : `_${index + 1}`;
      frontmatter[`${propertyPrefix}${keyName}${suffix}`] = safeValue;
    });
  }

  /**
   * Updates the YAML frontmatter of a note with new contact fields, merging with existing values.
   * @param content Original markdown note content.
   * @param newContactFields Contact data to inject into the frontmatter.
   * @returns Updated markdown content.
   */
  updateFrontmatterWithContactData(
    content: string,
    newContactFields: Record<string, string>
  ): string {
    const parts = content.split('---');

    if (parts.length < 3) {
      const yaml = stringifyYaml(newContactFields);
      return `---\n${yaml}---\n\n`;
    }

    const originalYaml = parts[1];
    const body = parts.slice(2).join('---').trim();

    const parsed = parseYaml(originalYaml) as Record<string, string>;

    for (const key of Object.keys(parsed)) {
      if (key in newContactFields) {
        parsed[key] = newContactFields[key];
        delete newContactFields[key];
      }
    }

    const updated = {
      ...parsed,
      ...newContactFields,
      synced: new Date().toISOString(),
    };

    const updatedYaml = stringifyYaml(updated);
    return `---\n${updatedYaml}---\n\n${body}`;
  }

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
