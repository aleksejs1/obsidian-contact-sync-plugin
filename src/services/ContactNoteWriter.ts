import {
  FileManager,
  MetadataCache,
  normalizePath,
  Notice,
  TFile,
  Vault,
} from 'obsidian';
import { GoogleContact } from 'src/types/Contact';
import { getAllMarkdownFilesInFolder } from 'src/utils/getAllMarkdownFilesInFolder';
import {
  createDefaultFormatter,
  createNamingStrategy,
} from 'src/core/Formatter';
import {
  decideNotesSync,
  getContactNotesText,
  hasBrokenNotesBlock,
  NotesBlock,
  hashNotesText,
  isWritableContact,
  readNotesBlock,
  upsertNotesBlock,
} from 'src/core/notesBlock';
import { NotesSyncReport, PendingNotesPush } from 'src/types/NotesSync';
import { VaultService } from './VaultService';
import { ContactNoteConfig } from 'src/types/ContactNoteConfig';
import { NamingStrategy } from 'src/types/Settings';
import { AdapterContext } from 'src/types/AdapterContext';

/**
 * Responsible for creating and updating contact notes in the vault.
 * Handles writing new notes and updating existing ones based on contact metadata.
 */
export class ContactNoteWriter {
  /**
   * The VaultService instance used for vault operations.
   *
   * This protected property is used to encapsulate file and folder operations to facilitate testing and decouple from direct API usage.
   */
  protected vaultService: VaultService;

  /**
   * The MetadataCache instance used for managing file metadata.
   *
   * This protected property is used to manage file metadata in the Obsidian vault.
   */
  protected metadataCache: MetadataCache;

  /**
   * The FileManager instance used for file operations.
   *
   * This protected property is used to manage file operations in the Obsidian vault.
   */
  protected fileManager: FileManager;

  /**
   * Creates an instance of ContactNoteWriter.
   *
   * @param vault - The Obsidian Vault instance to operate on.
   * @param metadataCache - The Obsidian MetadataCache instance to operate on.
   * @param fileManager - The Obsidian FileManager instance to operate on.
   */
  constructor(
    vault: Vault,
    metadataCache: MetadataCache,
    fileManager: FileManager
  ) {
    this.vaultService = new VaultService(vault, fileManager);
    this.metadataCache = metadataCache;
    this.fileManager = fileManager;
  }

  /**
   * Writes notes for the provided contacts based on the specified configuration.
   *
   * @param config - The configuration for writing contact notes.
   * @param labelMap - A mapping of label names to their corresponding group IDs.
   * @param contacts - The list of Google contacts to write notes for.
   * @returns Notes edited in Obsidian that should be sent to Google, plus conflicts
   *   (only populated when notes write-back is enabled).
   */
  async writeNotesForContacts(
    config: ContactNoteConfig,
    labelMap: Record<string, string>,
    contacts: GoogleContact[]
  ): Promise<NotesSyncReport> {
    const report: NotesSyncReport = {
      pushes: [],
      conflicts: [],
      readOnly: [],
      broken: [],
    };
    await this.vaultService.createFolderIfNotExists(config.folderPath);

    const folder = this.vaultService.getFolderByPath(config.folderPath);
    if (!folder) {
      return report;
    }

    const files = getAllMarkdownFilesInFolder(folder);
    const filesIdMapping = this.scanFiles(files, config.propertyPrefix);
    const invertedLabelMap = this.getInvertedLabelMap(labelMap);

    const context: AdapterContext = {
      ...config,
      labelMap: invertedLabelMap,
    };

    for (const contact of contacts) {
      await this.processContact(
        contact,
        context,
        labelMap,
        filesIdMapping,
        report
      );
    }
    return report;
  }

  /**
   * Records that a pushed value is now in sync, so it isn't sent again.
   * If the block was edited again in the meantime, it is left as is and will be sent on the next sync.
   *
   * @param push - The push that Google accepted.
   */
  async markNotesPushed(push: PendingNotesPush): Promise<void> {
    await this.vaultService.processFile(push.file, (data) => {
      const block = readNotesBlock(data);
      if (block?.text !== push.text) {
        return data;
      }
      return upsertNotesBlock(data, push.text, hashNotesText(push.text));
    });
  }

  private getInvertedLabelMap(
    labelMap: Record<string, string>
  ): Record<string, string> {
    return Object.fromEntries(
      Object.entries(labelMap).map(([key, value]) => [value, key])
    );
  }

  private async processContact(
    contact: GoogleContact,
    context: AdapterContext,
    labelMap: Record<string, string>,
    filesIdMapping: Record<string, TFile>,
    report: NotesSyncReport
  ): Promise<void> {
    if (!this.hasSyncLabel(contact, context.syncLabel, labelMap)) {
      return;
    }

    const id = this.getContactId(contact);
    if (!id) {
      return;
    }

    if (context.skipNamelessContacts && !this.hasName(contact)) {
      return;
    }

    const filename = this.getFilename(
      contact,
      id,
      context.folderPath,
      context.prefix,
      context.lastFirst
    );
    if (!filename) {
      return;
    }

    await this.updateContactFile(
      contact,
      context,
      id,
      filename,
      filesIdMapping,
      report
    );
  }

  private async updateContactFile(
    contact: GoogleContact,
    context: AdapterContext,
    id: string,
    filename: string,
    filesIdMapping: Record<string, TFile>,
    report: NotesSyncReport
  ): Promise<void> {
    try {
      if (context.renameFiles && filesIdMapping[id]) {
        filename = await this.ensureRenamed(id, filename, filesIdMapping);
      }

      const file = await this.getOrCreateFile(
        id,
        filename,
        filesIdMapping,
        context.noteBody
      );
      if (!file) {
        return;
      }
      if (context.notesInBody && context.notesWriteBack) {
        await this.syncNotesTwoWay(file, contact, report);
      } else if (context.notesInBody) {
        await this.writeNotesBlock(file, contact, report);
      }
      await this.fileManager.processFrontMatter(
        file,
        this.processFrontMatter(
          this.generateFrontmatterLines(context, contact),
          this.getObsoleteFrontmatterKeys(context)
        )
      );
    } catch (error) {
      new Notice(
        `Error processing contact "${filename}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Writes the contact's Google notes into the managed block of the note body (one-way mode).
   * The hash of the written value is always recorded in the closing marker, so that when
   * write-back is enabled later the plugin knows which side changed since the last sync.
   * No empty block is added to a note that has none. The file is only written when it changes.
   *
   * @param file - The contact note.
   * @param contact - The Google contact.
   * @param report - Collects notes with broken block markers.
   */
  private async writeNotesBlock(
    file: TFile,
    contact: GoogleContact,
    report: NotesSyncReport
  ): Promise<void> {
    const text = getContactNotesText(contact);
    const baseline = hashNotesText(text);
    const update = (data: string) =>
      !text && !readNotesBlock(data)
        ? data
        : upsertNotesBlock(data, text, baseline);

    const current = await this.vaultService.readFile(file);
    if (hasBrokenNotesBlock(current)) {
      report.broken.push(this.getContactName(contact, file));
      return;
    }
    if (update(current) === current) {
      return;
    }
    await this.vaultService.processFile(file, update);
  }

  /**
   * Reconciles the notes block with Google using the baseline hash stored in the block.
   * Google-side changes are applied immediately; Obsidian-side changes are queued in the report
   * and sent by the caller; conflicts are reported and leave the note untouched.
   *
   * @param file - The contact note.
   * @param contact - The Google contact.
   * @param report - Collects pending pushes and problems.
   */
  private async syncNotesTwoWay(
    file: TFile,
    contact: GoogleContact,
    report: NotesSyncReport
  ): Promise<void> {
    const remote = getContactNotesText(contact);
    const content = await this.vaultService.readFile(file);
    const name = this.getContactName(contact, file);
    if (hasBrokenNotesBlock(content)) {
      report.broken.push(name);
      return;
    }
    const local = readNotesBlock(content);

    switch (decideNotesSync(local, remote)) {
      case 'none':
      case 'pull':
        await this.applyRemoteNotes(file, content, local, remote);
        return;
      case 'push':
        if (!local) {
          return;
        }
        if (isWritableContact(contact)) {
          report.pushes.push({ contact, file, text: local.text, name });
        } else {
          report.readOnly.push(name);
        }
        return;
      case 'conflict':
        report.conflicts.push(name);
        return;
    }
  }

  /**
   * Writes the Google value into the block and records it as the baseline.
   * If the block was edited after it was read, the note is left as is; the edit is picked up
   * on the next sync instead of being overwritten.
   */
  private async applyRemoteNotes(
    file: TFile,
    content: string,
    local: NotesBlock | null,
    remote: string
  ): Promise<void> {
    const baseline = hashNotesText(remote);
    if (upsertNotesBlock(content, remote, baseline) === content) {
      return;
    }
    await this.vaultService.processFile(file, (data) => {
      const fresh = readNotesBlock(data);
      if (fresh?.text !== local?.text) {
        return data;
      }
      return upsertNotesBlock(data, remote, baseline);
    });
  }

  private getContactName(contact: GoogleContact, file: TFile): string {
    return contact.names?.[0]?.displayName ?? file.path;
  }

  /**
   * Returns frontmatter keys previously written by the plugin that must be removed
   * under the current configuration.
   * When notes are synced to the body, the old notes property is dropped so it can't go stale.
   *
   * @param context - The adapter context.
   * @returns Keys to delete from frontmatter.
   */
  private getObsoleteFrontmatterKeys(context: AdapterContext): string[] {
    if (!context.notesInBody) {
      return [];
    }
    const strategy = createNamingStrategy(context.namingStrategy);
    return [strategy.generateKey('bio', 0, context.propertyPrefix)];
  }

  private async ensureRenamed(
    id: string,
    filename: string,
    filesIdMapping: Record<string, TFile>
  ): Promise<string> {
    const existingFile = filesIdMapping[id];
    if (existingFile && existingFile.path !== filename) {
      await this.vaultService.renameFile(existingFile, filename);
      const updatedFile = this.vaultService.getFileByPath(filename);
      if (updatedFile) {
        filesIdMapping[id] = updatedFile;
        return filename;
      }
    }
    return existingFile?.path ?? filename;
  }

  private async getOrCreateFile(
    id: string,
    filename: string,
    filesIdMapping: Record<string, TFile>,
    noteBody: string
  ): Promise<TFile | null> {
    const existingFile =
      filesIdMapping[id] ?? this.vaultService.getFileByPath(filename);
    if (existingFile) {
      return existingFile;
    }
    return await this.vaultService.createFile(filename, noteBody);
  }

  /**
   * Generates a filename for the contact note based on the contact's display name and ID.
   * Falls back to organization name if no display name is available.
   *
   * @param contact - The Google contact to generate a filename for.
   * @param id - The contact ID.
   * @param folderPath - The folder path where the note will be stored.
   * @param prefix - The prefix to use for the filename.
   * @param lastFirst - Whether to format the name as Last, First.
   * @returns The generated filename, or null if the name is not available.
   */
  private getFilename(
    contact: GoogleContact,
    id: string,
    folderPath: string,
    prefix: string,
    lastFirst: boolean
  ): string {
    const name =
      this.getLastFirstName(contact, lastFirst) ??
      contact.names?.[0]?.displayName ??
      contact.organizations?.[0]?.name ??
      id;
    const safeName = name.replace(/[\\/:*?"<>|]/g, '_');
    return normalizePath(`${folderPath}/${prefix}${safeName}.md`);
  }

  /**
   * @param contact Source google contact
   * @param lastFirst If the last name should be first
   * @returns The last name first formatted display name, or null if not available or wrong strategy.
   */
  private getLastFirstName(contact: GoogleContact, lastFirst: boolean) {
    if (!lastFirst) {
      return null;
    }
    return contact.names?.[0]?.displayNameLastFirst?.replace(/,/g, '');
  }

  /**
   * Returns true if the contact has at least one resolvable name (display name or organization).
   *
   * @param contact - The Google contact to check.
   * @returns Whether the contact has a usable name.
   */
  private hasName(contact: GoogleContact): boolean {
    return !!(
      contact.names?.[0]?.displayName ??
      contact.names?.[0]?.displayNameLastFirst ??
      contact.organizations?.[0]?.name
    );
  }

  /**
   * Processes the frontmatter lines and updates the frontmatter of the given file.
   *
   * @param frontmatterLines - The frontmatter lines to process.
   * @param keysToDelete - Keys to remove from the frontmatter.
   * @returns A function that takes a frontmatter object and updates it with the provided lines.
   */
  private processFrontMatter(
    frontmatterLines: Record<string, string | string[]>,
    keysToDelete: string[] = []
  ): (frontmatter: Record<string, unknown>) => void {
    return (frontmatter: Record<string, unknown>) => {
      for (const key of keysToDelete) {
        if (!(key in frontmatterLines)) {
          Reflect.deleteProperty(frontmatter, key);
        }
      }
      for (const key in frontmatterLines) {
        frontmatter[key] = frontmatterLines[key];
      }
    };
  }

  /**
   * Extracts the contact ID from a Google contact object.
   *
   * @param contact - The Google contact to extract the ID from.
   * @returns The extracted contact ID, or null if not found.
   */
  private getContactId(contact: GoogleContact): string | null {
    if (!contact.resourceName) {
      return null;
    }
    return contact.resourceName.split('/').pop() ?? null;
  }

  /**
   * Generates frontmatter lines for a contact based on the provided property prefix and contact data.
   *
   * @param context - The adapter context containing configuration and label map.
   * @param contact - The Google contact to generate frontmatter for.
   * @returns A record of frontmatter properties and their values.
   */
  private generateFrontmatterLines(
    context: AdapterContext,
    contact: GoogleContact
  ): Record<string, string | string[]> {
    const formatter = createDefaultFormatter(context.namingStrategy);
    const formattedFields = formatter.generateFrontmatter(
      contact,
      context.propertyPrefix,
      context as unknown as Record<string, unknown>
    );

    const frontmatterLines: Record<string, string | string[]> = {
      ...formattedFields,
    };

    if (
      context.trackSyncTime &&
      context.namingStrategy !== NamingStrategy.VCF
    ) {
      frontmatterLines[`${context.propertyPrefix}synced`] =
        new Date().toISOString();
    }

    return frontmatterLines;
  }

  /**
   * Checks if a Google contact has the specified sync label.
   *
   * @param contact - The Google contact to check.
   * @param syncLabel - The label to check for.
   * @param labelMap - A mapping of label names to their corresponding group IDs.
   * @returns True if the contact has the label, false otherwise.
   */
  protected hasSyncLabel(
    contact: GoogleContact,
    syncLabel: string,
    labelMap: Record<string, string>
  ): boolean {
    if (!syncLabel) {
      return true;
    }

    const targetGroupId = labelMap[syncLabel];
    return (contact.memberships ?? []).some(
      (m) => m.contactGroupMembership?.contactGroupId === targetGroupId
    );
  }

  /**
   * Scans the provided files for frontmatter properties matching the specified prefix.
   *
   * @param files - The list of TFile objects to scan.
   * @param propertyPrefix - The prefix to use for identifying frontmatter properties.
   * @returns A mapping of property values to TFile objects.
   */
  protected scanFiles(
    files: TFile[],
    propertyPrefix: string
  ): Record<string, TFile> {
    const idToFileMapping: Record<string, TFile> = {};

    for (const file of files) {
      const frontmatter = this.metadataCache.getFileCache(file)?.frontmatter as
        Record<string, unknown> | undefined;
      const idFieldName = `${propertyPrefix}id`;
      const idValue = frontmatter?.[idFieldName];
      if (typeof idValue === 'string' || typeof idValue === 'number') {
        idToFileMapping[String(idValue)] = file;
      } else {
        const vcfIdFieldName = `X-GOOGLE-ID`;
        const vcfIdValue = frontmatter?.[vcfIdFieldName];
        if (typeof vcfIdValue === 'string' || typeof vcfIdValue === 'number') {
          idToFileMapping[String(vcfIdValue)] = file;
        }
      }
    }

    return idToFileMapping;
  }
}
