const LEGACY_EVIDENCE_PREFIX = "/uploads/score-applications/";

export type EvidenceUrlScope = "score-applications" | "score-adjustments";

export function isAllowedEvidenceImageUrl(url: string, scope: EvidenceUrlScope) {
  if (url.startsWith(LEGACY_EVIDENCE_PREFIX)) {
    return true;
  }

  return Boolean(getCosEvidenceObjectKey(url, scope));
}

export function getEvidenceImageProxyUrl(url: string, scope: EvidenceUrlScope) {
  const key = getCosEvidenceObjectKey(url, scope);

  if (!key) {
    return url;
  }

  return `/api/evidence-images/${encodeObjectKey(key)}`;
}

export function getCosEvidenceObjectKey(url: string, scope: EvidenceUrlScope) {
  if (!url || url.startsWith(LEGACY_EVIDENCE_PREFIX)) {
    return null;
  }

  const publicBaseUrl = process.env.COS_PUBLIC_BASE_URL?.trim();

  if (!publicBaseUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const parsedBaseUrl = new URL(publicBaseUrl);

    if (parsedUrl.protocol !== "https:" || parsedBaseUrl.protocol !== "https:") {
      return null;
    }

    if (parsedUrl.origin !== parsedBaseUrl.origin) {
      return null;
    }

    const basePath = normalizePathPrefix(parsedBaseUrl.pathname);
    const requiredPathPrefix = `${basePath}${scope}/`;

    if (!parsedUrl.pathname.startsWith(requiredPathPrefix)) {
      return null;
    }

    return decodeObjectKey(parsedUrl.pathname.slice(basePath.length));
  } catch {
    return null;
  }
}

function normalizePathPrefix(pathname: string) {
  const trimmed = pathname.replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
}

function encodeObjectKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function decodeObjectKey(pathname: string) {
  return pathname
    .split("/")
    .map((segment) => decodeURIComponent(segment))
    .join("/");
}
