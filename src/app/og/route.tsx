import React from "react";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title =
    searchParams.get("title") || "Bona — Collaborative Media Asset Management";
  const subtitle =
    searchParams.get("subtitle") || "Secure collaboration for teams";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "64px",
          background:
            "linear-gradient(135deg, #111827 0%, #0f172a 50%, #111827 100%)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 9999,
            background: "rgba(255,255,255,0.08)",
            color: "#e5e7eb",
            fontSize: 28,
            marginBottom: 24,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          bona.app
        </div>
        <div
          style={{
            color: "#f9fafb",
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -1.5,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: "#e5e7eb",
            fontSize: 32,
            marginTop: 18,
            maxWidth: 1000,
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
