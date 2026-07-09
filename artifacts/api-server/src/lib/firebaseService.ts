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

function getFirebaseApp(): App {
  if (app) return app;

  const projectId = process.env["FIREBASE_PROJECT_ID"];
  const clientEmail = process.env["FIREBASE_CLIENT_EMAIL"];
  const privateKeyRaw = process.env["FIREBASE_PRIVATE_KEY"];
  const storageBucket = process.env["FIREBASE_STORAGE_BUCKET"];

  if (!projectId || !clientEmail || !privateKeyRaw || !storageBucket) {
    throw new Error(
      "Firebase is not configured. Required secrets: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_STORAGE_BUCKET.",
    );
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

  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0]!;
    return app;
  }

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket,
  });
  return app;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env["FIREBASE_PROJECT_ID"] &&
      process.env["FIREBASE_CLIENT_EMAIL"] &&
      process.env["FIREBASE_PRIVATE_KEY"] &&
      process.env["FIREBASE_STORAGE_BUCKET"],
  );
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
