import { Plugin, TFile, normalizePath, Notice, Modal, Setting, App } from "obsidian";

interface GoogleContact {
  resourceName: string;
  names?: { displayName: string }[];
  emailAddresses?: { value: string }[];
  phoneNumbers?: { value: string }[];
}

export default class GoogleContactsSyncPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: "sync-google-contacts",
      name: "Sync Google Contacts",
      callback: () => this.syncContacts()
    });
  }

  async syncContacts() {
    const token = await this.getAccessToken();

    if (!token) {
      new Notice("No token provided.");
      return;
    }

    const contacts = await this.fetchGoogleContacts(token);
    const folderPath = "Contacts";

    await this.app.vault.createFolder(normalizePath(folderPath)).catch(() => {});

    for (const contact of contacts) {
      const id = contact.resourceName?.split("/").pop();
      const name = contact.names?.[0]?.displayName || "Unnamed";
      const email = contact.emailAddresses?.[0]?.value || "";
      const phone = contact.phoneNumbers?.[0]?.value || "";

      const frontmatter = `---\nid: ${id}\nname: ${name}\nemail: ${email}\nphone: ${phone}\nsynced: ${new Date().toISOString()}\n---`;

      let existingFile: TFile | null = null;

      const files = this.app.vault.getMarkdownFiles();
      for (const file of files) {
        const content = await this.app.vault.read(file);
        const match = content.match(/^---\n([\s\S]+?)\n---/);
        if (match && match[1].includes(`id: ${id}`)) {
          existingFile = file;
          break;
        }
      }

      if (existingFile) {
        const content = await this.app.vault.read(existingFile);
        const split = content.split("---");
        if (split.length >= 3) {
          const freeText = split.slice(2).join("---").trim();
          await this.app.vault.modify(existingFile, `${frontmatter}\n\n${freeText}`);
        } else {
          await this.app.vault.modify(existingFile, `${frontmatter}\n\n`);
        }
      } else {
        const safeName = name.replace(/[\\/:*?"<>|]/g, "_");
        const filename = normalizePath(`${folderPath}/${safeName}.md`);
        const initialText = `${frontmatter}\n\n# Notes\n`;
        await this.app.vault.create(filename, initialText);
      }
    }

    new Notice("Google Contacts synced!");
  }

  async getAccessToken(): Promise<string | null> {
    return new Promise((resolve) => {
      new TokenModal(this.app, (token) => resolve(token.trim())).open();
    });
  }


  async fetchGoogleContacts(token: string): Promise<GoogleContact[]> {
    const res = await fetch("https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=2000", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      new Notice("Error during getting the contacts");
      return [];
    }

    const data = await res.json();
    return data.connections || [];
  }
}

class TokenModal extends Modal {
  token: string = "";
  onSubmit: (token: string) => void;

  constructor(app: App, onSubmit: (token: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Enter Google Access Token" });

    new Setting(contentEl)
      .setName("Access Token")
      .addText((text) =>
        text.onChange((value) => {
          this.token = value;
        })
      );

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Save")
          .setCta()
          .onClick(() => {
            this.close();
            this.onSubmit(this.token);
          })
      );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
