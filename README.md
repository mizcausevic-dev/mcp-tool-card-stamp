# mcp-tool-card-stamp

[![CI](https://github.com/mizcausevic-dev/mcp-tool-card-stamp/actions/workflows/ci.yml/badge.svg)](https://github.com/mizcausevic-dev/mcp-tool-card-stamp/actions/workflows/ci.yml)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

Build and validate a minimal **MCP Tool Card** per [mcp-tool-card-spec v0.1](https://github.com/mizcausevic-dev/mcp-tool-card-spec) from a `StampOptions` struct.

Completes the stamp quartet:

- [`agent-card-stamp`](https://github.com/mizcausevic-dev/agent-card-stamp) — A2A AgentCards
- **`mcp-tool-card-stamp`** — MCP Tool Cards
- [`prompt-provenance-stamp`](https://github.com/mizcausevic-dev/prompt-provenance-stamp) — prompt provenance docs
- [`evidence-bundle-builder`](https://github.com/mizcausevic-dev/evidence-bundle-builder) — evidence bundles

Part of the [Kinetic Gain Suite](https://suite.kineticgain.com/).

---

## Why

A Tool Card is the contract between an MCP server's tools and every agent that calls them. Spec drift — a destructive tool that forgot to set `human_approval_required: true`, a `pii_exposure` set to a value that isn't in the enum, a schema block with neither `input_schema_inline` nor `input_schema_uri` — turns into a runtime governance hole. This tool catches every constraint up-front and emits a card you can sign and publish.

## Validation rules

| Rule | Behavior on violation |
|---|---|
| `tool.server_id` and `tool.name` match `^[a-z0-9][a-z0-9-]*[a-z0-9]$` and ≥ 2 chars | error |
| `tool.version` matches `^\d+\.\d+\.\d+(?:[-+].+)?$` | error |
| `tool.mcp_server_uri` and `tool.description` are non-empty | error |
| `schema` has **exactly one** of `input_schema_inline` or `input_schema_uri` | error if neither, or both |
| `safety.side_effect_class` ∈ `{read, mutating, external, destructive}` | error |
| `safety.pii_exposure` ∈ `{none, low, medium, high}` when present | error |
| `safety.secrets_exposure` ∈ `{none, reads_secret_material, writes_secret_material}` when present | error |
| **`side_effect_class=destructive` → `human_approval_required: true`** | error: `... requires safety.human_approval_required: true (per mcp-tool-card-spec v0.1 allOf clause)` |

## CLI

```
mcp-tool-card-stamp <stamp-options.json> [--out card.json]
```

Exit codes:

- `0` — card written
- `2` — validation error

## Library

```ts
import { stamp } from "mcp-tool-card-stamp";
import type { StampOptions } from "mcp-tool-card-stamp";

const opts: StampOptions = {
  server_id: "kg-admin-mcp",
  name: "tenant-reset",
  version: "0.3.0",
  mcp_server_uri: "https://admin.kineticgain.com/mcp",
  description: "Resets a tenant. Irreversible.",
  side_effect_class: "destructive",
  input_schema_inline: { type: "object" },
  human_approval_required: true   // required for destructive
};

const card = stamp(opts);
```

## Composes with

- [**`mcp-tool-card-spec`**](https://github.com/mizcausevic-dev/mcp-tool-card-spec) — the schema this enforces.
- [**`mcp-tool-card-diff`**](https://github.com/mizcausevic-dev/mcp-tool-card-diff) — diff two stamped cards across versions.
- [**`agent-card-stamp`**](https://github.com/mizcausevic-dev/agent-card-stamp), [**`prompt-provenance-stamp`**](https://github.com/mizcausevic-dev/prompt-provenance-stamp), [**`evidence-bundle-builder`**](https://github.com/mizcausevic-dev/evidence-bundle-builder) — siblings across the suite.

Historical reference: [**`mcp-tool-card-summary`**](https://github.com/mizcausevic-dev/mcp-tool-card-summary) surfaced badges from a stamped card. GitHub marked it archived and read-only when checked on 2026-10-30; its source remains available.

## License

[AGPL-3.0-or-later](LICENSE)
