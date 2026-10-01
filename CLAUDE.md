# CLAUDE.md

ServiceNow **Fluent** (Now SDK) config-as-code app. Metadata is TypeScript in `src/fluent/*.now.ts`; the build compiles it to instance XML in `dist/`.

## Before any Fluent work

Consult the SDK's built-in docs first — never guess API shapes:

```bash
npx @servicenow/sdk explain <topic> --list --peek --format=raw   # search + preview
npx @servicenow/sdk explain <topic> --format=raw                 # read
```

## Commands

```bash
pnpm run build      # compile + validate. ALWAYS run after editing fluent/server files
pnpm run build:ci   # frozen-keys build for CI (fails if keys.ts would change)
pnpm run deploy     # install dist/ on the authenticated instance. Only after a passing build
pnpm run types      # fetch instance type defs for autocomplete
pnpm run transform  # convert instance XML changes back to fluent source
pnpm exec now-sdk auth --list   # check instance credentials
```

## Hard rules

- **Never fabricate a sys_id.** New record identity is always `$id: Now.ID['kebab-key']`; the build assigns the sys_id and records it in `src/fluent/generated/keys.ts` (committed file — never hand-edit or delete it).
- **Never rename an existing `Now.ID` key or `Role` name** without understanding the old record gets orphaned.
- `Now` is a global in `.now.ts` files — never import it.
- Table exports: `export const <table_name> = Table({ name: '<table_name>', ... })` — variable and `name` must match exactly. Columns on own tables: no prefix. Columns added to foreign tables: scope prefix required.
- Cross-file references: export the fluent record and import the variable (or use `variable.$id`). `Now.ID[...]` is only for assigning identity. Platform records you don't own: `Now.ref('table', {...})`.

## Where scripts live (three places, not interchangeable)

- `src/server/` — **ES modules only** (SDK serverModules dir). Must `import { gs, GlideRecord } from '@servicenow/glide'` for every Glide API. Pass exported functions to `script:` on BusinessRule / UiAction / ScheduledScript / ScriptAction / RestApi routes.
- `src/scripts/` — files inlined via `Now.include('<relative path>')` for **string-only** script APIs: ScriptInclude, ClientScript, UI Policy, widgets, HTML/CSS. Script Include class files use ES5 `Class.create()`, do NOT import Glide (it's ambient there), and `type` must equal the class name and the fluent `name`.
- `src/fluent/` — `.now.ts` metadata only, one artifact type per directory, kebab-case filenames. Every `.now.ts` starts with `import '@servicenow/sdk/global'`.

Putting a `Class.create()` file in `src/server/` fails the build (module linter). Passing a module function to ScriptInclude/ClientScript fails the type check — those take strings.

## Project tooling for Claude

- `.claude/settings.json` pre-approves build/doc/query commands and defines two hooks: edits to `src/fluent/generated/keys.ts` are blocked, and every edit under `src/` triggers `pnpm run build` automatically (build failures are fed back — fix them before moving on).

## Workflow

1. Edit / add `.now.ts` + supporting scripts.
2. `pnpm run build` — fix diagnostics; the build enforces naming and reference rules.
3. Commit `keys.ts` changes together with the code that added the keys.
4. `pnpm run deploy` to push to the dev instance when asked.

The app scope is `x_912401_jamf_pro`.
