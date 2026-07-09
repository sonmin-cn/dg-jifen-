"use client";

import { formatDateCN, formatDateTimeCN } from "@/lib/utils/datetime";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  EvidenceImage,
  LeaderApplicationRuleOption,
} from "@/lib/services/score-applications";

type TripOption = {
  id: string;
  routeName: string;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
};

export type ApplicationInitialValues = {
  resubmitOfId: string;
  ruleId: string;
  tripId: string;
  description: string;
  evidenceText: string;
  evidenceUrl: string;
  orderNo: string;
  evidenceImages: EvidenceImage[];
};

export function ApplicationCreateForm({
  trips,
  rules,
  initial,
}: {
  trips: TripOption[];
  rules: LeaderApplicationRuleOption[];
  initial?: ApplicationInitialValues | null;
}) {
  const router = useRouter();
  const [ruleId, setRuleId] = useState(initial?.ruleId || "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [evidenceImages, setEvidenceImages] = useState<EvidenceImage[]>(
    initial?.evidenceImages || [],
  );
  const selectedRule = useMemo(
    () => rules.find((rule) => rule.id === ruleId) || null,
    [ruleId, rules],
  );
  const pointsText = selectedRule
    ? `预计 +${formatPoints(selectedRule.points)} 分`
    : "请选择积分规则";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const selectedRuleId = String(payload.ruleId || "").trim();
    const rule = rules.find((entry) => entry.id === selectedRuleId) || null;
    const tripId = String(payload.tripId || "").trim();
    const evidenceText = String(payload.evidenceText || "").trim();
    const evidenceUrl = String(payload.evidenceUrl || "").trim();
    const orderNo = String(payload.orderNo || "").trim();

    if (!selectedRuleId || !rule) {
      setError("请选择积分规则");
      setIsSubmitting(false);
      return;
    }

    if (rule.requireTrip && !tripId) {
      setError("该积分申请需要选择关联团期");
      setIsSubmitting(false);
      return;
    }

    if (rule.requireOrderNo && !orderNo) {
      setError("请填写复购订单号");
      setIsSubmitting(false);
      return;
    }

    if (!evidenceText && !evidenceUrl && evidenceImages.length === 0) {
      setError("请填写证明材料、证明链接或上传证明图片");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/leader/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          ruleId: selectedRuleId,
          tripId: tripId || null,
          orderNo: orderNo || null,
          resubmitOfId: initial?.resubmitOfId || null,
          evidenceImages,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        message?: string;
      } | null;

      if (!response.ok || data?.success === false) {
        setError(data?.error || data?.message || "提交申请失败");
        return;
      }

      setError("");
      router.push("/leader/applications");
      router.refresh();
    } catch {
      setError("提交申请请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    setError("");

    if (files.length === 0) {
      return;
    }

    if (evidenceImages.length + files.length > 3) {
      setError("最多上传 3 张证明图片");
      return;
    }

    for (const file of files) {
      const lowerName = file.name.toLowerCase();

      if (file.type === "image/heic" || file.type === "image/heif" || lowerName.endsWith(".heic") || lowerName.endsWith(".heif")) {
        setError("暂不支持 HEIC 图片。最简单的办法：先对照片截图，再上传截图；或在相册中将照片导出为 JPG/PNG。");
        return;
      }

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("仅支持 JPG、PNG、WEBP 图片");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("单张证明图片不能超过 5MB");
        return;
      }
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    setIsUploading(true);

    try {
      const response = await fetch("/api/leader/applications/upload-evidence", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        images?: EvidenceImage[];
        error?: string;
      } | null;

      if (!response.ok || data?.success === false || !data?.images) {
        setError(data?.error || "图片上传失败");
        return;
      }

      const uploadedImages = data.images;
      setEvidenceImages((current) => [...current, ...uploadedImages].slice(0, 3));
    } catch {
      setError("图片上传失败，请稍后重试");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="mt-6 rounded-lg border bg-card p-4 shadow-sm md:p-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ruleId">申请积分规则</Label>
          <select
            className="h-11 w-full rounded-md border bg-background px-3 text-base md:text-sm"
            id="ruleId"
            name="ruleId"
            onChange={(event) => {
              setRuleId(event.target.value);
              setError("");
            }}
            value={ruleId}
          >
            <option value="">请选择积分规则</option>
            {rules.map((rule) => (
              <option key={rule.id} value={rule.id}>
                {rule.name}（+{formatPoints(rule.points)}）
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-md border bg-muted/30 px-3 py-3 text-sm">
          <p className="font-medium">{pointsText}</p>
          <p className="mt-1 text-muted-foreground">
            {selectedRule
              ? selectedRule.requireTrip
                ? "需关联团期"
                : "可不关联团期"
              : "选择规则后显示申请要求"}
          </p>
          {selectedRule?.description ? (
            <p className="mt-1 text-muted-foreground">{selectedRule.description}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2" htmlFor="tripId">
            关联团期
            {selectedRule ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {selectedRule.requireTrip ? "必填" : "选填"}
              </span>
            ) : null}
          </Label>
          <select
            className="h-11 w-full rounded-md border bg-background px-3 text-base md:text-sm"
            defaultValue={initial?.tripId || ""}
            id="tripId"
            name="tripId"
          >
            <option value="">不关联或待选择</option>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.routeName}（{formatDate(trip.endDate)}）
              </option>
            ))}
          </select>
          {selectedRule ? (
            <p className="text-xs text-muted-foreground">
              {selectedRule.requireTrip
                ? "该积分申请需要选择关联团期。"
                : "如该申请与某次带队相关，可选择团期；无法确认时可不关联。"}
            </p>
          ) : null}
        </div>
        {selectedRule?.requireOrderNo ? (
          <div className="space-y-2 md:col-span-2">
            <Label className="flex items-center gap-2" htmlFor="orderNo">
              复购订单号
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                必填
              </span>
            </Label>
            <Input
              className="h-11 text-base md:text-sm"
              defaultValue={initial?.orderNo || ""}
              id="orderNo"
              name="orderNo"
              placeholder="填写报名系统中的订单号，同一订单只能归属 1 名队长"
            />
            <p className="text-xs text-muted-foreground">
              订单号用于复购归属查重，请从报名订单中完整复制。
            </p>
          </div>
        ) : null}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">申请说明</Label>
          <Textarea className="min-h-28 text-base md:text-sm" defaultValue={initial?.description || ""} id="description" name="description" placeholder="补充发布内容、复购来源或其他背景" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="evidenceText">证明材料</Label>
          <Textarea className="min-h-32 text-base md:text-sm" defaultValue={initial?.evidenceText || ""} id="evidenceText" name="evidenceText" placeholder="填写截图说明、聊天记录说明等" />
        </div>
        <Field defaultValue={initial?.evidenceUrl || ""} label="证明链接" name="evidenceUrl" placeholder="小红书链接、网盘链接或截图链接" />
        <div className="space-y-3 md:col-span-2">
          <div className="space-y-1">
            <Label htmlFor="evidenceImages">证明图片</Label>
            <p className="text-xs text-muted-foreground">
              最多上传 3 张，支持 JPG、PNG、WEBP，单张不超过 5MB。
            </p>
          </div>
          <Input
            accept="image/jpeg,image/png,image/webp"
            className="h-11 cursor-pointer text-base file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground md:text-sm"
            disabled={isUploading || evidenceImages.length >= 3}
            id="evidenceImages"
            multiple
            onChange={handleImageChange}
            type="file"
          />
          {isUploading ? (
            <p className="text-sm text-muted-foreground">图片上传中...</p>
          ) : null}
          {evidenceImages.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {evidenceImages.map((image) => {
                const displayUrl = image.displayUrl || image.url;

                return (
                  <div className="overflow-hidden rounded-lg border bg-background" key={image.url}>
                    <a href={displayUrl} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="证明图片"
                        className="h-28 w-full object-cover"
                        src={displayUrl}
                      />
                    </a>
                    <div className="flex items-center justify-between gap-2 p-2 text-xs">
                      <span className="min-w-0 truncate text-muted-foreground">
                        {image.filename}
                      </span>
                      <button
                        aria-label="移除图片"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted"
                        onClick={() => {
                          setEvidenceImages((current) =>
                            current.filter((item) => item.url !== image.url),
                          );
                        }}
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImagePlus className="h-4 w-4" />
              可从手机相册选择或拍照后上传。
            </p>
          )}
        </div>
      </div>
      {error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button className="mt-4 h-11 w-full md:w-auto" disabled={isSubmitting || isUploading} type="submit">
        <Send className="h-4 w-4" />
        {isSubmitting ? "提交中..." : isUploading ? "图片上传中..." : "提交申请"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input className="h-11 text-base md:text-sm" defaultValue={defaultValue} id={name} name={name} placeholder={placeholder} />
    </div>
  );
}

function formatDate(value: Date | string) {
  return formatDateCN(value);
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
