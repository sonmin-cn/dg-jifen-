"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/leader/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        message?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok) {
        setError(
          data.errors
            ? Object.values(data.errors).join("；")
            : data.message || "注册失败",
        );
        return;
      }

      event.currentTarget.reset();
      setSuccess("注册成功，请登录后申请绑定队长档案。");
    } catch {
      setError("注册请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 max-w-xl rounded-lg border bg-card p-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <Field label="用户名" name="username" required />
        <Field label="手机号" name="phone" required />
        <Field label="真实姓名" name="realName" required />
        <Field label="密码" name="password" required type="password" />
        <Field label="确认密码" name="confirmPassword" required type="password" />
      </div>
      {error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-4 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
          {success}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button disabled={isSubmitting} type="submit">
          <UserPlus className="h-4 w-4" />
          {isSubmitting ? "注册中..." : "注册队长账号"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">去登录</Link>
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required={required} type={type} />
    </div>
  );
}
