# Visual Guidance

Capture mechanics for the "Look First" rule in `core-contract.md`. Keep this file **byte-identical** across `project-builder`, `session-context-updater`, and `project-status-checker`. Load it when about to give step-by-step UI instructions or to verify a UI change.

## Pick the surface

| What the user is looking at | Capture with |
|---|---|
| A web page or web console in Chrome (Intune, Entra, Dockge, a local dev site) | Claude Code: the `claude-in-chrome` skill. Grok or no extension: the window script below against `chrome`. |
| A desktop app, installer, dialog, or settings window | The window script below. |
| Anything else, or a capture that fails twice | Ask the user to paste a screenshot (one line, no popup). |

## Window script

`project-status-checker/scripts/capture-window.ps1` captures one window to a PNG. It works from any agent and any shell, and does not need a browser extension.

```text
powershell -NoProfile -File <skills>\project-status-checker\scripts\capture-window.ps1 -Process <process-name> -Out <scratchpad>\shot.png
```

- `-Process` is the process name without `.exe` (`chrome`, `Obsidian`, `mmc`, `explorer`).
- `-TitleExclude` is a regex of window titles to skip, for apps that open a separate dialog window (default skips titles starting with `Settings`).
- To capture only a dialog and never the main window, exclude everything else: `-TitleExclude '^(?!Settings)'` captures only a window whose title starts with `Settings`. Use this when the main window shows personal content (a daily note, an inbox, a bank page).
- Then Read the PNG. A blank or all-black image means the window is minimized or occluded: ask the user to bring it forward, and retry once.
- If the script is not present (a copy of the skills on another machine), fall back to asking for a pasted screenshot.

## Browser notes (Claude Code, claude-in-chrome)

- Start with `tabs_context_mcp`. Use the user's open tab only when they point at it, otherwise open a new one.
- After `navigate`, make one cheap `javascript_tool` call before the first screenshot; a screenshot right after navigating often times out.
- Measure with `javascript_tool` first when the question is about size or position, and screenshot to see the result.
- Never read cookies or query strings. Never click through a page that asks for credentials; stop and tell the user.

## After the capture

- Say what you see in one line only if it changes the plan (wrong page, unexpected dialog, error text). Otherwise go straight to the next steps.
- Name controls as labeled in the capture, with where they are ("top right, Add button").
- Give 1-3 steps, then stop and wait. Capture again when the user reports back.
