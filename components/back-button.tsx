"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton({
  fallbackHref,
  label = "返回上一级",
}: {
  fallbackHref: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Button
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push(fallbackHref);
          }
        }}
        size="sm"
        type="button"
        variant="outline"
      >
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Button>
      <Button size="sm" variant="ghost" asChild>
        <Link href={fallbackHref}>返回首页</Link>
      </Button>
    </div>
  );
}
