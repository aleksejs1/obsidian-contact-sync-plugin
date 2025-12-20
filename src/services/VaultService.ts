// src/services/VaultService.ts

import { FileManager, TFile, TFolder, Vault, normalizePath } from 'obsidian';

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
   * The FileManager instance used for file operations.
   */
  private fileManager: FileManager;

  /**
   * Creates an instance of VaultService.
   *
   * @param vault - The Obsidian Vault instance to operate on.
   */
  constructor(vault: Vault, fileManager: FileManager) {
    this.vault = vault;
    this.fileManager = fileManager;
  }

  /**
   * Ensures that a folder exists at the given path, creating it if necessary.
   *
   * @param folderPath - The path of the folder to create.
   */
  async createFolderIfNotExists(folderPath: string): Promise<void> {
    const normalizedPath = normalizePath(folderPath);
    try {
      await this.vault.createFolder(normalizedPath);
    } catch {
      // Folder already exists or other error we can ignore
    }
  }

  /**
   * Retrieves a file from the vault by its path.
   *
   * @param filePath - The path of the file to retrieve.
   * @returns The TFile if found, or null.
   */
  getFileByPath(filePath: string): TFile | null {
    return this.vault.getFileByPath(filePath);
  }

  /**
   * Retrieves a folder from the vault by its path.
   *
   * @param folderPath - The path of the folder to retrieve.
   * @returns The TFolder if found, or null.
   */
  getFolderByPath(folderPath: string): TFolder | null {
    return this.vault.getFolderByPath(folderPath);
  }

  /**
   * Creates a new file with the given content.
   *
   * @param filePath - The path for the new file.
   * @param content - The initial content of the file.
   * @returns The created TFile.
   */
  async createFile(filePath: string, content: string): Promise<TFile> {
    const normalizedPath = normalizePath(filePath);
    return await this.vault.create(normalizedPath, content);
  }

  async renameFile(file: TFile, newPath: string): Promise<void> {
    const normalizedPath = normalizePath(newPath);
    await this.fileManager.renameFile(file, normalizedPath);
  }
}
