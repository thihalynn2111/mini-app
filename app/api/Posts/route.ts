import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const currentUserId = await getCurrentUserId();

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { visibility: "PUBLIC" },
          ...(currentUserId
            ? [{ authorId: currentUserId, visibility: "ONLY_ME" }]
            : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        likes: { select: { userId: true } },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
            replies: {
              include: {
                user: { select: { id: true, username: true, avatarUrl: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json({ posts, currentUserId }, { status: 200 });
  } catch (error) {
    console.error("GET Posts Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content, imageUrls, visibility } = body;

    const newPost = await prisma.post.create({
      data: {
        content: content?.trim() || null,
        imageUrls: imageUrls || [], // Saves your array of images into the JSON column
        visibility: visibility || "PUBLIC",
        authorId: currentUserId,
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        likes: { select: { userId: true } },
        comments: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("POST Post Error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }
}
