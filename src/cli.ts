#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { stamp } from "./stamp.js";
import type { StampOptions } from "./types.js";

interface Args {
  configFile?: string;
  out?: string;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") args.help = true;
    else if (a === "--out") args.out = argv[++i];
    else if (!a.startsWith("-")) args.configFile = a;
    else throw new Error(`Unknown option: ${a}`);
  }
  return args;
}

const HELP = `mcp-tool-card-stamp — build and validate a minimal MCP Tool Card

Usage:
  mcp-tool-card-stamp <stamp-options.json> [--out card.json]

Reads a StampOptions JSON file and emits a spec-conforming Tool Card v0.1.

Required fields in <stamp-options.json>:
  server_id, name, version, mcp_server_uri, description,
  side_effect_class, and exactly one of input_schema_inline or input_schema_uri

The spec requires:
  - server_id and name kebab-case
  - version semver
  - side_effect_class ∈ {read, mutating, external, destructive}
  - **side_effect_class=destructive → human_approval_required: true** (allOf)

Exit codes:
  0 — card written
  2 — usage / validation error`;

export function run(argv: string[]): number {
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    return 2;
  }
  if (args.help || !args.configFile) {
    process.stdout.write(`${HELP}\n`);
    return args.help ? 0 : 2;
  }

  let opts: StampOptions;
  try {
    opts = JSON.parse(readFileSync(args.configFile, "utf8")) as StampOptions;
  } catch (e) {
    process.stderr.write(`error reading config: ${(e as Error).message}\n`);
    return 2;
  }

  let card;
  try {
    card = stamp(opts);
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    return 2;
  }

  const json = JSON.stringify(card, null, 2);
  if (args.out) writeFileSync(args.out, `${json}\n`, "utf8");
  else process.stdout.write(`${json}\n`);
  return 0;
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  try {
    process.exit(run(process.argv.slice(2)));
  } catch (e) {
    process.stderr.write(`fatal: ${(e as Error).message}\n`);
    process.exit(2);
  }
}
