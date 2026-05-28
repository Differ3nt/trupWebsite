import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireOwnerSafe } from "@/lib/session";
import { handleApiError } from "@/lib/api-errors";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id: targetId } = await params;

    if (auth.data.userId === targetId) {
      return NextResponse.json(
        { error: "Cannot delete own account" },
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

    await prisma.user.delete({ where: { id: targetId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "[users [id] DELETE]");
  }
}
