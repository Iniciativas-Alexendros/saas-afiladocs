import { beforeEach, describe, expect, it, vi } from "vitest";

const envState = { cronSecret: "test-cron-secret" as string | undefined };

vi.mock("@/lib/env", () => ({
  get serverEnv() {
    return envState;
  },
}));

import { verifyCronBearer } from "@/lib/cron-auth";

describe("verifyCronBearer", () => {
  beforeEach(() => {
    envState.cronSecret = "test-cron-secret";
  });

  it("returns 503 when CRON_SECRET is missing", () => {
    envState.cronSecret = undefined;
    const res = verifyCronBearer(
      new Request("http://localhost/api/cron", {
        headers: { authorization: "Bearer test-cron-secret" },
      }),
    );
    expect(res?.status).toBe(503);
  });

  it("returns 401 when Authorization header is missing", () => {
    const res = verifyCronBearer(new Request("http://localhost/api/cron"));
    expect(res?.status).toBe(401);
  });

  it("returns 401 when token is wrong", () => {
    const res = verifyCronBearer(
      new Request("http://localhost/api/cron", {
        headers: { authorization: "Bearer wrong-secret" },
      }),
    );
    expect(res?.status).toBe(401);
  });

  it("returns null when Bearer token matches", () => {
    const res = verifyCronBearer(
      new Request("http://localhost/api/cron", {
        headers: { authorization: "Bearer test-cron-secret" },
      }),
    );
    expect(res).toBeNull();
  });
});
