import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "XIV Congreso Pineda 2026";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f4f8fb",
          backgroundImage: "linear-gradient(to bottom right, #f4f8fb 0%, #e0ebf5 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.6)",
            border: "2px solid rgba(255, 255, 255, 0.8)",
            borderRadius: 40,
            padding: "80px 100px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Logo */}
          <img
            src="https://congresopineda.vercel.app/images/logo-congreso-pineda.png"
            alt="Congreso Pineda Logo"
            width={600}
            style={{ marginBottom: 40 }}
          />

          {/* Text Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 15,
            }}
          >
            <h1
              style={{
                fontSize: 60,
                fontWeight: 800,
                color: "#0b2545",
                margin: 0,
                textAlign: "center",
                letterSpacing: "-0.03em",
              }}
            >
              XIV Congreso Pineda
            </h1>
            <p
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: "#2f80ed",
                margin: 0,
              }}
            >
              Inscripciones Abiertas
            </p>
            <p
              style={{
                fontSize: 24,
                fontWeight: 500,
                color: "#7a8aa3",
                margin: 0,
                marginTop: 20,
              }}
            >
              2 al 6 de noviembre de 2026 · Barquisimeto
            </p>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
