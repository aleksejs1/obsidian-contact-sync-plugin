export const normalizePath = (path: string) => path;
export const parseYaml = (yaml: string) => ({});
export const stringifyYaml = (obj: object) => '';
export class Vault {
  async read() {
    return '';
  }
}
export class TFile {}
export class TFolder {}
export class Notice {
  constructor(message: string) {
    console.log('Notice:', message);
  }
}
