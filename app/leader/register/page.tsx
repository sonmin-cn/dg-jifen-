import { RegisterForm } from "@/app/leader/register/RegisterForm";

export default function LeaderRegisterPage() {
  return (
    <section className="py-8">
      <h2 className="text-2xl font-semibold">队长自助注册</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        注册后请登录并申请绑定已有队长档案，审核通过后即可访问队长端数据。
      </p>
      <RegisterForm />
    </section>
  );
}
