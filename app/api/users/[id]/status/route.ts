import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireOwnerSafe } from "@/lib/session";
import { updateUserStatusSchema } from "@/lib/validations/user";
import { handleApiError } from "@/lib/api-errors";
import { invalidateStatsCache } from "@/lib/cache";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id: targetId } = await params;
    const body = await request.json();
    const validated = updateUserStatusSchema.parse(body);

    if (auth.data.userId === targetId) {
      return NextResponse.json(
        { error: "Cannot change own status" },
        { status: 403 },
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { email: true },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ownerCheck = await requireOwnerSafe(
      auth.data,
      targetId,
      target.email,
    );
    if (!ownerCheck.ok) return ownerCheck.response;

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { status: validated.status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        role: true,
      },
    });

    invalidateStatsCache();
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err, "[users [id] status PATCH]");
  }
}
