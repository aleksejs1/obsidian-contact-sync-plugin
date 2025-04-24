import type { ContactSyncSettings } from "./types/Settings";
import type { GoogleContact } from "./types/Contact";
import { ContactSyncSettingTab } from "./settings";
import { URL_PEOPLE_API, URL_CONTACT_GROUPS, URL_OAUTH_TOKEN, DEFAULT_SETTINGS } from "./config";
import { Plugin, TFile, TFolder, normalizePath, Notice, parseYaml, stringifyYaml, requestUrl } from "obsidian";
import { AuthManager } from "./AuthManager";

export default class GoogleContactsSyncPlugin extends Plugin {
  settings: ContactSyncSettings = DEFAULT_SETTINGS;
  auth: AuthManager | null = null;

  private syncIntervalId: number | null = null;

  async onload() {
    this.addCommand({
      id: "sync-google-contacts",
      name: "Sync Google Contacts",
      callback: () => this.syncContacts()
    });

    await this.loadSettings();
    this.auth = new AuthManager(this.settings);
    this.addSettingTab(new ContactSyncSettingTab(this.app, this));

    if (this.settings.syncOnStartup || this.shouldSyncNow()) {
      this.syncContacts();
    }

    this.setupAutoSync();
  }

  setupAutoSync() {
    if (this.syncIntervalId) clearInterval(this.syncIntervalId);

    const interval = this.settings.syncIntervalMinutes;

    if (interval > 0) {
      this.syncIntervalId = window.setInterval(() => {
        if (this.shouldSyncNow()){
          this.syncContacts();
        }
      }, interval * 60 * 1000);
    }
  }

  shouldSyncNow(): boolean {
    const { lastSyncTime, syncIntervalMinutes } = this.settings;

    if (syncIntervalMinutes === 0) return false;
    if (!lastSyncTime) return true;

    const last = new Date(lastSyncTime).getTime();
    const now = Date.now();
    const diffMinutes = (now - last) / 1000 / 60;

    return diffMinutes >= syncIntervalMinutes;
  }

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

    await this.app.vault.createFolder(normalizePath(folderPath)).catch(() => {});

    for (const contact of contacts) {
      if (syncLabel !== '') {
        const hasObsidianLabel = (contact.memberships || []).some((m) =>
          m.contactGroupMembership?.contactGroupId === labelMap[syncLabel]
        );

        if (!hasObsidianLabel) continue;
      }

      const id = contact.resourceName?.split("/").pop();
      const syncedAt = new Date().toISOString();

      let frontmatterLines: Record<string, string> = {
        [`${propertyPrefix}id`]: String(id ?? ""),
        [`${propertyPrefix}synced`]: String(syncedAt ?? "")
      };

      this.addContactFieldToFrontmatter(frontmatterLines, contact.names, "name", propertyPrefix, item => item.displayName);
      this.addContactFieldToFrontmatter(frontmatterLines, contact.emailAddresses, "email", propertyPrefix, item => item.value);
      this.addContactFieldToFrontmatter(frontmatterLines, contact.phoneNumbers, "phone", propertyPrefix, item => item.value);

      if (contact.birthdays && contact.birthdays.length > 0) {
        contact.birthdays.forEach((bday, index) => {
          const date = bday.date;
          const ending = index === 0 ? "" : `_${index + 1}`
          if (date) {
            const birthdayStr = `${date.year ?? "XXXX"}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
            frontmatterLines[`${propertyPrefix}birthday${ending}`] = birthdayStr;
          }
        });
      }

      const yaml = stringifyYaml(frontmatterLines);
      const frontmatter = `---\n${yaml}---`;

      const name = contact.names?.[0]?.displayName || "Unnamed";

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
        const updatedContent = this.updateFrontmatterWithContactData(content, frontmatterLines);
        await this.app.vault.modify(existingFile, updatedContent);
      } else {
        const safeName = name.replace(/[\\/:*?"<>|]/g, "_");
        const filename = normalizePath(`${folderPath}/${prefix}${safeName}.md`);
        const noteBody = this.settings.noteTemplate?.trim() || '# Notes\n';
        const initialText = `${frontmatter}\n\n${noteBody}`;
        await this.app.vault.create(filename, initialText);
      }
    }

    new Notice("Google Contacts synced!");
  }

  getAllMarkdownFilesInFolder(folder: TFolder): TFile[] {
    let files: TFile[] = [];

    for (const child of folder.children) {
      if (child instanceof TFolder) {
        files = files.concat(this.getAllMarkdownFilesInFolder(child));
      } else if (child instanceof TFile && child.extension === "md") {
        files.push(child);
      }
    }

    return files;
  }

  addContactFieldToFrontmatter(
    frontmatter: Record<string, string>,
    contact: any[] | undefined,
    keyName: string,
    propertyPrefix: string,
    valueExtractor: (item: any) => string | undefined
  ) {
    if (!contact || contact.length === 0) return;

    contact.forEach((item, index) => {
      const rawValue = valueExtractor(item);
      const value = typeof rawValue === "string" ? rawValue : "";
      const safeValue = value.replace(/[\\/:*?"<>|]/g, "_");
      const suffix = index === 0 ? "" : `_${index + 1}`;
      frontmatter[`${propertyPrefix}${keyName}${suffix}`] = safeValue;
    });
  }

  updateFrontmatterWithContactData(content: string, newContactFields: Record<string, any>): string {
    const parts = content.split("---");

    if (parts.length < 3) {
      const yaml = stringifyYaml(newContactFields);
      return `---\n${yaml}---\n\n`;
    }

    const originalYaml = parts[1];
    const body = parts.slice(2).join("---").trim();

    const parsed = parseYaml(originalYaml) as Record<string, any>;

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

  async fetchGoogleContacts(token: string): Promise<GoogleContact[]> {
    const res = await requestUrl({
      url: URL_PEOPLE_API,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json;
    return data.connections || [];
  }


  async fetchGoogleGroups(token: string): Promise<Record<string, string>> {
    const groupResponse = await requestUrl({
      url: URL_CONTACT_GROUPS,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await groupResponse.json;

    const labelMap: Record<string, string> = {};
    (data.contactGroups || []).forEach((group: any) => {
      if (group.name && group.resourceName) {
        labelMap[group.name.toLowerCase()] = group.resourceName.replace('contactGroups/', '');
      }
    });
    return labelMap || [];
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.settings.refreshToken) {
      new Notice("No refresh token found.");
      return false;
    }

    try {
      const response = await requestUrl({
        url: URL_OAUTH_TOKEN,
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: this.settings.clientId,
          client_secret: this.settings.clientSecret,
          refresh_token: this.settings.refreshToken,
          grant_type: "refresh_token"
        }).toString()
      });

      const data = await response.json;
      if (data.access_token) {
        this.settings.accessToken = data.access_token;

        if (data.expires_in) {
          this.settings.tokenExpiresAt = Date.now() + (data.expires_in * 1000);;
        }

        if (data.refresh_token) {
          this.settings.refreshToken = data.refresh_token;
        }

        await this.saveSettings();
        new Notice("Access token refreshed.");
        return true;
      } else {
        console.error("Failed to refresh token:", data);
        new Notice("Failed to refresh access token.");
        return false;
      }
    } catch (err) {
      console.error("Error refreshing token:", err);
      new Notice("Error refreshing access token.");
      return false;
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
