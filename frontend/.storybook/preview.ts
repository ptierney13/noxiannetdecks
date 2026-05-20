import type { Preview } from "@storybook/react";
import "../src/ui-foundation.css";
import "../src/styles.css";

const VIEWPORTS = {
  mobile:           { name: "Mobile (393px)",          styles: { width: "393px",  height: "852px" } },
  "desktop-small":  { name: "Desktop Small (700px)",   styles: { width: "700px",  height: "900px" } },
  "nav-items-edge": { name: "Nav Items Edge (767px)",  styles: { width: "767px",  height: "900px" } },
  desktop:          { name: "Desktop (900px)",          styles: { width: "900px",  height: "900px" } },
  "desktop-wide":   { name: "Desktop Wide (1280px)",   styles: { width: "1280px", height: "900px" } },
};

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    viewport: {
      viewports: VIEWPORTS,
    },
    controls: {
      expanded: true
    },
    backgrounds: {
      default: "app",
      values: [
        { name: "app", value: "#040508" },
        { name: "panel", value: "#0a0d14" }
      ]
    }
  }
};

export default preview;
