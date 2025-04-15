# @magicuidesign/mcp

[![npm version](https://badge.fury.io/js/%40magicuidesign%2Fmcp.svg)](https://badge.fury.io/js/%40magicuidesign%2Fmcp)

Official ModelContextProtocol (MCP) server for [Magic UI](https://magicui.design/).

This server enables AI assistants like Cursor to access information about Magic UI components, including lists of available components and their implementation details.

## Features

*   Get a list of all available Magic UI components.
*   Retrieve implementation details and code examples for specific components across various categories (Core, Special Effects, Animations, Text, Buttons, Backgrounds, Device Mocks).

## Setup with Cursor (or Claude Desktop)

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
    git clone magicuidesign/mcp
    cd mcp # Or your project directory name
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
*   `getComponents`: Provides implementation details for core components ([marquee](https://magicui.design/docs/components/marquee), [terminal](https://magicui.design/docs/components/terminal), [hero-video-dialog](https://magicui.design/docs/components/hero-video-dialog), [bento-grid](https://magicui.design/docs/components/bento-grid), [animated-list](https://magicui.design/docs/components/animated-list), [dock](https://magicui.design/docs/components/dock), [globe](https://magicui.design/docs/components/globe), [tweet-card](https://magicui.design/docs/components/tweet-card), [client-tweet-card](https://magicui.design/docs/components/client-tweet-card), [orbiting-circles](https://magicui.design/docs/components/orbiting-circles), [avatar-circles](https://magicui.design/docs/components/avatar-circles), [icon-cloud](https://magicui.design/docs/components/icon-cloud), [animated-circular-progress-bar](https://magicui.design/docs/components/animated-circular-progress-bar), [file-tree](https://magicui.design/docs/components/file-tree), [code-comparison](https://magicui.design/docs/components/code-comparison), [script-copy-btn](https://magicui.design/docs/components/script-copy-btn), [scroll-progress](https://magicui.design/docs/components/scroll-progress), [lens](https://magicui.design/docs/components/lens), [pointer](https://magicui.design/docs/components/pointer)).
*   `getDeviceMocks`: Provides implementation details for device mock components ([safari](https://magicui.design/docs/components/safari), [iphone-15-pro](https://magicui.design/docs/components/iphone-15-pro), [android](https://magicui.design/docs/components/android)).
*   `getSpecialEffects`: Provides implementation details for special effect components ([animated-beam](https://magicui.design/docs/components/animated-beam), [border-beam](https://magicui.design/docs/components/border-beam), [shine-border](https://magicui.design/docs/components/shine-border), [magic-card](https://magicui.design/docs/components/magic-card), [meteors](https://magicui.design/docs/components/meteors), [neon-gradient-card](https://magicui.design/docs/components/neon-gradient-card), [confetti](https://magicui.design/docs/components/confetti), [particles](https://magicui.design/docs/components/particles), [cool-mode](https://magicui.design/docs/components/cool-mode), [scratch-to-reveal](https://magicui.design/docs/components/scratch-to-reveal)).
*   `getAnimations`: Provides implementation details for animation components ([blur-fade](https://magicui.design/docs/components/blur-fade)).
*   `getTextAnimations`: Provides implementation details for text animation components ([text-animate](https://magicui.design/docs/components/text-animate), [line-shadow-text](https://magicui.design/docs/components/line-shadow-text), [aurora-text](https://magicui.design/docs/components/aurora-text), [number-ticker](https://magicui.design/docs/components/number-ticker), [animated-shiny-text](https://magicui.design/docs/components/animated-shiny-text), [animated-gradient-text](https://magicui.design/docs/components/animated-gradient-text), [text-reveal](https://magicui.design/docs/components/text-reveal), [hyper-text](https://magicui.design/docs/components/hyper-text), [word-rotate](https://magicui.design/docs/components/word-rotate), [typing-animation](https://magicui.design/docs/components/typing-animation), [scroll-based-velocity](https://magicui.design/docs/components/scroll-based-velocity), [flip-text](https://magicui.design/docs/components/flip-text), [box-reveal](https://magicui.design/docs/components/box-reveal), [sparkles-text](https://magicui.design/docs/components/sparkles-text), [morphing-text](https://magicui.design/docs/components/morphing-text), [spinning-text](https://magicui.design/docs/components/spinning-text)).
*   `getButtons`: Provides implementation details for button components ([rainbow-button](https://magicui.design/docs/components/rainbow-button), [shimmer-button](https://magicui.design/docs/components/shimmer-button), [shiny-button](https://magicui.design/docs/components/shiny-button), [interactive-hover-button](https://magicui.design/docs/components/interactive-hover-button), [animated-subscribe-button](https://magicui.design/docs/components/animated-subscribe-button), [pulsating-button](https://magicui.design/docs/components/pulsating-button), [ripple-button](https://magicui.design/docs/components/ripple-button)).
*   `getBackgrounds`: Provides implementation details for background components ([warp-background](https://magicui.design/docs/components/warp-background), [flickering-grid](https://magicui.design/docs/components/flickering-grid), [animated-grid-pattern](https://magicui.design/docs/components/animated-grid-pattern), [retro-grid](https://magicui.design/docs/components/retro-grid), [ripple](https://magicui.design/docs/components/ripple), [dot-pattern](https://magicui.design/docs/components/dot-pattern), [grid-pattern](https://magicui.design/docs/components/grid-pattern), [interactive-grid-pattern](https://magicui.design/docs/components/interactive-grid-pattern)).

## Installation (as a dependency)

While primarily intended as a standalone MCP server run via `npx`, you can also install it as a dependency if needed:

```bash
npm install @magicuidesign/mcp
```

ISC
