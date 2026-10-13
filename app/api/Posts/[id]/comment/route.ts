import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.id;

    const { content, parentId } = await req.json();
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Comment cannot be empty" },
        { status: 400 },
      );
    }

    const newComment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        userId,
        parentId: parentId || null,
      },
      include: {
        user: { select: { username: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error("Comment Creation Error:", error);
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 },
    );
  }
}
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.id;

    // URL query (သို့မဟုတ် request body) ကနေ commentId ကို ယူရန် (ဥပမာ /api/Posts/[postId]/comment?commentId=xxx)
    const url = new URL(req.url);
    const commentId = url.searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 },
      );
    }

    // Comment တကယ်ရှိမရှိနှင့် ပို့စ်ကိုပါ စစ်ဆေးရန်
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // ခွင့်ပြုချက်စစ်ဆေးခြင်း (ပို့စ်ပိုင်ရှင် လား သို့မဟုတ် Comment ပိုင်ရှင် လား)
    const isPostOwner = comment.post.authorId === userId;
    const isCommentOwner = comment.userId === userId;

    if (!isPostOwner && !isCommentOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Comment (သို့မဟုတ် Reply) ကို ဖျက်ခြင်း
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json(
      { message: "Comment deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Comment Deletion Error:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 },
    );
  }
}
