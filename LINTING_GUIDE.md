# ESLint & Knip Configuration - rvyu Project

## ✅ Configuration Complete

Your project now has ESLint with unused imports detection and Knip for finding unused files.

## 📦 Installed Dependencies

- `@eslint/eslintrc` - ESLint configuration compatibility layer
- `eslint-plugin-unused-imports` - Detects unused imports and variables
- `knip` - Finds unused files (especially icons)

## ⚙️ Configuration Files

### 1. `eslint.config.mjs`

- Extends Next.js recommended configs
- Adds `unused-imports` plugin
- Warns (not errors) about unused imports and variables
- Ignores variables starting with `_` (e.g., `_unusedVar`)

### 2. `knip.json`

- Configured for your app router structure
- Tracks files in: `app/`, `components/`, `features/`, `lib/`, `actions/`, etc.
- Specifically monitors icon files in `components/icons/` and feature icon directories

### 3. `package.json` Scripts

New scripts added:

- `bun run lint` - Check for linting issues
- `bun run lint:fix` - Auto-fix linting issues
- `bun run check:unused-icons` - Find unused icon files (human-readable)
- `bun run lint:icons` - Find unused icon files (JSON format for CI/CD)

## 🚀 Usage

### Check for Unused Imports

```bash
# Run ESLint
bun run lint

# Auto-fix unused imports
bun run lint:fix
```

### Check for Unused Icon Files

```bash
# Human-readable output
bun run check:unused-icons

# JSON output (for CI/CD)
bun run lint:icons
```

## 💡 Features

### Unused Imports Detection

ESLint will warn you about:

- Imports that are never used
- Variables that are defined but never referenced
- Function parameters that are unused

**Example:**

```tsx
import { UnusedComponent } from "./components";
// ⚠️ Warning
import { UsedComponent } from "./components";

// ✅ OK

// Ignore unused vars by prefixing with _
const _unusedVar = 123; // ✅ No warning
const unusedVar = 456; // ⚠️ Warning
```

### Unused File Detection

Knip will detect icon files that are not imported anywhere in your codebase.

**Monitored directories:**

- `components/icons/**/*.{ts,tsx}`
- `features/**/components/icons/**/*.{ts,tsx}`

## 🎯 VS Code Integration

If you have the ESLint extension installed, warnings will automatically appear:

- In the editor (squiggly underlines)
- In the Problems panel
- On save (if configured)

## 🔧 Customization

### Exclude Files from Unused Icon Check

Edit `knip.json` and add to the `ignore` array:

```json
{
  "ignore": [
    "components/icons/legacy-icon.tsx",
    "components/icons/deprecated/**"
  ]
}
```

### Adjust Icon Locations

Modify the `project` array in `knip.json`:

```json
{
  "project": [
    "components/icons/**/*.{ts,tsx}",
    "your/custom/icon/path/**/*.{ts,tsx}"
  ]
}
```

## 📊 CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Check for unused imports
  run: bun run lint
  continue-on-error: true

- name: Check for unused icons
  run: bun run check:unused-icons
  continue-on-error: true
```

## ⚠️ Important Notes

1. **Warnings, Not Errors**: The configuration uses `"warn"` to avoid breaking builds
2. **Manual Cleanup**: Review flagged unused files before deleting
3. **False Positives**: Some files may be flagged incorrectly - use the `ignore` config
4. **Regular Checks**: Run `check:unused-icons` periodically to keep codebase clean

## 🎉 Verification

Both tools are verified and working:

- ✅ ESLint detects unused imports
- ✅ Knip finds unused files
- ✅ All scripts execute successfully

## 📚 Resources

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [eslint-plugin-unused-imports](https://github.com/sweepline/eslint-plugin-unused-imports)
- [Knip Documentation](https://knip.dev/)
- [Next.js ESLint Config](https://nextjs.org/docs/app/api-reference/config/eslint)
