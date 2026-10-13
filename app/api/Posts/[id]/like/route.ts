import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params if it's a Promise (Next.js App Router compatibility)
    const params = await context.params;
    const postId = params.id;

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      return NextResponse.json({ liked: false }, { status: 200 });
    } else {
      await prisma.like.create({
        data: { userId, postId },
      });
      return NextResponse.json({ liked: true }, { status: 200 });
    }
  } catch (error) {
    console.error("Like API Error:", error);
    return NextResponse.json(
      { error: "Failed to process like" },
      { status: 500 },
    );
  }
}
