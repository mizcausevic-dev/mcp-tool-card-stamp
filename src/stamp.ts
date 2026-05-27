import type { StampOptions, ToolCard } from "./types.js";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:[-+].+)?$/;

const VALID_SIDE_EFFECTS = new Set(["read", "mutating", "external", "destructive"]);
const VALID_PII = new Set(["none", "low", "medium", "high"]);
const VALID_SECRETS = new Set(["none", "reads_secret_material", "writes_secret_material"]);

/**
 * Build a minimal-valid MCP Tool Card v0.1 from a StampOptions struct.
 *
 * Validates:
 *   - tool.server_id and tool.name are kebab-case (≥ 2 chars)
 *   - tool.version is semver-shaped
 *   - safety.side_effect_class is one of {read, mutating, external, destructive}
 *   - safety.pii_exposure / secrets_exposure are valid enum values when present
 *   - schema has exactly one of input_schema_inline OR input_schema_uri
 *   - **destructive → human_approval_required: true** (spec allOf clause)
 *
 * Pure: no I/O, no network. The caller passes everything in; this just
 * shapes it into a spec-conforming card and surfaces a clear error on
 * any constraint violation.
 */
export function stamp(opts: StampOptions): ToolCard {
  if (!SLUG_PATTERN.test(opts.server_id) || opts.server_id.length < 2) {
    throw new Error(`tool.server_id "${opts.server_id}" must be kebab-case (at least 2 chars)`);
  }
  if (!SLUG_PATTERN.test(opts.name) || opts.name.length < 2) {
    throw new Error(`tool.name "${opts.name}" must be kebab-case (at least 2 chars)`);
  }
  if (!SEMVER_PATTERN.test(opts.version)) {
    throw new Error(`tool.version "${opts.version}" must be semver-shaped`);
  }
  if (!opts.mcp_server_uri) throw new Error("tool.mcp_server_uri is required");
  if (!opts.description) throw new Error("tool.description is required");

  // Schema: exactly one of inline or URI
  const inlineSet = opts.input_schema_inline !== undefined;
  const uriSet = !!opts.input_schema_uri;
  if (!inlineSet && !uriSet) {
    throw new Error("schema requires either input_schema_inline or input_schema_uri");
  }
  if (inlineSet && uriSet) {
    throw new Error("schema must have only one of input_schema_inline or input_schema_uri, not both");
  }

  if (!VALID_SIDE_EFFECTS.has(opts.side_effect_class)) {
    throw new Error(`safety.side_effect_class "${opts.side_effect_class}" must be one of: read, mutating, external, destructive`);
  }
  if (opts.pii_exposure !== undefined && !VALID_PII.has(opts.pii_exposure)) {
    throw new Error(`safety.pii_exposure "${opts.pii_exposure}" must be one of: none, low, medium, high`);
  }
  if (opts.secrets_exposure !== undefined && !VALID_SECRETS.has(opts.secrets_exposure)) {
    throw new Error(
      `safety.secrets_exposure "${opts.secrets_exposure}" must be one of: none, reads_secret_material, writes_secret_material`
    );
  }

  // Spec's allOf clause: destructive → human_approval_required: true
  if (opts.side_effect_class === "destructive" && opts.human_approval_required !== true) {
    throw new Error(
      "side_effect_class=destructive requires safety.human_approval_required: true (per mcp-tool-card-spec v0.1 allOf clause)"
    );
  }

  const card: ToolCard = {
    tool_card_version: "0.1",
    tool: {
      server_id: opts.server_id,
      name: opts.name,
      version: opts.version,
      mcp_server_uri: opts.mcp_server_uri,
      description: opts.description
    },
    schema: {},
    safety: {
      side_effect_class: opts.side_effect_class
    }
  };
  if (inlineSet) card.schema.input_schema_inline = opts.input_schema_inline;
  if (uriSet) card.schema.input_schema_uri = opts.input_schema_uri;
  if (opts.external_systems && opts.external_systems.length > 0) card.safety.external_systems = opts.external_systems;
  if (opts.reversible !== undefined) card.safety.reversible = opts.reversible;
  if (opts.rate_limited !== undefined) card.safety.rate_limited = opts.rate_limited;
  if (opts.pii_exposure !== undefined) card.safety.pii_exposure = opts.pii_exposure;
  if (opts.secrets_exposure !== undefined) card.safety.secrets_exposure = opts.secrets_exposure;
  if (opts.human_approval_required !== undefined) card.safety.human_approval_required = opts.human_approval_required;
  if (opts.refusal_modes && opts.refusal_modes.length > 0) card.safety.refusal_modes = opts.refusal_modes;
  if (opts.tested_with && opts.tested_with.length > 0) card.tested_with = opts.tested_with;
  if (opts.performance) card.performance = opts.performance;
  if (opts.cost) card.cost = opts.cost;
  if (opts.audit) card.audit = opts.audit;

  return card;
}
