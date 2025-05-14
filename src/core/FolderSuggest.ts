import { TFolder, App, AbstractInputSuggest } from 'obsidian';

/**
 * FolderSuggest class for providing folder suggestions in Obsidian.
 * This class extends AbstractInputSuggest to create a custom suggestion provider
 * for folder paths in the Obsidian vault.
 */
export class FolderSuggest extends AbstractInputSuggest<TFolder> {
  /**
   * The list of folders in the vault.
   */
  private folders: TFolder[];

  /**
   * The input element to attach the suggestions to.
   */
  private inputEl: HTMLInputElement;

  /**
   * Constructs a FolderSuggest instance.
   *
   * @param app - The Obsidian app instance.
   * @param inputEl - The input element to attach the suggestions to.
   */
  constructor(app: App, inputEl: HTMLInputElement) {
    super(app, inputEl);
    this.folders = this.getAllFolders();
    this.inputEl = inputEl;
  }

  /**
   * Returns the folder suggestions based on the input query.
   *
   * @param query - The input query to filter folder suggestions.
   * @returns An array of TFolder objects that match the query.
   */
  getSuggestions(query: string): TFolder[] {
    return this.folders.filter((folder) =>
      folder.path.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Renders the suggestion element for a folder.
   *
   * @param folder - The TFolder object to render.
   * @param el - The HTML element to render the suggestion into.
   */
  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.setText(folder.path);
  }

  /**
   * Handles the selection of a folder suggestion.
   *
   * @param folder - The selected TFolder object.
   */
  selectSuggestion(folder: TFolder): void {
    this.inputEl.value = folder.path;
    this.inputEl.trigger('input');
  }

  /**
   * Retrieves all folders in the vault.
   *
   * @returns An array of TFolder objects representing all folders in the vault.
   */
  private getAllFolders(): TFolder[] {
    const folders: TFolder[] = [];

    const walk = (folder: TFolder) => {
      folders.push(folder);
      for (const child of folder.children) {
        if (child instanceof TFolder) {
          walk(child);
        }
      }
    };

    walk(this.app.vault.getRoot());
    return folders;
  }
}
