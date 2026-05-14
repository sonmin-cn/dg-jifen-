import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { getLeaderBindingState, maskPhone } from "@/lib/services/leader-binding";
import { BindRequestButton } from "@/app/leader/bind/BindRequestButton";

export default async function LeaderBindPage() {
  const user = await requireRole(["LEADER"], "/leader/bind");
  const state = await getLeaderBindingState(user.id);

  if (state.isBound) {
    redirect("/leader/dashboard");
  }

  if (state.isPending) {
    return (
      <MessageCard
        title="绑定申请待审核"
        message="你的绑定申请正在审核中。审核通过后即可访问队长端数据。"
      />
    );
  }

  const candidates = await prisma.leader.findMany({
    where: { phone: user.phone, userId: null },
    select: {
      id: true,
      realName: true,
      nickname: true,
      phone: true,
      residentLocation: true,
      region: true,
      rawLeaderIdentity: true,
      rawLeaderLevel: true,
      status: true,
      level: true,
    },
  });

  if (candidates.length === 0) {
    return (
      <MessageCard
        title="未找到匹配档案"
        message="未找到匹配的队长档案，请联系队长主管核实手机号。"
        rejectReason={state.latestRejectReason}
      />
    );
  }

  if (candidates.length > 1) {
    return (
      <MessageCard
        title="存在多个匹配档案"
        message="存在多个匹配档案，请联系队长主管处理。"
        rejectReason={state.latestRejectReason}
      />
    );
  }

  const leader = candidates[0];

  return (
    <section className="mt-8 max-w-3xl rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">绑定队长档案</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          系统根据你的注册手机号匹配到以下未绑定档案，请确认是否本人。
        </p>
        {state.latestRejectReason ? (
          <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            上一次申请被拒绝：{state.latestRejectReason}
          </p>
        ) : null}
      </div>
      <div className="mb-6 grid gap-4 text-sm md:grid-cols-2">
        <Info label="姓名" value={leader.realName} />
        <Info label="昵称" value={leader.nickname} />
        <Info label="手机号" value={maskPhone(leader.phone)} />
        <Info label="常驻地" value={leader.residentLocation} />
        <Info label="区域" value={leader.region} />
        <Info label="队长身份" value={leader.rawLeaderIdentity || leader.status} />
        <Info label="队长级别" value={leader.rawLeaderLevel || leader.level} />
        <div>
          <p className="text-muted-foreground">匹配方式</p>
          <Badge className="mt-1" variant="secondary">
            手机号一致
          </Badge>
        </div>
      </div>
      <BindRequestButton />
    </section>
  );
}

function MessageCard({
  title,
  message,
  rejectReason,
}: {
  title: string;
  message: string;
  rejectReason?: string | null;
}) {
  return (
    <section className="mt-8 max-w-3xl rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      {rejectReason ? (
        <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          上一次申请被拒绝：{rejectReason}
        </p>
      ) : null}
    </section>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || "-"}</p>
    </div>
  );
}
