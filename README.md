# project-session-tools

A Claude Code plugin for working on projects across many sessions without losing the thread. Each project keeps three plain markdown files, and the skills read and write them for you:

| File | Holds |
|---|---|
| `context/PROJECT_BRIEF.md` | What is true now: scope, environment, stakeholders |
| `context/STATUS.md` | A dated journal: what happened, what is next, blockers |
| `context/DECISIONS.md` | Choices made, with the alternatives and why |

Say **start** to open a session and get one Recommended First Move. Say **end session** to capture what happened and refresh the next-session primer.

## Skills

| Skill | Say | Does |
|---|---|---|
| `project-status-checker` | `start`, `start <project>`, `check status`, `full audit`, `which project today` | Opens a session with a First Move; health checks and audits; ranks projects for the day |
| `session-context-updater` | `end session`, `wrap up`, `quick capture: ...` | Captures the session into the three files, refreshes `context/prompts/next-session/latest.md`, commits what it wrote |
| `project-builder` | `build project instructions for ...` | Writes `CLAUDE.md` / Claude Project instructions for software or IT infrastructure projects |
| `ticket-triage` | `triage my tickets` | Compares your Freshservice queue with project folders and scaffolds the missing ones (needs a Freshservice MCP server) |

The bundled MCP server (`server/bundle/server.mjs`) does the deterministic parts: snapshots, portfolio ranking, health score math, STATUS / DECISIONS writes and ticket matching. Skills still work without it, by hand.

## Install

Needs Node.js 20 or newer on `PATH`.

```text
/plugin marketplace add justinsamsel/project-session-tools
/plugin install project-session-tools@project-session-tools
```

Then restart Claude Code. To get updates automatically: `/plugin` > Marketplaces > `project-session-tools` > Enable auto-update. Updates load at the next start.

If you already have these skills in `~/.claude/skills/`, remove those folders, or both copies load.

## Projects folder

The tools look for projects in the first of these that is set:

1. `PROJECT_SESSION_TOOLS_ROOT` environment variable
2. `projects_root` in `~/.claude/freshservice-config.json` (ticket-triage writes it)
3. `~/projects`

You can also always name a project by absolute path: `start C:\work\my-project`.

## Other agents

The skills are plain `SKILL.md` folders under `skills/`, and the server is a standard stdio MCP server, so agents that load skill folders and MCP servers can use both. See `skills/HOW-TO-INSTALL.md` and `server/README.md`.

## License

MIT. See `LICENSE`.
