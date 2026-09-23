import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { publicEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma/client";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/send";
import { verifyCronBearer } from "@/lib/cron-auth";
import { cronRateLimit, getClientIp, applyRateLimit } from "@/lib/rate-limit";
import { IntakeRequiredEmail } from "@/emails/intake-required";
import { notifyOpsError } from "@/lib/alerts/notify-ops";
import React from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderWithUser = Prisma.ordersGetPayload<{ include: { user: true } }>;

/** Send a single intake reminder email. Returns true on success. */
async function sendIntakeReminderEmail(
  order: OrderWithUser,
  supabase: ReturnType<typeof createServiceRoleClient>,
): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.admin.getUserById(
      order.user_id,
    );
    const email = userData?.user?.email;
    if (!email) return false;

    await sendEmail({
      to: email,
      subject: "Recordatorio: completa los datos de tu pedido — Afiladocs",
      react: React.createElement(IntakeRequiredEmail, {
        userName: order.user.full_name ?? email,
        productName: order.product_id,
        intakeUrl: `${publicEnv.siteUrl}/portal/pedido/${order.id}`,
      }),
    });
    return true;
  } catch (emailErr) {
    console.error(
      JSON.stringify({
        event: "cron.intake_reminders.email_error",
        order_id: order.id,
        message: emailErr instanceof Error ? emailErr.message : "Unknown",
        ts: new Date().toISOString(),
      }),
    );
    return false;
  }
}

/**
 * Cron: runs daily at 10:00 UTC (vercel.json schedule: "0 10 * * *")
 *
 * Sends intake reminder emails to clients whose orders have been in
 * intake_pending for more than 3 days without submitting intake data.
 * Excludes orders older than 90 days (likely abandoned).
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
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const orders = await prisma.orders.findMany({
      where: {
        status: "intake_pending",
        intake_data: { equals: Prisma.DbNull },
        deleted_at: null,
        created_at: { lt: threeDaysAgo, gt: ninetyDaysAgo },
      },
      include: { user: true },
      take: 50,
    });

    const supabase = createServiceRoleClient();
    let emailsSent = 0;

    for (const order of orders) {
      const sent = await sendIntakeReminderEmail(order, supabase);
      if (sent) emailsSent++;
    }

    console.log(
      JSON.stringify({
        event: "cron.intake_reminders.completed",
        orders_processed: orders.length,
        emails_sent: emailsSent,
        ts: new Date().toISOString(),
      }),
    );

    return NextResponse.json({ ok: true, emailsSent });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown";
    console.error(
      JSON.stringify({
        event: "cron.intake_reminders.error",
        message: errMsg,
        ts: new Date().toISOString(),
      }),
    );
    void notifyOpsError({
      event: "cron.intake_reminders.error",
      message: errMsg,
      severity: "warning",
    });
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
