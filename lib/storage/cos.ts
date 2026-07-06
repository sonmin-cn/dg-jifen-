import { randomBytes } from "crypto";
import COS from "cos-nodejs-sdk-v5";

type CosConfig = {
  secretId: string;
  secretKey: string;
  bucket: string;
  region: string;
  publicBaseUrl: string;
};

export type CosEvidenceUploadInput = {
  folder: string;
  extension: string;
  body: Buffer;
  contentType: string;
};

export type CosEvidenceUploadResult = {
  url: string;
  filename: string;
  key: string;
};

export type CosEvidenceObject = {
  body: Buffer;
  contentType?: string;
};

export class CosStorageConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CosStorageConfigError";
  }
}

let cosClient: COS | null = null;

export async function uploadEvidenceImageToCos({
  folder,
  extension,
  body,
  contentType,
}: CosEvidenceUploadInput): Promise<CosEvidenceUploadResult> {
  const config = getCosConfig();
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.${extension}`;
  const datePrefix = new Date().toISOString().slice(0, 10);
  const key = normalizeObjectKey(`${folder}/${datePrefix}/${filename}`);

  await getCosClient(config).putObject({
    Bucket: config.bucket,
    Region: config.region,
    Key: key,
    Body: body,
    ContentLength: body.length,
    ContentType: contentType,
  });

  return {
    url: `${config.publicBaseUrl}/${encodeObjectKey(key)}`,
    filename,
    key,
  };
}

export async function readEvidenceImageFromCos(key: string): Promise<CosEvidenceObject> {
  const config = getCosConfig();
  const object = await new Promise<COS.GetObjectResult>((resolve, reject) => {
    getCosClient(config).getObject(
      {
        Bucket: config.bucket,
        Region: config.region,
        Key: key,
      },
      (error, data) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(data);
      },
    );
  });

  return {
    body: object.Body,
    contentType: readHeader(object.headers, "content-type"),
  };
}

export function isCosStorageConfigError(error: unknown) {
  return error instanceof CosStorageConfigError;
}

function getCosClient(config: CosConfig) {
  if (!cosClient) {
    cosClient = new COS({
      SecretId: config.secretId,
      SecretKey: config.secretKey,
    });
  }

  return cosClient;
}

function getCosConfig(): CosConfig {
  return {
    secretId: readRequiredEnv("COS_SECRET_ID"),
    secretKey: readRequiredEnv("COS_SECRET_KEY"),
    bucket: readRequiredEnv("COS_BUCKET"),
    region: readRequiredEnv("COS_REGION"),
    publicBaseUrl: readRequiredEnv("COS_PUBLIC_BASE_URL").replace(/\/+$/, ""),
  };
}

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new CosStorageConfigError(`Missing required COS environment variable: ${name}`);
  }

  return value;
}

function normalizeObjectKey(value: string) {
  return value
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
}

function encodeObjectKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function readHeader(
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string,
) {
  if (!headers) {
    return undefined;
  }

  const value = headers[name] || headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}
