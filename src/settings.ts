import { Notice, Setting, App, PluginSettingTab, requestUrl } from "obsidian";
import { URL_OAUTH_TOKEN, LINK_TO_MANUAL, URI_OATUH_REDIRECT } from "./config";
import { getAuthUrl } from "./helper";
import GoogleContactsSyncPlugin from "./main"

export class ContactSyncSettingTab extends PluginSettingTab {
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
        href: LINK_TO_MANUAL,
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
            window.open(getAuthUrl(this.plugin.settings.clientId), "_blank");
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
            "redirect_uri": URI_OATUH_REDIRECT,
            "grant_type": "authorization_code"
          }

          try {
            const response = await requestUrl({
              url: URL_OAUTH_TOKEN,
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
