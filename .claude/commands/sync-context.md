Review recent git history and update CLAUDE.md to reflect the current state of the codebase.

## Steps

1. Run `git log --oneline -30` to see recent commits.

2. Find the last commit that touched CLAUDE.md:
   ```
   git log -1 --format="%H %ai" -- CLAUDE.md
   ```

3. List all commits since CLAUDE.md was last updated:
   ```
   git log --oneline $(git log -1 --format="%H" -- CLAUDE.md)..HEAD
   ```
   If this is empty, CLAUDE.md is already up to date — report that and stop.

4. For each commit in that list, read the relevant changed files to understand what was added or modified. Focus on:
   - New or changed route files in `server/routes/`
   - New or changed components in `src/components/`
   - New or changed pages in `src/pages/`
   - Changes to `prisma/schema.prisma`
   - Changes to `server/index.ts` (new migrations = new schema fields)
   - Changes to `src/App.tsx` (new routes)
   - New environment variables referenced in any file

5. Update CLAUDE.md in-place. Sections to check:
   - **Frontend Routes table** — add any new routes from `src/App.tsx`
   - **Frontend Pages list** — add new pages, update status if ComingSoon pages went live
   - **Frontend Components list** — add new components
   - **API Routes table** — add new route files
   - **Key Data Models** — update if schema changed
   - **Environment Variables** — add any new variables
   - **Known Issues** — mark fixed issues as resolved (with date), add newly discovered issues
   - **Workflow Rules / Architectural Principles** — update if any new patterns were established
   - Update the "Last reviewed" date in the Known Issues section

6. Commit the updated CLAUDE.md on the current branch:
   ```
   git add CLAUDE.md
   git commit -m "docs: sync CLAUDE.md with recent changes"
   ```

## Rules

- Do NOT merge to main. Committing CLAUDE.md updates to the current branch is the job.
- Do NOT invent content — only document what is actually in the code.
- Do NOT remove existing architectural documentation unless the code it describes no longer exists.
- If you discover a bug or security issue while reviewing the diff, add it to the Known Issues section.
- Keep descriptions concise — one line per item in tables and lists.
