# 🧩 Obsidian Google Contacts Sync Plugin

Synchronize your Google Contacts directly into Obsidian!  
Each contact becomes a separate note with YAML frontmatter for metadata and free-form text for your notes.

---

## ⚙️ Features


- 🔄 Synchronize Google Contacts into your Obsidian vault

- 🗂 Configurable folder for storing contact notes

- ✏️ Customizable note template (under the metadata block)

- 🏷 Filter by Google Contact label (e.g. only sync contacts tagged with `obsidian`)

- 📛 Filename prefix support (e.g. `p Ivan Ivanov.md`)

- 🧩 Customizable prefix for metadata keys (e.g. `s_name_1`, `s_email_1`)

- 📇 Supports multiple names, emails, phone numbers, birthdays

---

## 🔧 Build Instructions

To build the plugin:

1. Clone or download the repository

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the plugin using Rollup:   

   ```bash
   npx rollup -c
   ```

After this, two files will be generated:

main.js

manifest.json

These are the only files needed to install the plugin into Obsidian.

## 📦 Installing into Obsidian

1. Open your Obsidian vault

2. Go to .obsidian/plugins/ and create a folder, e.g. google-contacts-sync

3. Copy the following files into that folder:

```
google-contacts-sync/
├── main.js
└── manifest.json
```

4. In Obsidian:

- Go to Settings → Community Plugins

- Enable Safe Mode → OFF

- Click "Load community plugins"

- Enable google-contacts-sync

## 🔐 Google Authorization

1. Go to the plugin settings inside Obsidian.

2. Fill in:

- Client ID

- Client Secret
(see instructions below for how to obtain these)

3. Click the "Login to Google" button.

4. Follow the link, log in with your Google account, and copy the authorization code.

5. Paste the code into the prompt in Obsidian.
The plugin will automatically save the access and refresh tokens.

## 🚀 How to Use

1. Open the command palette (Ctrl+P or Cmd+P)

2. Run the command: Sync Google Contacts


## 🔁 Sync Algorithm

- Each contact is matched using its id stored in the YAML frontmatter

- If a contact already exists (by id), the plugin updates only the frontmatter

- Any free-text content below the frontmatter is preserved and never overwritten

- If no matching file exists, a new note is created with:

```
---
id: CONTACT_ID
name: Full Name
email: email@example.com
phone: +123456789
synced: 2025-04-19T12:34:56.789Z
---

# Notes

You can write anything here — this section is safe.
```

## 🔐 How to Get a Google Client ID and Secret
To sync your contacts, you’ll need a valid Google Access Token that grants access to the People API.

### 1. Set up Google Cloud
Go to https://console.cloud.google.com

Create a new project (or select an existing one)

### 2. Enable People API
Navigate to: API & Services → Library

Search for People API

Click Enable

### 3. Create OAuth 2.0 Credentials
Go to: API & Services → Credentials

Click "Create Credentials → OAuth client ID"

If prompted, configure the OAuth consent screen (you can use testing mode)

For application type, select: Desktop App

Copy your Client ID and Client Secret
