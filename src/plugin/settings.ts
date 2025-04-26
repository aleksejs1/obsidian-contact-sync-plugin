import { Notice, Setting, App, PluginSettingTab } from 'obsidian';
import { LINK_TO_MANUAL } from '../config';
import { getAuthUrl } from '../auth/getAuthUrl';
import GoogleContactsSyncPlugin from '../main';

/**
 * Settings tab for the Google Contacts Sync plugin.
 * Allows the user to configure plugin options through the Obsidian settings UI.
 */
export class ContactSyncSettingTab extends PluginSettingTab {
  /** Reference to the main plugin instance */
  plugin: GoogleContactsSyncPlugin;

  /**
   * Constructs the settings tab.
   * @param app The current Obsidian app instance.
   * @param plugin The instance of the GoogleContactsSyncPlugin.
   */
  constructor(app: App, plugin: GoogleContactsSyncPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /**
   * Renders the plugin's settings UI in Obsidian's settings panel.
   */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Google Contacts Sync Settings' });

    const manual = document.createDocumentFragment();
    manual.append(
      'Here is the manual about creating your own client: ',
      manual.createEl('a', {
        href: LINK_TO_MANUAL,
        text: 'manual',
      })
    );

    new Setting(containerEl)
      .setName('Google Client ID')
      .setDesc(manual)
      .addText((text) =>
        text
          .setPlaceholder('Enter your client ID')
          .setValue(this.plugin.settings.clientId)
          .onChange(async (value) => {
            this.plugin.settings.clientId = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName('Google Client Secret').addText((text) =>
      text
        .setPlaceholder('Enter your client secret')
        .setValue(this.plugin.settings.clientSecret)
        .onChange(async (value) => {
          this.plugin.settings.clientSecret = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl)
      .setName('Login with Google')
      .setDesc("Open Google's OAuth page in your browser")
      .addButton((btn) =>
        btn.setButtonText('Login').onClick(() => {
          if (!this.plugin.settings.clientId) {
            new Notice('Please enter your Client ID first.');
            return;
          }
          window.open(getAuthUrl(this.plugin.settings.clientId), '_blank');
        })
      );

    new Setting(containerEl)
      .setName('Authorization Code')
      .setDesc('Paste the code from Google after login')
      .addText((text) =>
        text.setPlaceholder('Paste code here').onChange(async (code) => {
          if (
            !this.plugin.settings.clientId ||
            !this.plugin.settings.clientSecret ||
            !this.plugin.auth
          ) {
            new Notice('Client ID and Secret required.');
            return;
          }

          this.plugin.auth.exchangeCode(code);
          Object.assign(
            this.plugin.settings,
            this.plugin.auth.getSettingsUpdate()
          );
          await this.plugin.saveSettings();
          new Notice('Tokens saved!');
        })
      );

    new Setting(containerEl)
      .setName('Contacts Folder')
      .setDesc('Vault folder where contact notes will be stored')
      .addText((text) =>
        text
          .setPlaceholder('e.g. Contacts')
          .setValue(this.plugin.settings.contactsFolder)
          .onChange(async (value) => {
            this.plugin.settings.contactsFolder = value.trim() || 'Contacts';
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Note Template')
      .setDesc(
        'Template to insert below the metadata block for new contact notes'
      )
      .addTextArea((text) =>
        text
          .setPlaceholder('e.g. # Notes\n\nWrite something here...')
          .setValue(this.plugin.settings.noteTemplate)
          .onChange(async (value) => {
            this.plugin.settings.noteTemplate = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('File Name Prefix')
      .setDesc('Prefix to add to the beginning of each contact file name')
      .addText((text) =>
        text
          .setPlaceholder('e.g. p ')
          .setValue(this.plugin.settings.fileNamePrefix)
          .onChange(async (value) => {
            this.plugin.settings.fileNamePrefix = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Property Name Prefix')
      .setDesc('Prefix to add to the beginning of each contact property name')
      .addText((text) =>
        text
          .setPlaceholder('e.g. s_')
          .setValue(this.plugin.settings.propertyNamePrefix)
          .onChange(async (value) => {
            this.plugin.settings.propertyNamePrefix = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Label to sync')
      .setDesc('If not empty, then only contacts with this label will synced')
      .addText((text) =>
        text
          .setPlaceholder('e.g. obsidian')
          .setValue(this.plugin.settings.syncLabel)
          .onChange(async (value) => {
            this.plugin.settings.syncLabel = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Auto sync period')
      .setDesc('Period in minutes. If 0, then never. 1 day = 1440')
      .addText((text) =>
        text
          .setPlaceholder('e.g. 1440')
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
      .setName('Sync on startup')
      .setDesc('Automatically sync contacts when the plugin is loaded.')
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
