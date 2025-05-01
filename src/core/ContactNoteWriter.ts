import {
  normalizePath,
  parseYaml,
  stringifyYaml,
  TFile,
  Vault,
} from 'obsidian';
import { GoogleContact } from 'src/types/Contact';
import { getAllMarkdownFilesInFolder } from 'src/utils/getAllMarkdownFilesInFolder';
import { Formatter } from './Formatter';
import { VaultService } from 'src/services/VaultService';

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
   * Creates an instance of the ContactNoteWriter class.
   *
   * @param vault - The Obsidian Vault instance where the contact notes are stored.
   */
  constructor(vault: Vault) {
    this.vaultService = new VaultService(vault);
  }

  /**
   * Creates or updates markdown notes for each contact based on the provided contact data.
   *
   * @param prefix - Prefix to use for note filenames.
   * @param propertyPrefix - Prefix to use for frontmatter properties.
   * @param syncLabel - Label used to determine which contacts to sync.
   * @param labelMap - Mapping of label names to Google Contact group resource names.
   * @param contacts - List of Google contacts to sync into notes.
   * @param folderPath - Target folder path where notes should be stored.
   * @param noteBody - The body template to insert below the frontmatter in each note.
   */
  async writeNotesForContacts(
    prefix: string,
    propertyPrefix: string,
    syncLabel: string,
    labelMap: Record<string, string>,
    contacts: GoogleContact[],
    folderPath: string,
    noteBody: string
  ): Promise<void> {
    await this.vaultService.createFolderIfNotExists(folderPath);

    const folder = this.vaultService.getFolderByPath(folderPath);
    if (!folder) return;
    const files = getAllMarkdownFilesInFolder(folder);
    const filesIdMapping = await this.scanFiles(files, propertyPrefix);

    for (const contact of contacts) {
      if (!this.hasSyncLabel(contact, syncLabel, labelMap)) continue;

      const id = contact.resourceName.split('/').pop();
      const syncedAt = new Date().toISOString();
      const frontmatterLines: Record<string, string> = {
        [`${propertyPrefix}id`]: String(id),
        [`${propertyPrefix}synced`]: String(syncedAt),
      };

      this.formatter.addNameField(frontmatterLines, contact, propertyPrefix);
      this.formatter.addEmailField(frontmatterLines, contact, propertyPrefix);
      this.formatter.addPhoneField(frontmatterLines, contact, propertyPrefix);
      this.formatter.addAddressFields(
        frontmatterLines,
        contact,
        propertyPrefix
      );
      this.formatter.addBioField(frontmatterLines, contact, propertyPrefix);
      this.formatter.addOrganizationFields(
        frontmatterLines,
        contact,
        propertyPrefix
      );
      this.formatter.addJobTitleFields(
        frontmatterLines,
        contact,
        propertyPrefix
      );
      this.formatter.addBirthdayFields(
        frontmatterLines,
        contact,
        propertyPrefix
      );

      const existingFile: TFile | null = filesIdMapping[String(id)] || null;

      if (existingFile) {
        await this.vaultService.modifyFile(
          existingFile,
          this.modifyNote(frontmatterLines)
        );
      } else {
        const name =
          contact.names?.[0]?.displayName ||
          String(contact.resourceName.split('/').pop());
        if (!name) continue;
        const safeName = name.replace(/[\\/:*?"<>|]/g, '_');
        const filename = normalizePath(`${folderPath}/${prefix}${safeName}.md`);
        const file = this.vaultService.getFileByPath(filename);
        if (file instanceof TFile) {
          await this.vaultService.modifyFile(
            file,
            this.modifyNote(frontmatterLines)
          );
        } else {
          const initialText =
            this.generateFrontmatterBlock(frontmatterLines) + noteBody;
          await this.vaultService.createFile(filename, initialText);
        }
      }
    }
  }

  /**
   * Returns a function that modifies the frontmatter of a note with new contact data.
   *
   * @param frontmatterLines - The new contact data to inject into the frontmatter.
   * @returns A function that takes the note content and returns the modified content.
   */
  modifyNote(
    frontmatterLines: Record<string, string>
  ): (data: string) => string {
    return (data: string): string => {
      return this.updateFrontmatterWithContactData(data, frontmatterLines);
    };
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
   * Scans an array of files, reads their content, and checks if the file's frontmatter contains an `id` field.
   * If an `id` field is found, it adds the `id` as a key and the corresponding file (`TFile`) as the value to a mapping object.
   *
   * This method uses Obsidian's `vaultService.readFile()` to read file content and `parseYaml()` to safely parse the YAML frontmatter.
   * It ensures that only files with valid `id` fields in their frontmatter are added to the mapping.
   *
   * @param files An array of `TFile` objects representing the files to be scanned.
   * @param propertyPrefix A string that may be used as a prefix for the `id` field in frontmatter.
   * @returns A promise that resolves to a record object where keys are the `id` values found in the frontmatter,
   *          and values are the corresponding `TFile` objects.
   *
   * @example
   * const idFileMapping = await this.scanFiles(files);
   * console.log(idFileMapping); // { "123": file1, "456": file2, ... }
   */
  protected async scanFiles(
    files: TFile[],
    propertyPrefix: string
  ): Promise<Record<string, TFile>> {
    const idToFileMapping: Record<string, TFile> = {};

    for (const file of files) {
      const content = await this.vaultService.readFile(file);

      const match = content.match(/^---\n([\s\S]+?)\n---/);
      if (match && match[1]) {
        const frontmatter = parseYaml(match[1]);

        const idFieldName = `${propertyPrefix}id`;
        if (frontmatter && frontmatter[idFieldName]) {
          idToFileMapping[frontmatter[idFieldName]] = file;
        }
      }
    }

    return idToFileMapping;
  }

  /**
   * Updates the YAML frontmatter of a note with new contact fields, merging with existing values.
   * @param content Original markdown note content.
   * @param newContactFields Contact data to inject into the frontmatter.
   * @returns Updated markdown content.
   */
  updateFrontmatterWithContactData(
    content: string,
    newContactFields: Record<string, string>
  ): string {
    if (!content.startsWith('---')) {
      return this.generateFrontmatterBlock(newContactFields) + content;
    }

    const parts = content.split('---');
    if (parts.length < 3) {
      return this.generateFrontmatterBlock(newContactFields) + content;
    }

    const originalYaml = parts[1];
    const body = parts.slice(2).join('---').trim();

    const parsed = parseYaml(originalYaml) as Record<string, string>;

    for (const key of Object.keys(parsed)) {
      if (key in newContactFields) {
        parsed[key] = newContactFields[key];
        delete newContactFields[key];
      }
    }

    const updated = {
      ...parsed,
      ...newContactFields,
    };

    return this.generateFrontmatterBlock(updated) + body;
  }

  /**
   * Generates a YAML frontmatter block string from the provided fields.
   *
   * @param fields - A record of key-value pairs to include in the frontmatter.
   * @returns A string representing the full frontmatter block with proper formatting.
   */
  protected generateFrontmatterBlock(fields: Record<string, string>): string {
    const yaml = stringifyYaml(fields);
    return `---\n${yaml}---\n\n`;
  }
}
