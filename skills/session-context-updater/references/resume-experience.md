# Resume Experience

On-demand only. **project-status-checker** owns Start; SCU owns End. This file is the SCU side of Fast/Deep when a primer exists.

**Load** on bootstrap, low-context A/C, explicit resume, or builder Fast/Deep accept. **Do not load** for ordinary wrap-up, Quick Capture, or primer regen (`next-session-prompt.md` owns that write).

Wrap-up already regenerates `latest.md` when the trio changed. Do not offer a primer after A/C. Do not write a dated twin. Do not paste the primer into chat.

## Detection

Check `context/prompts/next-session/latest.md` on Bootstrap, on low-context A/C, and when the user signals resume.

A primer is worth using only if it exists, is newer than `resume_prompt_max_age_days` (default 30), and is newer than the most recent dated STATUS entry.

| `resume_behavior` | What to do |
|---|---|
| `never` | Silent. No detection, no offer. |
| `ask` (default) | One low-pressure Fast / Deep / Not now choice. |
| `auto` | Run the configured `resume_mode` with one ready line. |

If no qualifying `latest.md`, stay silent. Never block wrap-up or delivery.

## Offer

One AskUserQuestion. Do not re-offer in the same session after decline.

> Want a clean start with current project context?

1. **Fast** — load context and go
2. **Deep** — short priority check first
3. **Not now**

If `resume_mode: fast` or `deep`, highlight that option. If the user says "just jump in" or "no resume stuff", do Fast (or skip if they refuse the primer).

Builder post-delivery uses the same three options (already in the builder SKILL). Treat accept as this flow.

## Fast

1. Load `latest.md` into working context. Do not dump it in chat.
2. One ready line, for example: "Ready. Using your latest project context."
3. Stop. Do not run the checker. Do not start a second job.

## Deep

1. Load `latest.md` silently (same as Fast).
2. Run **project-status-checker Start (Entry Point C)** with Deep on this project only.
3. Lead with the **Recommended First Move**. Tight why. Invite to begin.
4. Stop. No full dashboard, no extra question flow, no second skill unless they asked.

If the checker is missing or fails: First Move from the primer + STATUS Current State / Next Steps only. One line that the snapshot was skipped.

## Config

From `<!-- session-context-config` (defaults if missing):

| Key | Default |
|---|---|
| `resume_behavior` | `ask` |
| `resume_mode` | `ask` |
| `resume_prompt_max_age_days` | `30` |

`resume_mode: full` is not a separate product surface. Treat it as Deep.

## Ownership

| Who | Resume job |
|---|---|
| **project-status-checker Start (C)** | Default open: Fast (primer + light STATUS) or Deep (adds passes 1-2) |
| **SCU A (End)** | Write the trio; regen `latest.md`; do not run this file |
| **project-builder** | Quiet Fast / Deep / Not now after delivery; generate `latest.md` on accept if missing |
| **project-status-checker** | Start (Entry Point C) and Portfolio Focus |

Stay on the asked task. Detection is a side check. Never open an upgrade, audit, or new slice from a resume offer.
