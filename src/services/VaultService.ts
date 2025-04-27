// src/services/VaultService.ts

import { TFile, TFolder, Vault, normalizePath } from 'obsidian';

/**
 * Service class for interacting with the Obsidian Vault.
 * Encapsulates file and folder operations to facilitate testing and decouple from direct API usage.
 */
export class VaultService {
  /**
   * The underlying Obsidian Vault instance.
   */
  private vault: Vault;

  /**
   * Creates an instance of VaultService.
   *
   * @param vault - The Obsidian Vault instance to operate on.
   */
  constructor(vault: Vault) {
    this.vault = vault;
  }

  /**
   * Ensures that a folder exists at the given path, creating it if necessary.
   *
   * @param folderPath - The path of the folder to create.
   */
  async createFolderIfNotExists(folderPath: string): Promise<void> {
    const normalizedPath = normalizePath(folderPath);
    await this.vault.createFolder(normalizedPath).catch(() => {});
  }

  /**
   * Retrieves a file from the vault by its path.
   *
   * @param filePath - The path of the file to retrieve.
   * @returns The TFile if found, or null.
   */
  getFileByPath(filePath: string): TFile | null {
    return this.vault.getAbstractFileByPath(filePath) as TFile | null;
  }

  /**
   * Retrieves a folder from the vault by its path.
   *
   * @param folderPath - The path of the folder to retrieve.
   * @returns The TFolder if found, or null.
   */
  getFolderByPath(folderPath: string): TFolder | null {
    const folder = this.vault.getAbstractFileByPath(folderPath);
    return folder instanceof TFolder ? folder : null;
  }

  /**
   * Reads the content of a file.
   *
   * @param file - The file to read.
   * @returns The file content as a string.
   */
  async readFile(file: TFile): Promise<string> {
    return this.vault.read(file);
  }

  /**
   * Modifies an existing file with new content.
   *
   * @param file - The file to modify.
   * @param content - The new content to write.
   */
  async modifyFile(file: TFile, content: string): Promise<void> {
    await this.vault.modify(file, content);
  }

  /**
   * Creates a new file with the given content.
   *
   * @param filePath - The path for the new file.
   * @param content - The initial content of the file.
   */
  async createFile(filePath: string, content: string): Promise<void> {
    const normalizedPath = normalizePath(filePath);
    await this.vault.create(normalizedPath, content);
  }
}
