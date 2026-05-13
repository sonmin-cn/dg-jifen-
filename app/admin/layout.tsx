import Link from "next/link";
import { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { ADMIN_ROLES, requireRole } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireRole(ADMIN_ROLES, "/admin");

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {user.name} · {user.role}
            </p>
            <h1 className="mt-1 text-3xl font-semibold">管理后台</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/">首页</Link>
            </Button>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
