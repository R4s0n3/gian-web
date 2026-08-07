import type { Metadata } from "next";

import { CategoryArchive } from "@/app/_components/category-archive";
import { PublicSite } from "@/app/_components/public-site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Auftragsarbeiten",
  description: "Ausgewählte Auftragsarbeiten von Gian-Luca Blasius.",
};

export default function CommissionsPage() {
  return (
    <PublicSite>
      <CategoryArchive
        category="COMMISSION"
        emptyDescription="Noch sind keine Auftragsarbeiten veröffentlicht. Neue Arbeiten erscheinen hier, sobald sie bereit sind."
        emptyTitle="Das Archiv wird gerade zusammengestellt."
        eyebrow="Portfolio / Auftragsarbeiten"
        introduction="Auftragsarbeiten entstehen im Dialog mit Vorstellungen von Form, Motiv und Ort – als Gemälde ebenso wie als fotografische oder malerische Studien im Auftrag."
        title="Auftragsarbeiten"
      />
    </PublicSite>
  );
}
