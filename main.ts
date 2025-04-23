import { Plugin, TFile, TFolder, normalizePath, Notice, Modal, Setting, App, PluginSettingTab, parseYaml, stringifyYaml, requestUrl } from "obsidian";

interface GoogleContact {
  resourceName: string;
  names?: { displayName: string }[];
  emailAddresses?: { value: string }[];
  phoneNumbers?: { value: string }[];
  birthdays?: Birthday[];
  memberships?: Membership[];
}

interface Birthday {
  date?: {
    year?: number;
    month?: number;
    day?: number;
  };
  text?: string;
  metadata?: any;
}

interface ContactSyncSettings {
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

interface ContactGroupMembership {
  contactGroupId: string;
  contactGroupResourceName?: string;
}

interface Membership {
  contactGroupMembership?: ContactGroupMembership;
  domainMembership?: any;
  metadata?: any;
}

const DEFAULT_SETTINGS: ContactSyncSettings = {
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
  syncOnStartup: false
};

export default class GoogleContactsSyncPlugin extends Plugin {
  settings: ContactSyncSettings = DEFAULT_SETTINGS;

  private syncIntervalId: number | null = null;

  async onload() {
    this.addCommand({
      id: "sync-google-contacts",
      name: "Sync Google Contacts",
      callback: () => this.syncContacts()
    });

    await this.loadSettings();
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

    if (!this.settings.accessToken || Date.now() > this.settings.tokenExpiresAt) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        new Notice("Access token expired and could not be refreshed.");
        return;
      }
    }
    const token = this.settings.accessToken;
    const prefix = this.settings.fileNamePrefix || '';
    const propertyPrefix = this.settings.propertyNamePrefix || '';

    if (!token) {
      new Notice("No token provided.");
      return;
    }

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
      // const files = this.app.vault.getMarkdownFiles();
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
      url: "https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,birthdays,memberships,metadata&pageSize=2000",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json;
    return data.connections || [];
  }


  async fetchGoogleGroups(token: string): Promise<Record<string, string>> {
    const groupResponse = await requestUrl({
      url: 'https://people.googleapis.com/v1/contactGroups',
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
        url: "https://oauth2.googleapis.com/token",
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

class ContactSyncSettingTab extends PluginSettingTab {
  plugin: GoogleContactsSyncPlugin;

  constructor(app: App, plugin: GoogleContactsSyncPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Google Contacts Sync Settings" });

    const manual = document.createDocumentFragment();
    manual.append(
      "Here is the manual about creating your own client: ",
      manual.createEl("a", {
        href: "https://github.com/YukiGasai/obsidian-google-calendar/blob/1.10.16/documentation/content/Install.pdf",
        text: "manual",
      })
    );

    new Setting(containerEl)
      .setName("Google Client ID")
      .setDesc(manual)
      .addText((text) =>
        text
          .setPlaceholder("Enter your client ID")
          .setValue(this.plugin.settings.clientId)
          .onChange(async (value) => {
            this.plugin.settings.clientId = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Google Client Secret")
      .addText((text) =>
        text
          .setPlaceholder("Enter your client secret")
          .setValue(this.plugin.settings.clientSecret)
          .onChange(async (value) => {
            this.plugin.settings.clientSecret = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Login with Google")
      .setDesc("Open Google's OAuth page in your browser")
      .addButton((btn) =>
        btn.setButtonText("Login")
          .onClick(() => {
            if (!this.plugin.settings.clientId) {
              new Notice("Please enter your Client ID first.");
              return;
            }
            const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
              this.plugin.settings.clientId
            )}&redirect_uri=urn:ietf:wg:oauth:2.0:oob&response_type=code&scope=https://www.googleapis.com/auth/contacts.readonly`;

            window.open(url, "_blank");
          })
      );

    new Setting(containerEl)
      .setName("Authorization Code")
      .setDesc("Paste the code from Google after login")
      .addText((text) =>
        text.setPlaceholder("Paste code here").onChange(async (code) => {
          if (
            !this.plugin.settings.clientId ||
            !this.plugin.settings.clientSecret
          ) {
            new Notice("Client ID and Secret required.");
            return;
          }

          const body = {
            "code": code,
            "client_id": this.plugin.settings.clientId,
            "client_secret": this.plugin.settings.clientSecret,
            "redirect_uri": "urn:ietf:wg:oauth:2.0:oob",
            "grant_type": "authorization_code"
          }

          try {
            const response = await requestUrl({
              url: "https://oauth2.googleapis.com/token",
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(body),
            });

            const result = await response.json;
            if (result.access_token) {
              this.plugin.settings.accessToken = result.access_token;
              await this.plugin.saveSettings();
              new Notice("Access token saved!");
            } else {
              console.error(result);
              new Notice("Failed to retrieve access token.");
            }
            if (result.expires_in) {
              this.plugin.settings.tokenExpiresAt = Date.now() + (result.expires_in * 1000);;
              await this.plugin.saveSettings();
              new Notice("Token expires at saved!");
            } else {
              console.error(result);
              new Notice("Failed to retrieve Token expires at.");
            }
            if (result.refresh_token) {
              this.plugin.settings.refreshToken = result.refresh_token;
              await this.plugin.saveSettings();
              new Notice("Refresh token saved!");
            } else {
              console.error(result);
              new Notice("Failed to retrieve refresh token.");
            }
          } catch (err) {
            console.error(err);
            new Notice("Error during token exchange.");
          }
        })
      );

    new Setting(containerEl)
      .setName("Contacts Folder")
      .setDesc("Vault folder where contact notes will be stored")
      .addText((text) =>
        text
          .setPlaceholder("e.g. Contacts")
          .setValue(this.plugin.settings.contactsFolder)
          .onChange(async (value) => {
            this.plugin.settings.contactsFolder = value.trim() || 'Contacts';
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Note Template")
      .setDesc("Template to insert below the metadata block for new contact notes")
      .addTextArea((text) =>
        text
          .setPlaceholder("e.g. # Notes\n\nWrite something here...")
          .setValue(this.plugin.settings.noteTemplate)
          .onChange(async (value) => {
            this.plugin.settings.noteTemplate = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("File Name Prefix")
      .setDesc("Prefix to add to the beginning of each contact file name")
      .addText((text) =>
        text
          .setPlaceholder("e.g. p ")
          .setValue(this.plugin.settings.fileNamePrefix)
          .onChange(async (value) => {
            this.plugin.settings.fileNamePrefix = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Property Name Prefix")
      .setDesc("Prefix to add to the beginning of each contact property name")
      .addText((text) =>
        text
          .setPlaceholder("e.g. s_")
          .setValue(this.plugin.settings.propertyNamePrefix)
          .onChange(async (value) => {
            this.plugin.settings.propertyNamePrefix = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Label to sync")
      .setDesc("If not empty, then only contacts with this label will synced")
      .addText((text) =>
        text
          .setPlaceholder("e.g. obsidian")
          .setValue(this.plugin.settings.syncLabel)
          .onChange(async (value) => {
            this.plugin.settings.syncLabel = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Auto sync period")
      .setDesc("Period in minutes. If 0, then never. 1 day = 1440")
      .addText((text) =>
        text
          .setPlaceholder("e.g. 1440")
          .setValue(this.plugin.settings.syncIntervalMinutes.toString())
          .onChange(async (value) => {
            const parsed = parseInt(value);
            if (!isNaN(parsed) && parsed > 0) {
              this.plugin.settings.syncIntervalMinutes = parsed;
              this.plugin.setupAutoSync();
            } else {
              this.plugin.settings.syncIntervalMinutes = 0;
            }
            await this.plugin.saveSettings();
            this.plugin.setupAutoSync();
          })
      );

    new Setting(containerEl)
      .setName("Sync on startup")
      .setDesc("Automatically sync contacts when the plugin is loaded.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.syncOnStartup)
          .onChange(async (value) => {
            this.plugin.settings.syncOnStartup = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

