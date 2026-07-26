import { redirect } from "next/navigation";

import { AdminSidebar } from "@/app/admin/_components/admin-sidebar";
import { auth } from "@/server/auth";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/admin/login?callbackUrl=/admin");
  }

  return (
    <div className="admin-layout">
      <AdminSidebar email={session.user.email ?? "Administrator"} />
      <main className="admin-main" id="main-content">
        {children}
      </main>
    </div>
  );
}
