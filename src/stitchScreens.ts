export type StitchScreen = {
  id: string;
  screenId: string;
  title: string;
  subtitle: string;
  htmlPath: string;
  screenshotPath: string;
  frameHeight: number;
};

export const stitchScreens: StitchScreen[] = [
  {
    id: "dashboard-home",
    screenId: "cdfac24b8fec4f88a45ddcac5f1b9e9c",
    title: "Dashboard (Home)",
    subtitle: "Digital Oracle command center for market state, price action, and AI signals.",
    htmlPath: "/stitch/dashboard-home.html",
    screenshotPath: "/stitch/screenshots/dashboard-home.png",
    frameHeight: 1238,
  },
  {
    id: "ai-explainability-panel",
    screenId: "b093055bc0d0434b8aa313d391b5d004",
    title: "AI Explainability Panel",
    subtitle: "Decision trace view for model reasoning, tool flow, and execution confidence.",
    htmlPath: "/stitch/ai-explainability-panel.html",
    screenshotPath: "/stitch/screenshots/ai-explainability-panel.png",
    frameHeight: 1332,
  },
  {
    id: "portfolio-page",
    screenId: "c4f8d6dd237f4850b50f95bba5afd9a8",
    title: "Portfolio Page",
    subtitle: "Portfolio intelligence surface for holdings, trajectory, and allocation context.",
    htmlPath: "/stitch/portfolio-page.html",
    screenshotPath: "/stitch/screenshots/portfolio-page.png",
    frameHeight: 1382,
  },
  {
    id: "alerts-events-panel",
    screenId: "84267882cea245fabe8358d27f57114d",
    title: "Alerts & Events Panel",
    subtitle: "Real-time event stream combining AI alerts, news pressure, and execution prompts.",
    htmlPath: "/stitch/alerts-events-panel.html",
    screenshotPath: "/stitch/screenshots/alerts-events-panel.png",
    frameHeight: 1227,
  },
];
