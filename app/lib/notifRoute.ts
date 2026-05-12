export function notifTarget(
  type: string,
  metadata: string | null | undefined,
  role: "CANDIDAT" | "RECRUTEUR" | undefined
): string | null {
  let meta: { jobId?: string; conversationId?: string } = {};
  if (metadata) {
    try {
      const parsed = JSON.parse(metadata);
      if (parsed && typeof parsed === "object") meta = parsed;
    } catch { /* ignore */ }
  }
  if (type === "JOB_MATCH" && meta.jobId) return `/offres/${meta.jobId}`;
  if (type === "MESSAGE_RECEIVED") {
    return role === "RECRUTEUR"
      ? "/dashboard/recruteur/messagerie"
      : "/dashboard/candidat/messagerie";
  }
  if (type === "APPLICATION_RECEIVED" && role === "RECRUTEUR") {
    return "/dashboard/recruteur/offres";
  }
  return null;
}
