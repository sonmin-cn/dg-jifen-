import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getHomePathForRole } from "@/lib/auth/session";
import { LoginForm } from "@/app/login/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getHomePathForRole(user.role));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8 md:px-6 md:py-12">
      <section className="w-full max-w-sm rounded-lg border bg-card p-5 shadow-sm md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold md:text-3xl">登录</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            使用 seed 测试账号的用户名和密码登录。
          </p>
        </div>
        <LoginForm />
        <div className="mt-6 flex justify-between gap-4 text-sm text-muted-foreground">
          <Link className="hover:text-foreground" href="/admin/dashboard">
            管理后台
          </Link>
          <Link className="hover:text-foreground" href="/leader/dashboard">
            队长端
          </Link>
        </div>
      </section>
    </main>
  );
}
