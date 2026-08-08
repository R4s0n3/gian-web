"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type MobileMenuLink = { href: string; label: string };

export function MobileMenu({ navigation }: { navigation: MobileMenuLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((value) => !value), []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  return (
    <div className={open ? "mobile-menu is-open" : "mobile-menu"} ref={rootRef}>
      <button
        type="button"
        className="mobile-menu__toggle"
        aria-controls="mobile-navigation"
        aria-expanded={open}
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        onClick={toggle}
      >
        <span className="mobile-menu__bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="mobile-menu__label">Menü</span>
      </button>

      <div id="mobile-navigation" className="mobile-menu__panel" inert={!open}>
        <nav aria-label="Hauptnavigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "is-active" : undefined}
                aria-current={isActive ? "page" : undefined}
                onClick={close}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
