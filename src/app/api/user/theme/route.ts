import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ThemePreference = "light" | "dark";

const VALID_THEMES: readonly ThemePreference[] = ["light", "dark"];

export async function GET(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { themePreference: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    return NextResponse.json({ themePreference: user.themePreference });
  } catch (error) {
    console.error("GET /api/user/theme error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { themePreference } = body as { themePreference?: unknown };

  if (!themePreference || !VALID_THEMES.includes(themePreference as ThemePreference)) {
    return NextResponse.json(
      { error: "themePreference must be \"light\" or \"dark\"" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { themePreference: themePreference as ThemePreference },
      select: { id: true, email: true, themePreference: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("PUT /api/user/theme error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
