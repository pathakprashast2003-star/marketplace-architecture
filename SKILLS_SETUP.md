# Skills setup for this project

Four skills are installed in this project. Three work right away; REA needs one Terminal step on your Mac.

| Skill | Call it with | Source | Status |
|---|---|---|---|
| Reverse Engineer Anything (REA) | `/reverse-engineer-anything` | github.com/morluto/rea (official) | Skill installed. **Tools need setup (step 1).** |
| Hallmark | `/hallmark <prompt>` · `/hallmark redesign <path>` · `/hallmark audit <path>` | github.com/Nutlope/hallmark (official, v2.0.0) | Ready |
| Get Shit Done (GSD) | `/gsd-new-project`, then the other `/gsd-…` commands (67) | github.com/gsd-build/get-shit-done (official) | Ready. Optional hooks: step 2 |
| Ponytail | `/ponytail` | your account skill | Ready |

Installed in: `.claude/` (Claude Code), `.agent/` (Antigravity), `.agents/skills/` (other tools).

---

## Step 1 — Turn on REA's tools (required for REA, about 2 minutes)

The skill is only instructions. The real tools (decompiler bridge, browser and app capture, version compare) come from the REA server. Open **Terminal on your Mac** (not inside an AI app) and run:

```bash
cd ~/Downloads/marketplace-architecture

# 1. See what it will change, without changing anything
npx -y rea-agents setup --dry-run

# 2. Register REA with every AI app it finds (Claude Code, Antigravity, Cursor, Codex…)
npx -y rea-agents setup --all-detected

# 3. Check it is ready
npx -y rea-agents doctor
```

Then **quit and reopen** Claude Code / Antigravity in this folder.

Notes
- Needs Node.js 18+ (`node -v`). Setup does not install Java, Ghidra, Hopper, JADX etc. `doctor` tells you which optional engines are missing; you only need them for deep native-binary or Android work. Websites and Electron/JavaScript apps work without them.
- Only use the official sources: github.com/morluto/rea, rea.tools, npm package `rea-agents`.

## Step 2 — GSD safety hooks (optional)

Commands and agents already work. To also add GSD's optional hooks (commit checks, session state, etc.), in the same folder:

```bash
npx -y get-shit-done-cc --claude --local
npx -y get-shit-done-cc --antigravity --local
```

## Step 3 — Restart and test

Reopen your AI app in this folder and type `/` — you should see `reverse-engineer-anything`, `hallmark` and the `gsd-…` commands.

---

## How to use them together

```
/reverse-engineer-anything how does contra.com's profile page and inquiry flow work?
/hallmark redesign index.html
/gsd-new-project   (turn the plan into phases and build it)
/ponytail          (keep every change small)
```

Example chain in one message:
> /reverse-engineer-anything The Knot's vendor search page, then /hallmark the design for our Dunes theme, and plan the build with /gsd-new-project.

## Where things are

- `.claude/skills/` and `.agent/skills/`: `reverse-engineer-anything`, `hallmark`, plus GSD skills
- `.claude/commands/gsd/`: GSD commands
- `scratch/my_reverse_engineer_skill/`: the lighter handwritten website-teardown version (backup)

## Uninstall

```bash
npx -y get-shit-done-cc --claude --local --uninstall
npx -y get-shit-done-cc --antigravity --local --uninstall
rm -rf .claude/skills/reverse-engineer-anything .agent/skills/reverse-engineer-anything .agents/skills/reverse-engineer-anything
```
