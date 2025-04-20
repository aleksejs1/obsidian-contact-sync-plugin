'use strict';

var obsidian = require('obsidian');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

class GoogleContactsSyncPlugin extends obsidian.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            this.addCommand({
                id: "sync-google-contacts",
                name: "Sync Google Contacts",
                callback: () => this.syncContacts()
            });
        });
    }
    syncContacts() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            const token = yield this.getAccessToken();
            if (!token) {
                new obsidian.Notice("No token provided.");
                return;
            }
            const contacts = yield this.fetchGoogleContacts(token);
            const folderPath = "Contacts";
            yield this.app.vault.createFolder(obsidian.normalizePath(folderPath)).catch(() => { });
            for (const contact of contacts) {
                const id = (_a = contact.resourceName) === null || _a === void 0 ? void 0 : _a.split("/").pop();
                const name = ((_c = (_b = contact.names) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.displayName) || "Unnamed";
                const email = ((_e = (_d = contact.emailAddresses) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.value) || "";
                const phone = ((_g = (_f = contact.phoneNumbers) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.value) || "";
                const frontmatter = `---\nid: ${id}\nname: ${name}\nemail: ${email}\nphone: ${phone}\nsynced: ${new Date().toISOString()}\n---`;
                let existingFile = null;
                const files = this.app.vault.getMarkdownFiles();
                for (const file of files) {
                    const content = yield this.app.vault.read(file);
                    const match = content.match(/^---\n([\s\S]+?)\n---/);
                    if (match && match[1].includes(`id: ${id}`)) {
                        existingFile = file;
                        break;
                    }
                }
                if (existingFile) {
                    const content = yield this.app.vault.read(existingFile);
                    const split = content.split("---");
                    if (split.length >= 3) {
                        const freeText = split.slice(2).join("---").trim();
                        yield this.app.vault.modify(existingFile, `${frontmatter}\n\n${freeText}`);
                    }
                    else {
                        yield this.app.vault.modify(existingFile, `${frontmatter}\n\n`);
                    }
                }
                else {
                    const safeName = name.replace(/[\\/:*?"<>|]/g, "_");
                    const filename = obsidian.normalizePath(`${folderPath}/${safeName}.md`);
                    const initialText = `${frontmatter}\n\n# Notes\n`;
                    yield this.app.vault.create(filename, initialText);
                }
            }
            new obsidian.Notice("Google Contacts synced!");
        });
    }
    getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                new TokenModal(this.app, (token) => resolve(token.trim())).open();
            });
        });
    }
    fetchGoogleContacts(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield fetch("https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=2000", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!res.ok) {
                new obsidian.Notice("Error during getting the contacts");
                return [];
            }
            const data = yield res.json();
            return data.connections || [];
        });
    }
}
class TokenModal extends obsidian.Modal {
    constructor(app, onSubmit) {
        super(app);
        this.token = "";
        this.onSubmit = onSubmit;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Enter Google Access Token" });
        new obsidian.Setting(contentEl)
            .setName("Access Token")
            .addText((text) => text.onChange((value) => {
            this.token = value;
        }));
        new obsidian.Setting(contentEl)
            .addButton((btn) => btn
            .setButtonText("Save")
            .setCta()
            .onClick(() => {
            this.close();
            this.onSubmit(this.token);
        }));
    }
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

module.exports = GoogleContactsSyncPlugin;
