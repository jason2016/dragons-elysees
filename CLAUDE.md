# CLAUDE.md — dragons-elysees

## Long-term convention: dual-write work records to Semantic OS Obsidian

After finishing a batch of work on this project, save the work record in **two** places:

1. **Local repo** — keep artifacts with the code (e.g. under `docs/`), versioned with the project.
2. **Semantic OS Obsidian (required)** — also write that day's work record to:

   ```
   C:\Users\luqia\OneDrive\Documents\ObsidianVault\10_AI_OS\01_PROJECT_INBOX\customers\{client}\manual-notes\YYYY-MM-DD-{client}-daily-work-record.md
   ```

   For this project `{client}` = `dragons-elysees`.

When writing the Obsidian record, follow these boundaries:
- **Read-only git verification** — verify every commit hash / tag / count / release timestamp with read-only git commands and direct file inspection; mark anything unverifiable as `Not confirmed`. Do not copy numbers from chat.
- **Evidence-based status tiers** — Completed / Partially Completed / Pending Client Review / Not Confirmed / Not Done.
- **Do not modify any other Obsidian file** (no index/README/existing notes).
- **Do not distill**, do not create Project Map / Incident / Decision / Knowledge notes, do not generate a Context Pack.
- **No git add / commit / push and no deploy** for the note-saving step itself (real project commits/pushes/deploys done earlier may be recorded as history).
- **No secrets** — no passwords, tokens, API keys, backend logins, full `.env`, or customer private contact info.

3. **Proactive reminder** — if Jason forgets step 2 after a work batch, ask:
   > "工作记录是否需要同步到 Semantic OS Obsidian?"
