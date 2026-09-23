import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma/client";
import { sendEmail } from "@/lib/email/send";
import { verifyCronBearer } from "@/lib/cron-auth";
import { cronRateLimit, getClientIp, applyRateLimit } from "@/lib/rate-limit";
import { DailyOpsReport } from "@/emails/daily-ops-report";
import { notifyOpsError } from "@/lib/alerts/notify-ops";
import React from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DailyStats {
  newOrders: number;
  signedDocuments: number;
  pendingIntakes: number;
  alertsReceived: number;
  failedPayments: number;
  activeSubscriptions: number;
}

async function gatherStats(since: Date): Promise<DailyStats> {
  const [
    newOrders,
    signedDocuments,
    pendingIntakes,
    alertsReceived,
    failedPayments,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.orders.count({
      where: { created_at: { gte: since }, deleted_at: null },
    }),
    prisma.documents.count({
      where: { signed_at: { gte: since } },
    }),
    prisma.orders.count({
      where: { status: "intake_pending", deleted_at: null },
    }),
    prisma.monitor_alerts.count({
      where: { created_at: { gte: since } },
    }),
    prisma.audit_log.count({
      where: { event: "payment.failed", created_at: { gte: since } },
    }),
    prisma.subscriptions.count({
      where: { status: "active" },
    }),
  ]);

  return {
    newOrders,
    signedDocuments,
    pendingIntakes,
    alertsReceived,
    failedPayments,
    activeSubscriptions,
  };
}

async function sendDailyReport(
  stats: DailyStats,
  dateStr: string,
): Promise<void> {
  await sendEmail({
    to: serverEnv.opsEmail,
    subject: `Informe diario ops — ${dateStr}`,
    react: React.createElement(DailyOpsReport, {
      date: dateStr,
      ...stats,
    }),
  });
}

/**
 * Cron: runs Mon-Fri at 07:00 UTC (09:00 CET) — vercel.json schedule: "0 7 * * 1-5"
 *
 * Sends a daily operations summary email to ops@afiladocs.com with key metrics
 * from the last 24 hours: new orders, signed documents, pending intakes,
 * alerts received, failed payments, and active subscriptions.
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
    const since = new Date();
    since.setHours(since.getHours() - 24);

    const dateStr = new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const stats = await gatherStats(since);
    await sendDailyReport(stats, dateStr);

    console.log(
      JSON.stringify({
        event: "cron.daily_report.completed",
        ...stats,
        ts: new Date().toISOString(),
      }),
    );

    return NextResponse.json({ ok: true, ...stats });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown";
    console.error(
      JSON.stringify({
        event: "cron.daily_report.error",
        message: errMsg,
        ts: new Date().toISOString(),
      }),
    );
    void notifyOpsError({
      event: "cron.daily_report.error",
      message: errMsg,
      severity: "warning",
    });
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
