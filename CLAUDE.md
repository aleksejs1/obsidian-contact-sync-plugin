# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Setup

```bash
npm install   # installs deps and activates Husky pre-commit hooks
```

## Commands

```bash
npm run build      # Clean dist/ and bundle via Rollup → dist/main.js (CJS)
npm test           # Run Jest tests with coverage
npm run lint       # ESLint over src/**/*.{ts,tsx}
npm run typecheck  # tsc --noEmit (strict mode)
npm run format     # Prettier write
npm run quality    # typecheck + lint:deps + lint:prune + lint + test (full gate)
```

## Testing locally in Obsidian

Unit tests run without Obsidian. To verify changes in a real vault:

1. `npm run build`
2. Copy `dist/main.js` and `manifest.json` to `<vault>/.obsidian/plugins/google-contacts/`
3. In Obsidian → Settings → Community plugins — disable and re-enable **Google Contacts**

## Import convention

Use absolute imports with the `src/` prefix — never relative paths:

```ts
// correct
import { GoogleContact } from 'src/types/Contact';
// wrong
import { GoogleContact } from '../../types/Contact';
```

This is enforced by `baseUrl: "."` in `tsconfig.json` and mirrored in `jest.config.ts` → `moduleNameMapper`.

## TypeScript strictness

The tsconfig uses several aggressive options that commonly cause failures:

- `noUncheckedIndexedAccess` — `array[0]` has type `T | undefined`, not `T`
- `exactOptionalPropertyTypes` — cannot assign `undefined` explicitly to `prop?: string`
- `noUnusedLocals` / `noUnusedParameters` — unused variables/parameters are compile errors

Always run `npm run typecheck` after changes.

## Architecture

This is an **Obsidian plugin** that syncs Google Contacts into Obsidian markdown notes via the Google People API.

### Data flow

```
Google People API
    ↓ GoogleContactsService (fetch contacts + groups)
    ↓ ContactNoteWriter.writeNotesForContacts()
        ↓ Formatter.generateFrontmatter()
            ↓ FieldAdapter.extract()  (one per field type)
            ↓ KeyNamingStrategy.generateKey()
        ↓ VaultService (create/rename/update files)
        ↓ fileManager.processFrontMatter() (Obsidian API)
```

### Key abstractions

**`FieldAdapter`** (`src/core/interfaces.ts`) — extracts one field type from a `GoogleContact` into `ExtractionResult[]`. Adapters receive `AdapterContext` as `context` and must check `context.namingStrategy` to adapt output: for `Array` strategy return a single result with an array value; for `Default` return one result per value. All adapters live in `src/core/adapters/`.

**`KeyNamingStrategy`** (`src/core/interfaces.ts`) — turns `(baseKey, index, prefix, suffix?, type?)` into a frontmatter property name. Three implementations:
- `DefaultNamingStrategy` — multiple values produce separate keys: `phone`, `phone_2`, `phone_3`
- `ArrayNamingStrategy` — multiple values collapse into one YAML array under a single key: `phone: [...]`
- `VcfNamingStrategy` — VCard-compatible keys (`EMAIL`, `TEL`, `ADR[2]`, etc.), ignores prefix

**`Formatter`** (`src/core/Formatter.ts`) — orchestrates all adapters + strategy. `createDefaultFormatter(NamingStrategy)` is the factory used at runtime.

**`ContactNoteWriter`** (`src/services/ContactNoteWriter.ts`) — Obsidian-layer service. Scans existing files by frontmatter ID, creates/renames/updates notes, calls `Formatter`. Protected methods (`hasSyncLabel`, `scanFiles`) are overridden in tests via subclassing.

**`AuthManager`** (`src/auth/AuthManager.ts`) — OAuth2 code exchange and token refresh. Tokens stored in plugin settings (persisted by Obsidian).

**`ContactAuditService`** (`src/services/ContactAuditService.ts`) — secondary service that compares vault notes against live contacts and generates an orphan report.

Settings are defined in `src/types/Settings.ts` (`ContactSyncSettings`, `NamingStrategy` enum) with defaults and API endpoint constants in `src/config/index.ts`. `ContactNoteConfig` is the subset passed into `ContactNoteWriter`; `AdapterContext` extends it with the inverted `labelMap` (ID → label name).

### Adding a new contact field

Minimum steps (field always enabled, no toggle):

1. Add field type to `GoogleContact` in `src/types/Contact.ts`
2. Add field name to `PERSONAL_FIELDS` in `src/config/index.ts`
3. Create `src/core/adapters/<Field>Adapter.ts` implementing `FieldAdapter`
4. Register the adapter in `createDefaultFormatter()` in `src/core/Formatter.ts`
5. Add a VCF key to `VcfNamingStrategy.keyMap` in `src/core/strategies/VcfNamingStrategy.ts`
6. Add tests in `src/__tests__/core/adapters/`

Add a toggle only for backward compatibility — when enabling the feature by default would break existing notes or setups for current users (e.g. changing key names, altering output format of an existing field):

7. Add the setting to `ContactSyncSettings` in `src/types/Settings.ts` with a default in `DEFAULT_SETTINGS` (`src/config/index.ts`)
8. Add it to `ContactNoteConfig` (`src/types/ContactNoteConfig.ts`) and pass it through in `main.ts` → `getNoteConfig()`
9. Add a UI control in `src/plugin/settings.ts`

Every new toggle increases setup cost for end users. Add one only when skipping it would silently corrupt existing vaults.

### Testing

- Obsidian is fully mocked at `src/__mocks__/obsidian.ts`; Jest resolves `obsidian` → this file and `src/` paths via `moduleNameMapper` in `jest.config.ts`.
- Tests that need Obsidian vault behaviour subclass `ContactNoteWriter` and override protected methods rather than mocking the Obsidian API.

### i18n

All user-facing strings must go through `t(key)` from `src/i18n/translator.ts` and have entries in all three locales (`en`, `ru`, `lv`) in `src/i18n/translations.ts`. Never pass raw string literals to `Notice` or UI elements.
