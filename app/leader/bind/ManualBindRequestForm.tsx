"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ManualBindRequestForm() {
  const router = useRouter();
  const [realName, setRealName] = useState("");
  const [leaderPhone, setLeaderPhone] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!realName.trim() || !leaderPhone.trim()) {
      setError("请填写档案登记的真实姓名和手机号");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/leader/bind/manual-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ realName, leaderPhone }),
      });
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setError(data?.message || "提交绑定申请失败");
        return;
      }

      router.refresh();
    } catch {
      setError("提交绑定申请请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-6 rounded-md border bg-muted/20 p-4" onSubmit={handleSubmit}>
      <h3 className="font-medium">手机号不一致？申请人工绑定</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        如果你换过手机号，可填写当时在公司档案中登记的真实姓名和手机号，
        提交后由队长主管人工审核绑定。
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="manualRealName">档案登记的真实姓名</Label>
          <Input
            className="h-11 text-base md:text-sm"
            id="manualRealName"
            onChange={(event) => setRealName(event.target.value)}
            placeholder="与公司档案一致的姓名"
            value={realName}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manualLeaderPhone">档案登记的手机号</Label>
          <Input
            className="h-11 text-base md:text-sm"
            id="manualLeaderPhone"
            inputMode="tel"
            onChange={(event) => setLeaderPhone(event.target.value)}
            placeholder="当时登记的手机号"
            value={leaderPhone}
          />
        </div>
      </div>
      {error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button className="mt-4 h-11 w-full sm:w-auto" disabled={isSubmitting} type="submit">
        <Send className="h-4 w-4" />
        {isSubmitting ? "提交中..." : "提交人工绑定申请"}
      </Button>
    </form>
  );
}
