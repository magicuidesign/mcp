# @magicuidesign/mcp

[![npm version](https://badge.fury.io/js/%40magicuidesign%2Fmcp.svg)](https://badge.fury.io/js/%40magicuidesign%2Fmcp)

Official ModelContextProtocol (MCP) server for [Magic UI](https://magicui.design/).

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
    "@magicuidesign/mcp": {
      "command": "npx",
      "args": ["-y", "@magicuidesign/mcp"]
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

- `getUIComponents`: Provides a comprehensive list of all Magic UI components.
- `getComponents`: Provides implementation details for core components ([marquee](https://magicui.design/docs/components/marquee), [terminal](https://magicui.design/docs/components/terminal), [hero-video-dialog](https://magicui.design/docs/components/hero-video-dialog), [bento-grid](https://magicui.design/docs/components/bento-grid), [animated-list](https://magicui.design/docs/components/animated-list), [dock](https://magicui.design/docs/components/dock), [globe](https://magicui.design/docs/components/globe), [tweet-card](https://magicui.design/docs/components/tweet-card), [client-tweet-card](https://magicui.design/docs/components/client-tweet-card), [orbiting-circles](https://magicui.design/docs/components/orbiting-circles), [avatar-circles](https://magicui.design/docs/components/avatar-circles), [icon-cloud](https://magicui.design/docs/components/icon-cloud), [animated-circular-progress-bar](https://magicui.design/docs/components/animated-circular-progress-bar), [file-tree](https://magicui.design/docs/components/file-tree), [code-comparison](https://magicui.design/docs/components/code-comparison), [script-copy-btn](https://magicui.design/docs/components/script-copy-btn), [scroll-progress](https://magicui.design/docs/components/scroll-progress), [lens](https://magicui.design/docs/components/lens), [pointer](https://magicui.design/docs/components/pointer)).
- `getDeviceMocks`: Provides implementation details for device mock components ([safari](https://magicui.design/docs/components/safari), [iphone-15-pro](https://magicui.design/docs/components/iphone-15-pro), [android](https://magicui.design/docs/components/android)).
- `getSpecialEffects`: Provides implementation details for special effect components ([animated-beam](https://magicui.design/docs/components/animated-beam), [border-beam](https://magicui.design/docs/components/border-beam), [shine-border](https://magicui.design/docs/components/shine-border), [magic-card](https://magicui.design/docs/components/magic-card), [meteors](https://magicui.design/docs/components/meteors), [neon-gradient-card](https://magicui.design/docs/components/neon-gradient-card), [confetti](https://magicui.design/docs/components/confetti), [particles](https://magicui.design/docs/components/particles), [cool-mode](https://magicui.design/docs/components/cool-mode), [scratch-to-reveal](https://magicui.design/docs/components/scratch-to-reveal)).
- `getAnimations`: Provides implementation details for animation components ([blur-fade](https://magicui.design/docs/components/blur-fade)).
- `getTextAnimations`: Provides implementation details for text animation components ([text-animate](https://magicui.design/docs/components/text-animate), [line-shadow-text](https://magicui.design/docs/components/line-shadow-text), [aurora-text](https://magicui.design/docs/components/aurora-text), [number-ticker](https://magicui.design/docs/components/number-ticker), [animated-shiny-text](https://magicui.design/docs/components/animated-shiny-text), [animated-gradient-text](https://magicui.design/docs/components/animated-gradient-text), [text-reveal](https://magicui.design/docs/components/text-reveal), [hyper-text](https://magicui.design/docs/components/hyper-text), [word-rotate](https://magicui.design/docs/components/word-rotate), [typing-animation](https://magicui.design/docs/components/typing-animation), [scroll-based-velocity](https://magicui.design/docs/components/scroll-based-velocity), [flip-text](https://magicui.design/docs/components/flip-text), [box-reveal](https://magicui.design/docs/components/box-reveal), [sparkles-text](https://magicui.design/docs/components/sparkles-text), [morphing-text](https://magicui.design/docs/components/morphing-text), [spinning-text](https://magicui.design/docs/components/spinning-text)).
- `getButtons`: Provides implementation details for button components ([rainbow-button](https://magicui.design/docs/components/rainbow-button), [shimmer-button](https://magicui.design/docs/components/shimmer-button), [shiny-button](https://magicui.design/docs/components/shiny-button), [interactive-hover-button](https://magicui.design/docs/components/interactive-hover-button), [animated-subscribe-button](https://magicui.design/docs/components/animated-subscribe-button), [pulsating-button](https://magicui.design/docs/components/pulsating-button), [ripple-button](https://magicui.design/docs/components/ripple-button)).
- `getBackgrounds`: Provides implementation details for background components ([warp-background](https://magicui.design/docs/components/warp-background), [flickering-grid](https://magicui.design/docs/components/flickering-grid), [animated-grid-pattern](https://magicui.design/docs/components/animated-grid-pattern), [retro-grid](https://magicui.design/docs/components/retro-grid), [ripple](https://magicui.design/docs/components/ripple), [dot-pattern](https://magicui.design/docs/components/dot-pattern), [grid-pattern](https://magicui.design/docs/components/grid-pattern), [interactive-grid-pattern](https://magicui.design/docs/components/interactive-grid-pattern)).

## MCP Limitations

Some clients have a [limit](https://docs.cursor.com/context/model-context-protocol#limitations) on the number of tools they can call. This is why we opted to group the tools into categories.
