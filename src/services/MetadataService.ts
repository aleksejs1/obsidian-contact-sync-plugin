import { TFile, CachedMetadata, MetadataCache } from 'obsidian';

/**
 * Service class for managing metadata in Obsidian files.
 * Encapsulates metadata operations to facilitate testing and decouple from direct API usage.
 */
export class MetadataService {
  private metadataCache: MetadataCache;

  /**
   * Creates an instance of MetadataService.
   *
   * @param metadataCache - The Obsidian MetadataCache instance to operate on.
   */
  constructor(metadataCache: MetadataCache) {
    this.metadataCache = metadataCache;
  }

  /**
   * Retrieves the frontmatter metadata from a file.
   *
   * @param file - The TFile to retrieve frontmatter from.
   * @returns The frontmatter as a record of key-value pairs, or undefined if not found.
   */
  getFrontmatter(file: TFile): Record<string, string | string[]> | undefined {
    const cache = this.metadataCache.getFileCache(file);
    return cache?.frontmatter;
  }

  /**
   * Retrieves the YAML frontmatter from a file.
   *
   * @param file - The TFile to retrieve YAML frontmatter from.
   * @returns The YAML frontmatter as a string, or null if not found.
   */
  getFileCache(file: TFile): CachedMetadata | null {
    return this.metadataCache.getFileCache(file);
  }
}
