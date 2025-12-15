# Prettier Configuration - rvyu Project

## ✅ Configuration Complete

Your project now has Prettier configured with automatic import sorting and Tailwind CSS class sorting.

## 📦 Already Installed Dependencies

Your project already has:

- `prettier@3.6.2` - Core Prettier formatter
- `@trivago/prettier-plugin-sort-imports@5.2.2` - Automatic import sorting
- `prettier-plugin-tailwindcss@0.7.1` - Tailwind class sorting

## ⚙️ Configuration Files

### 1. `.prettierrc` - Updated with Project Structure

Your import order is now configured to match your actual folder structure:

```json
{
  "importOrder": [
    "^(react|react-dom)$", // React imports first
    "^next", // Next.js imports
    "<THIRD_PARTY_MODULES>", // All node_modules
    "^@/components/ui/(.*)$", // UI components
    "^@/components/common/(.*)$", // Common components
    "^@/components/icons/(.*)$", // Icons
    "^@/components/providers/(.*)$", // Providers
    "^@/features/(.*)$", // Feature modules
    "^@/lib/(.*)$", // Utilities
    "^@/actions/(.*)$", // Server actions
    "^@/types/(.*)$", // TypeScript types
    "^@/validation/(.*)$", // Validation schemas
    "^@/app/(.*)$", // App router files
    "^@/(.*)$", // Any other @ imports
    "^[./]" // Relative imports
  ]
}
```

### 2. `.prettierignore` - Created

Ignores build outputs, dependencies, and generated files.

### 3. `.vscode/settings.json` - Created

- Format on save enabled
- Prettier set as default formatter
- ESLint auto-fix on save enabled

### 4. `package.json` Scripts - Added

New scripts available:

- `bun run format` - Format all files
- `bun run format:check` - Check formatting without changes

## 🚀 Usage

### Format All Files

```bash
# Format entire project (fixes all 120 files found)
bun run format

# Check formatting without making changes
bun run format:check
```

### Format Specific Files

```bash
# Single file
npx prettier --write app/page.tsx

# Specific folder
npx prettier --write "app/**/*.tsx"

# Multiple patterns
npx prettier --write "components/**/*.{ts,tsx}"
```

### VS Code Integration

Just save any file (Ctrl+S) and it will auto-format! ✨

## 🎨 What Gets Formatted

### 1. Import Sorting

**Before:**

```tsx
import React, { useState } from "react";

import { motion } from "motion/react";

import { Button } from "@/components/ui/button";

import Clock from "@/components/icons/clock";

import { helper } from "../utils/helper";
```

**After:**

```tsx
import React, { useState } from "react";

import { motion } from "motion/react";

import { Button } from "@/components/ui/button";

import Clock from "@/components/icons/clock";

import { helper } from "../utils/helper";
```

### 2. Tailwind CSS Class Sorting

**Before:**

```tsx
<div className="text-white bg-blue-500 p-4 rounded-lg mt-8 flex items-center">
```

**After:**

```tsx
<div className="mt-8 flex items-center rounded-lg bg-blue-500 p-4 text-white">
```

### 3. General Code Formatting

- Consistent semicolons
- Double quotes (not single)
- 2-space indentation
- 80 character line width
- ES5 trailing commas

## 📊 Current Status

Prettier found **120 files** that need formatting:

- All TypeScript/TSX files in `app/`, `components/`, `features/`, `lib/`, etc.
- Configuration files

**To format all files now:**

```bash
bun run format
```

## 💡 Recommended Workflow

### Option 1: Format Everything Now

```bash
# Format all files at once
bun run format

# Verify
bun run format:check
```

### Option 2: Format as You Work

Just save files in VS Code - they'll auto-format! No manual intervention needed.

### Option 3: Pre-commit Hook (Optional)

Install Husky + lint-staged to auto-format before commits:

```bash
bun add -D husky lint-staged
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx,json,css,md}": "prettier --write"
  }
}
```

## 🎯 Integration with ESLint

Your setup now has both:

- **ESLint** - For code quality and unused imports
- **Prettier** - For code formatting

They work together without conflicts! ✨

### Run Both

```bash
# Check linting
bun run lint

# Fix linting issues
bun run lint:fix

# Check formatting
bun run format:check

# Fix formatting
bun run format
```

### Run All at Once

```bash
# Fix everything
bun run lint:fix && bun run format
```

## 📝 VS Code Setup

### Required Extension

Install "Prettier - Code formatter" extension:

1. Open Extensions (Ctrl+Shift+X)
2. Search "Prettier - Code formatter"
3. Install by Prettier

### Settings Already Configured

Your `.vscode/settings.json` is set up with:

- ✅ Format on save
- ✅ Prettier as default formatter
- ✅ ESLint auto-fix on save
- ✅ Requires `.prettierrc` config file

## 🔧 Customization

### Change Import Order

Edit the `importOrder` array in `.prettierrc` to match your preferences.

### Add More File Types

Edit scripts in `package.json`:

```json
{
  "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,scss,md,yml}\""
}
```

### Ignore Specific Files

Add to `.prettierignore`:

```
# Ignore specific files
components/legacy/**
old-code/
```

### Adjust Formatting Rules

Add to `.prettierrc`:

```json
{
  "singleQuote": true, // Use single quotes
  "printWidth": 100, // Longer lines
  "tabWidth": 4 // 4-space tabs
  // ... existing config
}
```

## ⚠️ Important Notes

1. **Format Before Committing**
   - Run `bun run format` before your first commit with new config
   - Creates a clean baseline for future changes

2. **VS Code Extension Required**
   - Format on save requires the Prettier extension
   - Without it, you'll need to run `bun run format` manually

3. **Import Order is Powerful**
   - Automatically organizes all your imports
   - Groups related imports together
   - Saves time and reduces merge conflicts

4. **Tailwind Classes**
   - Uses official Tailwind recommended order
   - Works with `cn()`, `clsx()`, and `classnames()`
   - Respects your custom Tailwind config

## ✨ Benefits

- **Consistency**: Same formatting across entire team
- **Time Saved**: No manual formatting needed
- **Reduced Conflicts**: Consistent style = fewer merge conflicts
- **Better Readability**: Clean, organized imports
- **Auto-fix**: Format on save = zero effort

## 🎉 Verification Checklist

- ✅ Prettier installed and configured
- ✅ Import sorting plugin configured
- ✅ Tailwind sorting plugin configured
- ✅ Scripts added to package.json
- ✅ .prettierignore created
- ✅ VS Code settings configured
- ✅ `bun run format:check` works (found 120 files)

## 🚀 Next Steps

1. **Format all files:**

   ```bash
   bun run format
   ```

2. **Verify formatting:**

   ```bash
   bun run format:check
   # Should output: "All matched files use Prettier code style!"
   ```

3. **Test in VS Code:**
   - Open any file
   - Make a change
   - Save (Ctrl+S)
   - Watch it auto-format! ✨

4. **Commit the changes:**
   ```bash
   git add .
   git commit -m "Configure Prettier with import sorting and Tailwind class sorting"
   ```

## 📚 Resources

- [Prettier Documentation](https://prettier.io/docs/en/)
- [@trivago/prettier-plugin-sort-imports](https://github.com/trivago/prettier-plugin-sort-imports)
- [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)

---

**Your code will now be automatically formatted with organized imports and sorted Tailwind classes!** 🎉
