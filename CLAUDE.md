# Benny

Repository for Claude Code skills and setup.

## Layout

- `.claude/skills/humanizer` - rewrites AI-sounding prose.
- `.claude/skills/notebooklm` - drives Gemini Notebook via the `notebooklm-py` CLI.
- `.claude/hooks/session-start.sh` - installs `notebooklm-py` in cloud sessions.
- `.claude/settings.json` - shared project settings and hooks.

## Conventions

- Add new skills as `.claude/skills/<name>/SKILL.md` with `name` and `description` frontmatter.
- Develop on the branch assigned to the session; don't open PRs unless asked.
