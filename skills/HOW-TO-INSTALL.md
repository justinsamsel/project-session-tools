# How to install these skills (copy-paste)

**Claude Code:** install the `project-session-tools` plugin instead (see the repo `README.md`). It brings these skills and the MCP server, and can update itself. Use the options below for other agents, or to run skills without the plugin.

## Option A — Copy into your skills directory (simplest)

1. Copy **each skill folder** from this directory (for example `project-builder`, `session-context-updater`, …) into your agent’s skills folder:
   - Claude: often `~/.claude/skills/`
   - Grok: often `~/.grok/skills/`
2. Do **not** copy this `HOW-TO-INSTALL.md` unless you want it for reference.
3. Restart Claude or Grok.

You should end up with paths like:

```text
~/.claude/skills/project-builder/SKILL.md
~/.claude/skills/session-context-updater/SKILL.md
…
```

## Option B — Link this folder into your skills directory (no copying)

Use this if you keep a full clone of the project and want edits to take effect immediately.

**Claude Code has no config setting for extra skill directories.** It only discovers skills from `~/.claude/skills/`, a project's `.claude/skills/`, directories passed with `--add-dir`, and plugins. But a skill entry in any of those can be a **symlink or junction to a directory elsewhere on disk** — Claude Code follows it and reads `SKILL.md` from the target. So link each skill folder rather than pointing a config at the parent.

**Windows (PowerShell)** — junctions, no admin or Developer Mode needed:

```powershell
$src = "C:\path\to\project-session-tools\skills"
foreach ($d in Get-ChildItem $src -Directory) {
  New-Item -ItemType Junction `
           -Path "$env:USERPROFILE\.claude\skills\$($d.Name)" `
           -Target $d.FullName
}
```

**macOS / Linux:**

```bash
src=~/path/to/project-session-tools/skills
for d in "$src"/*/; do ln -s "$d" ~/.claude/skills/"$(basename "$d")"; done
```

Claude Code watches `~/.claude/skills/` and picks up edits to `SKILL.md` live — no restart, no re-copy. Restart only if `~/.claude/skills/` did not exist when the session started.

**Grok** — in `~/.grok/config.toml`:

```toml
[skills]
paths = ["C:/path/to/project-session-tools/skills"]
```

Restart the agent.

## Recommended daily habits (after install)

| You say | What to expect |
|---------|----------------|
| **start session** | Continuity load + one Recommended First Move (`project-status-checker`) |
| **end session** | Capture context + refresh next-session primer (`session-context-updater`) |
| **plan my day** / **portfolio** | Rank which project deserves this session (`project-status-checker` Portfolio Focus) |

You can still call the core skills by name for audits, bootstrap, builders, etc.

## Updating

If you installed with **Option B**, there is nothing to do — the links already point at the updated folder.

If you installed with **Option A**: when the maintainer shares a new copy of `skills/`, replace the old skill folders with the new ones (or re-copy). There is no automatic update.

If you installed an older copy, delete the retired `session-os` and `infra-project-builder` folders from your skills directory when you re-copy.

### After you update skills (important)

**New skills + old projects** is normal. Current skills are built to **keep working** on projects created with older versions (missing config, no primer folder, plain context files, etc.).

For the best experience on a project you still use:

1. Open that project in chat with the updated skills loaded.
2. Say: **upgrade this project** or **bring this project up to current skills**  
   (runs session-context-updater Entry Point H — frontmatter/config/trio hygiene without wiping history).
3. Optional: **audit/refresh instructions** if `CLAUDE.md` is very old.

You do **not** need to upgrade every project before the next capture. Upgrade when you care about that project feeling fully modern.

If something still feels off, re-copy `skills/` completely (stale partial copies are a common coworker issue).
