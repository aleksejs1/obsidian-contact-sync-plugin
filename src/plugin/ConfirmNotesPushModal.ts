import { App, Modal, Setting } from 'obsidian';
import { t } from 'src/i18n/translator';

/**
 * Asks the user to confirm sending many edited notes to Google Contacts at once.
 * Guards against a vault-wide script or bulk edit silently overwriting notes in Google.
 */
export class ConfirmNotesPushModal extends Modal {
  private resolve: ((confirmed: boolean) => void) | null = null;

  constructor(
    app: App,
    private names: string[]
  ) {
    super(app);
  }

  /**
   * Opens the modal and resolves with the user's choice (false if closed without confirming).
   */
  ask(): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.open();
    });
  }

  override onOpen(): void {
    const { contentEl } = this;
    this.setTitle(t('Send notes to Google Contacts?'));
    contentEl.createEl('p', {
      text: t(
        'Notes of {count} contacts were changed in Obsidian. They will replace the Notes field of these contacts in Google Contacts:',
        { count: this.names.length }
      ),
    });
    const list = contentEl.createEl('ul');
    for (const name of this.names) {
      list.createEl('li', { text: name });
    }
    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText(t('Send'))
          .setCta()
          .onClick(() => {
            this.finish(true);
          })
      )
      .addButton((btn) =>
        btn.setButtonText(t('Cancel')).onClick(() => {
          this.finish(false);
        })
      );
  }

  override onClose(): void {
    this.contentEl.empty();
    this.finish(false);
  }

  private finish(confirmed: boolean): void {
    const resolve = this.resolve;
    if (!resolve) {
      return;
    }
    this.resolve = null;
    resolve(confirmed);
    this.close();
  }
}
