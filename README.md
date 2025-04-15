# @magicuidesign/mcp

[![npm version](https://badge.fury.io/js/%40magicuidesign%2Fmcp.svg)](https://badge.fury.io/js/%40magicuidesign%2Fmcp)

Official ModelContextProtocol (MCP) server for [Magic UI](https://magicui.design/).

This server enables AI assistants like Cursor to access information about Magic UI components, including lists of available components and their implementation details.

## Features

*   Get a list of all available Magic UI components.
*   Retrieve implementation details and code examples for specific components across various categories (Core, Special Effects, Animations, Text, Buttons, Backgrounds, Device Mocks).

## Setup with Cursor

1.  **Install Cursor:** Ensure you have the Cursor IDE installed.
2.  **Configure Cursor's MCP:** You need to tell Cursor how to run your MCP server.
    *   Locate or create the MCP configuration file. On macOS/Linux, this is typically at `~/.cursor/mcp.json`. On Windows, it might be `%USERPROFILE%\.cursor\mcp.json`.
    *   Edit the `mcp.json` file.
        *   **If the file doesn't exist or is empty:** Create it with the following content:
            ```json
            {
              "mcpServers": {
                "magicui-mcp": {
                  "command": "npx",
                  "args": [
                    "-y",
                    "@magicuidesign/mcp"
                  ]
                }
              }
            }
            ```
        *   **If the file exists and has other servers:** Add the `magicui-mcp` block inside the existing `mcpServers` object:
            ```json
            {
              "mcpServers": {
                // ... other servers might be here ...
                "magicui-mcp": {
                  "command": "npx",
                  "args": [
                    "-y",
                    "@magicuidesign/mcp"
                  ]
                }
              }
            }
            ```
3.  **Restart Cursor:** Close and reopen Cursor to apply the changes.
4.  **Verify:** Look for the Magic UI tools (like `getUIComponents`, `getComponents`, etc.) being available in Cursor's AI chat interface or MCP status indicators.

***Note:** This setup relies on `npx` successfully fetching and running the *latest published version* of `@magicuidesign/mcp` from npm. Ensure you have published a version that includes the `#!/usr/bin/env node` shebang in the main script (`dist/server.js`) and has all necessary dependencies.*

## Example Usage in Cursor

Once configured, you can ask Cursor questions like:

> "List all Magic UI components using the `getUIComponents` tool."

> "Show me the implementation details for the Magic UI Marquee component using the `getComponents` tool."

> "Get the code for the Neon Gradient Card effect from Magic UI."

## Development Setup

### Running with Inspector

For development and debugging, you can use the MCP Inspector tool:

```bash
npx @modelcontextprotocol/inspector npx -y @magicuidesign/mcp
```

Visit the [Inspector documentation](https://docs.modelcontextprotocol.dev/mcp-inspector/introduction) for more details.

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone beaubhp/magicui-mcp
    cd magicui-mcp # Or your project directory name
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Build the project:** (Compiles TypeScript to JavaScript in `dist/`)
    ```bash
    npm run build
    ```
4.  **For development with auto-rebuilding:** (Requires `tsc-watch` or similar setup in `package.json`)
    ```bash
    npm run watch # Or: tsc -w
    ```
    *(You might need to add a `watch` script to your `package.json` if it doesn't exist: `"watch": "tsc -w"`)*

## Available Tools

The server provides the following tools callable via MCP:

*   `getUIComponents`: Provides a comprehensive list of all Magic UI components.
*   `getComponents`: Provides implementation details for core components (marquee, terminal, hero-video-dialog, bento-grid, animated-list, dock, globe, tweet-card, client-tweet-card, orbiting-circles, avatar-circles, icon-cloud, animated-circular-progress-bar, file-tree, code-comparison, script-copy-btn, scroll-progress, lens, pointer).
*   `getDeviceMocks`: Provides implementation details for device mock components (safari, iphone-15-pro, android).
*   `getSpecialEffects`: Provides implementation details for special effect components (animated-beam, border-beam, shine-border, magic-card, meteors, neon-gradient-card, confetti, particles, cool-mode, scratch-to-reveal).
*   `getAnimations`: Provides implementation details for animation components (blur-fade).
*   `getTextAnimations`: Provides implementation details for text animation components (text-animate, line-shadow-text, aurora-text, number-ticker, animated-shiny-text, animated-gradient-text, text-reveal, hyper-text, word-rotate, typing-animation, scroll-based-velocity, flip-text, box-reveal, sparkles-text, morphing-text, spinning-text).
*   `getButtons`: Provides implementation details for button components (rainbow-button, shimmer-button, shiny-button, interactive-hover-button, animated-subscribe-button, pulsating-button, ripple-button).
*   `getBackgrounds`: Provides implementation details for background components (warp-background, flickering-grid, animated-grid-pattern, retro-grid, ripple, dot-pattern, grid-pattern, interactive-grid-pattern).

## Installation (as a dependency)

While primarily intended as a standalone MCP server run via `npx`, you can also install it as a dependency if needed:

```bash
npm install @magicuidesign/mcp
```

**License:** ISC
