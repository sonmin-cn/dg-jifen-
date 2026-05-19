import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/permissions";
import { TRIP_MANAGEMENT_ROLES, TRIP_READ_ROLES } from "@/lib/auth/roles";
import {
  TRIP_STATUS_LABELS,
  TRIP_LEADER_ROLE_LABELS,
} from "@/lib/constants/trips";
import { tripListSelect } from "@/lib/services/trip-select";
import {
  TripEditForm,
  TripLeaderManager,
} from "@/app/admin/trips/[id]/TripEditForms";
import { DeleteTripButton } from "@/app/admin/trips/[id]/DeleteTripButton";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminTripDetailPage({ params }: PageProps) {
  const user = await requireRole(TRIP_READ_ROLES, "/admin/trips/:id");
  const canManage = TRIP_MANAGEMENT_ROLES.includes(user.role);
  const { id } = await params;
  const [trip, leaders] = await Promise.all([
    prisma.trip.findUnique({
      where: { id },
      select: tripListSelect,
    }),
    prisma.leader.findMany({
      select: {
        id: true,
        realName: true,
        nickname: true,
        phone: true,
        status: true,
        level: true,
        externalLeaderId: true,
      },
      orderBy: { realName: "asc" },
    }),
  ]);

  if (!trip) {
    notFound();
  }

  const baseScoreRecordIds = trip.tripLeaders
    .map((row) => row.baseScoreRecordId)
    .filter((id): id is string => Boolean(id));
  const baseScoreRecords = baseScoreRecordIds.length
    ? await prisma.scoreRecord.findMany({
        where: { id: { in: baseScoreRecordIds } },
        select: {
          id: true,
          effectivePoints: true,
          rawPoints: true,
        },
      })
    : [];
  const baseScoreRecordMap = Object.fromEntries(
    baseScoreRecords.map((record) => [
      record.id,
      {
        effectivePoints: record.effectivePoints,
        rawPoints: record.rawPoints,
      },
    ]),
  );

  return (
    <div className="py-8">
      <BackButton fallbackHref="/admin/dashboard" />
      <Button className="mb-4" size="sm" variant="outline" asChild>
        <Link href="/admin/trips">返回列表</Link>
      </Button>

      <div className="mb-5 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">{trip.routeName}</h2>
          <Badge variant={trip.status === "CANCELLED" ? "outline" : "secondary"}>
            {TRIP_STATUS_LABELS[trip.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDate(trip.startDate)} 至 {formatDate(trip.endDate)} · {trip.tripDays} 天
        </p>
      </div>

      <section className="mb-5 grid gap-4 rounded-lg border bg-card p-5 text-sm shadow-sm md:grid-cols-4">
        <Info label="区域" value={trip.region} />
        <Info label="出团人数" value={trip.participantCount?.toString()} />
        <Info label="产品经理ID" value={trip.productManagerId} />
        <Info label="节假日" value={trip.isHoliday ? "是" : "否"} />
        <Info
          label="带队队长"
          value={
            trip.tripLeaders.length
              ? trip.tripLeaders
                  .map(
                    (row) =>
                      `${row.leader.realName}（${TRIP_LEADER_ROLE_LABELS[row.role]}）`,
                  )
                  .join("、")
              : "暂无"
          }
          wide
        />
      </section>

      {canManage ? (
        <>
          <TripEditForm trip={trip} />
          <TripLeaderManager
            baseScoreRecordMap={baseScoreRecordMap}
            leaders={leaders}
            tripStatus={trip.status}
            tripId={trip.id}
            tripLeaders={trip.tripLeaders}
          />
          {user.role === "SUPER_ADMIN" || user.role === "ADMIN" ? (
            <DeleteTripButton tripId={trip.id} />
          ) : null}
        </>
      ) : (
        <section className="rounded-lg border bg-card p-5 text-sm text-muted-foreground shadow-sm">
          当前角色仅可查看团期信息，不能编辑团期或带队记录。
        </section>
      )}
    </div>
  );
}

function Info({
  label,
  value,
  wide,
}: {
  label: string;
  value?: string | null;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-4" : undefined}>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || "-"}</p>
    </div>
  );
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}
