"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as {
        message?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        setError(data.message || "登录失败，请检查账号信息");
        return;
      }

      router.replace(data.redirectTo || "/");
      router.refresh();
    } catch {
      setError("登录请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="username">用户名</Label>
        <Input
          autoComplete="username"
          id="username"
          name="username"
          onChange={(event) => setUsername(event.target.value)}
          placeholder="请输入用户名"
          value={username}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          autoComplete="current-password"
          id="password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="请输入密码"
          type="password"
          value={password}
        />
      </div>
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button className="w-full" disabled={isSubmitting} type="submit">
        <LogIn className="h-4 w-4" />
        {isSubmitting ? "登录中..." : "登录"}
      </Button>
    </form>
  );
}
