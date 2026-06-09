const LEGACY_EVIDENCE_PREFIX = "/uploads/score-applications/";

export type EvidenceUrlScope = "score-applications" | "score-adjustments";

export function isAllowedEvidenceImageUrl(url: string, scope: EvidenceUrlScope) {
  if (!url) {
    return false;
  }

  if (url.startsWith(LEGACY_EVIDENCE_PREFIX)) {
    return true;
  }

  const publicBaseUrl = process.env.COS_PUBLIC_BASE_URL?.trim();

  if (!publicBaseUrl) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    const parsedBaseUrl = new URL(publicBaseUrl);

    if (parsedUrl.protocol !== "https:" || parsedBaseUrl.protocol !== "https:") {
      return false;
    }

    if (parsedUrl.origin !== parsedBaseUrl.origin) {
      return false;
    }

    const basePath = normalizePathPrefix(parsedBaseUrl.pathname);
    const requiredPathPrefix = `${basePath}${scope}/`;

    return parsedUrl.pathname.startsWith(requiredPathPrefix);
  } catch {
    return false;
  }
}

function normalizePathPrefix(pathname: string) {
  const trimmed = pathname.replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
}
