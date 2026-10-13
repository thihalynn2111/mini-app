import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { username: decodeURIComponent(username) },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        posts: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, username: true, avatarUrl: true } },
            likes: { select: { userId: true } },
            comments: {
              include: {
                user: { select: { id: true, username: true, avatarUrl: true } },
                replies: {
                  include: {
                    user: {
                      select: { id: true, username: true, avatarUrl: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Fetch User Profile Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
