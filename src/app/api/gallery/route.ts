import { NextResponse } from "next/server";

import { db } from "@/server/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const artworks = await db.galleryPost.findMany({
      where: { published: true },
      orderBy: [
        { featured: "desc" },
        { sortOrder: "asc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        description: true,
        imageUrl: true,
        imageAlt: true,
        medium: true,
        dimensions: true,
        year: true,
        featured: true,
        sortOrder: true,
        publishedAt: true,
      },
    });

    return NextResponse.json(artworks, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Could not load public gallery", error);
    return NextResponse.json(
      { error: "Die Galerie ist vorübergehend nicht verfügbar" },
      { status: 503 },
    );
  }
}
