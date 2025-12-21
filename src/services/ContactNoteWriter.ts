import {
  FileManager,
  MetadataCache,
  normalizePath,
  TFile,
  Vault,
} from 'obsidian';
import { GoogleContact } from 'src/types/Contact';
import { getAllMarkdownFilesInFolder } from 'src/utils/getAllMarkdownFilesInFolder';
import { createDefaultFormatter } from '../core/Formatter';
import { VaultService } from './VaultService';
import { ContactNoteConfig } from 'src/types/ContactNoteConfig';
import { NamingStrategy } from 'src/types/Settings';

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
   */
  async writeNotesForContacts(
    config: ContactNoteConfig,
    labelMap: Record<string, string>,
    contacts: GoogleContact[]
  ): Promise<void> {
    await this.vaultService.createFolderIfNotExists(config.folderPath);

    const folder = this.vaultService.getFolderByPath(config.folderPath);
    if (!folder) {
      return;
    }

    const files = getAllMarkdownFilesInFolder(folder);
    const filesIdMapping = this.scanFiles(files, config.propertyPrefix);
    const invertedLabelMap = this.getInvertedLabelMap(labelMap);

    for (const contact of contacts) {
      await this.processContact(
        contact,
        config,
        labelMap,
        invertedLabelMap,
        filesIdMapping
      );
    }
  }

  private getInvertedLabelMap(
    labelMap: Record<string, string>
  ): Record<string, string> {
    return Object.fromEntries(
      Object.entries(labelMap).map(([key, value]) => [value, key])
    ) as Record<string, string>;
  }

  private async processContact(
    contact: GoogleContact,
    config: ContactNoteConfig,
    labelMap: Record<string, string>,
    invertedLabelMap: Record<string, string>,
    filesIdMapping: Record<string, TFile>
  ): Promise<void> {
    if (!this.hasSyncLabel(contact, config.syncLabel, labelMap)) {
      return;
    }

    const id = this.getContactId(contact);
    if (!id) {
      return;
    }

    let filename = this.getFilename(
      contact,
      id,
      config.folderPath,
      config.prefix,
      config.lastFirst
    );
    if (!filename) {
      return;
    }

    if (config.renameFiles && filesIdMapping[id]) {
      filename = await this.ensureRenamed(id, filename, filesIdMapping);
    }

    const file = await this.getOrCreateFile(
      id,
      filename,
      filesIdMapping,
      config.noteBody
    );
    if (!file) {
      return;
    }
    await this.fileManager.processFrontMatter(
      file,
      this.processFrontMatter(
        this.generateFrontmatterLines(
          config.propertyPrefix,
          contact,
          invertedLabelMap,
          config.namingStrategy,
          config.organizationAsLink,
          config.trackSyncTime
        )
      )
    );
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
   * Processes the frontmatter lines and updates the frontmatter of the given file.
   *
   * @param frontmatterLines - The frontmatter lines to process.
   * @returns A function that takes a frontmatter object and updates it with the provided lines.
   */
  private processFrontMatter(
    frontmatterLines: Record<string, string | string[]>
  ): (frontmatter: Record<string, unknown>) => void {
    return (frontmatter: Record<string, unknown>) => {
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
   * @param propertyPrefix - The prefix to use for frontmatter properties.
   * @param contact - The Google contact to generate frontmatter for.
   * @param invertedLabelMap - A mapping of label names to their corresponding group IDs.
   * @param organizationAsLink - Whether to format organization names as Obsidian links.
   * @returns A record of frontmatter properties and their values.
   */
  private generateFrontmatterLines(
    propertyPrefix: string,
    contact: GoogleContact,
    invertedLabelMap: Record<string, string>,
    namingStrategy: NamingStrategy,
    organizationAsLink = false,
    trackSyncTime = false
  ): Record<string, string | string[]> {
    const formatter = createDefaultFormatter(namingStrategy);
    const formattedFields = formatter.generateFrontmatter(
      contact,
      propertyPrefix,
      {
        labelMap: invertedLabelMap,
        organizationAsLink: organizationAsLink,
        namingStrategy: namingStrategy,
      }
    );

    const frontmatterLines: Record<string, string | string[]> = {
      ...formattedFields,
    };

    if (trackSyncTime && namingStrategy !== NamingStrategy.VCF) {
      frontmatterLines[`${propertyPrefix}synced`] = new Date().toISOString();
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
        | Record<string, unknown>
        | undefined;
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
