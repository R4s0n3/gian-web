import { db } from "@/server/db";
import { getR2PortfolioPdf } from "@/server/r2";
import { isPortfolioPdfKey, PORTFOLIO_DOWNLOAD_NAME } from "@/lib/portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: "primary" },
      select: { portfolioPdfKey: true },
    });
    if (
      !settings?.portfolioPdfKey ||
      !isPortfolioPdfKey(settings.portfolioPdfKey)
    ) {
      return new Response("Noch kein Portfolio verfügbar.", {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    }
    const file = await getR2PortfolioPdf(settings.portfolioPdfKey);
    if (!file.Body) throw new Error("Portfolio file has no body");
    return new Response(file.Body.transformToWebStream(), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${PORTFOLIO_DOWNLOAD_NAME}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Portfolio download failed", error);
    return new Response(
      "Das Portfolio ist gerade nicht verfügbar. Bitte versuche es später erneut.",
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
