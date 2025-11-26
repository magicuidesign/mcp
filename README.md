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
| `getUIComponents` | Provides a comprehensive list of all Magic UI components.                                                                                                                                                                                                                                                                                                                                                     |
| `getLayout`       | Provides implementation details for [bento-grid](https://magicui.design/docs/components/bento-grid), [dock](https://magicui.design/docs/components/dock), [file-tree](https://magicui.design/docs/components/file-tree), [grid-pattern](https://magicui.design/docs/components/grid-pattern), [interactive-grid-pattern](https://magicui.design/docs/components/interactive-grid-pattern), [dot-pattern](https://magicui.design/docs/components/dot-pattern) components.         |
| `getMedia`        | Provides implementation details for [hero-video-dialog](https://magicui.design/docs/components/hero-video-dialog), [terminal](https://magicui.design/docs/components/terminal), [marquee](https://magicui.design/docs/components/marquee), [script-copy-btn](https://magicui.design/docs/components/script-copy-btn), [code-comparison](https://magicui.design/docs/components/code-comparison) components.                                                               |
| `getMotion`       | Provides implementation details for [blur-fade](https://magicui.design/docs/components/blur-fade), [scroll-progress](https://magicui.design/docs/components/scroll-progress), [scroll-based-velocity](https://magicui.design/docs/components/scroll-based-velocity), [orbiting-circles](https://magicui.design/docs/components/orbiting-circles), [animated-circular-progress-bar](https://magicui.design/docs/components/animated-circular-progress-bar) components. |
| `getTextReveal`   | Provides implementation details for [text-animate](https://magicui.design/docs/components/text-animate), [line-shadow-text](https://magicui.design/docs/components/line-shadow-text), [aurora-text](https://magicui.design/docs/components/aurora-text), [animated-shiny-text](https://magicui.design/docs/components/animated-shiny-text), [animated-gradient-text](https://magicui.design/docs/components/animated-gradient-text), [text-reveal](https://magicui.design/docs/components/text-reveal), [typing-animation](https://magicui.design/docs/components/typing-animation), [box-reveal](https://magicui.design/docs/components/box-reveal), [number-ticker](https://magicui.design/docs/components/number-ticker) components. |
| `getTextEffects`  | Provides implementation details for [word-rotate](https://magicui.design/docs/components/word-rotate), [flip-text](https://magicui.design/docs/components/flip-text), [hyper-text](https://magicui.design/docs/components/hyper-text), [morphing-text](https://magicui.design/docs/components/morphing-text), [spinning-text](https://magicui.design/docs/components/spinning-text), [sparkles-text](https://magicui.design/docs/components/sparkles-text) components.       |
| `getButtons`      | Provides implementation details for [rainbow-button](https://magicui.design/docs/components/rainbow-button), [shimmer-button](https://magicui.design/docs/components/shimmer-button), [shiny-button](https://magicui.design/docs/components/shiny-button), [interactive-hover-button](https://magicui.design/docs/components/interactive-hover-button), [animated-subscribe-button](https://magicui.design/docs/components/animated-subscribe-button), [pulsating-button](https://magicui.design/docs/components/pulsating-button), [ripple-button](https://magicui.design/docs/components/ripple-button) components. |
| `getEffects`      | Provides implementation details for [animated-beam](https://magicui.design/docs/components/animated-beam), [border-beam](https://magicui.design/docs/components/border-beam), [shine-border](https://magicui.design/docs/components/shine-border), [magic-card](https://magicui.design/docs/components/magic-card), [meteors](https://magicui.design/docs/components/meteors), [neon-gradient-card](https://magicui.design/docs/components/neon-gradient-card), [confetti](https://magicui.design/docs/components/confetti), [particles](https://magicui.design/docs/components/particles), [cool-mode](https://magicui.design/docs/components/cool-mode), [scratch-to-reveal](https://magicui.design/docs/components/scratch-to-reveal) components. |
| `getWidgets`      | Provides implementation details for [animated-list](https://magicui.design/docs/components/animated-list), [tweet-card](https://magicui.design/docs/components/tweet-card), [client-tweet-card](https://magicui.design/docs/components/client-tweet-card), [lens](https://magicui.design/docs/components/lens), [pointer](https://magicui.design/docs/components/pointer), [avatar-circles](https://magicui.design/docs/components/avatar-circles), [icon-cloud](https://magicui.design/docs/components/icon-cloud), [globe](https://magicui.design/docs/components/globe) components.                                |
| `getBackgrounds`  | Provides implementation details for [warp-background](https://magicui.design/docs/components/warp-background), [flickering-grid](https://magicui.design/docs/components/flickering-grid), [animated-grid-pattern](https://magicui.design/docs/components/animated-grid-pattern), [retro-grid](https://magicui.design/docs/components/retro-grid), [ripple](https://magicui.design/docs/components/ripple) components.                                                               |
| `getDevices`      | Provides implementation details for [safari](https://magicui.design/docs/components/safari), [iphone-15-pro](https://magicui.design/docs/components/iphone-15-pro), [android](https://magicui.design/docs/components/android) components.                                                                                                                                                            |

## MCP Limitations

Some clients have a [limit](https://docs.cursor.com/context/model-context-protocol#limitations) on the number of tools they can call. This is why we opted to group the tools into categories. Note: For more specific context on each component, run the MCP locally and modify the logic that groups the components.

## Credits

Big thanks to [@beaubhp](https://github.com/beaubhp) for creating the MCP server 🙏

[MIT](https://github.com/magicuidesign/mcp/blob/main/LICENSE.md)