import type { Metadata } from "next";

import { CategoryArchive } from "@/app/_components/category-archive";
import { PublicSite } from "@/app/_components/public-site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fotografien",
  description:
    "Ausgewählte Fotografien und fotografische Arbeiten von Gian-Luca Blasius.",
};

export default function PhotographyPage() {
  return (
    <PublicSite>
      <CategoryArchive
        category="PHOTOGRAPHY"
        emptyDescription="Noch sind keine Fotografien veröffentlicht. Neue Arbeiten erscheinen hier, sobald sie bereit sind."
        emptyTitle="Das Archiv wird gerade zusammengestellt."
        eyebrow="Portfolio / Fotografien"
        introduction="Fotografische Beobachtungen von Licht, Körper, Struktur und Landschaft – als eigenständige Arbeiten und fortlaufende Spuren des Studios."
        title="Fotografien"
      />
    </PublicSite>
  );
}
