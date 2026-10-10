import { ImageResponse } from "next/og";

const SIZES = new Set([180, 192, 512]);

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }): Promise<Response> {
  const size = Number((await params).size);
  if (!SIZES.has(size)) return new Response(null, { status: 404 });
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f766e", color: "#ffffff", fontSize: size * 0.56, fontWeight: 700 }}>M</div>
    ),
    { width: size, height: size },
  );
}
