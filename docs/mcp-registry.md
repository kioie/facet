# MCP Registry

Facet ships a [`server.json`](../server.json) manifest for the [MCP Registry](https://registry.modelcontextprotocol.io).

**Registry name:** `io.github.kioie/facet`  
**npm package:** `@kioie/facet`

## Validate

```bash
facet registry validate
# or
mcp-publisher validate server.json
```

## Publish

Publishing requires the official [mcp-publisher](https://github.com/modelcontextprotocol/registry) CLI and a GitHub-authenticated login.

```bash
# One-time auth (opens browser)
mcp-publisher login

# Publish current server.json
facet registry publish
# or
mcp-publisher publish server.json
```

After publishing, bump `version` in both `package.json` and `server.json` before the next release.

## Schema

Facet uses the `2025-12-11` server.json schema with:

- npm stdio transport via `npx @kioie/facet mcp`
- GitHub repository metadata for source verification
- `runtimeHint: npx` for package resolution

See the [schema changelog](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/CHANGELOG.md) when upgrading.
