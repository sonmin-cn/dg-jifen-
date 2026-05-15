import Link from "next/link";
import { ReactNode } from "react";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function LeaderLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-5 md:px-6 md:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4 text-primary" />
              队长端
            </p>
            <h1 className="mt-1 text-2xl font-semibold md:text-3xl">队长积分中心</h1>
          </div>
          <Button className="h-11 w-full sm:w-auto" variant="outline" asChild>
            <Link href="/">首页</Link>
          </Button>
        </header>
        {children}
      </div>
    </main>
  );
}
