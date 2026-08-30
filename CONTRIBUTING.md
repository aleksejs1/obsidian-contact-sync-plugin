# Contributing to Google Contacts Sync

Thank you for your interest in contributing to Google Contacts Sync! We welcome bug reports, feature requests, documentation improvements, and code contributions.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Development Setup](#development-setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Available Scripts](#available-scripts)
  - [Testing in Obsidian](#testing-in-obsidian)
- [Coding Guidelines](#coding-guidelines)
  - [Imports](#imports)
  - [TypeScript Strictness](#typescript-strictness)
  - [Code Quality & Quality Gate](#code-quality--quality-gate)
- [License](#license)

---

## Code of Conduct

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md) in all project interactions.

---

## How to Contribute

### Reporting Bugs

Before opening a new issue, please search existing issues to see if it has already been reported.

When creating a bug report, please include:
- A clear and descriptive title.
- Steps to reproduce the issue.
- Expected behavior vs. actual behavior.
- Your Obsidian version and operating system.
- Relevant console logs (`Ctrl+Shift+I` or `Cmd+Option+I` in Obsidian).

### Suggesting Enhancements

Feature requests and improvements are welcome! Please open an issue with:
- A clear description of the feature or improvement.
- The motivation and use cases for the change.
- Any alternative solutions or workarounds you have considered.

### Submitting Pull Requests

1. **Fork** the repository and create a branch from `master`.
2. **Make your changes** cleanly and write tests where applicable.
3. Ensure all tests and lint checks pass with `npm run quality`.
4. **Commit** your changes with a descriptive commit message.
5. **Push** to your fork and submit a **Pull Request**.

---

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

Clone your fork and install dependencies:

```bash
git clone https://github.com/aleksejs1/obsidian-contact-sync-plugin.git
cd obsidian-contact-sync-plugin
npm install
```

### Available Scripts

- **`npm run build`**: Cleans `dist/` and bundles the plugin via Rollup into `dist/main.js`.
- **`npm test`**: Runs unit tests with Jest and generates coverage reports.
- **`npm run lint`**: Lints TypeScript files with ESLint.
- **`npm run format`**: Formats source code with Prettier.
- **`npm run typecheck`**: Runs TypeScript type checking (`tsc --noEmit`).
- **`npm run lint:deps`**: Verifies architecture boundaries with `dependency-cruiser`.
- **`npm run lint:prune`**: Checks for unused exports with `ts-prune`.
- **`npm run quality`**: Runs the complete quality suite (`typecheck`, `lint:deps`, `lint:prune`, `lint`, `test`).

### Testing in Obsidian

To test your local build inside Obsidian:

1. Build the plugin:
   ```bash
   npm run build
   ```
2. Copy `dist/main.js` and `manifest.json` into your vault's plugin directory:
   `<vault>/.obsidian/plugins/google-contacts/`
3. In Obsidian, go to **Settings → Community plugins**, reload and enable **Google Contacts**.

---

## Coding Guidelines

### Imports

Use absolute imports with the `src/` prefix for internal modules:

```ts
// Recommended
import { GoogleContact } from 'src/types/Contact';

// Avoid deep relative paths
import { GoogleContact } from '../../types/Contact';
```

### TypeScript Strictness

The project uses strict TypeScript settings including:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noUnusedLocals: true` / `noUnusedParameters: true`

Always run `npm run typecheck` after modifying TypeScript files.

### Code Quality & Quality Gate

Before submitting a PR, make sure the full quality gate passes:

```bash
npm run quality
```

---

## License

By contributing to this project, you agree that your contributions will be licensed under the [GNU General Public License v3.0](LICENSE).
