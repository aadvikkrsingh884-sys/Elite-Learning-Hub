/**
 * Public file storage for generated study-resource PDFs, backed by Replit's
 * built-in Object Storage (GCS bucket provisioned via the App Storage tool).
 *
 * This replaced an earlier Firebase Storage integration: as of late 2024,
 * Google requires the paid Blaze plan to create any Storage bucket at all,
 * which the project's Firebase account (Spark/free plan) cannot do. Replit
 * Object Storage needs no billing account and uses the same "write a buffer,
 * get back a public URL" shape, so resources.ts / ingest-resources.ts did not
 * need to change their calling convention.
 */
import { objectStorageClient } from "./objectStorage";

function getPublicSearchPath(): string {
  const raw = process.env["PUBLIC_OBJECT_SEARCH_PATHS"] || "";
  const first = raw.split(",").map((p) => p.trim()).filter(Boolean)[0];
  if (!first) {
    throw new Error(
      "PUBLIC_OBJECT_SEARCH_PATHS is not set. Run setupObjectStorage() to provision the bucket.",
    );
  }
  return first; // e.g. "/replit-objstore-<id>/public"
}

export function isObjectStorageConfigured(): boolean {
  return Boolean(process.env["PUBLIC_OBJECT_SEARCH_PATHS"] && process.env["DEFAULT_OBJECT_STORAGE_BUCKET_ID"]);
}

/**
 * Uploads a buffer under the public search path and returns a URL our own
 * download route can redirect to (served via GET /api/storage/public-objects/<destination>).
 */
export async function uploadBufferToPublicStorage(opts: {
  buffer: Buffer;
  destination: string; // e.g. "resources/class-8/mathematics/chapter-1/pyq.pdf"
  contentType: string;
}): Promise<{ objectPath: string; storageUrl: string }> {
  const { buffer, destination, contentType } = opts;
  const searchPath = getPublicSearchPath(); // "/<bucketName>/public"
  const [, bucketName, ...rest] = searchPath.split("/");
  const prefix = rest.join("/"); // "public"
  const fullObjectName = [prefix, destination].filter(Boolean).join("/");

  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(fullObjectName);
  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });

  return {
    objectPath: `/${destination}`,
    // Served by the app's own /api/storage/public-objects/* route, which
    // searches PUBLIC_OBJECT_SEARCH_PATHS and streams the file with the
    // correct content type — no separate public ACL step needed.
    storageUrl: `/api/storage/public-objects/${destination}`,
  };
}
