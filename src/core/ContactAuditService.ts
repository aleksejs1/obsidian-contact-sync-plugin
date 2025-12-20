import { App, TFile, Notice, TFolder } from 'obsidian';
import { GoogleContactsService } from './GoogleContactsService';
import { ContactSyncSettings } from '../types/Settings';
import { getAllMarkdownFilesInFolder } from '../utils/getAllMarkdownFilesInFolder';
import { GoogleContact } from '../types/Contact';
import { t } from '../i18n/translator';

export class ContactAuditService {
  constructor(
    private app: App,
    private googleService: GoogleContactsService,
    private settings: ContactSyncSettings
  ) {}

  async auditContacts(token: string): Promise<void> {
    new Notice(t('Starting contact audit...'));

    let labelMap: Record<string, string> = {};
    try {
      labelMap = await this.googleService.fetchGoogleGroups(token);
    } catch (error) {
      console.error('Failed to fetch Google groups', error);
      new Notice(
        t('Failed to fetch Google groups. Check console for details.')
      );
      return;
    }

    let googleContacts: GoogleContact[] = [];
    try {
      googleContacts = await this.googleService.fetchGoogleContacts(token);
    } catch (error) {
      console.error('Failed to fetch Google contacts', error);
      new Notice(
        t('Failed to fetch Google contacts. Check console for details.')
      );
      return;
    }

    const validGoogleIds = new Set<string>();
    googleContacts.forEach((contact) => {
      if (this.hasSyncLabel(contact, this.settings.syncLabel, labelMap)) {
        const id = this.getContactId(contact);
        if (id) {
          validGoogleIds.add(id);
        }
      }
    });

    const folderPath = this.settings.contactsFolder;
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder || !(folder instanceof TFolder)) {
      new Notice(`${t('Contacts folder not found')}: ${folderPath}`);
      return;
    }

    const files = getAllMarkdownFilesInFolder(folder);
    const orphans: { file: TFile; id: string }[] = [];

    const propertyPrefix = this.settings.propertyNamePrefix;
    const idField = `${propertyPrefix}id`;

    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      const frontmatter = cache?.frontmatter as
        | Record<string, unknown>
        | undefined;
      const id = frontmatter?.[idField];

      if (typeof id === 'string' || typeof id === 'number') {
        const idStr = String(id);
        if (!validGoogleIds.has(idStr)) {
          orphans.push({ file, id: idStr });
        }
      }
    }

    await this.generateReport(orphans);
  }

  private async generateReport(
    orphans: { file: TFile; id: string }[]
  ): Promise<void> {
    const reportPath = 'Contact Audit Report.md';
    let content = `# ${t('Contact Audit Report')}\n\n`;
    content += `${t('Date')}: ${new Date().toLocaleString()}\n`;
    content += `${t('Checked Folder')}: \`${this.settings.contactsFolder}\`\n`;
    content += `${t('Sync Label')}: ${this.settings.syncLabel || '(' + t('None') + ')'}\n\n`;

    if (orphans.length === 0) {
      content += `✅ **${t('No orphaned contacts found.')}**\n${t(
        'All contact notes in the folder match existing Google Contacts.'
      )}\n`;
    } else {
      content += `⚠️ **${t('Found')} ${orphans.length} ${t(
        'orphaned contact notes'
      )}**\n`;
      content += `${t(
        'These notes have a contact ID that was not found in your Google Contacts (filtered by label).'
      )}\n\n`;
      content += `| ${t('File')} | ${t('Contact ID')} |\n`;
      content += `| :--- | :--- |\n`;

      for (const item of orphans) {
        content += `| [${item.file.basename}](${encodeURI(item.file.path)}) | \`${item.id}\` |\n`;
      }
    }

    const file = this.app.vault.getAbstractFileByPath(reportPath);
    if (file instanceof TFile) {
      await this.app.vault.modify(file, content);
    } else {
      await this.app.vault.create(reportPath, content);
    }

    new Notice(`${t('Audit complete. Report saved to')} ${reportPath}`);
    const reportFile = this.app.vault.getAbstractFileByPath(reportPath);
    if (reportFile instanceof TFile) {
      void this.app.workspace.getLeaf(true).openFile(reportFile);
    }
  }

  private hasSyncLabel(
    contact: GoogleContact,
    syncLabel: string,
    labelMap: Record<string, string>
  ): boolean {
    if (!syncLabel) {
      return true;
    }

    const targetGroupId = labelMap[syncLabel];
    if (!targetGroupId) {
      return false;
    }

    return (contact.memberships ?? []).some(
      (m) => m.contactGroupMembership?.contactGroupId === targetGroupId
    );
  }

  private getContactId(contact: GoogleContact): string | null {
    if (!contact.resourceName) {
      return null;
    }
    return contact.resourceName.split('/').pop() ?? null;
  }
}
