---
description: Commit and push changes with a descriptive message
---
Review pending changes with `git diff --staged` and `git diff` (if nothing is staged). Generate a commit message in English following best practices:

- Imperative subject line, max 50 chars
- Optional body explaining what and why, not how
- Conventional commit prefix when applicable: feat, fix, refactor, style, chore, docs, etc.

Then run:

1. `git add -A`
2. `git commit -m "<message>"`
3. `git push`
