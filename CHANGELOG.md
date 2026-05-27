# Changelog

## v0.1.0 — 2026-05-26

- Initial release: `stamp(opts)` → spec-conforming MCP Tool Card v0.1 from a `StampOptions` struct.
- Enforces the full v0.1 envelope: kebab-case `server_id` + `name`, semver `version`, non-empty `mcp_server_uri` and `description`, **exactly one** of `input_schema_inline` or `input_schema_uri`, valid enum values for `side_effect_class` / `pii_exposure` / `secrets_exposure`.
- **Enforces the spec's allOf clause**: `side_effect_class=destructive` → `safety.human_approval_required: true` is required, with a clear error message that references the spec clause.
- Pass-through for optional safety / tested_with / performance / cost / audit blocks.
- CLI: `mcp-tool-card-stamp <stamp-options.json> [--out card.json]`.
- Two fixtures: a read-tool `search-vectorstore` (with performance + cost metrics) and a destructive `tenant-reset` (with all safety + audit fields, `human_approval_required: true`).
- Completes the stamp quartet alongside `agent-card-stamp`, `prompt-provenance-stamp`, and `evidence-bundle-builder`.
- Node 20/22 CI (lint, typecheck, coverage, build, demo, `npm audit`), AGPL-3.0-or-later, Dependabot.
