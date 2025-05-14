export const normalizePath = (path: string) => path;
export const parseYaml = () => ({});
export const stringifyYaml = () => '';
export class Vault {
  async read() {
    return '';
  }
}
export class TFile {
  path: string = '';
}
export class TFolder {}
export class Notice {
  constructor(message: string) {
    console.log('Notice:', message);
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
