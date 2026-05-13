import Link from "next/link";
import { ArrowRight, ShieldCheck, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            内部管理系统 MVP
          </div>
          <h1 className="text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
            队长积分管理系统
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            当前已完成基础框架初始化，后续将接入登录权限、队长档案、团期管理、积分审核、排行榜与奖金测算。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">
                进入登录页
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin">管理后台</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/leader">
                <Trophy className="h-4 w-4" />
                队长端
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
