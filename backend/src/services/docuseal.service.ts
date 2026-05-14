import { env } from "../config/env";
import crypto from "crypto";

const BASE_URL = "https://api.docuseal.com";

// ─── Generic JSON request ─────────────────────────────────────────

async function docuSealFetch<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "X-Auth-Token": env.DOCUSEAL_API_KEY,
      "Content-Type": "application/json",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`DocuSeal ${method} ${path} → ${res.status}: ${txt}`);
  }
  return res.json() as Promise<T>;
}

// ─── Upload PDF and create a DocuSeal template ────────────────────
// DocuSeal /templates/pdf expects JSON with base64-encoded file content.

async function createTemplateFromPdf(name: string, pdfBuffer: Buffer): Promise<number> {
  const base64 = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;

  const tpl = await docuSealFetch<{ id: number }>("POST", "/templates/pdf", {
    name,
    documents: [{ name: "contrat.pdf", file: base64 }],
  });

  return tpl.id;
}

// ─── Public API ───────────────────────────────────────────────────

export interface DocuSealResult {
  submissionId: string;
  signerToken: string;
  signingUrl: string;
}

export async function initiateSignature(
  title: string,
  pdfBuffer: Buffer,
  signer: { firstName: string; lastName: string; email: string }
): Promise<DocuSealResult> {
  // 1. Create template from PDF
  const templateId = await createTemplateFromPdf(title.slice(0, 100), pdfBuffer);

  // 2. Create submission with candidate as signer
  const submitters = await docuSealFetch<Array<{
    id: number;
    uuid: string;
    slug: string;
    embed_src: string;
    submission_id: number;
  }>>(
    "POST",
    "/submissions",
    {
      template_id: templateId,
      send_email: false,
      submitters: [
        {
          role: "First Party",
          name: `${signer.firstName} ${signer.lastName}`.trim() || "Signataire",
          email: signer.email,
        },
      ],
    }
  );

  const submitter = submitters[0];
  if (!submitter) throw new Error("DocuSeal: aucun signataire retourné.");

  return {
    submissionId: String(submitter.submission_id),
    signerToken: submitter.slug,
    signingUrl: submitter.embed_src,
  };
}

// ─── Webhook signature verification ──────────────────────────────
// DocuSeal sends the configured secret in the X-Docuseal-Secret header.

export function verifyWebhookSignature(headerSecret: string, configSecret: string): boolean {
  if (!configSecret) return true;
  try {
    return crypto.timingSafeEqual(Buffer.from(headerSecret), Buffer.from(configSecret));
  } catch {
    return false;
  }
}
