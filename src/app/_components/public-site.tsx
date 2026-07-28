import type { ReactNode } from "react";

import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";

export function PublicSite({ children }: { children: ReactNode }) {
  return (
    <div className="public-site">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
