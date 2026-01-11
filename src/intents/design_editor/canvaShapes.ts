type RectArgs = {
  top: number;
  left: number;
  width: number;
  height: number;
  color: string;
};

/**
 * Canva Apps SDK shapes are SVG-like paths + a required viewBox.
 * This returns a filled rectangle shape element.
 */
export function rectShape({ top, left, width, height, color }: RectArgs) {
  return {
    type: "shape" as const,
    top,
    left,
    width,
    height,
    // The shape's geometry lives in `paths` and must have a `viewBox`.
    paths: [
      {
        // Simple rectangle path (closed). Must start with M. No Q commands.
        d: `M 0 0 H ${width} V ${height} H 0 Z`,
        fill: { color },
      },
    ],
    viewBox: {
      top: 0,
      left: 0,
      width,
      height,
    },
  };
}
