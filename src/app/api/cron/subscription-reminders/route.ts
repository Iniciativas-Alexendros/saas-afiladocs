import { NextResponse } from "next/server";
import { publicEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma/client";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/send";
import { verifyCronBearer } from "@/lib/cron-auth";
import { cronRateLimit, getClientIp, applyRateLimit } from "@/lib/rate-limit";
import SubscriptionActive from "@/emails/subscription-active";
import { notifyOpsError } from "@/lib/alerts/notify-ops";
import React from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SubscriptionWithUser {
  id: string;
  user_id: string;
  product_id: string;
  updated_at: Date;
  user: { full_name: string | null };
}

/** Send a single renewal reminder email. Returns true on success. */
async function sendReminderEmail(
  sub: SubscriptionWithUser,
  supabase: ReturnType<typeof createServiceRoleClient>,
): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.admin.getUserById(
      sub.user_id,
    );
    const email = userData?.user?.email;
    if (!email) return false;

    const renewalDate = new Date(sub.updated_at);
    renewalDate.setDate(renewalDate.getDate() + 30);

    await sendEmail({
      to: email,
      subject: "Recordatorio de renovación — afiladocs",
      react: React.createElement(SubscriptionActive, {
        userName: sub.user.full_name ?? email,
        productName: sub.product_id,
        nextBillingDate: renewalDate.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        portalUrl: `${publicEnv.siteUrl}/portal/suscripciones`,
      }),
    });
    return true;
  } catch (emailErr) {
    console.error(
      JSON.stringify({
        event: "cron.subscription_reminders.email_error",
        subscription_id: sub.id,
        message: emailErr instanceof Error ? emailErr.message : "Unknown",
        ts: new Date().toISOString(),
      }),
    );
    return false;
  }
}

/**
 * Cron: runs every Monday at 09:00 UTC (vercel.json schedule: "0 9 * * 1")
 *
 * Sends renewal reminder emails to clients with active subscriptions.
 * Only sends to subscriptions updated more than 25 days ago (approaching monthly renewal).
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
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 25);

    const subscriptions = await prisma.subscriptions.findMany({
      where: { status: "active", updated_at: { lt: cutoff } },
      include: { user: true },
      take: 100,
    });

    const supabase = createServiceRoleClient();
    let emailsSent = 0;

    for (const sub of subscriptions) {
      const sent = await sendReminderEmail(
        sub as SubscriptionWithUser,
        supabase,
      );
      if (sent) emailsSent++;
    }

    console.log(
      JSON.stringify({
        event: "cron.subscription_reminders.completed",
        subscriptions_processed: subscriptions.length,
        emails_sent: emailsSent,
        ts: new Date().toISOString(),
      }),
    );

    return NextResponse.json({ ok: true, emailsSent });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown";
    console.error(
      JSON.stringify({
        event: "cron.subscription_reminders.error",
        message: errMsg,
        ts: new Date().toISOString(),
      }),
    );
    void notifyOpsError({
      event: "cron.subscription_reminders.error",
      message: errMsg,
      severity: "warning",
    });
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
