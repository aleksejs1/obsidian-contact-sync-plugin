export const normalizePath = (path: string) => path;
export const parseYaml = () => ({});
export const stringifyYaml = () => '';
export const getLanguage = () => 'en';
export class Vault {
  async read() {
    return '';
  }
}
export class TFile {
  path: string = '';
}
export class TFolder {
  children: unknown[] = [];
}
export class Notice {
  constructor(message: string) {
    console.debug('Notice:', message);
  }
}

export class FileManager {
  processFrontMatter(file: TFile, fn: (frontmatter: unknown) => void) {
    fn({});
    console.debug('processFrontMatter', file);
  }
}
export class MockMetadataCache {
  private fileCacheMap: Map<string, unknown> = new Map();
  setFileCache(file: TFile, cache: unknown) {
    this.fileCacheMap.set(file.path, cache);
  }
  getFileCache(file: TFile): unknown {
    return this.fileCacheMap.get(file.path);
  }
  getFirstLinkpathDest() {
    return null; // Mock implementation
  }
  getCache() {
    return {}; // Mock implementation
  }
  fileToLinktext() {
    return ''; // Mock implementation
  }
  resolvedLinks = {};
  unresolvedLinks = {};
  on() {}
  off() {}
  offref() {}
  trigger() {}
  tryTrigger() {}
}

export const requestUrl = jest.fn();
export class App {
  vault: unknown;
  metadataCache: unknown;
  workspace: unknown;
  fileManager: unknown;
}
export class MetadataCache {}
