import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { stamp } from "../src/stamp.js";
import type { StampOptions } from "../src/types.js";

const here = fileURLToPath(new URL(".", import.meta.url));

function load(name: string): StampOptions {
  return JSON.parse(readFileSync(`${here}/../fixtures/${name}`, "utf8")) as StampOptions;
}

describe("stamp", () => {
  it("builds a read-tool card from the search-vectorstore fixture", () => {
    const card = stamp(load("search-vectorstore.json"));
    expect(card.tool_card_version).toBe("0.1");
    expect(card.tool.server_id).toBe("kg-research-mcp");
    expect(card.tool.name).toBe("search-vectorstore");
    expect(card.safety.side_effect_class).toBe("read");
    expect(card.safety.pii_exposure).toBe("low");
    expect(card.performance?.p50_latency_ms).toBe(90);
    expect(card.cost?.per_call_usd).toBe(0.0001);
    expect(card.schema.input_schema_inline).toBeDefined();
  });

  it("builds a destructive-tool card when human_approval_required=true", () => {
    const card = stamp(load("destructive-reset.json"));
    expect(card.safety.side_effect_class).toBe("destructive");
    expect(card.safety.human_approval_required).toBe(true);
    expect(card.safety.external_systems).toContain("primary-postgres");
    expect(card.audit?.incident_response_uri).toContain("kineticgain.com");
  });

  it("rejects destructive without human_approval_required (allOf clause)", () => {
    const opts = load("destructive-reset.json");
    delete opts.human_approval_required;
    expect(() => stamp(opts)).toThrow(/human_approval_required/);
    opts.human_approval_required = false;
    expect(() => stamp(opts)).toThrow(/human_approval_required/);
  });

  it("rejects invalid server_id or name (non-kebab-case or < 2 chars)", () => {
    const opts = load("search-vectorstore.json");
    opts.server_id = "Bad_Name!";
    expect(() => stamp(opts)).toThrow(/server_id/);
    const opts2 = load("search-vectorstore.json");
    opts2.name = "x";
    expect(() => stamp(opts2)).toThrow(/tool.name/);
  });

  it("rejects invalid version", () => {
    const opts = load("search-vectorstore.json");
    opts.version = "1.0";
    expect(() => stamp(opts)).toThrow(/semver/);
  });

  it("requires mcp_server_uri and description", () => {
    const opts = load("search-vectorstore.json");
    opts.mcp_server_uri = "";
    expect(() => stamp(opts)).toThrow(/mcp_server_uri/);
    const opts2 = load("search-vectorstore.json");
    opts2.description = "";
    expect(() => stamp(opts2)).toThrow(/description/);
  });

  it("rejects schema with neither inline nor URI", () => {
    const opts = load("search-vectorstore.json");
    delete opts.input_schema_inline;
    expect(() => stamp(opts)).toThrow(/input_schema_inline or input_schema_uri/);
  });

  it("rejects schema with both inline AND URI", () => {
    const opts = load("search-vectorstore.json");
    opts.input_schema_uri = "https://example.com/schema.json";
    expect(() => stamp(opts)).toThrow(/only one/);
  });

  it("accepts a schema with only input_schema_uri", () => {
    const opts = load("search-vectorstore.json");
    delete opts.input_schema_inline;
    opts.input_schema_uri = "https://example.com/schema.json";
    const card = stamp(opts);
    expect(card.schema.input_schema_uri).toBe("https://example.com/schema.json");
    expect(card.schema.input_schema_inline).toBeUndefined();
  });

  it("rejects invalid side_effect_class", () => {
    const opts = load("search-vectorstore.json");
    (opts as unknown as { side_effect_class: string }).side_effect_class = "weird";
    expect(() => stamp(opts)).toThrow(/side_effect_class/);
  });

  it("rejects invalid pii_exposure", () => {
    const opts = load("search-vectorstore.json");
    (opts as unknown as { pii_exposure: string }).pii_exposure = "critical";
    expect(() => stamp(opts)).toThrow(/pii_exposure/);
  });

  it("rejects invalid secrets_exposure", () => {
    const opts = load("search-vectorstore.json");
    (opts as unknown as { secrets_exposure: string }).secrets_exposure = "leaks_everything";
    expect(() => stamp(opts)).toThrow(/secrets_exposure/);
  });

  it("emits a card that matches v0.1 envelope shape", () => {
    const card = stamp(load("search-vectorstore.json"));
    expect(card.tool_card_version).toBe("0.1");
    expect(card.tool).toBeDefined();
    expect(card.schema).toBeDefined();
    expect(card.safety).toBeDefined();
  });

  it("omits empty optional arrays + missing optional sections", () => {
    const card = stamp({
      server_id: "minimal-server",
      name: "ping",
      version: "1.0.0",
      mcp_server_uri: "https://example.com/mcp",
      description: "Health check",
      side_effect_class: "read",
      input_schema_inline: { type: "object" }
    });
    expect(card.safety.external_systems).toBeUndefined();
    expect(card.safety.refusal_modes).toBeUndefined();
    expect(card.tested_with).toBeUndefined();
    expect(card.performance).toBeUndefined();
    expect(card.cost).toBeUndefined();
    expect(card.audit).toBeUndefined();
  });

  it("passes through tested_with, performance, cost, audit when provided", () => {
    const card = stamp({
      server_id: "x-server",
      name: "x-tool",
      version: "1.0.0",
      mcp_server_uri: "https://example.com/mcp",
      description: "X",
      side_effect_class: "read",
      input_schema_inline: { type: "object" },
      tested_with: [{ llm: "claude-opus-4", pass_rate: 1.0 }],
      audit: { log_uri: "https://audit/x", retention_days: 365 }
    });
    expect(card.tested_with).toHaveLength(1);
    expect(card.audit?.retention_days).toBe(365);
  });

  it("supports refusal_modes pass-through", () => {
    const card = stamp({
      server_id: "x-server",
      name: "x-tool",
      version: "1.0.0",
      mcp_server_uri: "https://example.com/mcp",
      description: "X",
      side_effect_class: "external",
      input_schema_inline: { type: "object" },
      refusal_modes: ["rate_limited", "unauthenticated"]
    });
    expect(card.safety.refusal_modes).toContain("rate_limited");
  });

  it("preserves false / 0 values for boolean and numeric safety fields", () => {
    const card = stamp({
      server_id: "x-server",
      name: "x-tool",
      version: "1.0.0",
      mcp_server_uri: "https://example.com/mcp",
      description: "X",
      side_effect_class: "read",
      input_schema_inline: { type: "object" },
      reversible: false,
      rate_limited: false,
      human_approval_required: false
    });
    expect(card.safety.reversible).toBe(false);
    expect(card.safety.rate_limited).toBe(false);
    expect(card.safety.human_approval_required).toBe(false);
  });
});
