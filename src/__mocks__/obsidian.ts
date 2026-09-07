export const normalizePath = (path: string) => path;
export const parseYaml = () => ({});
export const stringifyYaml = () => '';
export const getLanguage = () => 'en';
export class Vault {
  async read() {
    return '';
  }
  getRoot(): TFolder {
    return new TFolder();
  }
}
export class TFile {
  path = '';
}
export class TFolder {
  path = '';
  children: unknown[] = [];
}
export class Notice {
  constructor(_message: string) {
    // console.debug('Notice:', message);
  }
}

export class FileManager {
  processFrontMatter(_file: TFile, fn: (frontmatter: unknown) => void) {
    fn({});
    // console.debug('processFrontMatter', file);
  }
}
export class MockMetadataCache {
  private fileCacheMap = new Map<string, unknown>();
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
  vault: Vault = new Vault();
  metadataCache: unknown = new MockMetadataCache();
  workspace: unknown = {};
  fileManager: FileManager = new FileManager();
}
export class MetadataCache {}

export class Setting {
  setName = jest.fn().mockReturnThis();
  setDesc = jest.fn().mockReturnThis();
  setHeading = jest.fn().mockReturnThis();
  addText = jest.fn().mockImplementation((cb) => {
    cb({
      setPlaceholder: jest.fn().mockReturnThis(),
      setValue: jest.fn().mockReturnThis(),
      onChange: jest.fn().mockReturnThis(),
      inputEl: {},
    });
    return this;
  });
  addTextArea = jest.fn().mockImplementation((cb) => {
    cb({
      setPlaceholder: jest.fn().mockReturnThis(),
      setValue: jest.fn().mockReturnThis(),
      onChange: jest.fn().mockReturnThis(),
    });
    return this;
  });
  addToggle = jest.fn().mockImplementation((cb) => {
    cb({
      setValue: jest.fn().mockReturnThis(),
      onChange: jest.fn().mockReturnThis(),
    });
    return this;
  });
  addDropdown = jest.fn().mockImplementation((cb) => {
    cb({
      addOption: jest.fn().mockReturnThis(),
      setValue: jest.fn().mockReturnThis(),
      onChange: jest.fn().mockReturnThis(),
    });
    return this;
  });
  addButton = jest.fn().mockImplementation((cb) => {
    cb({
      setButtonText: jest.fn().mockReturnThis(),
      onClick: jest.fn().mockReturnThis(),
    });
    return this;
  });
}

export class PluginSettingTab {
  app: App;
  plugin: unknown;
  containerEl: { empty: jest.Mock };
  constructor(app: App, plugin: unknown) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = { empty: jest.fn() };
  }
  display() {}
  hide() {}
  getSettingDefinitions(): unknown[] {
    return [];
  }
  getControlValue(_key: string): unknown {
    return undefined;
  }
  setControlValue(_key: string, _value: unknown): void | Promise<void> {}
  refreshDomState() {}
}

export class Plugin {
  app: App;
  manifest: unknown;
  constructor(app: App, manifest: unknown) {
    this.app = app;
    this.manifest = manifest;
  }
}

export class AbstractInputSuggest<T> {
  app: App;
  inputEl: HTMLInputElement;
  constructor(app: App, inputEl: HTMLInputElement) {
    this.app = app;
    this.inputEl = inputEl;
  }
  getSuggestions(_query: string): T[] {
    return [];
  }
  renderSuggestion(_value: T, _el: HTMLElement): void {}
  selectSuggestion(_value: T, _evt: MouseEvent | KeyboardEvent): void {}
}
