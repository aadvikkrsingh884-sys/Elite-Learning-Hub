/**
 * Firebase Admin SDK service utility.
 *
 * Provides Firebase Storage access using the project's service-account
 * credentials (from Replit Secrets). Used by:
 *  - the resource ingestion pipeline (uploads generated/sourced files)
 *  - the download route (redirects to the public Firebase URL when present)
 */
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

let app: App | null = null;

interface ServiceAccountCreds {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  storageBucket: string;
}

/**
 * Resolves service-account credentials. Prefers FIREBASE_SERVICE_ACCOUNT_BASE64
 * (the entire service-account JSON file, base64-encoded) when present, since
 * that survives copy/paste through secret-entry UIs without corruption —
 * multi-line PEM private keys pasted as a raw env var are extremely prone to
 * silently losing characters (dropped newlines, stripped backslashes, etc.),
 * which manifests as "Failed to parse private key" / invalid base64 errors.
 * Falls back to the four discrete FIREBASE_* secrets for backward compat.
 */
function resolveCredentials(): ServiceAccountCreds | null {
  const b64 = process.env["FIREBASE_SERVICE_ACCOUNT_BASE64"];
  const storageBucketEnv = process.env["FIREBASE_STORAGE_BUCKET"];

  if (b64) {
    let json: Record<string, unknown>;
    try {
      json = JSON.parse(Buffer.from(b64.trim(), "base64").toString("utf8"));
    } catch (err) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_BASE64 could not be decoded/parsed as JSON: ${(err as Error).message}`,
      );
    }
    const projectId = (json["project_id"] as string) ?? process.env["FIREBASE_PROJECT_ID"];
    const clientEmail = (json["client_email"] as string) ?? process.env["FIREBASE_CLIENT_EMAIL"];
    const privateKey = json["private_key"] as string;
    const storageBucket = storageBucketEnv ?? (projectId ? `${projectId}.appspot.com` : undefined);
    if (!projectId || !clientEmail || !privateKey || !storageBucket) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_BASE64 is missing required fields (project_id, client_email, private_key) or FIREBASE_STORAGE_BUCKET is not set.",
      );
    }
    return { projectId, clientEmail, privateKey, storageBucket };
  }

  const projectId = process.env["FIREBASE_PROJECT_ID"];
  const clientEmail = process.env["FIREBASE_CLIENT_EMAIL"];
  const privateKeyRaw = process.env["FIREBASE_PRIVATE_KEY"];
  const storageBucket = storageBucketEnv;

  if (!projectId || !clientEmail || !privateKeyRaw || !storageBucket) {
    return null;
  }

  // Service-account private keys are frequently mangled in transit: wrapped
  // in extra quotes, given literal "\n" sequences instead of real newlines,
  // or padded with stray whitespace. Normalize all of these before use.
  let privateKey = privateKeyRaw.trim();
  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }
  if (privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }
  if (!privateKey.includes("BEGIN PRIVATE KEY") && !privateKey.includes("BEGIN RSA PRIVATE KEY")) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY does not look like a PEM key (missing 'BEGIN PRIVATE KEY' header). Re-check the secret value.",
    );
  }
  if (!privateKey.includes("\n")) {
    privateKey = privateKey
      .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/, "-----BEGIN $1PRIVATE KEY-----\n")
      .replace(/-----END (RSA )?PRIVATE KEY-----/, "\n-----END $1PRIVATE KEY-----");
  }

  return { projectId, clientEmail, privateKey, storageBucket };
}

function getFirebaseApp(): App {
  if (app) return app;

  const creds = resolveCredentials();
  if (!creds) {
    throw new Error(
      "Firebase is not configured. Provide FIREBASE_SERVICE_ACCOUNT_BASE64 (preferred), or the four discrete secrets: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_STORAGE_BUCKET.",
    );
  }

  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0]!;
    return app;
  }

  app = initializeApp({
    credential: cert({ projectId: creds.projectId, clientEmail: creds.clientEmail, privateKey: creds.privateKey }),
    storageBucket: creds.storageBucket,
  });
  return app;
}

export function isFirebaseConfigured(): boolean {
  try {
    return resolveCredentials() !== null;
  } catch {
    return false;
  }
}

/**
 * Uploads a buffer to Firebase Storage at the given path and returns its
 * public download URL. Makes the object publicly readable (this is a
 * public study-resource library, not user-private data).
 */
export async function uploadBufferToFirebase(opts: {
  buffer: Buffer;
  destination: string; // e.g. "resources/class-8/mathematics/chapter-1/pyq.pdf"
  contentType: string;
}): Promise<string> {
  const { buffer, destination, contentType } = opts;
  const fbApp = getFirebaseApp();
  const bucket = getStorage(fbApp).bucket();
  const file = bucket.file(destination);

  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });
  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${destination}`;
}
