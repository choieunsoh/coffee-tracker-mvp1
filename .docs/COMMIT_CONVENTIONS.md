# Conventional Commits Guide

This project follows [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add coffee count button` |
| `fix` | Bug fix | `fix: prevent duplicate entries` |
| `docs` | Documentation changes | `docs: update README with setup steps` |
| `style` | Code style (formatting, semi-colons, etc.) | `style: format code with prettier` |
| `refactor` | Code refactoring | `refactor: simplify API client structure` |
| `perf` | Performance improvements | `perf: optimize database queries` |
| `test` | Adding or updating tests | `test: add unit tests for API client` |
| `build` | Build system or dependencies | `build: upgrade to Vite 6.0` |
| `ci` | CI/CD changes | `ci: configure GitHub Actions` |
| `chore` | Other changes (maintenance, etc.) | `chore: update .gitignore` |
| `revert` | Revert a previous commit | `revert: feat(feature-name)` |

## Scopes

Optional scopes for this project:
- `server` - Backend (Express, API routes)
- `client` - Frontend (React, components)
- `api` - API endpoints and data handling
- `ui` - UI components and styling
- `db` - Database and data storage
- `config` - Configuration files
- `deps` - Dependencies

## Examples

### Basic commits
```bash
git commit -m "feat: add coffee entry deletion"
git commit -m "fix: correct timestamp display"
git commit -m "docs: update deployment guide"
```

### With scope
```bash
git commit -m "feat(server): add CORS support"
git commit -m "fix(client): prevent memory leak in WebSocket"
git commit -m "chore(deps): upgrade React to v19"
```

### With body
```bash
git commit -m "feat(api): add date range filtering

- Add startDate query parameter to /api/entries
- Update client to support date range selection
- Add date utility functions for formatting"
```

### Breaking changes
```bash
git commit -m "feat(api): change API response format

BREAKING CHANGE: API now returns {data: [...]} instead of [...]
```

## Manual Validation

To validate your commit message manually:

```bash
# Install commitlint CLI globally
bun add -g @commitlint/cli @commitlint/config-conventional

# Validate your commit message
echo "feat: add new feature" | commitlint
```

## Best Practices

- ✅ Use lowercase for type and scope
- ✅ Keep description under 72 characters
- ✅ Use imperative mood ("add" not "added" or "adds")
- ✅ Explain WHAT and WHY in the body (not HOW)
- ❌ Don't use "and" or "or" - split into multiple commits
- ❌ Don't mix unrelated changes in one commit
