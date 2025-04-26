import { TFile, TFolder } from 'obsidian';

/**
 * Recursively retrieves all markdown files in the specified folder.
 * @param folder The root folder to search within.
 * @returns An array of markdown files.
 */
export function getAllMarkdownFilesInFolder(folder: TFolder): TFile[] {
  let files: TFile[] = [];

  for (const child of folder.children) {
    if (child instanceof TFolder) {
      files = files.concat(getAllMarkdownFilesInFolder(child));
    } else if (child instanceof TFile && child.extension === 'md') {
      files.push(child);
    }
  }

  return files;
}
