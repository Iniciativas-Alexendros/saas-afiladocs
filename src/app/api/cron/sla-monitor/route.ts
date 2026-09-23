import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { serverEnv, publicEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma/client";
import { sendEmail } from "@/lib/email/send";
import { verifyCronBearer } from "@/lib/cron-auth";
import { cronRateLimit, getClientIp, applyRateLimit } from "@/lib/rate-limit";
import { SlaAlertEmail } from "@/emails/sla-alert";
import { notifyOpsError } from "@/lib/alerts/notify-ops";
import React from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OverdueDocument = Prisma.documentsGetPayload<{
  include: { order: { include: { user: true } } };
}>;

interface DocumentSummary {
  orderId: string;
  productId: string;
  customerName: string;
  daysPending: number;
}

/** Build summary list from overdue documents. */
function buildDocumentsSummary(docs: OverdueDocument[]): DocumentSummary[] {
  const now = new Date();
  return docs.map((doc) => ({
    orderId: doc.order.id,
    productId: doc.order.product_id,
    customerName: doc.order.user.full_name ?? "Sin nombre",
    daysPending: Math.floor(
      (now.getTime() - new Date(doc.created_at).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  }));
}

/** Send SLA alert email to ops. Non-blocking — logs errors without throwing. */
async function sendSlaAlertEmail(
  overdueCount: number,
  documents: DocumentSummary[],
): Promise<void> {
  try {
    const plural = overdueCount > 1;
    await sendEmail({
      to: serverEnv.opsEmail,
      subject: `Alerta SLA: ${overdueCount} documento${plural ? "s" : ""} pendiente${plural ? "s" : ""} de firma`,
      react: React.createElement(SlaAlertEmail, {
        overdueCount,
        documents,
        opsUrl: `${publicEnv.siteUrl}/ops/pedidos`,
      }),
    });
  } catch (emailErr) {
    console.error(
      JSON.stringify({
        event: "cron.sla_monitor.email_error",
        message: emailErr instanceof Error ? emailErr.message : "Unknown",
        ts: new Date().toISOString(),
      }),
    );
  }
}

/**
 * Cron: runs Monday-Friday at 08:00 UTC (vercel.json schedule: "0 8 * * 1-5")
 *
 * Detects documents sent for signing but not yet signed after 7 days.
 * Sends a single summary email to ops with all overdue documents.
 * Verified via CRON_SECRET header (set by Vercel Cron).
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const { limited, retryAfter } = await applyRateLimit(cronRateLimit, ip);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter ?? 60) } },
    );
  }

  const authError = verifyCronBearer(request);
  if (authError) return authError;

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const overdueDocuments = await prisma.documents.findMany({
      where: {
        signing_document_id: { not: null },
        signed_at: null,
        status: "draft",
        created_at: { lt: sevenDaysAgo },
        order: { deleted_at: null },
      },
      include: {
        order: {
          include: { user: true },
        },
      },
      take: 100,
    });

    if (overdueDocuments.length === 0) {
      console.log(
        JSON.stringify({
          event: "cron.sla_monitor.completed",
          overdue_count: 0,
          message: "No overdue documents found",
          ts: new Date().toISOString(),
        }),
      );
      return NextResponse.json({ ok: true, overdueCount: 0 });
    }

    const summary = buildDocumentsSummary(overdueDocuments);
    await sendSlaAlertEmail(overdueDocuments.length, summary);

    console.log(
      JSON.stringify({
        event: "cron.sla_monitor.completed",
        overdue_count: overdueDocuments.length,
        ts: new Date().toISOString(),
      }),
    );

    return NextResponse.json({
      ok: true,
      overdueCount: overdueDocuments.length,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown";
    console.error(
      JSON.stringify({
        event: "cron.sla_monitor.error",
        message: errMsg,
        ts: new Date().toISOString(),
      }),
    );
    void notifyOpsError({
      event: "cron.sla_monitor.error",
      message: errMsg,
      severity: "warning",
    });
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
