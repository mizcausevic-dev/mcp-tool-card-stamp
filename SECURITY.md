# Security Policy

`mcp-tool-card-stamp` is a pure-transform library and CLI: it reads a JSON struct and emits a JSON card. No network listener, no remote fetch, no execution of user-supplied code, no live MCP server invocation.

The input may include internal MCP server URIs, audit log URIs, incident-response URIs, and tool descriptions that are sensitive in your environment. The output card includes those values verbatim — be deliberate about where you publish the stamped card.

## Supported versions

Only the latest tagged release is supported.

## Reporting a vulnerability

Please use GitHub Security Advisories for private disclosure:

- [Open a security advisory](https://github.com/mizcausevic-dev/mcp-tool-card-stamp/security/advisories/new)

Do not file public issues for security reports.
