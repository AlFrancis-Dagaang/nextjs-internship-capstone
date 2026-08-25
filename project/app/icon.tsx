import { ImageResponse } from "next/og";
import { Layers } from "lucide-react";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 20,
        background: "transparent",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#0d9488", // Teal color matching your teal theme
      }}
    >
      <Layers size={24} />
    </div>,
    {
      ...size,
    },
  );
}
