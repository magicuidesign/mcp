export const componentCategories = {
  Layout: [
    "bento-grid",
    "dock",
    "file-tree",
    "grid-pattern",
    "interactive-grid-pattern",
    "dot-pattern",
  ],
  Media: [
    "hero-video-dialog",
    "terminal",
    "marquee",
    "script-copy-btn",
    "code-comparison",
  ],
  Motion: [
    "blur-fade",
    "scroll-progress",
    "scroll-based-velocity",
    "orbiting-circles",
    "animated-circular-progress-bar",
  ],
  TextReveal: [
    "text-animate",
    "line-shadow-text",
    "aurora-text",
    "animated-shiny-text",
    "animated-gradient-text",
    "text-reveal",
    "typing-animation",
    "box-reveal",
    "number-ticker",
  ],
  TextEffects: [
    "word-rotate",
    "flip-text",
    "hyper-text",
    "morphing-text",
    "spinning-text",
    "sparkles-text",
  ],
  Buttons: [
    "rainbow-button",
    "shimmer-button",
    "shiny-button",
    "interactive-hover-button",
    "animated-subscribe-button",
    "pulsating-button",
    "ripple-button",
  ],
  Effects: [
    "animated-beam",
    "border-beam",
    "shine-border",
    "magic-card",
    "meteors",
    "neon-gradient-card",
    "confetti",
    "particles",
    "cool-mode",
    "scratch-to-reveal",
  ],
  Widgets: [
    "animated-list",
    "tweet-card",
    "client-tweet-card",
    "lens",
    "pointer",
    "avatar-circles",
    "icon-cloud",
    "globe",
  ],
  Backgrounds: [
    "warp-background",
    "flickering-grid",
    "animated-grid-pattern",
    "retro-grid",
    "ripple",
  ],
  Devices: [
    "safari",
    "iphone-15-pro",
    "android",
  ],
} as const satisfies Record<string, readonly string[]>;

export type ComponentCategoryName = keyof typeof componentCategories;

export function getComponentCategoryNames(): ComponentCategoryName[] {
  return Object.keys(componentCategories) as ComponentCategoryName[];
}
