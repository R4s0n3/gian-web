import type { Metadata } from "next";

import { CategoryArchive } from "@/app/_components/category-archive";
import { PublicSite } from "@/app/_components/public-site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gemälde",
  description:
    "Ausgewählte Gemälde und Originalarbeiten von Gian-Luca Blasius.",
};

export default function PaintingsPage() {
  return (
    <PublicSite>
      <CategoryArchive
        category="PAINTING"
        emptyDescription="Noch sind keine Gemälde veröffentlicht. Neue Arbeiten erscheinen hier, sobald sie bereit sind."
        emptyTitle="Das Archiv wird gerade zusammengestellt."
        eyebrow="Portfolio / Gemälde"
        introduction="Ausgewählte Originalarbeiten auf Leinwand, Holz und Papier – geprägt von Material, Geste und der Spur ihres Entstehens."
        title="Gemälde"
      />
    </PublicSite>
  );
}
