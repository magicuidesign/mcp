# @magicuidesign/mcp

[![npm version](https://badge.fury.io/js/@magicuidesign%2Fmcp.svg?icon=si%3Anpm)](https://badge.fury.io/js/@magicuidesign%2Fmcp)

Official ModelContextProtocol (MCP) server for [Magic UI](https://magicui.design/).

<div align="center">
  <img src="https://github.com/magicuidesign/mcp/blob/main/public/mcp.png" alt="MCP" />
</div>

## Install MCP configuration

```bash
npx @magicuidesign/cli@latest install <client>
```

### Supported Clients

- [x] cursor
- [x] windsurf
- [x] claude
- [x] cline
- [x] roo-cline

## Manual Installation

Add to your IDE's MCP config:

```json
{
  "mcpServers": {
    "magicuidesign-mcp": {
      "command": "npx",
      "args": ["-y", "@magicuidesign/mcp@latest"]
    }
  }
}
```

## Example Usage

Once configured, you can questions like:

> "Make a marquee of logos"

> "Add a blur fade text animation"

> "Add a grid background"

## Available Tools

The server provides the following tools callable via MCP:

| Tool Name       | Description                                                                                                                                                                                                                                                                                                                                                                                             |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `listRegistryItems` | Lists Magic UI registry items with optional filters like `kind`, `query`, `limit`, and `offset`. Recommended for discovery. |
| `searchRegistryItems` | Searches Magic UI registry items by keyword or use case and returns ranked matches with pagination support. Recommended for discovery. |
| `getRegistryItem` | Returns details for a single registry item, including install instructions and optional source, related items, and examples. Recommended for direct lookup. |

## MCP Limitations

Some clients have a [limit](https://docs.cursor.com/context/model-context-protocol#limitations) on the number of tools they can call. The server keeps a small generic tool surface and reads directly from the live Magic UI registry, rather than relying on hardcoded category buckets.

## Credits

Big thanks to [@beaubhp](https://github.com/beaubhp) for creating the MCP server 🙏

[MIT](https://github.com/magicuidesign/mcp/blob/main/LICENSE.md)
