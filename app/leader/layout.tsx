import Link from "next/link";
import { ReactNode } from "react";
import { Trophy } from "lucide-react";
import { requireRole } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";

export default async function LeaderLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireRole(["LEADER"], "/leader");

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4 text-primary" />
              {user.name} · 队长端
            </p>
            <h1 className="mt-1 text-3xl font-semibold">队长端首页</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">首页</Link>
          </Button>
        </header>
        {children}
      </div>
    </main>
  );
}
