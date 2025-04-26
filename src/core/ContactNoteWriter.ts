import {
  normalizePath,
  parseYaml,
  stringifyYaml,
  TFile,
  TFolder,
  Vault,
} from 'obsidian';
import { GoogleContact } from 'src/types/Contact';
import { getAllMarkdownFilesInFolder } from 'src/utils/getAllMarkdownFilesInFolder';
import { Formatter } from './Formatter';

/**
 * Responsible for creating and updating contact notes in the vault.
 * Handles writing new notes and updating existing ones based on contact metadata.
 */
export class ContactNoteWriter {
  /**
   * The Vault instance where the notes are stored.
   *
   * This protected property is used to interact with the vault to read, write, and update files.
   */
  protected vault: Vault;

  /**
   * The Formatter instance used for formatting contact data into frontmatter.
   *
   * This protected property is used to format contact data into a suitable format for Obsidian frontmatter.
   */
  protected formatter: Formatter = new Formatter();

  /**
   * Creates an instance of the ContactNoteWriter class.
   *
   * @param vault - The Obsidian Vault instance where the contact notes are stored.
   */
  constructor(vault: Vault) {
    this.vault = vault;
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
    await this.vault.createFolder(normalizePath(folderPath)).catch(() => {});

    const folder = this.vault.getAbstractFileByPath(folderPath);
    if (!(folder instanceof TFolder)) return;
    const files = getAllMarkdownFilesInFolder(folder);
    const filesIdMapping = await this.scanFiles(files, propertyPrefix);

    for (const contact of contacts) {
      if (!this.hasSyncLabel(contact, syncLabel, labelMap)) continue;

      const id = contact.resourceName?.split('/').pop();
      const syncedAt = new Date().toISOString();
      const frontmatterLines: Record<string, string> = {
        [`${propertyPrefix}id`]: String(id ?? ''),
        [`${propertyPrefix}synced`]: String(syncedAt ?? ''),
      };

      this.formatter.addNameField(frontmatterLines, contact, propertyPrefix);
      this.formatter.addEmailField(frontmatterLines, contact, propertyPrefix);
      this.formatter.addPhoneField(frontmatterLines, contact, propertyPrefix);
      this.formatter.addBirthdayFields(
        frontmatterLines,
        contact,
        propertyPrefix
      );

      const existingFile: TFile | null = filesIdMapping[id ?? ''] || null;

      if (existingFile) {
        const content = await this.vault.read(existingFile);
        const updatedContent = this.updateFrontmatterWithContactData(
          content,
          frontmatterLines
        );
        await this.vault.modify(existingFile, updatedContent);
      } else {
        const name = contact.names?.[0]?.displayName || 'Unnamed';
        const safeName = name.replace(/[\\/:*?"<>|]/g, '_');
        const filename = normalizePath(`${folderPath}/${prefix}${safeName}.md`);
        const initialText =
          this.generateFrontmatterBlock(frontmatterLines) + noteBody;
        await this.vault.create(filename, initialText);
      }
    }
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
   * This method uses Obsidian's `vault.read()` to read file content and `parseYaml()` to safely parse the YAML frontmatter.
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
      const content = await this.vault.read(file);

      const match = content.match(/^---\n([\s\S]+?)\n---/);
      if (match && match[1]) {
        try {
          const frontmatter = parseYaml(match[1]);

          const idFieldName = `${propertyPrefix}id`;
          if (frontmatter && frontmatter[idFieldName]) {
            idToFileMapping[frontmatter[idFieldName]] = file;
          }
        } catch (error) {
          console.error(`Error parsing YAML in file: ${file.path}`, error);
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
