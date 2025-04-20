# Obsidian Google Contacts Sync Plugin

A custom Obsidian plugin that synchronizes your Google Contacts into individual markdown notes — one note per contact — inside a chosen folder.

Each note contains metadata (ID, name, email, phone, last sync time) and a free-text section that is **preserved across syncs**, allowing you to store your own notes without risk of data loss.

---

## ✨ Features

- Sync contacts from your Google Account via People API

- One markdown note per contact

- Metadata stored in YAML frontmatter

- Custom notes (below frontmatter) are **never overwritten**

- Incremental sync: updates existing notes, creates new ones if missing

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

## 🚀 How to Use

1. Open the command palette (Ctrl+P or Cmd+P)

2. Run the command: Sync Google Contacts

3. On first run, a modal window will appear asking for your Google Access Token

4. Enter the token and the plugin will:

- Fetch contacts from your Google Account
- Create or update one .md file per contact in the configured folder

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

## 🔐 How to Get a Google Access Token
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

### 4. Get Authorization Code

Open this URL in your browser (replace YOUR_CLIENT_ID):

```
https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=urn:ietf:wg:oauth:2.0:oob&response_type=code&scope=https://www.googleapis.com/auth/contacts.readonly
```

- Log in and allow access

- Copy the authorization code displayed

### 5. Exchange Code for Access Token

Use curl or Postman:

```
curl --request POST \
  --data "code=YOUR_AUTH_CODE" \
  --data "client_id=YOUR_CLIENT_ID" \
  --data "client_secret=YOUR_CLIENT_SECRET" \
  --data "redirect_uri=urn:ietf:wg:oauth:2.0:oob" \
  --data "grant_type=authorization_code" \
  https://oauth2.googleapis.com/token
```

In response, you will get:

```
{
  "access_token": "ya29....",
  "expires_in": 3599,
  "refresh_token": "1//0g...",
  ...
}
```

Use the `access_token` in the plugin when prompted.

⚠️ Note: Access tokens expire after 1 hour. For a persistent solution, token refreshing will need to be implemented.