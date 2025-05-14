import {
  FileManager,
  MetadataCache,
  normalizePath,
  TFile,
  Vault,
} from 'obsidian';
import { GoogleContact } from 'src/types/Contact';
import { getAllMarkdownFilesInFolder } from 'src/utils/getAllMarkdownFilesInFolder';
import { Formatter } from './Formatter';
import { VaultService } from 'src/services/VaultService';
import { ContactNoteConfig } from 'src/types/ContactNoteConfig';

/**
 * Responsible for creating and updating contact notes in the vault.
 * Handles writing new notes and updating existing ones based on contact metadata.
 */
export class ContactNoteWriter {
  /**
   * The Formatter instance used for formatting contact data into frontmatter.
   *
   * This protected property is used to format contact data into a suitable format for Obsidian frontmatter.
   */
  protected formatter: Formatter = new Formatter();

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
    this.vaultService = new VaultService(vault);
    this.metadataCache = metadataCache;
    this.fileManager = fileManager;
  }

  /**
   * Writes notes for the provided contacts based on the specified configuration.
   *
   * @param config - The configuration for writing contact notes.
   * @param labelMap - A mapping of label names to their corresponding group IDs.
   * @param contacts - The list of Google contacts to write notes for.
   */
  async writeNotesForContacts(
    config: ContactNoteConfig,
    labelMap: Record<string, string>,
    contacts: GoogleContact[]
  ): Promise<void> {
    await this.vaultService.createFolderIfNotExists(config.folderPath);

    const folder = this.vaultService.getFolderByPath(config.folderPath);
    if (!folder) return;
    const files = getAllMarkdownFilesInFolder(folder);
    const filesIdMapping = await this.scanFiles(files, config.propertyPrefix);
    const invertedLabelMap: Record<string, string> = Object.fromEntries(
      Object.entries(labelMap).map((a) => a.reverse())
    );

    for (const contact of contacts) {
      if (!this.hasSyncLabel(contact, config.syncLabel, labelMap)) continue;

      const id = this.getContactId(contact);
      if (!id) continue;

      const filename = this.getFilename(
        contact,
        id,
        config.folderPath,
        config.prefix
      );
      if (!filename) continue;

      await this.fileManager.processFrontMatter(
        filesIdMapping[id] ||
          (await this.vaultService.getFileByPath(filename)) ||
          (await this.vaultService.createFile(filename, config.noteBody)),
        this.processFrontMatter(
          this.generateFrontmatterLines(
            config.propertyPrefix,
            contact,
            invertedLabelMap
          )
        )
      );
    }
  }

  /**
   * Generates a filename for the contact note based on the contact's display name and ID.
   *
   * @param contact - The Google contact to generate a filename for.
   * @param id - The contact ID.
   * @param folderPath - The folder path where the note will be stored.
   * @param prefix - The prefix to use for the filename.
   * @returns The generated filename, or null if the name is not available.
   */
  private getFilename(
    contact: GoogleContact,
    id: string,
    folderPath: string,
    prefix: string
  ): string | null {
    const name = contact.names?.[0]?.displayName || id;
    if (!name) return null;
    const safeName = name.replace(/[\\/:*?"<>|]/g, '_');
    const filename = normalizePath(`${folderPath}/${prefix}${safeName}.md`);
    return filename;
  }

  /**
   * Processes the frontmatter lines and updates the frontmatter of the given file.
   *
   * @param frontmatterLines - The frontmatter lines to process.
   * @returns A function that takes a frontmatter object and updates it with the provided lines.
   */
  private processFrontMatter(
    frontmatterLines: Record<string, string>
  ): (frontmatter: Record<string, string>) => void {
    return (frontmatter: Record<string, string>) => {
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
    if (!contact.resourceName) return null;
    return contact.resourceName.split('/').pop() || null;
  }

  /**
   * Generates frontmatter lines for a contact based on the provided property prefix and contact data.
   *
   * @param propertyPrefix - The prefix to use for frontmatter properties.
   * @param contact - The Google contact to generate frontmatter for.
   * @param invertedLabelMap - A mapping of label names to their corresponding group IDs.
   * @returns A record of frontmatter properties and their values.
   */
  private generateFrontmatterLines(
    propertyPrefix: string,
    contact: GoogleContact,
    invertedLabelMap: Record<string, string>
  ): Record<string, string> {
    const frontmatterLines: Record<string, string> = {
      [`${propertyPrefix}id`]: String(this.getContactId(contact)),
      [`${propertyPrefix}synced`]: String(new Date().toISOString()),
    };

    this.formatter.addNameField(frontmatterLines, contact, propertyPrefix);
    this.formatter.addEmailField(frontmatterLines, contact, propertyPrefix);
    this.formatter.addPhoneField(frontmatterLines, contact, propertyPrefix);
    this.formatter.addAddressFields(frontmatterLines, contact, propertyPrefix);
    this.formatter.addBioField(frontmatterLines, contact, propertyPrefix);
    this.formatter.addOrganizationFields(
      frontmatterLines,
      contact,
      propertyPrefix
    );
    this.formatter.addJobTitleFields(frontmatterLines, contact, propertyPrefix);
    this.formatter.addBirthdayFields(frontmatterLines, contact, propertyPrefix);
    this.formatter.addLabels(
      frontmatterLines,
      contact,
      propertyPrefix,
      invertedLabelMap
    );

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
    if (!syncLabel) return true;

    const targetGroupId = labelMap[syncLabel];
    return (contact.memberships || []).some(
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
  protected async scanFiles(
    files: TFile[],
    propertyPrefix: string
  ): Promise<Record<string, TFile>> {
    const idToFileMapping: Record<string, TFile> = {};

    for (const file of files) {
      const frontmatter = this.metadataCache.getFileCache(file)?.frontmatter;
      const idFieldName = `${propertyPrefix}id`;
      if (frontmatter && frontmatter[idFieldName]) {
        idToFileMapping[frontmatter[idFieldName]] = file;
      }
    }

    return idToFileMapping;
  }
}
