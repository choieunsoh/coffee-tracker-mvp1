# Linting and Formatting Guide

This project uses **ESLint** and **Prettier** for code quality and consistent formatting.

## Available Scripts

### Linting

```bash
# Check for linting issues
bun run lint

# Automatically fix linting issues
bun run lint:fix
```

### Formatting

```bash
# Format all source files
bun run format

# Check if files are formatted (without modifying)
bun run format:check
```

## Configuration Files

- **`eslint.config.js`** - ESLint configuration (flat config format)
- **`.prettierrc`** - Prettier formatting rules
- **`.prettierignore`** - Files to exclude from formatting

## ESLint Rules

### Enabled Rules

- ✅ TypeScript recommended rules
- ✅ No unused variables (with `_` prefix exception)
- ✅ Warn about `any` types
- ✅ No `console.log` (only `console.warn` and `console.error` allowed)
- ✅ Prefer `const` over `let`

### Disabled Rules

- ❌ `react/react-in-jsx-scope` - React 19 doesn't need React in scope
- ❌ `react/prop-types` - Using TypeScript instead
- ❌ `no-undef` - TypeScript handles this

## Prettier Configuration

```json
{
  "semi": false,              // No semicolons
  "singleQuote": true,        // Single quotes
  "tabWidth": 2,              // 2 spaces
  "trailingComma": "es5",     // Trailing commas where valid
  "printWidth": 100,          // Max line length
  "arrowParens": "always"     // Arrow function params in parentheses
}
```

## Pre-commit Workflow

Before committing code:

```bash
# 1. Check formatting
bun run format:check

# 2. Format if needed
bun run format

# 3. Fix linting issues
bun run lint:fix

# 4. Build to ensure no TypeScript errors
bun run build
```

Or run them all in one line:
```bash
bun run format && bun run lint:fix && bun run build
```

## Current Issues

### Warnings (12)

There are currently console.log warnings in development code:
- `src/features/coffee-tracker/components/CoffeeCountButton.tsx` (4 warnings)
- `src/features/coffee-tracker/hooks/useCoffeeEntries.ts` (8 warnings)

These are acceptable for development but should be removed before production deployment.

### Fix Options

**Option 1:** Remove console.log statements (recommended for production)
```bash
# Search for console.log
grep -r "console.log" src/
```

**Option 2:** Disable the rule for development
```javascript
// In eslint.config.js
'no-console': 'off', // Allow all console statements
```

**Option 3:** Keep as is (acceptable for development)

## VS Code Integration

### Recommended Extensions

1. **ESLint** - `dbaeumer.vscode-eslint`
2. **Prettier** - `esbenp.prettier-vscode`

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
}
```

## Troubleshooting

### ESLint not working

```bash
# Clear ESLint cache
rm -rf node_modules/.cache-eslint

# Reinstall dependencies
bun install

# Try again
bun run lint
```

### Prettier not formatting

```bash
# Check if Prettier is installed
bun prettier --version

# Try formatting manually
bun prettier --write "src/**/*.ts"
```

### Conflicts between ESLint and Prettier

The `eslint-plugin-prettier` ensures Prettier formatting takes precedence. If you see conflicts:

```bash
# Reinstall Prettier plugins
bun add -d eslint-config-prettier eslint-plugin-prettier
```

## Best Practices

1. **Run lint before commits** - Catch issues early
2. **Format on save** - Keep code consistently formatted
3. **Fix warnings** - Don't ignore linting warnings
4. **Use TypeScript** - Let TypeScript catch errors before ESLint
5. **Be consistent** - Follow the project's coding style

## Resources

- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/)

---

**Last Updated:** 2026-03-20
**Version:** 1.5.0
