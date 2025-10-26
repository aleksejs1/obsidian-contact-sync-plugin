import { Notice, Setting, App, PluginSettingTab } from 'obsidian';
import { LINK_TO_MANUAL } from '../config';
import { getAuthUrl } from '../auth/getAuthUrl';
import GoogleContactsSyncPlugin from '../main';
import { t } from '../i18n/translator';
import { FolderSuggest } from 'src/core/FolderSuggest';

/**
 * Settings tab for the Google contacts sync plugin.
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

    const manual = document.createDocumentFragment();
    manual.append(
      t('Here is the manual about creating your own client:'),
      ' ',
      manual.createEl('a', {
        href: LINK_TO_MANUAL,
        text: t('manual'),
      })
    );

    new Setting(containerEl)
      .setName(t('Contacts folder'))
      .setDesc(t('Vault folder where contact notes will be stored'))
      .addText((text) => {
        text
          .setPlaceholder(t('e.g. Contacts'))
          .setValue(this.plugin.settings.contactsFolder)
          .onChange(async (value) => {
            this.plugin.settings.contactsFolder = value.trim() || 'Contacts';
            await this.plugin.saveSettings();
          });

        new FolderSuggest(this.app, text.inputEl);

        return text;
      });

    new Setting(containerEl)
      .setName(t('Note template'))
      .setDesc(
        t('Template to insert below the metadata block for new contact notes')
      )
      .addTextArea((text) =>
        text
          .setPlaceholder(t('e.g. # Notes\n\nWrite something here...'))
          .setValue(this.plugin.settings.noteTemplate)
          .onChange(async (value) => {
            this.plugin.settings.noteTemplate = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t('File name prefix'))
      .setDesc(t('Prefix to add to the beginning of each contact file name'))
      .addText((text) =>
        text
          .setPlaceholder(t('e.g. p '))
          .setValue(this.plugin.settings.fileNamePrefix)
          .onChange(async (value) => {
            this.plugin.settings.fileNamePrefix = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t('Property name prefix'))
      .setDesc(
        t('Prefix to add to the beginning of each contact property name')
      )
      .addText((text) =>
        text
          .setPlaceholder(t('e.g. s_'))
          .setValue(this.plugin.settings.propertyNamePrefix)
          .onChange(async (value) => {
            this.plugin.settings.propertyNamePrefix = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t('Organization as link'))
      .setDesc(
        t(
          'Organization name will be stored as a obsidian link [[...]] instead of plain text'
        )
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.organizationAsLink)
          .onChange(async (value) => {
            this.plugin.settings.organizationAsLink = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t('Label to sync'))
      .setDesc(
        t('If not empty, then only contacts with this label will synced')
      )
      .addText((text) =>
        text
          .setPlaceholder(t('e.g. obsidian'))
          .setValue(this.plugin.settings.syncLabel)
          .onChange(async (value) => {
            this.plugin.settings.syncLabel = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t('Auto sync period'))
      .setDesc(t('Period in minutes. If 0, then never. 1 day = 1440'))
      .addText((text) =>
        text
          .setPlaceholder(t('e.g. 1440'))
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
      .setName(t('Sync on startup'))
      .setDesc(t('Automatically sync contacts when the plugin is loaded.'))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.syncOnStartup)
          .onChange(async (value) => {
            this.plugin.settings.syncOnStartup = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t('Rename files if name changed'))
      .setDesc(
        t(
          'If enabled, existing contact files will be renamed if the contact name changes. All links in vault will be updated accordingly.'
        )
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.renameFiles)
          .onChange(async (value) => {
            this.plugin.settings.renameFiles = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t('Track last sync time in notes'))
      .setDesc(
        t(
          'If enabled, the plugin will update the synced property in each note with the last synchronization time. This may cause performance issues with very large contact lists.'
        )
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.trackSyncTime)
          .onChange(async (value) => {
            this.plugin.settings.trackSyncTime = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName(t('Google auth')).setHeading();

    new Setting(containerEl)
      .setName(t('Google client ID'))
      .setDesc(manual)
      .addText((text) =>
        text
          .setPlaceholder(t('Enter your client ID'))
          .setValue(this.plugin.settings.clientId)
          .onChange(async (value) => {
            this.plugin.settings.clientId = value;
            await this.plugin.saveSettings();
            this.plugin.auth?.updateSettings(this.plugin.settings);
          })
      );

    new Setting(containerEl)
      .setName(t('Google client secret'))
      .addText((text) =>
        text
          .setPlaceholder(t('Enter your client secret'))
          .setValue(this.plugin.settings.clientSecret)
          .onChange(async (value) => {
            this.plugin.settings.clientSecret = value;
            await this.plugin.saveSettings();
            this.plugin.auth?.updateSettings(this.plugin.settings);
          })
      );

    new Setting(containerEl)
      .setName(t('Login with Google'))
      .setDesc(t("Open Google's auth page in your browser"))
      .addButton((btn) =>
        btn.setButtonText(t('Login')).onClick(() => {
          if (!this.plugin.settings.clientId) {
            new Notice(t('Please enter your client ID first.'));
            return;
          }
          window.open(getAuthUrl(this.plugin.settings.clientId), '_blank');
        })
      );

    new Setting(containerEl)
      .setName(t('Authorization code'))
      .setDesc(t('Paste the code from Google after login'))
      .addText((text) =>
        text.setPlaceholder(t('Paste code here')).onChange(async (code) => {
          if (
            !this.plugin.settings.clientId ||
            !this.plugin.settings.clientSecret ||
            !this.plugin.auth
          ) {
            new Notice(t('Client ID and secret required.'));
            return;
          }

          try {
            await this.plugin.auth.exchangeCode(code);
          } catch (error) {
            console.error(
              'Failed to exchange code:',
              JSON.stringify(error, null, 2)
            );
            new Notice(
              t('Failed to exchange code. Check console for details.')
            );
            return;
          }

          Object.assign(
            this.plugin.settings,
            this.plugin.auth.getSettingsUpdate()
          );
          await this.plugin.saveSettings();
          new Notice(t('Tokens saved!'));
        })
      );
  }
}
