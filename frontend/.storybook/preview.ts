import type { Preview } from "@storybook/react";
import "../src/ui-foundation.css";
import "../src/styles.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
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
