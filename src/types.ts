// Build + validate a minimal MCP Tool Card per mcp-tool-card-spec v0.1.
// Reference: https://github.com/mizcausevic-dev/mcp-tool-card-spec

export type SideEffectClass = "read" | "mutating" | "external" | "destructive";
export type PiiExposure = "none" | "low" | "medium" | "high";
export type SecretsExposure = "none" | "reads_secret_material" | "writes_secret_material";

export interface ToolCard {
  tool_card_version: string;
  tool: {
    server_id: string;
    name: string;
    version: string;
    mcp_server_uri: string;
    description: string;
  };
  schema: {
    input_schema_inline?: Record<string, unknown>;
    input_schema_uri?: string;
  };
  safety: {
    side_effect_class: SideEffectClass;
    external_systems?: string[];
    reversible?: boolean;
    rate_limited?: boolean;
    pii_exposure?: PiiExposure;
    secrets_exposure?: SecretsExposure;
    human_approval_required?: boolean;
    refusal_modes?: string[];
  };
  tested_with?: Array<{
    llm: string;
    provider?: string;
    test_suite_uri?: string;
    pass_rate?: number;
    tested_at?: string;
    sample_size?: number;
  }>;
  performance?: {
    p50_latency_ms?: number;
    p95_latency_ms?: number;
    p99_latency_ms?: number;
    measurement_window?: string;
  };
  cost?: {
    per_call_usd?: number;
    measurement_window?: string;
  };
  audit?: {
    log_uri?: string;
    retention_days?: number;
    signed_by?: string;
    incident_response_uri?: string;
  };
}

export interface StampOptions {
  /** tool.server_id — kebab-case slug identifying the MCP server. */
  server_id: string;
  /** tool.name — kebab-case slug for this tool. */
  name: string;
  /** tool.version — semver. */
  version: string;
  /** tool.mcp_server_uri. */
  mcp_server_uri: string;
  /** tool.description. */
  description: string;
  /** JSON Schema describing the tool input. Provide either `input_schema_inline` or `input_schema_uri`. */
  input_schema_inline?: Record<string, unknown>;
  /** Externally hosted JSON Schema URI for the input. */
  input_schema_uri?: string;
  /** safety.side_effect_class — required. */
  side_effect_class: SideEffectClass;
  /** safety.external_systems. */
  external_systems?: string[];
  /** safety.reversible. */
  reversible?: boolean;
  /** safety.rate_limited. */
  rate_limited?: boolean;
  /** safety.pii_exposure. */
  pii_exposure?: PiiExposure;
  /** safety.secrets_exposure. */
  secrets_exposure?: SecretsExposure;
  /** safety.human_approval_required — REQUIRED true when side_effect_class === "destructive". */
  human_approval_required?: boolean;
  /** safety.refusal_modes. */
  refusal_modes?: string[];
  /** tested_with entries. */
  tested_with?: ToolCard["tested_with"];
  /** performance metrics. */
  performance?: ToolCard["performance"];
  /** cost metrics. */
  cost?: ToolCard["cost"];
  /** audit metadata. */
  audit?: ToolCard["audit"];
}
