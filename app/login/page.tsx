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
            队长使用注册手机号和密码登录；后台人员仍可使用用户名登录。
          </p>
        </div>
        <LoginForm />
        <p className="mt-6 text-sm text-muted-foreground">
          忘记密码或没有账号？请联系队长主管处理。
        </p>
      </section>
    </main>
  );
}
