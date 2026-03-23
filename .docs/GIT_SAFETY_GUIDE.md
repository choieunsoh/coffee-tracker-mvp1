# Git Safety Guide

This document provides essential information about dangerous git commands and how to work safely with git to prevent data loss.

## ⚠️ EXTREMELY DANGEROUS COMMANDS

These commands can cause **permanent data loss** with no recovery. Use only when you understand the consequences and have backups.

### 1. Repository Destruction

```bash
# ⚠️ DESTROYS ENTIRE GIT REPOSITORY
rm -rf .git
```

**What it does:** Deletes the `.git` directory, destroying all version control history.

**When to avoid:** Almost always. Only use if you intentionally want to remove git from a project.

**Safer alternative:** If you want to stop tracking a repo, create a backup first:
```bash
# Backup the entire repo first
cp -r .git .git-backup-$(date +%Y%m%d-%H%M%S)
# Then remove if you're sure
rm -rf .git
```

### 2. Hard Reset Operations

```bash
# ⚠️ DISCARDS LAST COMMIT AND ALL CHANGES
git reset --hard HEAD~1

# ⚠️ DISCARDS ALL CHANGES SINCE A SPECIFIC COMMIT
git reset --hard <commit-hash>
```

**What it does:**
- Rewrites commit history
- Discards all uncommitted changes
- Discards the specified commit(s)
- **Cannot be undone**

**When to avoid:** When you have uncommitted work you might need, or when working with shared branches.

**Safer alternatives:**
```bash
# See what will be discarded
git reset --hard HEAD~1 --dry-run

# Keep changes as unstaged
git reset HEAD~1

# Keep changes as a new commit
git reset --soft HEAD~1
```

### 3. Clean Operations

```bash
# ⚠️ DELETES ALL UNTRACKED FILES AND DIRECTORIES
git clean -fd

# ⚠️ DELETES UNTRACKED FILES INCLUDING .GITIGNORED ONES
git clean -fdx
```

**What it does:** Permanently deletes files that git isn't tracking.

**When to avoid:** When you might have files you forgot to add, or when there are generated files you might need.

**Safer alternatives:**
```bash
# See what would be deleted
git clean -fd --dry-run

# Interactive mode - ask for each file
git clean -fdi

# Only delete files (not directories)
git clean -f

# Only delete files matching a pattern
git clean -f "*.tmp"
```

## 🔴 DANGEROUS COMMANDS

These commands can overwrite history or cause conflicts. Use with caution.

### 1. Force Push

```bash
# ⚠️ OVERWRITES REMOTE BRANCH HISTORY
git push --force

# ⚠️ SAFER BUT STILL RISKY
git push --force-with-lease
```

**What it does:** Overwrites the remote branch with your local version, discarding any commits others may have made.

**When to avoid:** When working with shared branches or team repositories.

**Safer alternatives:**
```bash
# Pull latest changes first
git pull origin main

# Create a new branch instead of force pushing
git checkout -b new-feature-branch
git push origin new-feature-branch

# Use --force-with-lease if you must force push
git push --force-with-lease
```

### 2. Interactive Rebase

```bash
# ⚠️ REWRITES ALL COMMITS SINCE <branch>
git rebase --interactive <branch>
```

**What it does:** Rewrites commit history, changing commit messages, order, or splitting commits.

**When to avoid:** When others have based work on your commits.

**Safer alternatives:**
```bash
# Rebase on your local branch only
git rebase --interactive main

# Use merge instead of rebase for shared branches
git merge feature-branch

# Create a new branch and rebase there
git checkout -b temp-branch
git rebase main
```

### 3. Checkout with Force

```bash
# ⚠️ DISCARDS ALL UNCOMMITTED CHANGES
git checkout --force <branch>
```

**What it does:** Discards all uncommitted changes and switches branches.

**Safer alternatives:**
```bash
# Stash changes first
git stash
git checkout <branch>
git stash pop

# See what would be discarded
git checkout -- <branch> --dry-run

# Commit or stash changes first
git add .
git commit -m "WIP"
git checkout <branch>
```

## 🟡 RISKY COMMANDS

These commands can cause issues but are sometimes necessary.

### 1. Branch Deletion

```bash
# ⚠️ DELETES BRANCH WITHOUT MERGE CHECK
git branch -D <branch>
```

**What it does:** Force deletes a branch even if it hasn't been merged.

**Safer alternatives:**
```bash
# Safe delete (checks for unmerged commits)
git branch -d <branch>

# Check where the branch is used
git branch --merged <branch>
git branch --no-merged <branch>
```

### 2. Stash Operations

```bash
# ⚠️ DROPS ALL STASHES
git stash drop -a
```

**What it does:** Permanently deletes all stashed changes.

**Safer alternatives:**
```bash
# View stashes first
git stash list

# Drop specific stash
git stash drop stash@{0}

# Pop instead of drop (applies stash and removes it)
git stash pop
```

### 3. Merge Operations

```bash
# ⚠️ CREATES UNNECESSARY MERGE COMMITS
git merge --no-ff <branch>
```

**What it does:** Creates a merge commit even when a fast-forward is possible.

**When this is good:** When you want to preserve branch history.

**Safer alternative:**
```bash
# Fast-forward merge (clean history)
git merge <branch>
```

## 🛡️ PREVENTION STRATEGIES

### 1. Always Use Dry Run First

```bash
# Check what will happen
git reset --hard HEAD~1 --dry-run
git clean -fd --dry-run
git checkout --force <branch> --dry-run
```

### 2. Create Regular Backups

```bash
# Backup before risky operations
git backup() {
    git stash
    git stash branch backup-$(date +%Y%m%d-%H%M%S)
    git stash pop
}

# Or create a full repo backup
cp -r .git .git-backup-$(date +%Y%m%d)
```

### 3. Use .gitattributes

Create a `.gitattributes` file to mark files as binary or to handle line endings:

```
# Mark files as binary
*.pdf binary
*.jpg binary

# Handle line endings
* text=auto eol=lf
```

### 4. Configure Warnings

```bash
# Warn before force operations
git config --global push.default simple
git config --global rebase.autostash true
```

### 5. Use Branches for Experiments

```bash
# Create a branch for risky changes
git checkout -risky-experiment
# ... do risky work ...
# If it fails, just delete the branch
git checkout main
git branch -D risky-experiment
```

## 🚨 REAL-WORLD DISASTERS

### Case 1: The Force Push Gone Wrong

**Scenario:** Developer force pushed to main, overwriting 2 days of team work.

**Prevention:**
- Never force push shared branches
- Use pull requests instead
- Have a backup strategy

**Recovery:**
```bash
# If you accidentally force pushed
git reflog
git reset --hard <before-force-push-commit>
git push --force-with-lease
```

### Case 2: The Hard Reset Disaster

**Scenario:** Developer hard reset, losing important uncommitted work.

**Prevention:**
- Always stash before reset
- Use `git status` before destructive operations
- Commit frequently

**Recovery:**
```bash
# Check reflog for lost commits
git reflog
# Restore lost work
git reset --hard <lost-commit-hash>
```

### Case 3: The Clean Command Mistake

**Scenario:** Developer ran `git clean -fdx` accidentally, deleting vendor files.

**Prevention:**
- Always use `--dry-run` first
- Add important files to .gitignore
- Use version control for all project files

**Recovery:**
```bash
# If vendor files are in git history
git checkout HEAD~1 -- vendor/
git add vendor/
git commit -m "Restore vendor files"
```

## 📋 SAFETY CHECKLIST

Before running any potentially dangerous command:

- [ ] Have I committed or stashed all important changes?
- [ ] Have I run with `--dry-run` first?
- [ ] Do I have a backup of this branch/repo?
- [ ] Are others working on this branch?
- [ ] Do I understand exactly what this command will do?

## 🔧 RECOMMENDED GIT CONFIGURATION

Add these to your global `.gitconfig`:

```ini
[push]
    default = simple
    followTags = true

[rebase]
    autostash = true
    autosquash = true

[advice]
    detachedHead = false
    pushNonFFCurrent = true
    pushUpdateRejected = true

[init]
    defaultBranch = main

[core]
    editor = code --wait
```

## 🆘 EMERGENCY RECOVERY

If you've lost work:

1. **Check reflog:**
   ```bash
   git reflog
   ```

2. **Restore lost commits:**
   ```bash
   git reset --hard <lost-commit-hash>
   ```

3. **Restore lost files:**
   ```bash
   git checkout <commit> -- <file>
   ```

4. **Recover from backup:**
   ```bash
   cp .git-backup-*/HEAD .git/HEAD
   git reset --hard
   ```

Remember: **Prevention is better than recovery.** Always think before you type!

---

**Last Updated:** 2026-03-22
**Version:** 1.0.0

---

## 🛡️ Git Safety System Implementation

### How the Safety System Works

The Git Safety System consists of three main components:

#### 1. **git-safe Wrapper Script**
- **Location:** `H:\code\scripts\git-safe\git-safe.sh`
- **Purpose:** Intercepts dangerous git commands before they execute
- **How it works:**
  - Wraps around git commands
  - Scans arguments for dangerous patterns
  - Shows warnings about what will be affected
  - Requires explicit confirmation
  - Can be bypassed with `--no-safety` flag

#### 2. **Pre-commit Hook**
- **Location:** Installed in `.git/hooks/pre-commit`
- **Purpose:** Blocks commits containing dangerous patterns
- **How it works:**
  - Scans commit messages for dangerous commands
  - Blocks commits mentioning reset, force push, or clean
  - Warns about large files in commits

#### 3. **Safety Check Utility**
- **Location:** `H:\code\scripts\git-safe\safety-check.sh`
- **Purpose:** Quick audit of current repository state
- **How it works:**
  - Checks for uncommitted changes
  - Looks for untracked files
  - Reviews recent dangerous operations
  - Provides safety recommendations

### Installation & Usage

```bash
# Install the safety system
cd H:\code\scripts\git-safe
./install.sh

# Run safety audit
safety-check

# Use git-safe wrapper
git reset --hard HEAD~1  # Shows warning and requires confirmation
git --no-safety reset --hard HEAD~1  # Bypasses safety

# Configure safety rules
cat .git/safety/config
```

### Safety Configuration

The system uses environment variables:
- `GIT_ALLOW_DANGEROUS_COMMANDS=false` - Disables dangerous commands
- `GIT_REQUIRE_CONFIRMATION=true` - Requires confirmation
- `GIT_DANGEROUS_COMMAND_TIMEOUT=5` - Confirmation timeout

### Emergency Procedures

If you need to bypass safety:
```bash
# Use --no-safety flag
git reset --hard --no-safety HEAD~1

# Or set environment variable
export GIT_ALLOW_DANGEROUS_COMMANDS=true
git reset --hard HEAD~1
```

### Custom Rules

Create `.git/safety-rules.yml` to customize:
```yaml
commands:
  reset:
    pattern: "--hard"
    action: "warn"
    message: "This will discard all changes"
```

The safety system provides multiple layers of protection while remaining flexible enough for legitimate emergency operations.