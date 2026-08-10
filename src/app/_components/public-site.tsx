import type { ReactNode } from "react";

import { SiteFooter } from "@/app/_components/site-footer";
import {
  SiteHeader,
  type SiteHeaderVariant,
} from "@/app/_components/site-header";

export function PublicSite({
  children,
  headerVariant = "default",
}: {
  children: ReactNode;
  headerVariant?: SiteHeaderVariant;
}) {
  return (
    <div
      className={
        headerVariant === "overlay"
          ? "public-site public-site--header-overlay"
          : "public-site"
      }
    >
      <SiteHeader variant={headerVariant} />
      {children}
      <SiteFooter />
    </div>
  );
}
