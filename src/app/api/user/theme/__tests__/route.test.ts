import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock server-only so auth module can be imported in test env
vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth", () => ({
  verifySession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { GET, PUT } from "../route";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MOCK_SESSION = { userId: "user-1", email: "user@example.com", expiresAt: new Date() };

function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest("http://localhost/api/user/theme", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/user/theme
// ---------------------------------------------------------------------------

describe("GET /api/user/theme", () => {
  test("returns 401 when session is missing", async () => {
    (verifySession as any).mockResolvedValue(null);

    const res = await GET(makeRequest("GET"));

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/authentication required/i);
  });

  test("returns themePreference for authenticated user", async () => {
    (verifySession as any).mockResolvedValue(MOCK_SESSION);
    (prisma.user.findUnique as any).mockResolvedValue({ themePreference: "dark" });

    const res = await GET(makeRequest("GET"));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.themePreference).toBe("dark");
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { themePreference: true },
    });
  });

  test("returns 401 when user is not found in DB", async () => {
    (verifySession as any).mockResolvedValue(MOCK_SESSION);
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const res = await GET(makeRequest("GET"));

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/user not found/i);
  });

  test("returns 500 on prisma error", async () => {
    (verifySession as any).mockResolvedValue(MOCK_SESSION);
    (prisma.user.findUnique as any).mockRejectedValue(new Error("DB error"));

    const res = await GET(makeRequest("GET"));

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/internal server error/i);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/user/theme
// ---------------------------------------------------------------------------

describe("PUT /api/user/theme", () => {
  test("returns 401 when session is missing", async () => {
    (verifySession as any).mockResolvedValue(null);

    const res = await PUT(makeRequest("PUT", { themePreference: "dark" }));

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/authentication required/i);
  });

  test("returns 400 when themePreference is missing", async () => {
    (verifySession as any).mockResolvedValue(MOCK_SESSION);

    const res = await PUT(makeRequest("PUT", {}));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/light.*dark|dark.*light/i);
  });

  test("returns 400 when themePreference has invalid value", async () => {
    (verifySession as any).mockResolvedValue(MOCK_SESSION);

    const res = await PUT(makeRequest("PUT", { themePreference: "blue" }));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/light.*dark|dark.*light/i);
  });

  test("returns 400 when body is not valid JSON", async () => {
    (verifySession as any).mockResolvedValue(MOCK_SESSION);

    const req = new NextRequest("http://localhost/api/user/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });

    const res = await PUT(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/invalid json/i);
  });

  test("updates theme to dark and returns user data", async () => {
    (verifySession as any).mockResolvedValue(MOCK_SESSION);
    const updatedUser = { id: "user-1", email: "user@example.com", themePreference: "dark" };
    (prisma.user.update as any).mockResolvedValue(updatedUser);

    const res = await PUT(makeRequest("PUT", { themePreference: "dark" }));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.themePreference).toBe("dark");
    expect(data.id).toBe("user-1");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { themePreference: "dark" },
      select: { id: true, email: true, themePreference: true },
    });
  });

  test("updates theme to light and returns user data", async () => {
    (verifySession as any).mockResolvedValue(MOCK_SESSION);
    const updatedUser = { id: "user-1", email: "user@example.com", themePreference: "light" };
    (prisma.user.update as any).mockResolvedValue(updatedUser);

    const res = await PUT(makeRequest("PUT", { themePreference: "light" }));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.themePreference).toBe("light");
  });

  test("returns 500 on prisma error", async () => {
    (verifySession as any).mockResolvedValue(MOCK_SESSION);
    (prisma.user.update as any).mockRejectedValue(new Error("DB error"));

    const res = await PUT(makeRequest("PUT", { themePreference: "dark" }));

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/internal server error/i);
  });
});
